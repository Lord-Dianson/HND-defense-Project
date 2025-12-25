<?php

namespace Controllers;

use Exception;
use Models\User;
use Ramsey\Uuid\Uuid;
use Firebase\JWT\JWT;

class AuthController
{
    public function test($req, $res, $args)
    {
        $body = $req->getParsedBody();
        $res->getBody()->write(json_encode(["message" => "API is still running Mr " . ($body["fname"] ?? '') . " " . ($body['lname'] ?? '')]));
        return $res->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
    // 1. Send OTP
    public function sendOTP($req, $res)
    {
        try {
            $body = $req->getParsedBody();
            $email = $body['email'] ?? '';
            $name = $body['name'] ?? '';
            $phone = $body['phone'] ?? '';
            $role = $body['role'];
            $password = $body['password'] ?? '';
            if (!$email || !$name || !$phone || !$password) {
                $res->getBody()->write(json_encode(["success" => false, "message" => "All fields required."]));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Check if user exists first
            if (User::where('email', $email)->exists()) {
                $res->getBody()->write(json_encode(["success" => false, "message" => "User already exist"]));
                return $res->withStatus(409)->withHeader('Content-Type', 'application/json');
            }

            $otp = random_int(100000, 999999);
            $jti = Uuid::uuid4()->toString();
            $otpHash = password_hash($otp, PASSWORD_DEFAULT);
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            if (session_status() !== PHP_SESSION_ACTIVE) session_start();
            $_SESSION['otp_' . $jti] = [
                'hash' => $otpHash,
                'email' => $email,
                'name' => $name,
                'phone' => $phone,
                'password_hash' => $passwordHash,
                'role' => $role,
                'created' => time(),
            ];

            $emailSent = sendEmailVerification($otp, $name, $email);

            if (!$emailSent) {
                $res->getBody()->write(json_encode(["success" => false, "message" => "Failed to send verification email"]));
                return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $responsePayload = ["success" => true, "jti" => $jti];
            // Expose OTP in response only in development for local testing
            if (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'development') {
                $responsePayload['otp'] = (string)$otp;
            }

            $res->getBody()->write(json_encode($responsePayload));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(["success" => false, "message" => "Error: " . $e->getMessage(), "trace" => $e->getTraceAsString()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // 2. Signup
    public function signup($req, $res)
    {
        try {
            $body = $req->getParsedBody();
            $otp = $body['otp'] ?? '';
            $jti = $body['jti'] ?? '';

            if (!$otp || !$jti) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP and JTI required.']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            if (session_status() !== PHP_SESSION_ACTIVE) session_start();
            $userInfo = $_SESSION['otp_' . $jti] ?? null;

            if (!$userInfo) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP session not found.']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Check if session has expired (5 minutes)
            if (time() - $userInfo['created'] > 300) {
                unset($_SESSION['otp_' . $jti]);
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Session timeout']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Verify OTP
            if (!password_verify($otp, $userInfo['hash'])) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP incorrect']));
                return $res->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            // Get user data from session
            $name = $userInfo['name'];
            $email = $userInfo['email'];
            $role = $userInfo['role'] ?? 'student';
            $phone = $userInfo['phone'];
            $passwordHash = $userInfo['password_hash'];

            // Check if user already exists (prevent duplicates)
            if (User::where('email', $email)->exists()) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'User already exists']));
                return $res->withStatus(409)->withHeader('Content-Type', 'application/json');
            }

            // Create user in database
            $user = User::create([
                'ID' => Uuid::uuid4()->toString(),
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'password' => $passwordHash,
                'role' => $role,
                'status' => 'active',
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);
            unset($_SESSION['otp_' . $jti]);

            // Generate JWT token
            $token = JWT::encode([
                'sub' => $user->ID,
                'role' => $user->role,
                'exp' => time() + 86400,
            ], $_ENV['JWT_SECRET'], 'HS256');

            $res->getBody()->write(json_encode([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user->ID,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'status' => $user->status
                ]
            ]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // 3. Resend OTP
    public function resendOTP($req, $res)
    {
        $body = $req->getParsedBody();
        $jti = $body['jti'] ?? '';
        if (!$jti) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'JTI is required.']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $userInfo = $_SESSION['otp_' . $jti] ?? null;
        if (!$userInfo) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP session not found.']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Check if session is expired
        if (time() - $userInfo['created'] > 300) { // 5 min expiry
            unset($_SESSION['otp_' . $jti]);
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Session timeout']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Generate new OTP
        $newOtp = random_int(100000, 999999);
        $newOtpHash = password_hash($newOtp, PASSWORD_DEFAULT);

        // Update session with new OTP
        $_SESSION['otp_' . $jti] = [
            'hash' => $newOtpHash,
            'email' => $userInfo['email'],
            'name' => $userInfo['name'],
            'phone' => $userInfo['phone'],
            'password_hash' => $userInfo['password_hash'],
            'role' => $userInfo['role'],
            'created' => time()
        ];

        // Send new OTP via email
        $emailSent = sendEmailVerification($newOtp, $userInfo['name'], $userInfo['email']);

        if (!$emailSent) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Failed to send verification email']));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }

        $res->getBody()->write(json_encode(['success' => true, 'message' => 'New OTP sent successfully']));
        return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    // 4. Login
    public function login($req, $res)
    {
        $body = $req->getParsedBody();
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';
        if (!$email || !$password) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Email and password required.']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        $user = User::where('email', $email)->first();
        if (!$user || !password_verify($password, $user->password)) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Invalid credentials.']));
            return $res->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        $token = JWT::encode([
            'sub' => $user->ID,
            'role' => $user->role,
            'exp' => time() + 86400,
        ], $_ENV['JWT_SECRET'], 'HS256');
        $res->getBody()->write(json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->ID,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => $user->status
            ]
        ]));
        return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    // 5. Reset Password
    public function resetPassword($req, $res)
    {
        $body = $req->getParsedBody();
        $email = $body['email'] ?? '';
        $otp = $body['otp'] ?? '';
        $newPassword = $body['newPassword'] ?? '';
        $jti = $body['jti'] ?? '';
        if (!$email || !$otp || !$newPassword || !$jti) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'All fields required.']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $userInfo = $_SESSION['otp_' . $jti] ?? null;
        if (!$userInfo || $userInfo['email'] !== $email) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP session not found or mismatched.']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        if (time() - $userInfo['created'] > 300) { // 5 min expiry
            unset($_SESSION['otp_' . $jti]);
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP expired.']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        if (!password_verify($otp, $userInfo['hash'])) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Invalid OTP.']));
            return $res->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        $user = User::where('email', $email)->first();
        if (!$user) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'User not found.']));
            return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        $user->password = password_hash($newPassword, PASSWORD_DEFAULT);
        $user->updatedAt = date('Y-m-d H:i:s');
        $user->save();
        unset($_SESSION['otp_' . $jti]);
        $res->getBody()->write(json_encode(['success' => true, 'message' => 'Password updated.']));
        return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    
}
