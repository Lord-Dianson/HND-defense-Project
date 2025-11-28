<?php
$requestUrl = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestValue = $_POST['requestValue'];

// Include necessary files containing controllers and utilities
require '../controllers/auth.php';

// controller instance or initialization
$authController = new AuthController();

// Define routes and map them to controller methods
if ($requestUrl === '/api/login' && $requestMethod === 'POST' ) {
    $credentials = [
        'email' => $_POST['email'],
        'password' => $_POST['password'],
    ];
    $role = $_POST['role'];
    $authController->login($role, $credentials);
}

?>