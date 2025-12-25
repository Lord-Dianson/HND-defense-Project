<?php
// helper utilities

function validateLoginInput($role, array $credentials) {
    if (empty($role) || empty($credentials['email']) || empty($credentials['password'])) {
        return false;
    }
    return filter_var($credentials['email'], FILTER_VALIDATE_EMAIL) && strlen($credentials['password']) >= 6;
}


function validateSignupInput(array $credentials): bool {
    return isset($credentials['name'], $credentials['email'], $credentials['password'], $credentials['phone']) &&
           !empty($credentials['name']) &&
           !empty($credentials['email']) &&
           !empty($credentials['password']) &&
           !empty($credentials['phone']) &&
           filter_var($credentials['email'], FILTER_VALIDATE_EMAIL) &&
           strlen($credentials['password']) >= 6;
}



?>