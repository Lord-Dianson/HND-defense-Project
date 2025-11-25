<?php
require '../vendor/autoload.php'; // Ensure Composer's autoload is included
require '../config/database.php'; // Include the database connection setup
require '../utils/functions.php'; // Include utility functions

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Example endpoint for login
class AuthController {
    
    public function login($role, $credentials) {
        // Validate inputs
        if (!validateLoginInput($role,$credentials)) {
            return jsonResponse(['success' => false, 'message' => 'All fields are required.'], 400);
        }

        // find user using user credentials
        if($role === 'agent'){
            $user = R::findOne('Agent', 'email = ?', [$credentials['email']]);
                            //table name, column name, user email value
        }else{
            $user = R::findOne('Student', 'email = ?', [$credentials['email']]);
        }
        
        // Check if user exists after searching from the tables in db as in the code above
        if (!$user) {
            return jsonResponse(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }

        // Verify password
        if (password_verify($credentials['password'], $user->password)) {
            return jsonResponse(['success' => true, 'user' => $user]);
        } else {
            return jsonResponse(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }
    }

    public function signup($role,$credentials){
             // find user using user credentials
        if($role === 'agent'){
            $user = R::findOne('Agent', 'email = ?', [$credentials['email']]);
                            //table name, column name, user email value
        }else{
            $user = R::findOne('Student', 'email = ?', [$credentials['email']]);
        }
        
        // Check if user exists after searching from the tables in db as in the code above
        if (!$user) {
            return jsonResponse(['success' => false, 'message' => 'User already exists'], 401);
        }

        // Hash the password before storing
        $hashedPassword = password_hash($credentials['password'], PASSWORD_DEFAULT);
        //Other user dettails
        if($role === 'agent'){
            $newUser = R::dispense('Agent');
            $newUser->name = $credentials['name'];
            $newUser->email = $credentials['email'];
            $newUser->password = $hashedPassword;
            $newUser->agency = $credentials['phone'];
        }

        else{
            $newUser = R::dispense('Student');
            $newUser->name = $credentials['name'];
            $newUser->email = $credentials['email'];
            $newUser->password = $hashedPassword;
            $newUser->phone = $credentials['phone'];
        }

        //Send emaill to user for verification
        $verificationCode = rand(100000, 999999); // Generate a 6

        $mail = new PHPMailer(true);// set to true to enable debugging
        try {
        $mail->isSMTP();
        $mail->Host = 'smtp.example.com'; // Your SMTP server
        $mail->SMTPAuth = true;
        $mail->Username = 'akulorddianson@gmail.com';
        $mail->Password = 'your_password';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        $mail->setFrom('no-reply@example.com', 'Mailer');
        $mail->addAddress('recipient@example.com', 'Recipient Name');

        $mail->isHTML(true);
        $mail->Subject = 'Test Email';
        $mail->Body    = '<b>Hello!</b> This is a test email.';
        $mail->AltBody = 'Hello! This is a test email.';

        $mail->send();
        echo 'Message has been sent';
        } catch (\Throwable $th) {
            //throw $th;
        }
    }
}

?>