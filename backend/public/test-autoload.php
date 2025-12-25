<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP Version: " . phpversion() . "\n";
echo "Script: " . __FILE__ . "\n";
echo "Vendor Path: " . realpath(__DIR__ . '/../vendor/autoload.php') . "\n";

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    echo "Autoload file exists: YES\n";
    require __DIR__ . '/../vendor/autoload.php';
    echo "Autoload file loaded: YES\n";
    
    echo "Slim\Factory\AppFactory exists: " . (class_exists('Slim\\Factory\\AppFactory') ? 'YES' : 'NO') . "\n";
} else {
    echo "Autoload file exists: NO\n";
}
?>
