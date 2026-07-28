<?php
// api/auth/delete-account.php
require_once '../../db_connect.php';

header('Content-Type: application/json');

try {
    $userId = authenticate($pdo);

    // Delete user (cascade will delete reports due to foreign key constraint)
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    echo json_encode(['message' => 'Account deleted successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>