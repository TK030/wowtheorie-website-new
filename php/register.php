<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

/* ── Helpers ────────────────────────────────────────── */
function respondJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload);
    exit;
}

function safe(string $val): string
{
    return htmlspecialchars(trim($val), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/* ── Only allow POST ─────────────────────────────────── */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respondJson(['ok' => false, 'error' => 'Alleen POST-verzoeken worden geaccepteerd.'], 405);
}

/* ── Load .env ───────────────────────────────────────── */
$envLoaded = false;
foreach ([dirname(__DIR__), __DIR__] as $path) {
    if (is_readable($path . '/.env')) {
        Dotenv::createImmutable($path)->load();
        $envLoaded = true;
        break;
    }
}

if (!$envLoaded) {
    respondJson(['ok' => false, 'error' => 'Serverconfiguratie ontbreekt (.env niet gevonden).'], 500);
}

/* ── Collect & validate input ────────────────────────── */
$required = ['cursus', 'provincie', 'datum', 'voornaam', 'achternaam', 'geboortedatum', 'email', 'telefoon', 'postcode', 'huisnummer'];
$data = [];

foreach ($required as $field) {
    $val = trim((string)($_POST[$field] ?? ''));
    if ($val === '') {
        respondJson(['ok' => false, 'error' => "Verplicht veld ontbreekt: {$field}."], 400);
    }
    $data[$field] = $val;
}

// Optional fields
$data['extras']   = trim((string)($_POST['extras']   ?? 'Geen'));
$data['straat']   = trim((string)($_POST['straat']   ?? ''));
$data['stad']     = trim((string)($_POST['stad']     ?? ''));
$data['datum_raw']= trim((string)($_POST['datum_raw']?? ''));

// Basic email validation
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    respondJson(['ok' => false, 'error' => 'Ongeldig e-mailadres.'], 400);
}

/* ── ENV ─────────────────────────────────────────────── */
$mailTo         = $_ENV['MAIL_TO']         ?? '';
$mailFrom       = $_ENV['MAIL_FROM']       ?? '';
$mailFromName   = $_ENV['MAIL_FROM_NAME']  ?? 'WOW Theorie';
$smtpHost       = $_ENV['SMTP_HOST']       ?? '';
$smtpPort       = (int)($_ENV['SMTP_PORT'] ?? 587);
$smtpEncryption = $_ENV['SMTP_ENCRYPTION'] ?? 'tls';
$smtpUser       = $_ENV['SMTP_USERNAME']   ?? '';
$smtpPass       = $_ENV['SMTP_PASSWORD']   ?? '';

if (!$mailTo || !$mailFrom || !$smtpHost || !$smtpUser || !$smtpPass) {
    respondJson(['ok' => false, 'error' => 'SMTP-instellingen zijn onvolledig. Neem contact op met de beheerder.'], 500);
}

/* ── Build e-mail body ───────────────────────────────── */
$naam    = safe($data['voornaam']) . ' ' . safe($data['achternaam']);
$adres   = implode(', ', array_filter([
    safe($data['straat']) ? safe($data['straat']) . ' ' . safe($data['huisnummer']) : safe($data['huisnummer']),
    safe($data['postcode']),
    safe($data['stad'])
]));
$timestamp = date('d-m-Y H:i:s');

$subject = '🎓 Nieuwe aanmelding: ' . safe($data['cursus']) . ' - ' . $naam;

