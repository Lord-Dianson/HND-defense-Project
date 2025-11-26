<?php
require '../utils/sendEmail.php'; // Include email sending utility

$result = sendEmailVerification('123456', 'Lord Dianson','akulorddianson@gmail.com');
echo json_encode($result);

/*
// Adjust the path to the autoload.php file based on your directory structure
require '../vendor/autoload.php'; 
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__)); // This goes one level up
$dotenv->load();

// set up db variables
$hostname = $_ENV['DB_HOST'];
$database = getenv('DB_DATABASE');
$username = getenv('DB_USERNAME');
$password = getenv('DB_PASSWORD');
// Load the .env file located in the project root
echo "DB_HOST: " . $hostname . "\n";
echo "DB_DATABASE: " . $database . "\n";

// For debugging purposes, to see loaded environment variables
*/


?>