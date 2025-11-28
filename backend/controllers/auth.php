<?php
session_start();

require '../vendor/autoload.php'; // Ensure Composer's autoload is included
require '../config/database.php'; // Include the database connection setup
require '../utils/functions.php'; // Include utility functions
require '../utils/sendEmail.php'; // Include email sending utility


class AuthController {
    
    //Public function for log in
    public function login($role="agent", $credentials=["email"=>"akulorddianson@gmail.com","password"=>"123456"]) {
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
            if( $role === 'agent'){
                header('location: agent_dashboard.html');}
            else{
                header('location: student_dashboard.html');
            }
            return jsonResponse(['success' => true, 'user' => $user]);
        } else {
            return jsonResponse(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }
    }

    //Public function for sign up
    public function signup($credentials, $userOtpInput){

        if($userOtpInput !== $credentials['verificationCode']) {
            jsonResponse(['message' => 'Invalid OTP. Please try again.'], 400);
            return 0;
        };

        $uuid4 = Uuid::uuid4(); // Generates a random UUID (v4)
        //Other user dettails
        if($credentials['role'] === 'agent'){
            $newUser = R::dispense('Agent');
            $newUser->id= $uuid4->toString(); 
            $newUser->name = $credentials['name'];
            $newUser->email = $credentials['email'];
            $newUser->phone = $credentials['phone'];
            $newUser->password = $credentials['password'];
            $newUser->status = 'active';

        }
        else{
            $newUser = R::dispense('Student');
            $newUser->id= $uuid4->toString(); 
            $newUser->name = $credentials['name'];
            $newUser->email = $credentials['email'];
            $newUser->phone = $credentials['phone'];
            $newUser->password = $credentials['password'];
        }

        R::store($newUser);
        jsonResponse(['success' => true, 'message' => 'User registered successfully.']);

        }

        public function verifyEmail($OTP, $role, $credentials){
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
                //Send emaill to user for verification
        $verificationCode = rand(100000, 999999); // Generate a random number

        sendEmailVerification($verificationCode, $credentials['name'], $credentials['email']);

        $_SESSION['user'] = [
            'role' => $role,
            'name' => $credentials['name'],
            'email' => $credentials['email'],
            'password' => password_hash($credentials['password'],PASSWORD_DEFAULT),
            'phone' => $credentials['phone'],
            'verificationCode' => $verificationCode
        ];
        
        }
}

?>