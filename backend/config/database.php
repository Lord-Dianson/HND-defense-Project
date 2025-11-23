<?php
require '../vendor/autoload.php';   // if installed via Composer
use RedBeanPHP\R;
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__)); // This goes one level up
$dotenv->load();

// set up db variables
$hostname = $_ENV['DB_HOST'];
$database = $_ENV['DB_DATABASE'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];

// Connect to MySQL via XAMPP
R::setup("mysql:host=$hostname;dbname=$database", $username, $password);

// Optional: freeze schema in production
R::freeze(false);

?>
