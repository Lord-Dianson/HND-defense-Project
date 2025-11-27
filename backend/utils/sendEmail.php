<?php

require '../vendor/autoload.php';
require './functions.php';

use Ramsey\Uuid\Uuid;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__)); // This goes one level up
$dotenv->load();


function sendEmailVerification($OTP, $name, $email){
     $mail = new PHPMailer(true);// set to true to enable debugging
        try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // Your SMTP server
        $mail->SMTPAuth = true;
        $mail->Username =$_ENV['DEV_EMAIL'];
        $mail->Password = $_ENV['DEV_EMAIL_PASSWORD'];
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        $mail->setFrom('no-reply@hosteLink.com', 'hosteLink.great-site.net');
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
            padding: 20px;
            margin: 0 auto; 
            height: auto;
        }
        .otp-container {
            border-radius: 5px; 
            display: grid;
            justify-self: center; 
            border: 1px solid; 
            width: 120px; 
            height: 50px;
            text-align: center;
            margin: 20px auto;
        }
    </style>
</head>
<body>

<div class="email-body">
    <h1 style="margin-top: 3rem;text-align: center;">Welcome to HosteLink!</h1>
    <p>Thank you for signing up to HosteLink, Mr/Mrs '.$name.' Please verify your email address using your OTP below.</p>
    <div class="otp-container">
        <span style="display: flex;justify-content: center;align-items: center;">'.$OTP.'</span>
    </div>
    <p>If you did not sign up for this account, please ignore this email.</p>
    <p>Best regards,<br/>The HosteLink Team</p>
</div>

</body>
</html>';
        $mail->AltBody = 'Greetings, this is your OTP, copy to verify your email address: '.$OTP.'. If this email is not for you, please ignore it.';

        $mail->send();
        return jsonResponse(['success' => true, 'message' => 'Verification email sent successfully.']);
        } catch (\Throwable $th) {
        return jsonResponse(['success' => false, 'message' => 'Email could not be sent. Mailer Error: ' . $mail->ErrorInfo], 500);
        }
   
}

?>