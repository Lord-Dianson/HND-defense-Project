<?php

namespace Controllers;

use Controllers\paymentControllers as PaymentControllers;
use Exception;
use Models\User;
use Models\Hostel;
use Models\Payment;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Ramsey\Uuid\Uuid;

class AgentControllers extends PaymentControllers
{
    private function verifyAgentRole($authHeader)
    {
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        try {
            $token = $matches[1];
            $payload = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
            $user = User::where('ID', $payload->sub)->first();
            return ($user && $user->role === 'agent') ? $user : null;
        } catch (Exception $e) {
            return null;
        }
    }

    public function submitHostel($req, $res)
    {
        try {
            $agent = $this->verifyAgentRole($req->getHeaderLine('Authorization'));
            if (!$agent) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $required = ['name', 'location', 'capacity', 'description', 'facilities'];
            foreach ($required as $field) {
                if (empty($body[$field] ?? '')) {
                    $res->getBody()->write(json_encode(['success' => false, 'message' => "Missing: $field"]));
                    return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
            }

            $hostel = Hostel::create([
                'hostelID' => Uuid::uuid4()->toString(),
                'name' => $body['name'],
                'location' => $body['location'],
                'capacity' => $body['capacity'],
                'description' => $body['description'],
                'facilities' => $body['facilities'],
                'verified' => false,
                'agentID' => $agent->ID,
                'status' => 'available',
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Hostel submitted', 'hostelID' => $hostel->hostelID]));
            return $res->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function listSubmissionHistory($req, $res)
    {
        try {
            $agent = $this->verifyAgentRole($req->getHeaderLine('Authorization'));
            if (!$agent) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $hostels = Hostel::where('agentID', $agent->ID)->get();
            $res->getBody()->write(json_encode(['success' => true, 'count' => count($hostels), 'hostels' => $hostels]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function recievePayment($req, $res)
    {
        try {
            $agent = $this->verifyAgentRole($req->getHeaderLine('Authorization'));
            if (!$agent) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $payment = Payment::find($body['paymentID'] ?? '');
            if (!$payment) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Payment not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $hostel = Hostel::find($payment->hostelID);
            if (!$hostel || $hostel->agentID !== $agent->ID) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $payment->status = 'completed';
            $payment->paidAt = date('Y-m-d H:i:s');
            $payment->save();

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Payment completed']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function listPaymentHistory($req, $res)
    {
        try {
            $agent = $this->verifyAgentRole($req->getHeaderLine('Authorization'));
            if (!$agent) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }
            // Get hostels for this agent and include related hostel info on each payment
            $hostels = Hostel::where('agentID', $agent->ID)->pluck('hostelID');
            $payments = Payment::whereIn('hostelID', $hostels)->with('hostel')->get();

            $formatted = $payments->map(function ($p) {
                return [
                    'paymentID' => $p->paymentID,
                    'hostelID' => $p->hostelID,
                    'hostelName' => $p->hostel ? ($p->hostel->name ?? null) : null,
                    'hostelLocation' => $p->hostel ? ($p->hostel->location ?? null) : null,
                    'studentID' => $p->studentID,
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
