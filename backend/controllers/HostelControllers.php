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

    public function createHostel($req, $res)
    {
        try {
            // Verify agent token
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user || ($user->role !== 'agent' && $user->role !== 'admin' && $user->role !== 'super_admin')) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized - Agent access required']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();

            // Validate required fields
            $requiredFields = ['name', 'location', 'price'];
            foreach ($requiredFields as $field) {
                if (empty($body[$field])) {
                    $res->getBody()->write(json_encode(['success' => false, 'message' => "Missing required field: $field"]));
                    return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
            }

            // Generate unique hostel ID
            $hostelID = Uuid::uuid4()->toString();

            // Create the hostel
            $hostel = Hostel::create([
                'hostelID' => $hostelID,
                'name' => $body['name'],
                'location' => $body['location'],
                'image' => $body['image'] ?? null,
                'capacity' => $body['capacity'] ?? 1,
                'roomsLeft' => $body['roomsLeft'] ?? $body['capacity'] ?? 1,
                'price' => $body['price'],
                'facilities' => $body['facilities'] ?? '',
                'roomType' => $body['roomType'] ?? 'Single Room only',
                'description' => $body['description'] ?? '',
                'status' => 'available',
                'agentID' => $user->ID,
                'landlordPhone' => $body['landlordPhone'] ?? '',
                'verified' => 0,
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);

            $res->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Hostel created successfully',
                'hostel' => $hostel
            ]));
            return $res->withStatus(201)->withHeader('Content-Type', 'application/json');
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
                error_log('Booking: User authentication failed');
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            error_log('Booking request body: ' . json_encode($body));
            
            $hostelID = $body['hostelID'] ?? null;
            if (!$hostelID) {
                error_log('Booking: hostelID is missing or null');
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'hostelID is required']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            error_log('Booking: Looking for hostel ID: ' . $hostelID);
            $hostel = Hostel::find($hostelID);
            
            if (!$hostel) {
                error_log('Booking: Hostel not found for ID: ' . $hostelID);
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Hostel not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            if ($hostel->status !== 'available') {
                error_log('Booking: Hostel not available. Status: ' . $hostel->status);
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Hostel not available']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // 1. Create Payment FIRST
            try {
                error_log('Booking: Creating payment for student: ' . $user->ID);
                $payment = Payment::create([
                    'paymentID' => Uuid::uuid4()->toString(),
                    'studentID' => $user->ID,
                    'hostelID' => $hostel->hostelID,
                    'landlordPhone' => $hostel->landlordPhone,
                    'amount' => $body['amount'] ?? 0,
                    'status' => 'completed',
                    'reference' => 'BOOK_' . time(),
                    'paidAt' => date('Y-m-d H:i:s'),
                    'createdAt' => date('Y-m-d H:i:s'),
                    'updatedAt' => date('Y-m-d H:i:s')
                ]);
                error_log('Booking: Payment created successfully: ' . $payment->paymentID);
            } catch (Exception $paymentError) {
                error_log('Booking: Payment creation error: ' . $paymentError->getMessage());
                throw new Exception('Failed to create payment: ' . $paymentError->getMessage());
            }

            // 2. Create Booking SECOND
            try {
                error_log('Booking: Creating booking for student: ' . $user->ID);
                $booking = Booking::create([
                    'bookingID' => Uuid::uuid4()->toString(),
                    'studentID' => $user->ID,
                    'hostelID' => $hostel->hostelID,
                    'landlordPhone' => $hostel->landlordPhone,
                    'paymentID' => $payment->paymentID,
                    'checkOut' => $body['checkOut'] ?? date('Y-m-d', strtotime('+30 days')),
                    'receipt' => $body['receipt'] ?? null,
                    'createdAt' => date('Y-m-d H:i:s'),
                    'updatedAt' => date('Y-m-d H:i:s')
                ]);
                error_log('Booking: Booking created successfully: ' . $booking->bookingID);
            } catch (Exception $bookingError) {
                error_log('Booking: Booking creation error: ' . $bookingError->getMessage());
                throw new Exception('Failed to create booking: ' . $bookingError->getMessage());
            }

            $res->getBody()->write(json_encode(['success' => true, 'message' => 'Booking completed', 'bookingID' => $booking->bookingID, 'paymentID' => $payment->paymentID]));
            return $res->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            error_log('Booking: Endpoint error: ' . $e->getMessage());
            $res->getBody()->write(json_encode(['success' => false, 'message' => 'Error processing booking: ' . $e->getMessage()]));
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

            $bookings = Booking::with(['hostel', 'payment'])->where('studentID', $studentID)->orderBy('createdAt', 'desc')->get();
            $res->getBody()->write(json_encode(['success' => true, 'count' => count($bookings), 'bookings' => $bookings]));
            return $res->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $res->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $res->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getReceiptUrl($req, $res)
    {
        try {
            $user = $this->verifyToken($req->getHeaderLine('Authorization'));
            if (!$user) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Unauthorized']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $body = $req->getParsedBody();
            $bookingID = $body['bookingID'] ?? '';
            $phone = $body['phone'] ?? ''; // Can be used for extra verification or payment trigger

            if (empty($bookingID)) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Booking ID required']));
                return $res->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $booking = Booking::find($bookingID);
            
            if (!$booking) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Booking not found']));
                return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Verify ownership
            if ($booking->studentID !== $user->ID && $user->role !== 'admin') {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'Forbidden']));
                return $res->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            if (empty($booking->receipt)) {
                $res->getBody()->write(json_encode(['success' => false, 'message' => 'No receipt available for this booking']));
                 return $res->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $res->getBody()->write(json_encode(['success' => true, 'receiptUrl' => $booking->receipt]));
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
