<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

// Produceer generieke response naar client, log details intern
ini_set('display_errors', '0');            // niet tonen aan gebruikers
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/send_error.log');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'Alleen POST toegestaan.']);
        exit;
    }

    // Zoek autoload (vendor) één niveau boven /php/ of in /php/vendor
    $autoloadPaths = [
        dirname(__DIR__) . '/vendor/autoload.php',
        __DIR__ . '/vendor/autoload.php',
    ];
    $autoloadLoaded = false;
    foreach ($autoloadPaths as $p) {
        if (file_exists($p)) {
            require $p;
            $autoloadLoaded = true;
            break;
        }
    }
    if (!$autoloadLoaded) {
        throw new RuntimeException('vendor/autoload.php niet gevonden. Run composer install en upload vendor/');
    }

    // dotenv: zoek .env op projectroot (dirname(__DIR__)) of in /php
    $envPaths = [dirname(__DIR__), __DIR__];
    $envLoaded = false;
    foreach ($envPaths as $p) {
        if (is_readable($p . '/.env')) {
            \Dotenv\Dotenv::createImmutable($p)->load();
            $envLoaded = true;
            break;
        }
    }
    if (!$envLoaded) {
        throw new RuntimeException('.env niet gevonden of niet leesbaar in gecontroleerde paden.');
    }

    // Honeypot anti-spam
    if (!empty(trim((string)($_POST['website'] ?? '')))) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Spam gedetecteerd.']);
        exit;
    }

    // Input validatie
    $naam = trim((string)($_POST['naam'] ?? ''));
    $email = trim((string)($_POST['email'] ?? ''));
    $onderwerp = trim((string)($_POST['onderwerp'] ?? ''));
    $bericht = trim((string)($_POST['bericht'] ?? ''));

    if ($naam === '' || mb_strlen($naam) < 2) throw new InvalidArgumentException('Naam is ongeldig.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('E-mail is ongeldig.');
    if ($bericht === '' || mb_strlen($bericht) < 5) throw new InvalidArgumentException('Bericht is te kort.');

    $subjects = [
        '' => 'Geen onderwerp gekozen',
        'auto-theorie' => 'Auto Theorie',
        'motor-theorie' => 'Motor Theorie',
        'scooter-theorie' => 'Scooter Theorie',
        'vrachtwagen-theorie' => 'Vrachtwagen Theorie',
        'bus-theorie' => 'Bus Theorie',
        '1-daagse' => '1-Daagse Opleiding',
        '2-daagse' => '2-Daagse Opleiding',
        'machtiging' => 'Machtiging CBR',
        'algemeen' => 'Algemene vraag',
    ];
    $subjectLabel = $subjects[$onderwerp] ?? 'Onbekend onderwerp';

    // ENV values
    $mailTo = $_ENV['MAIL_TO'] ?? '';
    $mailFrom = $_ENV['MAIL_FROM'] ?? '';
    $mailFromName = $_ENV['MAIL_FROM_NAME'] ?? 'WOW Theorie';
    $smtpHost = $_ENV['SMTP_HOST'] ?? '';
    $smtpPort = (int)($_ENV['SMTP_PORT'] ?? 587);
    $smtpEncryption = $_ENV['SMTP_ENCRYPTION'] ?? 'tls';
    $smtpUser = $_ENV['SMTP_USERNAME'] ?? '';
    $smtpPass = $_ENV['SMTP_PASSWORD'] ?? '';

    if ($mailTo === '' || $mailFrom === '' || $smtpHost === '' || $smtpUser === '' || $smtpPass === '') {
        throw new RuntimeException('SMTP/Mail instellingen ontbreken in .env of onjuist.');
    }

    // PHPMailer verzenden
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

    $mail->CharSet = 'UTF-8';
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->Port = $smtpPort;
    $mail->SMTPAutoTLS = true;

    if (strtolower($smtpEncryption) === 'ssl') {
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    } else {
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    }

    $mail->setFrom($mailFrom, $mailFromName);
    $mail->addAddress($mailTo);
    $mail->addReplyTo($email, $naam);

    $safeNaam = htmlspecialchars($naam, ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safeOnderwerp = htmlspecialchars($subjectLabel, ENT_QUOTES, 'UTF-8');
    $safeBericht = nl2br(htmlspecialchars($bericht, ENT_QUOTES, 'UTF-8'));

    $mail->isHTML(true);
    $mail->Subject = 'Contactformulier - ' . $safeOnderwerp;
    $mail->Body = "
        <h2>Nieuw bericht via contactformulier</h2>
        <p><strong>Naam:</strong> {$safeNaam}</p>
        <p><strong>E-mail:</strong> {$safeEmail}</p>
        <p><strong>Onderwerp:</strong> {$safeOnderwerp}</p>
        <p><strong>Bericht:</strong><br>{$safeBericht}</p>
    ";
    $mail->AltBody = "Naam: {$naam}\nE-mail: {$email}\nOnderwerp: {$subjectLabel}\n\nBericht:\n{$bericht}";

    $mail->send();

    echo json_encode(['ok' => true]);
    exit;
} catch (\Throwable $e) {
    // Log volledige fout intern
    $msg = sprintf(
        "[%s] %s in %s on line %d\nStacktrace:\n%s\n\n",
        date('c'),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    );
    error_log($msg); // gaat naar send_error.log door ini_set bovenaan

    // Geef generieke fout naar client
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Versturen mislukt. Controleer server logs of contacteer beheer.']);
    exit;
}