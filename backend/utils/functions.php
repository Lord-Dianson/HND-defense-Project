<?php
function jsonResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
}

function validateLoginInput($role, $credentials) {
    if (empty($role) || empty($credentials['username']) || empty($credentials['password'])) {
        return false;
    }
    return true;
}




?>