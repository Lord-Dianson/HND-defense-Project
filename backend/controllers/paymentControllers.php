<?php

namespace Controllers;

use Exception;
use Models\Payment;
use Models\User;
use Models\Booking;
use Models\Hostel;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Ramsey\Uuid\Uuid;

class paymentControllers
{
    protected function verifyToken($authHeader)
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

    protected function verifyAdminRole($authHeader)
    {
        $user = $this->verifyToken($authHeader);
        return ($user && $user->role === 'admin') ? $user : null;
    }

    protected function UserPayment($phoneNumber, $amount)
    {
        $cameroonPhonePattern = '/^237[2367]\d{7}$/';
        if (!preg_match($cameroonPhonePattern, $phoneNumber)) {
            return ['success' => false, 'message' => 'Invalid Cameroon phone number'];
        }

        $provider = substr($phoneNumber, 3, 1);
        if (in_array($provider, ['2', '3'])) {
            $provider = 'MTN';
        } else {
            $provider = 'Orange';
        }

        return $this->processPaymentGateway($phoneNumber, $amount, $provider);
    }

    private function processPaymentGateway($phoneNumber, $amount, $provider)
    {
        // Simulate payment processing
        return [
            'success' => true,
            'message' => 'Payment processed successfully',
            'provider' => $provider,
            'reference' => 'PAY_' . time(),
            'amount' => $amount
        ];
    }

    public function generatePDFReciept($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $paymentID = $body['paymentID'] ?? '';
            if (empty($paymentID)) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Payment ID required']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $payment = Payment::find($paymentID);
            if (!$payment) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Payment not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            if ($payment->studentID !== $user->ID && $user->role !== 'admin') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $booking = Booking::where('paymentID', $paymentID)->first();
            $hostel = Hostel::find($payment->hostelID);

            $html = '<html><body>';
            $html .= '<h2>Receipt</h2>';
            $html .= '<p><strong>Payment ID:</strong> ' . $payment->paymentID . '</p>';
            $html .= '<p><strong>Amount:</strong> ' . $payment->amount . ' XAF</p>';
            $html .= '<p><strong>Status:</strong> ' . $payment->status . '</p>';
            $html .= '<p><strong>Paid At:</strong> ' . $payment->paidAt . '</p>';
            if ($booking) {
                $html .= '<p><strong>Check-in:</strong> ' . $booking->checkIn . '</p>';
                $html .= '<p><strong>Check-out:</strong> ' . $booking->checkOut . '</p>';
            }
            if ($hostel) {
                $html .= '<p><strong>Hostel:</strong> ' . $hostel->name . '</p>';
            }
            $html .= '</body></html>';

            $receiptID = Uuid::uuid4()->toString();
            $res->getBody()->write(json_encode(['success' => true, 'receiptID' => $receiptID, 'html' => $html]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function downloadGeneratedReciept($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $receiptID = $body['receiptID'] ?? '';
            $paymentID = $body['paymentID'] ?? '';

            if (empty($receiptID) || empty($paymentID)) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Receipt ID and Payment ID required']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $payment = Payment::find($paymentID);
            if (!$payment || $payment->studentID !== $user->ID) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            // Charge 500 FCFA after first download (simulate by checking download count)
            $downloadCharge = 500;

            $res->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Receipt downloaded',
                'charge' => $downloadCharge,
                'receiptID' => $receiptID
            ]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}

?>
