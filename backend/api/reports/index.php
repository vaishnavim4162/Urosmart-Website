<?php
// api/reports/index.php
// Handles POST (create) and GET (list)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't show errors in output
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../php_errors.log');

try {
    require_once '../../db_connect.php';

    // Authenticate user
    $userId = authenticate($pdo);
    // If authentication fails, authenticate() will exit script

    header('Content-Type: application/json');

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // CREATE REPORT
        $data = json_decode(file_get_contents("php://input"), true);

        // Auto-generate case number logic if missing is complex without race conditions in PHP/MySQL
        // but the app sends case_number if user entered it.
        // If we need auto-generation logic similar to Python:
        $caseNumber = isset($data['case_number']) ? $data['case_number'] : null;

        if (!$caseNumber) {
            // Simple sequential generation logic PER USER
            // Find last CASE-XXXXX for this user
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
        }

        // Check for duplicates for this user
        $stmt = $pdo->prepare("SELECT id FROM medical_reports WHERE user_id = ? AND case_number = ?");
        $stmt->execute([$userId, $caseNumber]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => "Case number '$caseNumber' already exists"]);
            exit;
        }

        try {
            $sql = "INSERT INTO medical_reports (
            user_id, case_number, 
            yeast_present, yeast_count, yeast_confidence,
            triple_phosphate_present, triple_phosphate_count, triple_phosphate_confidence,
            calcium_oxalate_present, calcium_oxalate_count, calcium_oxalate_confidence,
            squamous_cells_present, squamous_cells_count, squamous_cells_confidence,
            uric_acid_present, uric_acid_count, uric_acid_confidence,
            image_paths, boxed_paths, pdf_path
        ) VALUES (
            ?, ?, 
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?
        )";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $userId,
                $caseNumber,
                ($data['yeast_present'] ?? false) ? 1 : 0,
                $data['yeast_count'] ?? 0,
                $data['yeast_confidence'] ?? 0.0,
                ($data['triple_phosphate_present'] ?? false) ? 1 : 0,
                $data['triple_phosphate_count'] ?? 0,
                $data['triple_phosphate_confidence'] ?? 0.0,
                ($data['calcium_oxalate_present'] ?? false) ? 1 : 0,
                $data['calcium_oxalate_count'] ?? 0,
                $data['calcium_oxalate_confidence'] ?? 0.0,
                ($data['squamous_cells_present'] ?? false) ? 1 : 0,
                $data['squamous_cells_count'] ?? 0,
                $data['squamous_cells_confidence'] ?? 0.0,
                ($data['uric_acid_present'] ?? false) ? 1 : 0,
                $data['uric_acid_count'] ?? 0,
                $data['uric_acid_confidence'] ?? 0.0,
                $data['image_paths'] ?? '[]',
                $data['boxed_paths'] ?? '[]',
                $data['pdf_path'] ?? null
            ]);

            $reportId = $pdo->lastInsertId();

            // Return 201 Created with structure matching expected 'CreateReportResponse'
            // app.py returns: { 'message': ..., 'report': { ...full report... } }
            // BUT NetworkService.swift expects: { 'report': { 'id': Int } } structure inside 'CreateReportResponse'

            http_response_code(201);
            echo json_encode([
                'message' => 'Report created successfully',
                'report' => [
                    'id' => (int) $reportId,
                    'case_number' => $caseNumber
                    // Add more fields if needed by app, but Swift only reads ID from creation response
                ]
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }

    } elseif ($method === 'GET') {
        // GET REPORTS
        try {
            $reportId = isset($_GET['id']) ? (int)$_GET['id'] : null;
            
            if ($reportId) {
                $sql = "SELECT * FROM medical_reports WHERE user_id = ? AND id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$userId, $reportId]);
                $rows = $stmt->fetchAll();
            } else {
                $sql = "SELECT * FROM medical_reports WHERE user_id = ? ORDER BY report_date DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$userId]);
                $rows = $stmt->fetchAll();
            }

            // Transform to match backend JSON structure
            $reports = [];
            foreach ($rows as $row) {
                $reports[] = [
                    'id' => (int) $row['id'],
                    'case_number' => $row['case_number'],
                    'report_date' => date('Y-m-d\TH:i:s\Z', strtotime($row['report_date'])),
                    'results' => [
                        'yeast' => [
                            'present' => (bool) $row['yeast_present'],
                            'confidence' => (float) $row['yeast_confidence']
                        ],
                        'triple_phosphate' => [
                            'present' => (bool) $row['triple_phosphate_present'],
                            'confidence' => (float) $row['triple_phosphate_confidence']
                        ],
                        'calcium_oxalate' => [
                            'present' => (bool) $row['calcium_oxalate_present'],
                            'confidence' => (float) $row['calcium_oxalate_confidence']
                        ],
                        'squamous_cells' => [
                            'present' => (bool) $row['squamous_cells_present'],
                            'confidence' => (float) $row['squamous_cells_confidence']
                        ],
                        'uric_acid' => [
                            'present' => (bool) $row['uric_acid_present'],
                            'confidence' => (float) $row['uric_acid_confidence']
                        ]
                    ],
                    'pdf_path' => $row['pdf_path'],
                    'image_paths' => $row['image_paths'],
                    'boxed_paths' => $row['boxed_paths'] ?? '[]'
                ];
            }

            echo json_encode(['reports' => $reports, 'count' => count($reports)]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Report API Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>