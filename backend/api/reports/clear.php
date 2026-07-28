<?php
// api/reports/clear.php
// Handles POST request to delete all reports for the authenticated user

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../php_errors.log');

try {
    require_once '../../db_connect.php';

    // Authenticate user
    $userId = authenticate($pdo);

    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Delete all reports belonging to this user
        $stmt = $pdo->prepare("DELETE FROM medical_reports WHERE user_id = ?");
        $stmt->execute([$userId]);

        http_response_code(200);
        echo json_encode(['message' => 'All reports cleared successfully', 'count' => $stmt->rowCount()]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Clear Reports API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
