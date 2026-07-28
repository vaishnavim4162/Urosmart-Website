<?php
// api/reports/delete.php
// Handles POST request to delete a report

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../php_errors.log');

try {
    require_once '../../db_connect.php';

    // Authenticate user
    $userId = authenticate($pdo);
    // If authentication fails, authenticate() will exit script

    header('Content-Type: application/json');

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['report_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing report_id']);
            exit;
        }

        $reportId = $data['report_id'];

        // Verify ownership and delete
        // We DELETE directly with user_id check. If rows affected > 0, it existed and was owned.
        $stmt = $pdo->prepare("DELETE FROM medical_reports WHERE id = ? AND user_id = ?");
        $stmt->execute([$reportId, $userId]);

        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(['message' => 'Report deleted successfully']);
        } else {
            // Either report didn't exist or belonged to another user
            // We can check which it is, but for security/simplicity, 404 is fine or just success (idempotent)
            // But user expects it to be gone.
            // Let's check if it exists at all to give better error?
            // No, 404 Not Found is appropriate if it's not found for THIS user.
            http_response_code(404);
            echo json_encode(['error' => 'Report not found or access denied']);
        }

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Delete Report API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
