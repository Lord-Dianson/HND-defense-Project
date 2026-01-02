<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 1. Load Autoload FIRST
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Slim\Middleware\BodyParsingMiddleware;
use Dotenv\Dotenv;
use Controllers\AuthController;
use Controllers\AdminControllers;
use Controllers\AgentControllers;
use Controllers\HostelControllers;
use Controllers\paymentControllers;
use Controllers\userController;



try {
    // 2. Load Environment Variables
    $dotenv = Dotenv::createImmutable(dirname(__DIR__));
    $dotenv->load();

    // 3. Initialize Database Connection BEFORE loading controllers
    require __DIR__ . '/../config/database.php';

    // 4. Load utilities (needed for sendEmail and functions)
    require_once __DIR__ . '/../utils/sendEmail.php';
    require_once __DIR__ . '/../utils/functions.php';

    // 5. Configure session for cross-origin requests
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_secure', 'false'); // Set to 'true' in production with HTTPS
    ini_set('session.cookie_httponly', 'true');
    
    // Start session early to ensure consistent session handling
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    // 6. Setup Slim App
    $app = AppFactory::create();

    $app->addBodyParsingMiddleware();
    $app->addRoutingMiddleware();

    $app->add(function ($request, $handler) {
        $response = $handler->handle($request);
        return $response
            ->withHeader('Access-Control-Allow-Origin', $request->getHeaderLine('Origin'))
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    });

    $app->options('/{routes:.+}', function ($request, $response, $args) {
        return $response
            ->withHeader('Access-Control-Allow-Origin', $request->getHeaderLine('Origin'))
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    });


    // Add error middleware with verbose output
    $errorMiddleware = $app->addErrorMiddleware(true, true, true);
    $errorMiddleware->getDefaultErrorHandler()->forceContentType('application/json');


    $authControllers = new AuthController();
    $adminControllers = new AdminControllers();
    $agentControllers = new AgentControllers();
    $hostelControllers = new HostelControllers();
    $paymentControllers = new paymentControllers();
    $userControllers = new userController();

    // Define routes
    // Test route
    $app->get("/api", [$authControllers, 'test']);

    // Auth Routes
    $app->post('/api/auth/send-otp', [$authControllers, 'sendOTP']);
    $app->post('/api/auth/signup', [$authControllers, 'signup']);
    $app->post('/api/auth/resend-otp', [$authControllers, 'resendOTP']);
    $app->post('/api/auth/login', [$authControllers, 'login']);
    $app->post('/api/auth/reset-password', [$authControllers, 'resetPassword']);
    $app->post('/api/auth/forgot-password', [$authControllers, 'forgotPassword']);
    $app->post('/api/auth/update-password', [$authControllers, 'updatePassword']);
    $app->get('/api/auth/me', [$authControllers, 'getUserById']);
    $app->post('/api/auth/get-token', [$authControllers, 'getToken']);

    // Admin Routes
    $app->get('/api/admin/users', [$adminControllers, 'listAllUsers']);
    $app->put('/api/admin/users/{id}', [$adminControllers, 'updateUserInfo']);
    $app->get('/api/admin/hostels', [$adminControllers, 'listAllHostelsSubmissions']);
    $app->post('/api/admin/hostels/verify', [$adminControllers, 'verifyHostelSubmission']);
    $app->post('/api/admin/agents/pay', [$adminControllers, 'payAgent']);

    // Agent Routes
    $app->post('/api/agent/submit-hostels', [$agentControllers, 'submitHostel']);
    $app->get('/api/agent/list-hostels', [$agentControllers, 'listSubmissionHistory']);
    $app->post('/api/agent/payments/{id}', [$agentControllers, 'recievePayment']);
    $app->get('/api/agent/payments', [$agentControllers, 'listPaymentHistory']);

    // Hostel Routes
    $app->get('/api/hostels', [$hostelControllers, 'getAllHostels']);
    $app->post('/api/hostels/by-id', [$hostelControllers, 'getHostelByID']);
    $app->put('/api/hostels/{id}', [$hostelControllers, 'updateHosteDetails']);
    $app->delete('/api/hostels/{id}', [$hostelControllers, 'deleteHostel']);
    $app->post('/api/hostels/book', [$hostelControllers, 'bookHostel']);
    $app->get('/api/bookings', [$hostelControllers, 'getBookingHistoryById']);
    $app->put('/api/bookings/{id}', [$hostelControllers, 'updateBookingDetails']);
    $app->delete('/api/bookings/{id}', [$hostelControllers, 'cancelBooking']);

    // Payment Routes
    $app->post('/api/receipts/generate', [$paymentControllers, 'generatePDFReciept']);
    $app->post('/api/receipts/download', [$paymentControllers, 'downloadGeneratedReciept']);

    // User Routes
    $app->get('/api/users', [$userControllers, 'getAllUsers']);
    $app->post('/api/users/by-id', [$userControllers, 'getUserById']);
    $app->get('/api/payments/history', [$userControllers, 'getPaymentHistory']);

    // Run the app
    $app->run();
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
}
