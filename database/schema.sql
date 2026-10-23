CREATE DATABASE IF NOT EXISTS library_portal;
USE library_portal;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    available_copies INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NULL,
    returned_on TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

INSERT INTO books (title, author, category, available_copies) VALUES
('Clean Code', 'Robert C. Martin', 'Programming', 3),
('The Pragmatic Programmer', 'Andrew Hunt', 'Software', 2),
('Data Structures in Java', 'R. S. Salaria', 'Computer Science', 5),
('Operating System Concepts', 'Silberschatz', 'Systems', 1),
('Database System Concepts', 'Korth', 'Database', 4),
('Discrete Mathematics', 'Rosen', 'Mathematics', 2),
('Artificial Intelligence', 'Russell & Norvig', 'AI', 3),
('Engineering Mathematics', 'Erwin Kreyszig', 'Mathematics', 0)
ON DUPLICATE KEY UPDATE title = VALUES(title);
