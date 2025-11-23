<?php
require '../vendor/autoload.php'; // Ensure Composer's autoload is included
require '../config/database.php'; // Include the database connection setup
require '../utils/functions.php'; // Include utility functions

// Example endpoint for login
class LoginController {
    
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
}

// Assume this is how you're invoking the login method
$controller = new LoginController();
$result = $controller->login('admin', ['username' => 'john_doe', 'password' => 'securePassword123']);
jsonResponse($result); // Return the JSON response
?>