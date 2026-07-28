<?php
// api/reports/next-case-number.php
require_once '../../db_connect.php';

header('Content-Type: application/json');

try {
    $userId = authenticate($pdo);

    // Find last generated case number for THIS USER
    $stmt = $pdo->prepare("SELECT case_number FROM medical_reports WHERE user_id = ? AND case_number LIKE 'CASE-%' ORDER BY id DESC LIMIT 1");
    $stmt->execute([$userId]);
    $last = $stmt->fetchColumn();

    $nextId = 1;
    if ($last) {
        $parts = explode('-', $last);
        if (count($parts) == 2 && is_numeric($parts[1])) {
            $nextId = intval($parts[1]) + 1;
        }
    }

    $caseNumber = 'CASE-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);

    echo json_encode(['case_number' => $caseNumber]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>