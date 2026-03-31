-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 31, 2026 at 05:46 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `caar_assurance`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `access_level` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agencies`
--

DROP TABLE IF EXISTS `agencies`;
CREATE TABLE IF NOT EXISTS `agencies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `agency_code` int NOT NULL,
  `fax` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `wilaya` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `services` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agency_code` (`agency_code`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `agencies`
--

INSERT INTO `agencies` (`id`, `name`, `address`, `phone`, `agency_code`, `fax`, `latitude`, `longitude`, `city`, `wilaya`, `type`, `services`) VALUES
(1, 'Agency', '23 Rue Mohamed Belouizded, Alger', '021655024', 203, '021660676', 36.75833000, 3.05597100, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(2, 'Agency', 'Cité Serbat Bt A9 Garidi 1, Kouba Alger', '023700160', 210, '023700157', 36.73014500, 3.06645800, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(3, 'Agency', 'Cité 2004 Logements Bt 43 A et B, Baraki Alger', '023906141', 212, '023906142', 36.78963500, 3.26231300, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(4, 'Agency', 'Cité des 39 Logts Route Nationale 5 Lakhdaria Bouira', '026712039', 215, '026712040', 36.56393900, 3.59660100, 'Bouira', 'Bouira', 'Agency', 'Auto,Habitation,Transport'),
(5, 'Agency', 'Big Centre Boulevard Krim Belkacem, Béjaïa', '034110505', 216, '034113390', 36.74493200, 5.04810800, 'Bejaia', 'Bejaia', 'Agency', 'Auto,Habitation,Transport'),
(6, 'Agency', '31 Avenue du 1er Novembre Rouiba Alger', '023854546', 226, '023854258', 36.73611300, 3.28085400, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(7, 'Agency', 'Route du Lycée Larabaa Nath Irathen Tizi Ouzou', '026492628', 228, '026492632', 36.63485000, 4.20576500, 'Tizi Ouzou', 'Tizi Ouzou', 'Agency', 'Auto,Habitation,Transport'),
(8, 'Agency', 'Cité 1516 Logts Bt D6 Ain El Malha Ain Naadja Alger', '023530028', 233, '023530027', 36.69369870, 3.06532000, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(9, 'Agency', 'Cité El Djaouhara Bt 63 Les Halles Belouizded Alger', '021674693', 601, '021674692', 36.75536200, 3.06630700, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(10, 'Agency', '74 Rue Didouche Mourad Alger', '023504965', 602, '023504990', 36.76558800, 3.05030800, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(11, 'Agency', '77 Boulevard Mohamed Boudiaf Blida', '025215826', 604, '025215827', 36.47846275, 2.81924834, 'Blida', 'Blida', 'Main Agency', 'Auto,Habitation,Transport'),
(12, 'Agency', 'Rue Ibn Rochd BP137 Chlef', '027771573', 607, '027778158', 36.17012300, 1.33474100, 'Chlef', 'Chlef', 'Agency', 'Auto,Habitation,Transport'),
(13, 'Agency', 'Niveau 104 Local 1 A 03 Riadh El Feth El Madania Alger', '021678907', 609, '021678906', 36.74273900, 3.06824600, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(14, 'Agency', 'Centre Commercial Bouzaréah Alger', '023181585', 611, '023181584', 36.78989500, 3.01636500, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(15, 'Agency', 'Cité 128 Logts LSP Route de Bousmail Koléa Tipaza', '024384900', 620, '024384901', 36.63881900, 2.75188100, 'Tipaza', 'Tipaza', 'Agency', 'Auto,Habitation,Transport'),
(16, 'Agency', '16 Place Kennedy El Biar Alger', '023377215', 622, '023377217', 36.76912700, 3.03100400, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(17, 'Agency', '14 Rue Djilti Mustapha, Khemis Miliana', '027563809', 627, '027563808', 36.25950600, 2.21762000, 'Khemis Miliana', 'Ain Defla', 'Agency', 'Auto,Habitation,Transport'),
(18, 'Agency', 'Tour d’affaires Theniet El Hadjer, Médéa', '025732303', 629, '025732304', 36.27045039, 2.77716532, 'Medea', 'Medea', 'Agency', 'Auto,Habitation,Transport'),
(19, 'Agency', '27 Rue Didouche Mourad, Alger', '021633894', 630, '021633755', 36.76936249, 3.05509500, 'Alger', 'Alger', 'Main Agency', 'Auto,Habitation,Transport'),
(20, 'Agency', 'Cité Wiam Bt N°30, Djelfa', '027926155', 631, '027926154', 34.66755000, 3.27567300, 'Djelfa', 'Djelfa', 'Agency', 'Auto,Habitation,Transport'),
(21, 'Agency', 'Cité 150 Logts LSP B03, Tipaza', '024374375', 634, '024374373', 36.58614100, 2.43111900, 'Tipaza', 'Tipaza', 'Agency', 'Auto,Habitation,Transport'),
(22, 'Agency', 'Route du Sahara BP62 El Kala El Taref', '038350256', 303, '038662436', 36.89672600, 8.44576800, 'El Taref', 'El Taref', 'Agency', 'Auto,Habitation,Transport'),
(23, 'Agency', 'Cité 100 Logements Route de Batna, Khenchela', '032725539', 311, '032725538', 35.42651500, 7.14609400, 'Khenchela', 'Khenchela', 'Agency', 'Auto,Habitation,Transport'),
(24, 'Agency', 'Cité 30 Logts Mordj Dib Les Platanes Skikda', '038938590', 316, '038938609', 36.75967870, 6.89452430, 'Skikda', 'Skikda', 'Agency', 'Auto,Habitation,Transport'),
(25, 'Agency', 'Cité du 17 Octobre BP18 El Oued', '032114640', 320, '032114639', 33.36148600, 6.84592300, 'El Oued', 'El Oued', 'Agency', 'Auto,Habitation,Transport'),
(26, 'Agency', 'Rue Patrice Lumumba Guelma', '037143787', 321, '037143769', 36.46442300, 7.43162000, 'Guelma', 'Guelma', 'Agency', 'Auto,Habitation,Transport'),
(27, 'Agency', 'Rue Frikh Taif El Taref', '038301267', 322, '038301751', 36.76648500, 8.31214300, 'El Taref', 'El Taref', 'Agency', 'Auto,Habitation,Transport'),
(28, 'Agency', 'Boulevard Seddik Benyahia Annaba', '038485593', 323, '038485593', 36.90157700, 7.73708100, 'Annaba', 'Annaba', 'Regional Office', 'Auto,Habitation,Transport'),
(29, 'Agency', '15 Avenue Hammou Mokhtar El Makkari Oran', '041281752', 401, '041281748', 35.69882808, -0.62883248, 'Oran', 'Oran', 'Regional Office', 'Auto,Habitation,Transport'),
(30, 'Agency', 'N°04 cité 108 Logements Sidi Bel Abbes', '048746272', 402, '048746271', 35.19286534, -0.61769284, 'Sidi Bel Abbes', 'Sidi Bel Abbes', 'Agency', 'Auto,Habitation,Transport'),
(31, 'Agency', 'N°08 Zaouia Boulevard Mouloud Feraoun Saida', '048412445', 407, '048412520', 34.82839671, 0.15272886, 'Saida', 'Saida', 'Agency', 'Auto,Habitation,Transport'),
(32, 'Agency', '04 Rue Belhachemi Mouley Oran', '041332566', 409, '041331950', 35.70369101, -0.64433639, 'Oran', 'Oran', 'Regional Office', 'Auto,Habitation,Transport'),
(33, 'Agency', 'Boulevard Mohamed Boudiaf Ain Temouchent', '043778282', 415, '043778610', 35.30741841, -1.13840851, 'Ain Temouchent', 'Ain Temouchent', 'Agency', 'Auto,Habitation,Transport'),
(34, 'Agency', 'Rue Mohamed Khemisti Maghnia Tlemcen', '043502723', 416, '043502724', 34.84760782, -1.72902048, 'Maghnia', 'Maghnia', 'Agency', 'Auto,Habitation,Transport'),
(35, 'Agency', 'Cité Boussouf BT7 Constantine', '031602722', 502, '031602052', 36.33174100, 6.58131030, 'Constantine', 'Constantine', 'Regional Office', 'Auto,Habitation,Transport'),
(36, 'Agency', '55 Avenue Aouati Mostefa Constantine', '031911010', 503, '031929491', 36.35719000, 6.60823600, 'Constantine', 'Constantine', 'Regional Office', 'Auto,Habitation,Transport'),
(37, 'Agency', 'Cité Boutout Salah Mila', '031474721', 504, '031474720', 36.45531700, 6.26622300, 'Mila', 'Mila', 'Agency', 'Auto,Habitation,Transport'),
(38, 'Agency', 'Cité Financiere Boulevard Port Said Setif', '036825690', 506, '036825688', 36.19442100, 5.41165700, 'Setif', 'Setif', 'Main Agency', 'Auto,Habitation,Transport'),
(39, 'Agency', 'Centre Commercial Rue Larbi Ben M’Hidi Jijel', '034471227', 507, '034475628', 36.82036900, 5.76854800, 'Jijel', 'Jijel', 'Agency', 'Auto,Habitation,Transport'),
(40, 'Agency', 'Cité des 500 Logements Bordj Bou Arreridj', '035697520', 510, '035698162', 36.07906760, 4.76473130, 'Bordj Bou Arreridj', 'Bordj Bou Arreridj', 'Agency', 'Auto,Habitation,Transport'),
(41, 'Agency', 'Cité des 800 Logements El Eulma Setif', '036481260', 511, '036481260', 36.15301000, 5.70222000, 'Setif', 'Setif', 'Main Agency', 'Auto,Habitation,Transport'),
(42, 'Agency', 'Arrondissement administratif Daksi Constantine', '031638074', 512, '031611175', 36.35769444, 6.63966667, 'Constantine', 'Constantine', 'Regional Office', 'Auto,Habitation,Transport');

-- --------------------------------------------------------

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
CREATE TABLE IF NOT EXISTS `agents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `agency_id` int DEFAULT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `agency_id` (`agency_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `table_name`, `record_id`, `description`, `created_at`) VALUES
(1, 14, 'CREATE_CONTRACT', 'contracts', 1, 'Roadside Assistance contract created via online payment. Quote #1, Policy: RSA-20260329-000001', '2026-03-29 22:05:18'),
(2, 15, 'CREATE_CONTRACT', 'contracts', 2, 'Roadside Assistance contract created via online payment. Quote #3, Policy: RSA-20260329-000003', '2026-03-29 22:37:19');

-- --------------------------------------------------------

--
-- Table structure for table `claims`
--

DROP TABLE IF EXISTS `claims`;
CREATE TABLE IF NOT EXISTS `claims` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_id` int DEFAULT NULL,
  `description` text,
  `status` varchar(50) DEFAULT NULL,
  `claim_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_claims_contract` (`contract_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `claims`
--

INSERT INTO `claims` (`id`, `contract_id`, `description`, `status`, `claim_date`) VALUES
(1, 1, 'Accident on highway', 'expert_assigned', '2026-04-01');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `insurance_number` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `user_id`, `insurance_number`, `address`) VALUES
(1, 14, 'CAAR-20260329-8498', NULL),
(2, 15, 'CAAR-20260329-00E1', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject` varchar(100) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied') DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `subject`, `full_name`, `email`, `phone`, `message`, `status`, `created_at`) VALUES
(1, 'Information', 'Test Client', 'client@test.com', NULL, 'I want information about insurance.', 'read', '2026-03-30 12:36:43');

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `plan_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `premium_amount` decimal(10,2) DEFAULT NULL,
  `policy_reference` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `policy_reference` (`policy_reference`),
  KEY `product_id` (`product_id`),
  KEY `idx_contracts_client` (`client_id`),
  KEY `fk_contract_vehicle` (`vehicle_id`),
  KEY `fk_contract_plan` (`plan_id`),
  KEY `idx_contracts_policy_ref` (`policy_reference`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `client_id`, `vehicle_id`, `product_id`, `plan_id`, `start_date`, `end_date`, `status`, `premium_amount`, `policy_reference`) VALUES
(1, 1, 1, 5, 1, '2026-03-29', '2027-03-28', 'active', 4900.00, 'RSA-20260329-000001'),
(2, 2, 3, 5, 2, '2026-03-29', '2027-03-28', 'active', 7900.00, 'RSA-20260329-000003');

-- --------------------------------------------------------

--
-- Table structure for table `contract_guarantees`
--

DROP TABLE IF EXISTS `contract_guarantees`;
CREATE TABLE IF NOT EXISTS `contract_guarantees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_id` int NOT NULL,
  `guarantee_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contract_id` (`contract_id`),
  KEY `guarantee_id` (`guarantee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `contract_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `contract_id` (`contract_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experts`
--

DROP TABLE IF EXISTS `experts`;
CREATE TABLE IF NOT EXISTS `experts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `experts`
--

INSERT INTO `experts` (`id`, `user_id`, `specialization`) VALUES
(1, 17, 'Automobile');

-- --------------------------------------------------------

--
-- Table structure for table `expert_reports`
--

DROP TABLE IF EXISTS `expert_reports`;
CREATE TABLE IF NOT EXISTS `expert_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claim_id` int DEFAULT NULL,
  `expert_id` int DEFAULT NULL,
  `report` text,
  `estimated_damage` decimal(10,2) DEFAULT NULL,
  `report_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `claim_id` (`claim_id`),
  KEY `expert_id` (`expert_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `expert_reports`
--

INSERT INTO `expert_reports` (`id`, `claim_id`, `expert_id`, `report`, `estimated_damage`, `report_date`) VALUES
(1, 1, 1, 'Front bumper damaged, headlights broken', 50000.00, '2026-04-02');

-- --------------------------------------------------------

--
-- Table structure for table `guarantees`
--

DROP TABLE IF EXISTS `guarantees`;
CREATE TABLE IF NOT EXISTS `guarantees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `guarantees`
--

INSERT INTO `guarantees` (`id`, `name`, `description`) VALUES
(1, 'Earthquake', 'Damage caused by earthquakes'),
(2, 'Flood', 'Damage caused by floods'),
(3, 'Storm', 'Damage caused by storms'),
(4, 'Ground Movement', 'Damage caused by ground movement');

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

DROP TABLE IF EXISTS `job_applications`;
CREATE TABLE IF NOT EXISTS `job_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_of_interest` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position_sought` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `cv_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `job_applications`
--

INSERT INTO `job_applications` (`id`, `first_name`, `last_name`, `email`, `phone`, `field_of_interest`, `position_sought`, `message`, `cv_file`, `created_at`, `status`) VALUES
(1, 'Karim', 'Benali', 'karim@test.com', '0555555555', 'IT', 'Intern', 'I want to apply for an internship.', 'cv_karim.pdf', '2026-03-30 12:42:58', 'reviewed');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 14, 'Your Roadside Assistance contract is active', 'Your policy (RSA-20260329-000001) has been created and is valid from 2026-03-29 to 2027-03-28.', 'contract', 0, '2026-03-29 22:05:18'),
(2, 15, 'Your Roadside Assistance contract is active', 'Your policy (RSA-20260329-000003) has been created and is valid from 2026-03-29 to 2027-03-28.', 'contract', 0, '2026-03-29 22:37:19');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payments_contract` (`contract_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `contract_id`, `amount`, `payment_date`, `status`) VALUES
(1, 1, 4900.00, '2026-03-29', 'paid'),
(2, 2, 7900.00, '2026-03-29', 'paid');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `name`, `price`, `description`, `created_at`) VALUES
(1, 'Basic', 4900.00, 'Towing 50km, On-site repair, 24/7 assistance, 1 intervention/year', '2026-03-28 00:21:37'),
(2, 'Plus', 7900.00, 'Towing 150km, On-site repair, 24/7 assistance, Replacement vehicle, 3 interventions/year', '2026-03-28 00:21:37'),
(3, 'Premium', 11500.00, 'Unlimited towing, Priority assistance, Replacement vehicle, Hotel coverage, Unlimited interventions', '2026-03-28 00:21:37');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `insurance_type` varchar(50) DEFAULT NULL,
  `base_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `insurance_type`, `base_price`) VALUES
(1, 'Multi-Risk Home Insurance', 'Coverage for residential properties', 'Individual Risks', 0.00),
(2, 'Multi-Risk Professional Insurance', 'Insurance for professional activities', 'Individual Risks', 0.00),
(3, 'Natural Disaster Insurance', 'Coverage against natural disasters', 'Individual Risks', 0.00),
(4, 'Motor Insurance', 'Vehicle insurance coverage', 'Auto Insurance', 0.00),
(5, 'Roadside Assistance', 'Emergency assistance for vehicles', 'Auto Insurance', 0.00),
(6, 'Windshield / Glass Breakage Assistance', 'Coverage for windshield damage', 'Auto Insurance', 0.00),
(7, 'Pleasure Craft Insurance', 'Insurance for boats and pleasure crafts', 'Transport Insurance', 0.00),
(8, 'Air Cargo Insurance', 'Coverage for air transported goods', 'Transport Insurance', 0.00),
(9, 'Goods Insurance (Public Transport)', 'Coverage for goods transported publicly', 'Transport Insurance', 0.00),
(10, 'Goods Insurance (Private Transport)', 'Coverage for goods transported privately', 'Transport Insurance', 0.00),
(11, 'Contractors Plant and Machinery Insurance', 'Insurance for construction machinery', 'Technical Risks', 0.00),
(12, 'Computer / IT All Risks Insurance', 'Coverage for IT systems and equipment', 'Technical Risks', 0.00),
(13, 'Construction and Erection All Risks Insurance', 'Insurance for construction projects', 'Technical Risks', 0.00),
(14, 'Machinery Breakdown Insurance', 'Coverage for industrial machinery failure', 'Industrial Risks', 0.00),
(15, 'Decennial Civil Liability Insurance', '10-year liability insurance for construction', 'Industrial Risks', 0.00),
(16, 'Professional Civil Liability Insurance for Contractors', 'Liability coverage for contractors', 'Industrial Risks', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `quotes`
--

DROP TABLE IF EXISTS `quotes`;
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `vehicle_id` int DEFAULT NULL,
  `product_id` int NOT NULL,
  `plan_id` int DEFAULT NULL,
  `estimated_amount` decimal(10,2) NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `product_id` (`product_id`),
  KEY `plan_id` (`plan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotes`
--

INSERT INTO `quotes` (`id`, `client_id`, `vehicle_id`, `product_id`, `plan_id`, `estimated_amount`, `status`, `created_at`) VALUES
(1, 1, 1, 5, 1, 4900.00, 'accepted', '2026-03-29 19:34:51'),
(2, 1, 2, 5, 1, 4900.00, 'pending', '2026-03-29 22:03:16'),
(3, 2, 3, 5, 2, 7900.00, 'accepted', '2026-03-29 22:36:46');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('client','admin','agent','expert') NOT NULL DEFAULT 'client',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `role`, `created_at`) VALUES
(1, 'Aida', 'Moufouki', 'aida@email.com', 'hashedpass', '0550000001', 'client', '2026-03-05 21:06:32'),
(2, 'Nawal', 'Messouaf', 'nawal@email.com', 'hashedpass', '0550000002', 'client', '2026-03-05 21:06:32'),
(3, 'Riham', 'MohamedKebir', 'kebir@email.com', 'hashedpass', '0550000003', 'client', '2026-03-05 21:06:32'),
(13, 'Aida', 'Test', 'aida@test.com', '$2b$12$MM0JV7y0GJZx4N0AIm4emuh2HdC/vki3Kc.KNq4Z4ypDq7k0cwVZK', NULL, 'client', '2026-03-28 23:56:35'),
(14, 'Test', 'User', 'testuser@email.com', '$2b$10$fR/vnXOvlXh/fHrHNyAq0eUOHCtBAkgZm08TCYnJJqYUULoWnfVJq', '0555555555', 'client', '2026-03-29 19:34:51'),
(15, 'Aida', 'MOUFOUKI', 'aida.moufouki@gmail.com', '$2b$12$JyFpLsNAr7zx9OS03RZUYekjksxL7vN5Kba0jEH76b0SgItQyawMe', '0549025814', 'client', '2026-03-29 22:36:46'),
(16, 'Admin', 'System', 'admin@caar.dz', '$2b$10$fR/vnXOvlXh/fHrHNyAq0eUOHCtBAkgZm08TCYnJJqYUULoWnfVJq', '0550000000', 'admin', '2026-03-30 12:33:31'),
(17, 'Expert', 'Auto', 'expert@caar.dz', '$2b$10$fR/vnXOvlXh/fHrHNyAq0eUOHCtBAkgZm08TCYnJJqYUULoWnfVJq', NULL, 'expert', '2026-03-30 16:41:50'),
(18, 'Client', 'Test', 'client@test.com', '$2b$12$C9H96xyKK53nZjQ/sFmRQ.p8xMcih0GUaZyiqKl1UVf9HPHkqQr3q', '0550000000', 'client', '2026-03-30 17:07:43');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `license_plate` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `wilaya` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `client_id`, `license_plate`, `brand`, `model`, `year`, `wilaya`, `created_at`) VALUES
(1, 1, '123-ABC-16', 'Renault', 'Clio', 2020, 'Blida', '2026-03-29 19:34:51'),
(2, 1, '123-ABC-16', 'Renault', 'Clio', 2020, 'Blida', '2026-03-29 22:03:16'),
(3, 2, '12345-65702022', 'Renault', 'clio 4', 2024, '25 _ Constantine', '2026-03-29 22:36:46');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agents`
--
ALTER TABLE `agents`
  ADD CONSTRAINT `agents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agents_ibfk_2` FOREIGN KEY (`agency_id`) REFERENCES `agencies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `claims`
--
ALTER TABLE `claims`
  ADD CONSTRAINT `claims_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_contract_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_contract_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `contract_guarantees`
--
ALTER TABLE `contract_guarantees`
  ADD CONSTRAINT `contract_guarantees_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contract_guarantees_ibfk_2` FOREIGN KEY (`guarantee_id`) REFERENCES `guarantees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experts`
--
ALTER TABLE `experts`
  ADD CONSTRAINT `experts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expert_reports`
--
ALTER TABLE `expert_reports`
  ADD CONSTRAINT `expert_reports_ibfk_1` FOREIGN KEY (`claim_id`) REFERENCES `claims` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expert_reports_ibfk_2` FOREIGN KEY (`expert_id`) REFERENCES `experts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `quotes`
--
ALTER TABLE `quotes`
  ADD CONSTRAINT `quotes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotes_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `quotes_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotes_ibfk_4` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
