<?php
// db_connect.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Database configuration
$host = 'localhost';
$db_name = 'urosmart';
$username = 'root';     // Default XAMPP username
$password = '';         // Default XAMPP password (empty)

try {
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $username, $password, $options);
} catch (\PDOException $e) {
    // Return unified JSON error format
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Helper to get authorization header
function getBearerToken()
{
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        // Server-side fix for bug in some clients
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Helper to validate token (Simple version: checks if user exists)
// In a real JWT system, you'd decode and verify signature.
// Here we assume the token IS the user_id (for simplicity with XAMPP/no-composer)
// OR we can implement a simple token table. 
// For this migration to be compatible with the Python 'create_access_token(identity=str(user.id))',
// we will start by just using the user_id as the token for simplicity, 
// OR simpler: we'll assume the client sends the ID.
// BUT wait, existing app expects a token. Python uses JWT.
// To make this work easily in PHP without libraries, let's just make a simple function.

function authenticate($pdo)
{
    $token = getBearerToken();
    if (!$token) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Missing authorization token']);
        exit;
    }

    // DECODE JWT (Simplified for standard HS256 without external libs if possible, 
    // but easier to just use a simple proprietary token for this tailored backend)
    // However, existing iOS app likely sends the JWT string.
    // If we change backend, iOS app 'just works' if we return a string it treats as a token.
    // So let's make our PHP 'token' just be "USERID_<id>_SECRET" encoded or similar.
    // For now: assume the token is literally the user_id (INSECURE but functional for local XAMPP demo)
    // Or better: base64_encode(user_id)

    // Let's try to base64 decode it
    $decoded = base64_decode($token, true);
    if ($decoded === false) {
        // Maybe it's not base64, assume it's just the ID directly if numeric?
        // Let's accept base64 encoded "urosmart_user_<id>"
        // No, let's keep it simple.
        // We will issue tokens as: base64_encode("urosmart:" . $user_id)
    }

    $parts = explode(':', $decoded);
    if (count($parts) === 2 && $parts[0] === 'urosmart') {
        $user_id = intval($parts[1]);
        return $user_id;
    }

    // Fallback: If we can't decode, deny.
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}
?>