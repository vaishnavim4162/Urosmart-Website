<?php
// api/auth/signup.php
require_once '../../db_connect.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Validate fields
if (!isset($data['phone_number']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$phone = $data['phone_number'];
$email = $data['email'];
$password = $data['password'];

// Validate phone (10 digits)
if (!preg_match('/^[0-9]{10}$/', $phone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Phone number must be exactly 10 digits']);
    exit;
}

// Validate email (@gmail.com)
if (!str_ends_with($email, '@gmail.com')) {
    http_response_code(400);
    echo json_encode(['error' => 'Only @gmail.com email addresses are allowed']);
    exit;
}

try {
    // Check if duplicate
    $stmt = $pdo->prepare("SELECT email, phone_number FROM users WHERE email = ? OR phone_number = ?");
    $stmt->execute([$email, $phone]);
    $existingUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($existingUsers) > 0) {
        $emailExists = false;
        $phoneExists = false;

        foreach ($existingUsers as $user) {
            if ($user['email'] === $email) {
                $emailExists = true;
            }
            if ($user['phone_number'] === $phone) {
                $phoneExists = true;
            }
        }

        if ($emailExists && $phoneExists) {
            http_response_code(409);
            echo json_encode(['error' => 'user already exixt']);
            exit;
        } elseif ($emailExists) {
            http_response_code(409);
            echo json_encode(['error' => 'e mail already exist']);
            exit;
        } elseif ($phoneExists) {
            http_response_code(409);
            echo json_encode(['error' => 'phone number already exist']);
            exit;
        }
    }

    // Create user
    // NOTE: In production, assume PASSWORD_BCRYPT is safe.
    // The Python used bcrypt. PHP password_hash defaults to Bcrypt (currently).
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (phone_number, email, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$phone, $email, $hash]);

    $userId = $pdo->lastInsertId();

    // Generate simple token (base64 of urosmart:userid)
    $token = base64_encode('urosmart:' . $userId);

    // Format response to match existing Python API
    $response = [
        'message' => 'User created successfully',
        'user' => [
            'id' => (int) $userId,
            'phone_number' => $phone,
            'email' => $email,
            'created_at' => date('c')
        ],
        'access_token' => $token
    ];

    http_response_code(201);
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>