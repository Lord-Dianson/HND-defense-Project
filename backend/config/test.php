<?php
require_once __DIR__ . '/../bootstrap/eloquent.php';

try {
    $db = Illuminate\Database\Capsule\Manager::connection();
    $db->getPdo();
    echo "Database connection established.";
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}
?>
