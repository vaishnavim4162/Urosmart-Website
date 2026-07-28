<?php
// api/auth/change-password.php
require_once '../../db_connect.php';

header('Content-Type: application/json');

try {
    $userId = authenticate($pdo);

    $data = json_decode(file_get_contents("php://input"), true);

    $currentPassword = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';

    if (!$currentPassword || !$newPassword) {
        http_response_code(400);
        echo json_encode(['error' => 'Both current and new passwords are required']);
        exit;
    }

    // Verify current password
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }

    // Update password
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$newHash, $userId]);

    echo json_encode(['message' => 'Password changed successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>