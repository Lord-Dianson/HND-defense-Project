<?php

namespace Controllers;

use Exception;
use Models\Payment;
use Models\User;
use Models\Booking;
use Models\Hostel;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Mpdf\Mpdf;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->load();

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
        // Set CORS headers FIRST (before any output)
        $allowedOrigins = [
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://localhost:3000',
            'null'
        ];
        
        $origin = $req->getHeaderLine('Origin');
        if (in_array($origin, $allowedOrigins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        
        // Extract data from request body
        $body = $req->getParsedBody();
        $payer = htmlspecialchars($body['payer_name'] ?? 'N/A');
        $hostel = htmlspecialchars($body['hostel_name'] ?? 'N/A');
        $period = intval($body['booking_period'] ?? 1);
        $amount = floatval($body['rent_amount'] ?? 0);
        
        // Calculate total amount
        $totalAmount = $amount * $period;
        
        // Set timezone to Cameroon (Africa/Douala) and format current date
        date_default_timezone_set('Africa/Douala');
        $currentDate = date('F j, Y');
        
        // Calculate year range for booking period
        $currentYear = intval(date('Y'));
        $endYear = $currentYear + $period;
        $yearRange = $currentYear . '-' . $endYear;
        
        // Determine singular/plural for years
        $yearText = $period > 1 ? "years" : "year";

        try {
            // Build mPDF-friendly HTML with dynamic data
            $htmlContent = <<<HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { 
                font-family: Helvetica, Arial, sans-serif; 
                background-color: #0f111a; 
                color: #e5e7eb; 
                margin: 0; 
                padding: 0; 
            }
            
            /* Container optimized for single-page fit */
            .receipt-container {
                width: 680px; 
                margin: 20pt auto;
                background-color: #1e2538;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12pt;
                overflow: hidden;
                page-break-inside: avoid; 
            }

            .header { padding: 25pt; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: center; }
            .logo-area { font-size: 22pt; font-weight: bold; color: #ffffff; margin-bottom: 10pt; }
            .receipt-title { font-size: 28pt; font-weight: bold; color: #fbbf24; font-family: "Times New Roman", serif; margin-bottom: 5pt; }
            
            .date-section { text-align: center; padding: 15pt 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
            .date-label { font-size: 9pt; text-transform: uppercase; color: #9ca3af; letter-spacing: 1.5pt; }
            .date-value { font-size: 14pt; font-weight: bold; color: #ffffff; margin-top: 3pt; }

            .details-box { margin: 20pt; background-color: #161b28; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10pt; padding: 15pt; }
            .details-title { font-size: 16pt; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10pt; margin-bottom: 12pt; color: #ffffff; }

            .row-table { width: 100%; border-collapse: collapse; }
            .row-table td { padding: 6pt 0; vertical-align: middle; }
            .label { color: #d1d5db; font-size: 11pt; }
            .value { font-weight: bold; color: #ffffff; text-align: right; font-size: 11pt; }

            .total-section { margin: 0 20pt 20pt 20pt; }
            .border-dashed { border-bottom: 1pt dashed rgba(255, 255, 255, 0.2); padding-bottom: 10pt; margin-bottom: 10pt; }
            
            /* Contact Section Alignment Fix */
            .contact-section { background-color: #161b28; padding: 15pt 20pt; border-top: 1px solid rgba(255, 255, 255, 0.1); }
            .contact-table { width: 100%; }
            .contact-cell { width: 33.33%; text-align: center; vertical-align: middle; }
            
            /* Nested table for perfect icon alignment */
            .icon-align-table { margin: 0 auto; border-collapse: collapse; }
            .icon-align-table td { padding: 0 4pt; vertical-align: middle; color: #d1d5db; font-size: 9pt; }
            
            .icon-svg { width: 14px; height: 14px; }

            .footer { padding: 15pt 30pt; text-align: center; font-size: 10pt; color: #9ca3af; line-height: 1.4; }
            .copyright { text-align: center; font-size: 8pt; color: #4b5563; padding-bottom: 20pt; }
            .text-brand-blue { color: #3b82f6; }
        </style>
    </head>
    <body>

        <div class="receipt-container">
            <div class="header">
                <div class="logo-area">Hoste<span class="text-brand-blue">Link</span></div>
                <h1 class="receipt-title">Payment Receipt</h1>
                <p style="color: #9ca3af; font-size: 11pt;">Thank you for your booking!</p>
            </div>

            <div class="date-section">
                <div class="date-label">Payment Date</div>
                <div class="date-value">{$currentDate}</div>
            </div>

            <div class="details-box">
                <div class="details-title">Booking Details</div>
                <table class="row-table">
                    <tr><td class="label">Payer Name:</td><td class="value">{$payer}</td></tr>
                    <tr><td class="label">Hostel Name:</td><td class="value">{$hostel}</td></tr>
                    <tr><td class="label">Booking Period:</td><td class="value">{$period} {$yearText} ({$yearRange})</td></tr>
                </table>
            </div>

            <div class="total-section">
                <table class="row-table border-dashed">
                    <tr>
                        <td style="color: #d1d5db; font-size: 12pt;">Rent Amount:</td>
                        <td class="value" style="font-size: 13pt;">{$amount} FCFA</td>
                    </tr>
                </table>
                <table class="row-table" style="margin-top: 5pt;">
                    <tr>
                        <td class="text-brand-blue" style="font-size: 18pt; font-weight: bold;">Total Paid:</td>
                        <td class="text-brand-blue" style="font-size: 20pt; font-weight: bold; text-align: right;">{$totalAmount} FCFA</td>
                    </tr>
                </table>
            </div>

            <div class="contact-section">
    <table class="contact-table">
        <tr>
            <td class="contact-cell">
                <table class="icon-align-table">
                    <tr>
                        <td><svg class="icon-svg" viewBox="0 0 24 24"><path fill="#3b82f6" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></td>
                        <td>hosteLink@gmail.com</td>
                    </tr>
                </table>
            </td>
            <td class="contact-cell">
                <table class="icon-align-table">
                    <tr>
                        <td><svg class="icon-svg" viewBox="0 0 24 24"><path fill="#3b82f6" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></td>
                        <td>+237 653568807</td>
                    </tr>
                </table>
            </td>
            <td class="contact-cell">
                <table class="icon-align-table">
                    <tr>
                        <td>
<svg class="icon-svg" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path fill="#3b82f6" d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 .01 5.36.01 12c0 2.11.55 4.18 1.6 6.01L0 24l6.2-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.36 12-12 0-1.98-.48-3.86-1.48-5.5zM12 21.5c-1.2 0-2.38-.28-3.44-.82l-.25-.12-3.68.96.98-3.6-.13-.27A9.5 9.5 0 0 1 2.5 12 9.5 9.5 0 0 1 12 2.5c5.24 0 9.5 4.26 9.5 9.5S17.24 21.5 12 21.5zM16.1 14.6c-.26-.13-1.54-.76-1.78-.85-.24-.09-.42-.13-.6.13-.18.26-.7.85-.86 1.03-.16.18-.32.2-.59.07-.27-.13-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.13-.16.17-.27.26-.45.09-.18.04-.34-.02-.47-.06-.13-.6-1.44-.82-1.97-.22-.52-.45-.45-.62-.46-.16-.01-.35-.01-.54-.01s-.45.06-.69.34c-.24.28-.92.9-.92 2.2 0 1.3.94 2.56 1.07 2.74.13.18 1.85 2.9 4.49 3.95 3.14 1.24 3.14.83 3.7.78.56-.05 1.82-.74 2.08-1.45.26-.71.26-1.32.18-1.45-.08-.13-.24-.18-.5-.31z"/>
</svg>
</td>
                        <td>+237 653568807</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>
            <div class="footer">
                This receipt confirms your payment for the specified booking. Please present this "Golden Receipt" to the landlord upon arrival.
            </div>
        </div>

        <div class="copyright">
            © 2025 HosteLink Cameroon. All rights reserved.
        </div>

    </body>
    </html>
HTML;

            // Ensure tempDir exists and is writable (try system temp, fallback to project tmp)
            $tempDir = sys_get_temp_dir() . '/mpdf';
            if (!is_dir($tempDir)) {
                @mkdir($tempDir, 0755, true);
            }
            if (!is_writable($tempDir)) {
                $projTmp = dirname(__DIR__) . '/tmp/mpdf';
                if (!is_dir($projTmp)) {
                    @mkdir($projTmp, 0755, true);
                }
                $tempDir = $projTmp;
            }
            if (!is_dir($tempDir) || !is_writable($tempDir)) {
                // attempt to set permissive permissions as a last resort (may fail on some hosts)
                @chmod($tempDir, 0777);
            }

            // Initialize mPDF
            $mpdf = new Mpdf([
                'mode' => 'utf-8',
                'format' => 'A4',
                'orientation' => 'L',
                'margin_left' => 0,
                'margin_right' => 0,
                'margin_top' => 0,
                'margin_bottom' => 0,
                'default_font_size' => 12,
                'default_font' => 'DejaVu Sans',
                'tempDir' => $tempDir
            ]);

            // Document metadata
            $mpdf->SetTitle('HosteLink - Golden Receipt');
            $mpdf->SetAuthor('HosteLink System');
            $mpdf->SetSubject('Payment Receipt');
            $mpdf->SetKeywords('receipt, payment, hostel, booking');
            $mpdf->SetAutoPageBreak(false);
            // mPDF settings
            $mpdf->useSubstitutions = false;
            $mpdf->simpleTables = true;
            $mpdf->packTableData = true;

            // Write HTML to PDF
            $mpdf->WriteHTML($htmlContent);

            // Clear all output buffers to prevent corruption
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            // Output PDF as download
            $mpdf->Output('HosteLink_Receipt_' . date('Ymd_His') . '.pdf', 'D');
            exit;
        } catch (Exception $e) {
            // Clear buffers before printing error to avoid corrupting output
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            // Return error as JSON for better frontend handling
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error generating PDF: ' . $e->getMessage()
            ]);
            exit;
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
