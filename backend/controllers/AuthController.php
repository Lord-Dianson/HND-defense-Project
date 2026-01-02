<?php

namespace Controllers;

use Exception;
use Models\User;
use Models\OtpSession;
use Ramsey\Uuid\Uuid;
use Firebase\JWT\JWT;

class AuthController
{
    // 1. Send OTP
    public function sendOTP($req, $res)
    {
        try {
            $body = $req->getParsedBody();
            $email = $body['email'] ?? '';
            $name = $body['name'] ?? '';
            $phone = $body['phone'] ?? '';
            $profile = $body['profile'] ?? '';
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

            // Clean up any expired OTP sessions
            OtpSession::cleanup();

            // Store OTP in database instead of PHP session
            $createdAt = date('Y-m-d H:i:s');
            $expiresAt = date('Y-m-d H:i:s', time() + 300); // 5 minutes
            
            OtpSession::create([
                'id' => Uuid::uuid4()->toString(),
                'jti' => $jti,
                'email' => $email,
                'name' => $name,
                'phone' => $phone,
                'otp_hash' => $otpHash,
                'password_hash' => $passwordHash,
                'role' => $role ?? 'student',
                'profile' => $profile,
                'created_at' => $createdAt,
                'expires_at' => $expiresAt
            ]);

            $emailResult = sendEmailVerification($otp, $name, $email);

            if ($emailResult !== true) {
                // $emailResult contains the error message
                $res->getBody()->write(json_encode(["success" => false, "message" => "Failed to send email: " . $emailResult]));
                return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $responsePayload = ["success" => true, "jti" => $jti, "timestamp" => time()];
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

            // Look up OTP session from database
            $otpSession = OtpSession::where('jti', $jti)->first();

            if (!$otpSession) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP session not found.']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Check if session has expired
            if (strtotime($otpSession->expires_at) < time()) {
                $otpSession->delete();
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Session timeout']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Verify OTP
            if (!password_verify($otp, $otpSession->otp_hash)) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP incorrect']));
                return $res->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            // Get user data from OTP session
            $name = $otpSession->name;
            $email = $otpSession->email;
            $role = $otpSession->role ?? 'student';
            $phone = $otpSession->phone;
            $passwordHash = $otpSession->password_hash;
            $profile = $otpSession->profile;

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
                'profile' => $profile,
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);
            $otpSession->delete();

            // Generate JWT token
            $token = JWT::encode([
                'sub' => $user->ID,
                'role' => $user->role,
                'exp' => time() + 86400,
            ], $_ENV['JWT_SECRET'], 'HS256');

            // Save token to database
            $user->token = $token;
            $user->save();

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

        // Look up OTP session from database
        $otpSession = OtpSession::where('jti', $jti)->first();
        if (!$otpSession) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'OTP session not found.']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Check if session is expired
        if (strtotime($otpSession->expires_at) < time()) {
            $otpSession->delete();
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Session timeout']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Generate new OTP
        $newOtp = random_int(100000, 999999);
        $newOtpHash = password_hash($newOtp, PASSWORD_DEFAULT);

        // Update database with new OTP and reset expiry
        $otpSession->otp_hash = $newOtpHash;
        $otpSession->expires_at = date('Y-m-d H:i:s', time() + 300);
        $otpSession->save();

        // Send new OTP via email
        $emailSent = sendEmailVerification($newOtp, $otpSession->name, $otpSession->email);

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

        // Save token to database
        $user->token = $token;
        $user->save();

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

    // 5. Forgot Password - Send Reset Email
    public function forgotPassword($req, $res)
    {
        try {
            $body = $req->getParsedBody();
            $email = $body['email'] ?? '';
            
            if (!$email) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Email is required.']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Check if user exists
            $user = User::where('email', $email)->first();
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'User not found.']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Send password reset email
            $resetLink = $_ENV['FRONTEND_URL'] . '/pages/auth/inputNewPassword.html';
            $emailSent = sendPasswordResetEmail($email, $user->name, $resetLink);

            if (!$emailSent) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Failed to send reset email.']));
                return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $res->getBody()->write(json_encode([
                'success' => true,
                'password_reset' => true,
                'email' => $email,
                'message' => 'Password reset email sent successfully.'
            ]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    // 6. Reset Password (OTP-based)
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

    // 7. Update Password (for forgot password flow - simpler, no OTP)
    public function updatePassword($req, $res)
    {
        try {
            $body = $req->getParsedBody();
            $email = $body['email'] ?? '';
            $newPassword = $body['newPassword'] ?? '';
            
            if (!$email || !$newPassword) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Email and new password are required.']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Validate password length
            if (strlen($newPassword) < 8) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Find user
            $user = User::where('email', $email)->first();
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'User not found.']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Update password
            $user->password = password_hash($newPassword, PASSWORD_DEFAULT);
            $user->updatedAt = date('Y-m-d H:i:s');
            $user->save();

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Password updated successfully.']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }


    public function getToken($req, $res)
    {
        $body = $req->getParsedBody();
        $userId = $body['user_id'] ?? '';

        if (!$userId) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'User ID required']));
            return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $user = User::where('ID', $userId)->first();

        if (!$user) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'User not found']));
            return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $res->getBody()->write(json_encode([
            'success' => true,
            'token' => $user->token
        ]));

        return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    
}
