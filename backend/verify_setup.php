<?php
// verify_setup.php - Comprehensive verification script for UroSmart backend

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'checks' => []
];

// 1. Check PHP Version
$results['checks']['php_version'] = [
    'status' => version_compare(PHP_VERSION, '7.4.0', '>=') ? 'PASS' : 'FAIL',
    'message' => 'PHP Version: ' . PHP_VERSION,
    'required' => '>=7.4.0'
];

// 2. Check Composer Dependencies
$composerCheck = file_exists(__DIR__ . '/vendor/autoload.php');
$results['checks']['composer_dependencies'] = [
    'status' => $composerCheck ? 'PASS' : 'FAIL',
    'message' => $composerCheck ? 'Composer dependencies installed' : 'Composer dependencies missing - run: composer install',
    'path' => __DIR__ . '/vendor/autoload.php'
];

// 3. Check Database Configuration File
$dbConfigCheck = file_exists(__DIR__ . '/db_connect.php');
$results['checks']['db_config_file'] = [
    'status' => $dbConfigCheck ? 'PASS' : 'FAIL',
    'message' => $dbConfigCheck ? 'Database config file exists' : 'db_connect.php not found'
];

// 4. Test Database Connection
try {
    $host = 'localhost';
    $db_name = 'urosmart_v2';
    $username = 'root';
    $password = '';
    
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    $results['checks']['database_connection'] = [
        'status' => 'PASS',
        'message' => 'Successfully connected to database: ' . $db_name,
        'host' => $host,
        'database' => $db_name
    ];
    
    // 5. Check if tables exist
    $tables = ['users', 'medical_reports'];
    $tableStatus = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->rowCount() > 0;
        $tableStatus[$table] = $exists ? 'EXISTS' : 'MISSING';
    }
    
    $allTablesExist = !in_array('MISSING', $tableStatus);
    $results['checks']['database_tables'] = [
        'status' => $allTablesExist ? 'PASS' : 'WARNING',
        'message' => $allTablesExist ? 'All required tables exist' : 'Some tables are missing - run urosmart_schema.sql',
        'tables' => $tableStatus
    ];
    
    // 6. Count existing data
    if ($allTablesExist) {
        $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $reportCount = $pdo->query("SELECT COUNT(*) FROM medical_reports")->fetchColumn();
        
        $results['checks']['database_data'] = [
            'status' => 'INFO',
            'message' => 'Database statistics',
            'users_count' => $userCount,
            'reports_count' => $reportCount
        ];
    }
    
} catch (PDOException $e) {
    $results['checks']['database_connection'] = [
        'status' => 'FAIL',
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'error_details' => [
            'code' => $e->getCode(),
            'hint' => 'Make sure MySQL/XAMPP/MAMP is running and database "urosmart_v2" exists'
        ]
    ];
}

// 7. Check API Directories
$apiDirs = ['api/auth', 'api/reports', 'api/files'];
$apiDirStatus = [];

foreach ($apiDirs as $dir) {
    $path = __DIR__ . '/' . $dir;
    $exists = is_dir($path);
    $apiDirStatus[$dir] = [
        'exists' => $exists,
        'file_count' => $exists ? count(glob($path . '/*.php')) : 0
    ];
}

$results['checks']['api_structure'] = [
    'status' => 'INFO',
    'message' => 'API directory structure',
    'directories' => $apiDirStatus
];

// 8. Check file permissions for uploads
$uploadDir = __DIR__ . '/uploads';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$results['checks']['upload_directory'] = [
    'status' => is_writable($uploadDir) ? 'PASS' : 'WARNING',
    'message' => is_writable($uploadDir) ? 'Upload directory is writable' : 'Upload directory is not writable',
    'path' => $uploadDir
];

// 9. Check required PHP extensions
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
$extensionStatus = [];

foreach ($requiredExtensions as $ext) {
    $extensionStatus[$ext] = extension_loaded($ext);
}

$allExtensionsLoaded = !in_array(false, $extensionStatus);
$results['checks']['php_extensions'] = [
    'status' => $allExtensionsLoaded ? 'PASS' : 'FAIL',
    'message' => $allExtensionsLoaded ? 'All required PHP extensions loaded' : 'Some required extensions are missing',
    'extensions' => $extensionStatus
];

// Calculate overall status
$statuses = array_column($results['checks'], 'status');
$failCount = count(array_filter($statuses, fn($s) => $s === 'FAIL'));
$warningCount = count(array_filter($statuses, fn($s) => $s === 'WARNING'));

$results['overall'] = [
    'status' => $failCount > 0 ? 'FAIL' : ($warningCount > 0 ? 'WARNING' : 'PASS'),
    'summary' => sprintf(
        '%d checks passed, %d warnings, %d failures',
        count(array_filter($statuses, fn($s) => $s === 'PASS')),
        $warningCount,
        $failCount
    )
];

// Output results
echo json_encode($results, JSON_PRETTY_PRINT);
?>
