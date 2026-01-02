<?php

namespace Controllers;

use Exception;
use Models\User;
use Models\Payment;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class userController
{
    private function verifyToken($authHeader)
    {
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        try {
            $token = $matches[1];
            $payload = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
            return User::where('ID', $payload->sub)->first();
        } catch (Exception $e) {
            return null;
        }
    }

    private function verifyAdminRole($authHeader)
    {
        $user = $this->verifyToken($authHeader);
        return ($user && $user->role === 'admin') ? $user : null;
    }

    public function getAllUsers($req, $res)
    {
        try {
            $admin = $this->verifyAdminRole($req->getHeaderLine('Authorization'));
            if (!$admin) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $users = User::all();
            $res->getBody()->write(json_encode(['success' => true, 'count' => count($users), 'users' => $users]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getUserById($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $userID = $body['userID'] ?? $user->ID;

            if ($userID !== $user->ID && $user->role !== 'admin') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $targetUser = User::find($userID);
            if (!$targetUser) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'User not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $res->getBody()->write(json_encode(['success' => true, 'user' => $targetUser]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getPaymentHistory($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $userID = $body['userID'] ?? $user->ID;

            if ($userID !== $user->ID && $user->role !== 'admin') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }
            // Eager load related hostel to provide human-friendly payment info
            $payments = Payment::where('studentID', $userID)->with('hostel')->get();

            // Map payments to include hostel name/location, date, amount and status
            $formatted = $payments->map(function ($p) {
                return [
                    'paymentID' => $p->paymentID,
                    'hostelID' => $p->hostelID,
                    'hostelName' => $p->hostel ? ($p->hostel->name ?? null) : null,
                    'hostelLocation' => $p->hostel ? ($p->hostel->location ?? null) : null,
                    'amount' => $p->amount,
                    'status' => $p->status,
                    'paidAt' => $p->paidAt ?? $p->createdAt,
                    'reference' => $p->reference ?? null,
                ];
            });

            $res->getBody()->write(json_encode(['success' => true, 'count' => count($formatted), 'payments' => $formatted]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}

?>
