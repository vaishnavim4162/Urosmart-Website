<?php
// api/files/reports.php
// Quick placeholder for file downloading
// Since XAMPP serves files directly, we could just let Apache handle it,
// but the app requests /api/files/reports/<id_or_filename>
// and expects authentication verification.

// To properly route this: 
// The user needs an .htaccess or we create a script that takes a query param.
// XAMPP usually maps URLs to files.
// "/api/files/reports/123.pdf" -> might need a rewrite rule OR 
// we place this script at /api/files/reports/index.php and rely on PATH_INFO?
// Let's assume the user will configure Apache or simply access via query param if they change Swift.
// BUT since we can't easily change Swift logic for URL structure without recompiling,
// We should probably rely on a simple .htaccess or create this as `download.php` and advise usage.
//
// HOWEVER, standard PHP pattern: `api/files/reports.php?file=...`
// The Swift code: `let url = URL(string: "\(baseURL)/files/reports/\(reportId)")!`
// This expects a RESTful path.
//
// SOLUTION: We'll create a simple .htaccess in the root of backend_php to route these if possible,
// OR just leave this file here and assume the user knows how to set up rewrites.
// I will create `api/files/download_report.php` and provide instructions on .htaccess.

require_once '../../db_connect.php';

$userId = authenticate($pdo);

// Get filename from PATH_INFO or query
// If using RewriteRule: ^api/files/reports/(.*)$ api/files/download_report.php?file=$1
$filename = $_GET['file'] ?? basename($_SERVER['REQUEST_URI']);

// Security: Prevent directory traversal
$filename = basename($filename);

// Location of uploads (create this folder)
$storageDir = __DIR__ . '/../../uploads/reports/';

if (!file_exists($storageDir . $filename)) {
    // Return 404
    http_response_code(404);
    echo "File not found";
    exit;
}

// Check ownership? 
// The system currently saves "pdfFileName" in DB. 
// Ideally we check if this user owns a report with this pdfFileName.
$stmt = $pdo->prepare("SELECT id FROM medical_reports WHERE user_id = ? AND pdf_path = ?");
$stmt->execute([$userId, $filename]);
if (!$stmt->fetch()) {
    // Not found or not owned by user
    http_response_code(403);
    echo "Access denied";
    exit;
}

// Serve file
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . $filename . '"');
readfile($storageDir . $filename);
?>