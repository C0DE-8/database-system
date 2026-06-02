CREATE DATABASE IF NOT EXISTS dbms_gateway
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dbms_gateway;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  site_id VARCHAR(100) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  db_host VARCHAR(255) NOT NULL,
  db_port INT UNSIGNED NOT NULL DEFAULT 3306,
  db_name VARCHAR(150) NOT NULL,
  db_user VARCHAR(150) NOT NULL,
  encrypted_db_password TEXT NOT NULL,
  encrypted_credentials TEXT NULL,
  pool_connection_limit INT UNSIGNED NOT NULL DEFAULT 10,
  pool_queue_limit INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_site_id (site_id),
  KEY idx_projects_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_api_keys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  key_prefix VARCHAR(32) NOT NULL,
  key_hash CHAR(64) NOT NULL,
  encrypted_api_key TEXT NULL,
  last_used_at TIMESTAMP NULL DEFAULT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_api_keys_hash (key_hash),
  KEY idx_project_api_keys_project_id (project_id),
  KEY idx_project_api_keys_prefix (key_prefix),
  CONSTRAINT fk_project_api_keys_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS connection_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NULL,
  site_id VARCHAR(100) NOT NULL,
  event_type ENUM('pool_created', 'pool_closed', 'online', 'offline', 'reconnect', 'error') NOT NULL,
  message VARCHAR(500) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_connection_events_project_id (project_id),
  KEY idx_connection_events_site_id_created_at (site_id, created_at),
  CONSTRAINT fk_connection_events_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS query_activity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NULL,
  site_id VARCHAR(100) NOT NULL,
  sql_preview VARCHAR(500) NOT NULL,
  duration_ms INT UNSIGNED NULL,
  status ENUM('success', 'failed') NOT NULL,
  error_message VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_query_activity_project_id (project_id),
  KEY idx_query_activity_site_id_created_at (site_id, created_at),
  KEY idx_query_activity_status (status),
  CONSTRAINT fk_query_activity_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gateway_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  message VARCHAR(500) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_gateway_logs_type_created_at (type, created_at),
  KEY idx_gateway_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