$bodyHtml = '<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nieuwe Aanmelding</title>
<style>
  body { font-family: \'Segoe UI\', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; }
  .card { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #1e3a8a, #2548a8); color: #fff; padding: 28px 32px; }
  .header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
  .header p { margin: 0; font-size: 13px; opacity: 0.8; }
  .badge { display: inline-block; background: #f97316; color: #fff; font-size: 13px; font-weight: 700; padding: 4px 14px; border-radius: 20px; margin-top: 12px; }
  .body { padding: 28px 32px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 0; font-size: 14px; vertical-align: top; }
  td:first-child { color: #6b7280; width: 42%; font-weight: 500; }
  td:last-child { color: #1f2937; font-weight: 600; }
  .footer { background: #f9fafb; padding: 16px 32px; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; }
  .highlight { background: #fff7ed; border-left: 4px solid #f97316; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 12px; font-size: 14px; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>🎓 Nieuwe aanmelding ontvangen</h1>
    <p>Via het aanmeldformulier op wowtheorie.nl</p>
    <div class="badge">' . safe($data['cursus']) . '</div>
  </div>
  <div class="body">

    <div class="section">
      <div class="section-title">📋 Cursusgegevens</div>
      <table>
        <tr><td>Cursustype</td><td>' . safe($data['cursus']) . '</td></tr>
        <tr><td>Provincie</td><td>' . safe($data['provincie']) . '</td></tr>
        <tr><td>Gewenste datum</td><td>' . safe($data['datum']) . '</td></tr>
        <tr><td>Extra opties</td><td>' . safe($data['extras']) . '</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">👤 Persoonlijke gegevens</div>
      <table>
        <tr><td>Naam</td><td>' . $naam . '</td></tr>
        <tr><td>Geboortedatum</td><td>' . safe($data['geboortedatum']) . '</td></tr>
        <tr><td>E-mailadres</td><td>' . safe($data['email']) . '</td></tr>
        <tr><td>Telefoonnummer</td><td>' . safe($data['telefoon']) . '</td></tr>
        <tr><td>Adres</td><td>' . $adres . '</td></tr>
      </table>
    </div>

    <div class="highlight">
      📩 Deze aanmelding is binnengekomen op <strong>' . $timestamp . '</strong>
    </div>

  </div>
  <div class="footer">WOW Theorie - Aanmeldformulier • Gegenereerd op ' . $timestamp . '</div>
</div>
</body>
</html>';

$bodyText = "NIEUWE AANMELDING - WOW Theorie\n" .
            str_repeat("=", 40) . "\n\n" .
            "CURSUSGEGEVENS\n" .
            "Cursustype:    " . $data['cursus'] . "\n" .
            "Provincie:     " . $data['provincie'] . "\n" .
            "Datum:         " . $data['datum'] . "\n" .
            "Extra opties:  " . $data['extras'] . "\n\n" .
            "PERSOONLIJKE GEGEVENS\n" .
            "Naam:          " . $data['voornaam'] . " " . $data['achternaam'] . "\n" .
            "Geboortedatum: " . $data['geboortedatum'] . "\n" .
            "E-mail:        " . $data['email'] . "\n" .
            "Telefoon:      " . $data['telefoon'] . "\n" .
            "Adres:         " . ($data['straat'] ? $data['straat'] . " " . $data['huisnummer'] . ", " : $data['huisnummer'] . ", ") .
                                 $data['postcode'] . ", " . $data['stad'] . "\n\n" .
            "Ontvangen op: " . $timestamp . "\n";

/* ── Send via PHPMailer ───────────────────────────────── */
$mail = new PHPMailer(true);

try {
    $mail->CharSet   = 'UTF-8';
    $mail->isSMTP();
    $mail->Host      = $smtpHost;
    $mail->SMTPAuth  = true;
    $mail->Username  = $smtpUser;
    $mail->Password  = $smtpPass;
    $mail->Port      = $smtpPort;
    $mail->SMTPSecure = $smtpEncryption === 'ssl'
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;

    $mail->setFrom($mailFrom, $mailFromName);
    $mail->addAddress($mailTo);
    $mail->addReplyTo($data['email'], $data['voornaam'] . ' ' . $data['achternaam']);

    $mail->Subject = $subject;
    $mail->isHTML(true);
    $mail->Body    = $bodyHtml;
    $mail->AltBody = $bodyText;

    $mail->send();

    respondJson(['ok' => true], 200);

} catch (Exception $e) {
    $debug = $mail->ErrorInfo ?: $e->getMessage();
    respondJson([
        'ok'    => false,
        'error' => 'Er is een fout opgetreden bij het verzenden. Probeer het later opnieuw of bel ons.',
        'debug' => $debug
    ], 500);
}
