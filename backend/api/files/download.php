<?php
// api/files/download.php
// Handles file downloads (images and PDFs) with authentication

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once '../../db_connect.php';

    // Authenticate user
    $userId = authenticate($pdo);
    
    $type = $_GET['type'] ?? ''; // 'image' or 'pdf'
    $filename = $_GET['file'] ?? '';
    
    if (!$type || !$filename) {
        http_response_code(400);
        die("Missing parameters");
    }
    
    $filename = basename($filename); // Security
    
    // Verify ownership
    if ($type === 'pdf') {
        $stmt = $pdo->prepare("SELECT id FROM medical_reports WHERE user_id = ? AND pdf_path = ?");
        $stmt->execute([$userId, $filename]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            die("Access denied or file not found");
        }
        $subDir = 'reports/';
        $contentType = 'application/pdf';
    } elseif ($type === 'image') {
        // Basic check: Does any report of this user contain this image?
        // JSON search is messy in SQL, but LIKE '%filename%' is decent for this constraint
        $stmt = $pdo->prepare("SELECT id FROM medical_reports WHERE user_id = ? AND image_paths LIKE ?");
        $stmt->execute([$userId, '%' . $filename . '%']);
        if (!$stmt->fetch()) {
             http_response_code(403);
             die("Access denied or file not found");
        }
        $subDir = 'images/';
        $contentType = 'image/jpeg';
    } else {
        http_response_code(400);
        die("Invalid type");
    }
    
    $filePath = __DIR__ . '/../../uploads/' . $subDir . $filename;
    
    if (!file_exists($filePath)) {
        http_response_code(404);
        die("File not found on server");
    }
    
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);

} catch (Exception $e) {
    http_response_code(500);
    die("Server error");
}
?>
