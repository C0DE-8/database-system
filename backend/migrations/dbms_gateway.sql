-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 01, 2026 at 01:11 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbms_gateway`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin') NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin@example.com', '$2a$12$aahw1mll9eYipjFB7bCumuQd3yv2wjHSnKygdwZHSIjb/VZvFPnpG', 'admin', '2026-05-31 22:45:44', '2026-05-31 22:45:44');

-- --------------------------------------------------------

--
-- Table structure for table `connection_events`
--

CREATE TABLE `connection_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `site_id` varchar(100) NOT NULL,
  `event_type` enum('pool_created','pool_closed','online','offline','reconnect','error') NOT NULL,
  `message` varchar(500) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `connection_events`
--

INSERT INTO `connection_events` (`id`, `project_id`, `site_id`, `event_type`, `message`, `metadata`, `created_at`) VALUES
(1, NULL, 'temp_verify', 'pool_closed', 'Pool closed for temp_verify', '{}', '2026-05-31 22:48:21'),
(2, 2, 'shop', 'pool_created', 'Pool created for shop', '{}', '2026-05-31 23:00:33'),
(3, 2, 'shop', 'online', 'shop is online', '{}', '2026-05-31 23:00:33'),
(4, 2, 'shop', 'online', 'shop is online', '{}', '2026-05-31 23:00:36');

-- --------------------------------------------------------

--
-- Table structure for table `gateway_logs`
--

CREATE TABLE `gateway_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` varchar(500) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gateway_logs`
--

INSERT INTO `gateway_logs` (`id`, `type`, `message`, `metadata`, `created_at`) VALUES
(1, 'project', 'Project created: temp_verify', '{\"siteId\":\"temp_verify\"}', '2026-05-31 22:48:06'),
(2, 'project', 'Project deleted: temp_verify', '{\"siteId\":\"temp_verify\"}', '2026-05-31 22:48:21'),
(3, 'project', 'Project created: shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:52:00'),
(4, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:55:20'),
(5, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:56:02'),
(6, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:57:00'),
(7, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:57:03'),
(8, 'apikey', 'API key generated for shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:57:37'),
(9, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:58:34'),
(10, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 22:59:08'),
(11, 'connection', 'Pool created for shop', '{\"siteId\":\"shop\"}', '2026-05-31 23:00:33'),
(12, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 23:00:49'),
(13, 'auth', 'Gateway auth failed for shop', '{\"siteId\":\"shop\"}', '2026-05-31 23:00:52');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `site_id` varchar(100) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `db_host` varchar(255) NOT NULL,
  `db_port` int(10) UNSIGNED NOT NULL DEFAULT 3306,
  `db_name` varchar(150) NOT NULL,
  `db_user` varchar(150) NOT NULL,
  `encrypted_db_password` text NOT NULL,
  `encrypted_credentials` text DEFAULT NULL,
  `pool_connection_limit` int(10) UNSIGNED NOT NULL DEFAULT 10,
  `pool_queue_limit` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `site_id`, `enabled`, `db_host`, `db_port`, `db_name`, `db_user`, `encrypted_db_password`, `encrypted_credentials`, `pool_connection_limit`, `pool_queue_limit`, `created_at`, `updated_at`) VALUES
(2, 'shop website', 'shop', 1, 'localhost', 3306, 'shop_db', 'root', '{\"iv\":\"pQxmhyO3k9xfV/gl\",\"tag\":\"WK5N95BrzzsQ4SWi6XUQ7g==\",\"data\":\"uZCNH5bWE77NoRjw1Bo2\"}', '{\"iv\":\"nupFQFq/Pmejd0ng\",\"tag\":\"J6vZrspz+KQsdsrk0o4oNA==\",\"data\":\"cUQQ8ljvGPRiSd12lXL6OkGd6ATfAT7/k7N8PBHZuAwglH6xwL/NrRPDDtXjOG8vfu5dKCOoxzNiydjRTibFclC5MIlT3M95rW5Gm21vOSAaKxzEa87w3mVMG7YefD4aB3jiTDgfR8t/znijvIXugNtjdHy/\"}', 10, 0, '2026-05-31 22:52:00', '2026-05-31 22:52:00');

-- --------------------------------------------------------

--
-- Table structure for table `project_api_keys`
--

CREATE TABLE `project_api_keys` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `key_prefix` varchar(32) NOT NULL,
  `key_hash` char(64) NOT NULL,
  `encrypted_api_key` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_api_keys`
--

INSERT INTO `project_api_keys` (`id`, `project_id`, `name`, `key_prefix`, `key_hash`, `encrypted_api_key`, `last_used_at`, `revoked_at`, `created_at`) VALUES
(2, 2, 'Default key', 'dbms_Kyi8UVr', 'a23584f0f3484bf96162d4f559377b22d3bebd44ca12415a830477bef3528297', NULL, NULL, NULL, '2026-05-31 22:52:00'),
(3, 2, 'Dashboard key', 'dbms_qH0mQUv', 'ffb72021e2c59435f323e327caa9ac4846c6bcaadf8e2adae4518e31b497de07', NULL, NULL, NULL, '2026-05-31 22:57:37');

-- --------------------------------------------------------

--
-- Table structure for table `query_activity`
--

CREATE TABLE `query_activity` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `site_id` varchar(100) NOT NULL,
  `sql_preview` varchar(500) NOT NULL,
  `duration_ms` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('success','failed') NOT NULL,
  `error_message` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admins_email` (`email`);

--
-- Indexes for table `connection_events`
--
ALTER TABLE `connection_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_connection_events_project_id` (`project_id`),
  ADD KEY `idx_connection_events_site_id_created_at` (`site_id`,`created_at`);

--
-- Indexes for table `gateway_logs`
--
ALTER TABLE `gateway_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_gateway_logs_type_created_at` (`type`,`created_at`),
  ADD KEY `idx_gateway_logs_created_at` (`created_at`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_projects_site_id` (`site_id`),
  ADD KEY `idx_projects_enabled` (`enabled`);

--
-- Indexes for table `project_api_keys`
--
ALTER TABLE `project_api_keys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_api_keys_hash` (`key_hash`),
  ADD KEY `idx_project_api_keys_project_id` (`project_id`),
  ADD KEY `idx_project_api_keys_prefix` (`key_prefix`);

--
-- Indexes for table `query_activity`
--
ALTER TABLE `query_activity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_query_activity_project_id` (`project_id`),
  ADD KEY `idx_query_activity_site_id_created_at` (`site_id`,`created_at`),
  ADD KEY `idx_query_activity_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `connection_events`
--
ALTER TABLE `connection_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gateway_logs`
--
ALTER TABLE `gateway_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_api_keys`
--
ALTER TABLE `project_api_keys`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `query_activity`
--
ALTER TABLE `query_activity`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `connection_events`
--
ALTER TABLE `connection_events`
  ADD CONSTRAINT `fk_connection_events_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `project_api_keys`
--
ALTER TABLE `project_api_keys`
  ADD CONSTRAINT `fk_project_api_keys_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `query_activity`
--
ALTER TABLE `query_activity`
  ADD CONSTRAINT `fk_query_activity_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
