-- Database Schema for UroSmart (Modified for 'urosmart' DB)
USE urosmart;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(6),
    reset_token_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Medical Reports Table
CREATE TABLE IF NOT EXISTS medical_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    case_number VARCHAR(50) NOT NULL,
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Analysis Results
    yeast_present TINYINT(1) DEFAULT 0,
    yeast_count INT DEFAULT 0,
    yeast_confidence FLOAT DEFAULT 0.0,
    
    triple_phosphate_present TINYINT(1) DEFAULT 0,
    triple_phosphate_count INT DEFAULT 0,
    triple_phosphate_confidence FLOAT DEFAULT 0.0,
    
    calcium_oxalate_present TINYINT(1) DEFAULT 0,
    calcium_oxalate_count INT DEFAULT 0,
    calcium_oxalate_confidence FLOAT DEFAULT 0.0,
    
    squamous_cells_present TINYINT(1) DEFAULT 0,
    squamous_cells_count INT DEFAULT 0,
    squamous_cells_confidence FLOAT DEFAULT 0.0,
    
    uric_acid_present TINYINT(1) DEFAULT 0,
    uric_acid_count INT DEFAULT 0,
    uric_acid_confidence FLOAT DEFAULT 0.0,
    
    -- File Paths
    image_paths TEXT, -- JSON array
    pdf_path VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (case_number),
    INDEX (user_id)
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    case_number VARCHAR(50),
    scan_clarity_rating INT NOT NULL,
    scan_accuracy_rating INT NOT NULL,
    ease_of_use_rating INT NOT NULL,
    overall_satisfaction_rating INT NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (case_number),
    INDEX (created_at)
);

-- Federated Learning Updates
CREATE TABLE IF NOT EXISTS training_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(100),
    update_path VARCHAR(255) NOT NULL, -- Path to gradient JSON/file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
