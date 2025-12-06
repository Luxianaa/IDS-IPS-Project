CREATE DATABASE IF NOT EXISTS ids_sistema;
USE ids_sistema;

-- Tabla de usuarios
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario por defecto: admin / admin123
INSERT INTO usuarios (username, password, rol) 
VALUES ('admin', 'admin123', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- Tabla de ataques detectados
CREATE TABLE ataques (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip VARCHAR(45) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  detalle TEXT,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  user_agent TEXT,
  url VARCHAR(255),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (fecha),
  INDEX (ip),
  INDEX (tipo)
);

-- Tabla de IPs bloqueadas
CREATE TABLE ips_bloqueadas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip VARCHAR(45) UNIQUE NOT NULL,
  razon VARCHAR(100),
  intentos INT DEFAULT 1,
  bloqueado_hasta TIMESTAMP NULL,
  permanente BOOLEAN DEFAULT FALSE,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (ip)
);

-- Tabla de reglas IDS
CREATE TABLE reglas_ids (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  patron TEXT,
  activa BOOLEAN DEFAULT TRUE,
  severidad ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reglas por defecto
INSERT INTO reglas_ids (nombre, tipo, patron, severidad) VALUES
('SQL Injection - Comillas', 'sql_injection', '''', 'high'),
('SQL Injection - OR 1=1', 'sql_injection', '1=1', 'high'),
('SQL Injection - Comentarios', 'sql_injection', '--', 'high'),
('XSS - Script tags', 'xss', '<script', 'high'),
('Path Traversal', 'path_traversal', '../', 'medium'),
('Command Injection', 'command_injection', ';|&&', 'critical')
ON DUPLICATE KEY UPDATE nombre=nombre;
