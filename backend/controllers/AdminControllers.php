<?php

namespace Controllers;

use Exception;
use Models\User;
use Models\Hostel;
use Models\Payment;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Ramsey\Uuid\Uuid;

class AdminControllers extends paymentControllers
{
    public function listAllUsers($req, $res)
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

    public function updateUserInfo($req, $res)
    {
        try {
            $admin = $this->verifyAdminRole($req->getHeaderLine('Authorization'));
            if (!$admin) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }
            $body = $req->getParsedBody();
            $user = User::find($body['userID'] ?? '');
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'User not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            foreach (['name', 'status', 'role', 'phone'] as $field) {
                if (isset($body['data'][$field])) $user->$field = $body['data'][$field];
            }
            $user->save();
            $res->getBody()->write(json_encode(['success' => true, 'message' => 'User updated']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function listAllHostelsSubmissions($req, $res)
    {
        try {
            $admin = $this->verifyAdminRole($req->getHeaderLine('Authorization'));
            if (!$admin) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }
            $hostels = Hostel::all();
            $res->getBody()->write(json_encode(['success' => true, 'count' => count($hostels), 'hostels' => $hostels]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function verifyHostelSubmission($req, $res)
    {
        try {
            $admin = $this->verifyAdminRole($req->getHeaderLine('Authorization'));
            if (!$admin) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }
            $body = $req->getParsedBody();
            $hostel = Hostel::find($body['hostelID'] ?? '');
            if (!$hostel) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Hostel not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $hostel->verified = $body['verified'] ?? false;
            $hostel->save();
            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Hostel verified']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function payAgent($req, $res)
    {
        try {
            $admin = $this->verifyAdminRole($req->getHeaderLine('Authorization'));
            if (!$admin) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }
            $body = $req->getParsedBody();
            $agent = User::find($body['agentID'] ?? '');
            if (!$agent || $agent->role !== 'agent') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Invalid agent']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $payment = Payment::create([
                'paymentID' => Uuid::uuid4()->toString(),
                'studentID' => $admin->ID,
                'hostelID' => $body['hostelID'] ?? Uuid::uuid4()->toString(),
                'landlordID' => $body['landlordID'] ?? Uuid::uuid4()->toString(),
                'amount' => $body['amount'] ?? 0,
                'status' => 'completed',
                'reference' => 'ADMIN_PAY_' . time(),
                'paidAt' => date('Y-m-d H:i:s'),
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);
            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Agent paid', 'paymentID' => $payment->paymentID]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}


?>