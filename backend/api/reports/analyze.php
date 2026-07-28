<?php
// api/reports/analyze.php
header('Content-Type: application/json');
require_once '../../db_connect.php';

try {
    $userId = authenticate($pdo);

    $data = json_decode(file_get_contents("php://input"), true);
    $filename = $data['filename'] ?? '';

    if (!$filename) {
        throw new Exception('No filename provided');
    }

    $imagePath = realpath(__DIR__ . '/../../uploads/images/' . $filename);

    if (!$imagePath || !file_exists($imagePath)) {
        throw new Exception('Image file not found: ' . $filename);
    }

    // Call Python script
    $pythonPath = 'python'; // Or path to your python executable
    $scriptPath = __DIR__ . '/analyze.py';
    
    $command = escapeshellcmd("$pythonPath $scriptPath " . escapeshellarg($imagePath));
    $output = shell_exec($command . ' 2>&1'); // Capture stderr too

    if ($output === null) {
        throw new Exception('Failed to execute analysis script');
    }

    // Extract JSON from output (find content between { and })
    if (preg_match('/\{.*\}/s', $output, $matches)) {
        echo $matches[0];
    } else {
        throw new Exception('Invalid response from AI script: ' . $output);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
