<?php
// api/db_monitor.php
// A secure database performance monitor for SRE and performance analytics.

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../db_connect.php';

    // Fetch MySQL status metrics
    $metrics = [
        'Threads_connected' => 0,
        'Slow_queries' => 0,
        'Questions' => 0,
        'Table_locks_waited' => 0,
        'Innodb_row_lock_time' => 0,
        'Innodb_row_lock_waits' => 0,
        'Max_used_connections' => 0,
        'Connections' => 0
    ];

    foreach ($metrics as $key => $value) {
        $stmt = $pdo->prepare("SHOW GLOBAL STATUS LIKE ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        if ($row) {
            $metrics[$key] = is_numeric($row['Value']) ? (int)$row['Value'] : $row['Value'];
        }
    }

    // Get table sizes as a measure of database volume
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($allTables as $tableName) {
        $sizeStmt = $pdo->prepare("
            SELECT 
                data_length + index_length AS size_bytes,
                table_rows AS row_count
            FROM information_schema.TABLES 
            WHERE table_schema = DATABASE() AND table_name = ?
        ");
        $sizeStmt->execute([$tableName]);
        $info = $sizeStmt->fetch();
        if ($info) {
            $tables[$tableName] = [
                'rows' => (int)$info['row_count'],
                'size_kb' => round($info['size_bytes'] / 1024, 2)
            ];
        }
    }

    echo json_encode([
        'status' => 'success',
        'timestamp' => date('c'),
        'metrics' => $metrics,
        'tables' => $tables
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
