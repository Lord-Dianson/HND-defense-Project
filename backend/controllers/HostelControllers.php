<?php

namespace Controllers;

use Exception;
use Models\Hostel;
use Models\Booking;
use Models\Payment;
use Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Ramsey\Uuid\Uuid;

class HostelControllers extends paymentControllers
{
    public function getAllHostels($req, $res)
    {
        try {
            $hostels = Hostel::where('status', 'available')->get();
            $res->getBody()->write(json_encode(['success' => true, 'count' => count($hostels), 'hostels' => $hostels]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getHostelByID($req, $res)
    {
        try {
            $body = $req->getParsedBody();
            $hostelID = $body['hostelID'] ?? '';
            if (empty($hostelID)) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Hostel ID required']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $hostel = Hostel::find($hostelID);
            if (!$hostel) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Hostel not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $res->getBody()->write(json_encode(['success' => true, 'hostel' => $hostel]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateHosteDetails($req, $res)
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

            foreach (['name', 'location', 'capacity', 'description', 'facilities', 'status', 'verified'] as $field) {
                if (isset($body[$field])) $hostel->$field = $body[$field];
            }
            $hostel->updatedAt = date('Y-m-d H:i:s');
            $hostel->save();

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Hostel updated']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function deleteHostel($req, $res)
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

            $hostel->deletedAt = date('Y-m-d H:i:s');
            $hostel->save();

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Hostel deleted']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function bookHostel($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $hostel = Hostel::find($body['hostelID'] ?? '');
            if (!$hostel || $hostel->status !== 'available') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Hostel not found or not available']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $payment = Payment::create([
                'paymentID' => Uuid::uuid4()->toString(),
                'studentID' => $user->ID,
                'hostelID' => $hostel->hostelID,
                'landlordID' => $hostel->landLordID ?? '',
                'amount' => $body['amount'] ?? 0,
                'status' => 'completed',
                'reference' => 'BOOK_' . time(),
                'paidAt' => date('Y-m-d H:i:s'),
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);

            $booking = Booking::create([
                'bookingID' => Uuid::uuid4()->toString(),
                'studentID' => $user->ID,
                'hostelID' => $hostel->hostelID,
                'landlordID' => $hostel->landLordID ?? '',
                'paymentID' => $payment->paymentID,
                'agentID' => $hostel->agentID ?? '',
                'checkIn' => $body['checkIn'] ?? date('Y-m-d'),
                'checkOut' => $body['checkOut'] ?? date('Y-m-d', strtotime('+30 days')),
                'receipt' => null,
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Booking completed', 'bookingID' => $booking->bookingID, 'paymentID' => $payment->paymentID]));
            return $res->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getBookingHistoryById($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $studentID = $body['studentID'] ?? $user->ID;

            if ($studentID !== $user->ID && $user->role !== 'admin') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $bookings = Booking::where('studentID', $studentID)->get();
            $res->getBody()->write(json_encode(['success' => true, 'count' => count($bookings), 'bookings' => $bookings]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateBookingDetails($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $booking = Booking::find($body['bookingID'] ?? '');
            if (!$booking) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Booking not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            if ($booking->studentID !== $user->ID && $user->role !== 'admin') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            foreach (['checkIn', 'checkOut'] as $field) {
                if (isset($body[$field])) $booking->$field = $body[$field];
            }
            $booking->updatedAt = date('Y-m-d H:i:s');
            $booking->save();

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Booking updated']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function cancelBooking($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $booking = Booking::find($body['bookingID'] ?? '');
            if (!$booking) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Booking not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            if ($booking->studentID !== $user->ID && $user->role !== 'admin') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $booking->delete();
            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Booking cancelled']));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}

?>
