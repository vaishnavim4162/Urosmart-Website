<?php
// email_helper.php - PHPMailer SMTP Email Helper

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function sendOTPEmail($toEmail, $otp)
{
    $mail = new PHPMailer(true);
    
    // Default credentials (placeholders)
    $mail->Username = 'YOUR_GMAIL@gmail.com';
    $mail->Password = 'YOUR_APP_PASSWORD';

    // Check if credentials are configured
    if ($mail->Username === 'YOUR_GMAIL@gmail.com' || $mail->Password === 'YOUR_APP_PASSWORD') {
        error_log("Email credentials not configured. Skipping email send.");
        return false;
    }

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        // Credentials already set above
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Recipients
        $mail->setFrom('YOUR_GMAIL@gmail.com', 'UroSmart Team');
        $mail->addAddress($toEmail);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'UroSmart Password Reset OTP';
        $mail->Body = "
            <h2>Password Reset Request</h2>
            <p>Your OTP for password reset is: <strong style='font-size: 24px; color: #2563eb;'>$otp</strong></p>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>UroSmart Team</p>
        ";
        $mail->AltBody = "Your OTP is: $otp\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email sending failed: {$mail->ErrorInfo}");
        return false;
    }
}
?>