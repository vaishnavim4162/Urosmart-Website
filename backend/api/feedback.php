<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        echo json_encode(["status" => "error", "message" => "No data provided"]);
        exit;
    }

    $user_id = $data['user_id'] ?? 0;
    $report_id = $data['report_id'] ?? 0;
    $q1 = $data['image_clarity'] ?? 0;
    $q2 = $data['accuracy'] ?? 0;
    $q3 = $data['ease_of_use'] ?? 0;
    $q4 = $data['overall'] ?? 0;
    $comments = $data['comments'] ?? '';

    try {
        // Check if feedback table exists, if not create it
        $conn->query("CREATE TABLE IF NOT EXISTS user_feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            report_id INT,
            rating_image_clarity INT,
            rating_accuracy INT,
            rating_ease_of_use INT,
            rating_overall INT,
            comments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $stmt = $conn->prepare("INSERT INTO user_feedback (user_id, report_id, rating_image_clarity, rating_accuracy, rating_ease_of_use, rating_overall, comments) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiiiiii", $user_id, $report_id, $q1, $q2, $q3, $q4, $comments);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Feedback submitted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
