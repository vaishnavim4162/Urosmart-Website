<?php
// api/files/upload.php
// Handles file uploads (images and PDFs)

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../php_errors.log');

header('Content-Type: application/json');

try {
    require_once '../../db_connect.php';

    // Authenticate user
    $userId = authenticate($pdo);
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $type = $_POST['type'] ?? 'unknown'; // 'image' or 'pdf'
    $file = $_FILES['file'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload error: ' . $file['error']);
    }

    // Determine upload directory
    $baseDir = __DIR__ . '/../../uploads/';
    $subDir = '';
    
    if ($type === 'image') {
        $subDir = 'images/';
    } elseif ($type === 'pdf') {
        $subDir = 'reports/';
    } else {
        throw new Exception('Invalid file type specified');
    }
    
    $targetDir = $baseDir . $subDir;
    
    if (!file_exists($targetDir)) {
        if (!mkdir($targetDir, 0755, true)) {
            throw new Exception('Failed to create upload directory');
        }
    }

    // Validate file extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExtensions = [];
    
    if ($type === 'image') {
        $allowedExtensions = ['jpg', 'jpeg', 'png'];
    } elseif ($type === 'pdf') {
        $allowedExtensions = ['pdf'];
    }
    
    if (!in_array($extension, $allowedExtensions)) {
        throw new Exception('Invalid file extension');
    }

    // Generate unique filename to prevent overwrites and guessing
    // We keep the original extension
    // Using a UUID or timestamp + random suffix is good practice
    $newFilename = uniqid($type . '_', true) . '.' . $extension;
    $targetPath = $targetDir . $newFilename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // Return the filename so the client can send it in the create_report request
    echo json_encode([
        'message' => 'File uploaded successfully',
        'filename' => $newFilename
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
