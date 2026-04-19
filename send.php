<?php
declare(strict_types=1);



$SMTP_HOST = 'mail.hosting.reg.ru';
$SMTP_PORT = 465;
$SMTP_USER = 'help@10polok.ru';
$SMTP_PASS = 'ВСТАВЬ_ПАРОЛЬ_ЗДЕСЬ';
$MAIL_TO   = 'help@10polok.ru';
$FROM_NAME = '10polok.ru';
$ALLOWED_ORIGIN = 'https://www.10polok.ru';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Robots-Tag: noindex, nofollow');
header('Content-Type: application/json; charset=utf-8');

function jsonExit(int $code, array $data): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonExit(405, ['ok' => false, 'error' => 'Method Not Allowed']);
}

$origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$okOrigin  = $origin  && str_starts_with($origin,  $ALLOWED_ORIGIN);
$okReferer = $referer && str_starts_with($referer, $ALLOWED_ORIGIN);
if (!$okOrigin && !$okReferer) {
    jsonExit(403, ['ok' => false, 'error' => 'Forbidden']);
}

if (!empty($_POST['hp_field'] ?? '')) {
    jsonExit(200, ['ok' => true]);
}

$ts = (int)($_POST['form_ts'] ?? 0);
$elapsed = time() - $ts;
if ($ts <= 0 || $elapsed < 3) {
    jsonExit(200, ['ok' => true]);
}
if ($elapsed > 3600) {
    jsonExit(400, ['ok' => false, 'error' => 'Форма устарела, обновите страницу']);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash = hash('sha256', $ip);
$rateDir = sys_get_temp_dir() . '/10polok_rate';
if (!is_dir($rateDir)) {
    @mkdir($rateDir, 0700, true);
}
$rateFile = $rateDir . '/' . $ipHash;
$now = time();
$windowSec   = 3600;
$maxPerHour  = 20;
$minInterval = 15;

$history = [];
if (is_file($rateFile)) {
    $raw = @file_get_contents($rateFile);
    if ($raw !== false) {
        $history = array_values(array_filter(
            array_map('intval', explode("\n", $raw)),
            fn($t) => $t > $now - $windowSec
        ));
    }
}
if ($history && ($now - max($history)) < $minInterval) {
    jsonExit(429, ['ok' => false, 'error' => 'Слишком часто, попробуйте через минуту']);
}
if (count($history) >= $maxPerHour) {
    jsonExit(429, ['ok' => false, 'error' => 'Превышен лимит отправок в час']);
}
$history[] = $now;
@file_put_contents($rateFile, implode("\n", $history), LOCK_EX);

function clean(string $v, int $max = 2000): string {
    $v = trim($v);
    $v = mb_substr($v, 0, $max, 'UTF-8');
    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
}
function cleanHeader(string $v): string {
    return preg_replace('/[\r\n]/', '', clean($v, 200)) ?? '';
}

$skip = ['form_ts', 'hp_field'];
$fieldLabels = [
    'name'     => 'Имя',
    'phone'    => 'Телефон',
    'email'    => 'Email',
    'message'  => 'Сообщение',
    'interest' => 'Интерес',
    'page'     => 'Страница',
];
$lines = [];
foreach ($_POST as $key => $val) {
    if (in_array($key, $skip, true) || !is_string($val)) continue;
    $val = clean($val, 3000);
    if ($val === '') continue;
    $label = $fieldLabels[$key] ?? $key;
    $lines[] = $label . ': ' . $val;
}

$name  = clean($_POST['name']  ?? '', 100);
$phone = clean($_POST['phone'] ?? '', 30);
$message = clean($_POST['message'] ?? '', 3000);
if ($name === '') {
    jsonExit(400, ['ok' => false, 'error' => 'Укажите имя']);
}
$hasPhone = $phone !== '' && preg_match('/^[\d\s\+\-\(\)]{6,30}$/u', $phone) === 1;
if (!$hasPhone && $message === '') {
    jsonExit(400, ['ok' => false, 'error' => 'Укажите телефон или сообщение']);
}

$body  = "Новая заявка с сайта 10polok.ru\r\n";
$body .= "----------------------------------------\r\n\r\n";
$body .= implode("\r\n", $lines) . "\r\n\r\n";
$body .= "----------------------------------------\r\n";
$body .= "IP: {$ip}\r\n";
$body .= "UA: " . cleanHeader($_SERVER['HTTP_USER_AGENT'] ?? '') . "\r\n";
$body .= "Время: " . date('Y-m-d H:i:s') . "\r\n";
// Normalize all line endings to CRLF (SMTP/RFC-5322 requirement)
$body = preg_replace('/\r\n|\r|\n/', "\r\n", $body);

$subject = '=?UTF-8?B?' . base64_encode('Новая заявка с 10polok.ru') . '?=';
$fromEnc = '=?UTF-8?B?' . base64_encode($FROM_NAME) . '?=';

function smtpSend(
    string $host, int $port, string $user, string $pass,
    string $fromName, string $fromEmail, string $to,
    string $subject, string $body
): bool {
    $ctx = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
    ]]);
    $fp = @stream_socket_client(
        "ssl://{$host}:{$port}",
        $errno, $errstr, 30,
        STREAM_CLIENT_CONNECT, $ctx
    );
    if (!$fp) return false;

    $readLine = static function($fp): string {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };
    $send = static function($fp, string $cmd): void {
        fwrite($fp, $cmd . "\r\n");
    };
    $expect = static function(string $resp, string $code): bool {
        return str_starts_with($resp, $code);
    };

    $steps = [
        ['',                             '220'],
        ['EHLO 10polok.ru',              '250'],
        ['AUTH LOGIN',                   '334'],
        [base64_encode($user),           '334'],
        [base64_encode($pass),           '235'],
        ["MAIL FROM:<{$fromEmail}>",     '250'],
        ["RCPT TO:<{$to}>",              '250'],
        ['DATA',                         '354'],
    ];
    foreach ($steps as [$cmd, $code]) {
        if ($cmd !== '') $send($fp, $cmd);
        $r = $readLine($fp);
        if (!$expect($r, $code)) { fclose($fp); return false; }
    }

    $msgId = '<' . bin2hex(random_bytes(16)) . '@10polok.ru>';
    $headers = [
        "From: {$fromName} <{$fromEmail}>",
        "To: <{$to}>",
        "Subject: {$subject}",
        "Date: " . date('r'),
        "Message-ID: {$msgId}",
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
    ];
    $data = implode("\r\n", $headers) . "\r\n\r\n" . $body;
    $data = preg_replace('/^\./m', '..', $data);
    $send($fp, $data);
    $send($fp, '.');
    $r = $readLine($fp);
    $send($fp, 'QUIT');
    fclose($fp);
    return str_starts_with($r, '250');
}

$ok = smtpSend(
    $SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS,
    $fromEnc, $SMTP_USER, $MAIL_TO, $subject, $body
);

if (!$ok) {
    $fallbackHeaders = "From: {$fromEnc} <{$SMTP_USER}>\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "MIME-Version: 1.0";
    $ok = @mail($MAIL_TO, $subject, $body, $fallbackHeaders);
}

if ($ok) {
    jsonExit(200, ['ok' => true]);
}
@file_put_contents($rateDir . '/send.log',
    date('c') . " SEND_FAIL ip={$ipHash}\n", FILE_APPEND);
jsonExit(500, ['ok' => false, 'error' => 'Ошибка отправки, позвоните нам']);
