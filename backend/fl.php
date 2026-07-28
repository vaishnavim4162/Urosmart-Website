<?php
require 'db_connect.php';

header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

if ($action == 'upload_gradients') {
    $client_id = $_POST['client_id'] ?? 'unknown';
    $gradients = $_POST['gradients'] ?? ''; // JSON string or file path
    
    // Save gradients to a file
    $filename = "fl_updates/grad_" . uniqid() . ".json";
    if (!is_dir("fl_updates")) mkdir("fl_updates");
    file_put_contents($filename, $gradients);
    
    // Log to DB using PDO
    try {
        $stmt = $pdo->prepare("INSERT INTO training_updates (client_id, update_path) VALUES (:client_id, :update_path)");
        $stmt->execute([':client_id' => $client_id, ':update_path' => $filename]);
        
        echo json_encode(["status" => "success", "message" => "Gradients received"]);
    } catch (PDOException $e) {
        error_log("Database Error: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Database error"]);
    }

} elseif ($action == 'get_global_model') {
    // Serve the latest tflite model
    
    // Read version from file
    $version_file = "models/version.txt";
    if (file_exists($version_file)) {
        $model_version = trim(file_get_contents($version_file));
    } else {
        $model_version = "1.0.0";
    }
    
    // Construct dynamic URL based on server location
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $path = dirname($_SERVER['REQUEST_URI']);
    $model_url = "$protocol://$host$path/models/urosmart_model.tflite";
    
    echo json_encode([
        "status" => "success", 
        "version" => $model_version,
        "download_url" => $model_url
    ]);

} else {
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
?>
