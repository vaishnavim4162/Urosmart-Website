<?php
// api/feedback/submit.php
require_once __DIR__ . '/../../db_connect.php';

header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Authenticate user
$user_id = authenticate($pdo);

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Validate required fields
$required_fields = [
    'case_number',
    'scan_clarity_rating',
    'scan_accuracy_rating',
    'ease_of_use_rating',
    'overall_satisfaction_rating'
];

foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Validate ratings (1-5)
$ratings = [
    'scan_clarity_rating',
    'scan_accuracy_rating',
    'ease_of_use_rating',
    'overall_satisfaction_rating'
];

foreach ($ratings as $rating_field) {
    $value = intval($data[$rating_field]);
    if ($value < 1 || $value > 5) {
        http_response_code(400);
        echo json_encode(['error' => "$rating_field must be between 1 and 5"]);
        exit;
    }
}

try {
    // Insert feedback
    $stmt = $pdo->prepare("
        INSERT INTO feedback (
            user_id,
            case_number,
            scan_clarity_rating,
            scan_accuracy_rating,
            ease_of_use_rating,
            overall_satisfaction_rating,
            comments,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $user_id,
        $data['case_number'],
        intval($data['scan_clarity_rating']),
        intval($data['scan_accuracy_rating']),
        intval($data['ease_of_use_rating']),
        intval($data['overall_satisfaction_rating']),
        $data['comments'] ?? null
    ]);
    
    $feedback_id = $pdo->lastInsertId();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Feedback submitted successfully',
        'feedback_id' => $feedback_id
    ]);
    
} catch (PDOException $e) {
    error_log("Feedback submission error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to submit feedback']);
}
?>
