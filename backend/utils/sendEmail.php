<?php
require_once __DIR__ . '/functions.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->load();


// DEBUG: Output loaded .env values and enable PHPMailer debug
// Remove or comment out after debugging
if (!isset($_ENV['DEV_EMAIL']) || !isset($_ENV['DEV_EMAIL_PASSWORD'])) {
    // Do not terminate execution here; warn so JSON responses are not corrupted
    trigger_error('WARNING: .env DEV_EMAIL or DEV_EMAIL_PASSWORD not set.', E_USER_WARNING);
}

function sendEmailVerification($OTP = "123456", $name = "Bill-Gates", $email = "akulorddianson@gmail.com")
{
    $mail = new PHPMailer(false); // set to false to disable debugging
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // Your SMTP server
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['DEV_EMAIL'];
        $mail->Password = $_ENV['DEV_EMAIL_PASSWORD'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom($_ENV['DEV_EMAIL'], 'HosteLink');
        $mail->addAddress($email, $name);

        $mail->isHTML(true);
        $mail->Subject = 'Verify your email address';
        $mail->Body    = '
  <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .email-body {
            text-align: center;
            padding: 20px;
            margin: 0 auto;
            background: url("https://res.cloudinary.com/dmtgl1spo/image/upload/v1766508367/favicon_vgghfj.png") no-repeat;
            background-size: cover;
            background-position: center;
            color: #fff;
        }

        .otp-container {
            border-radius: 5px;
            box-shadow: 0 0 10px 10px rgba(255, 255, 255, 0.366);
            display: flex;
            justify-content: center;
            align-items: center;
            width: 120px;
            height: 50px;
            font-size: xx-large;
            margin: 20px auto;
            text-align: center;
        }


        .faint-bg {
            background-color: rgba(25, 41, 96, 0.67);
            padding: 20px;
            border-radius: 10px;
        }
    </style>
</head>

<body>

    <div class="email-body">
        <div class="faint-bg">
            <h1 style="margin-top: 3rem;text-align: center;">Welcome to HosteLink!</h1>
            <p>Thank you for signing up to HosteLink '.$name.'. Please verify your email address using your OTP
                below.</p>
            <div class="otp-container">
                <span style="display: flex;justify-content: center;align-items: center;">'.$OTP.'</span>
            </div>
            <p>If you did not sign up for this account, please ignore this email.</p>
            <p>Best regards,<br />The HosteLink Team</p>
        </div>
    </div>

</body>

</html>';
        $mail->AltBody = 'Greetings, this is your OTP, copy to verify your email address: ' . $OTP . '. If this email is not for you, please ignore it.';

        $mail->send();
        return true;
    } catch (\Throwable $th) {
        return false;
    }
}
