-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 05, 2026 at 11:56 AM
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
-- Table structure for table `agencies`
--

DROP TABLE IF EXISTS `agencies`;
CREATE TABLE IF NOT EXISTS `agencies` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `agency_code` smallint UNSIGNED NOT NULL COMMENT 'Internal CAAR code',
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Agency',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wilaya_id` smallint UNSIGNED NOT NULL,
  `city_id` mediumint UNSIGNED NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `agency_type` enum('Headquarters','Regional Office','Main Agency','Agency','Sub Agency','Claims Center') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Agency',
  `services` set('Auto','Habitation','Transport','Industrial','Agricultural','Claims') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Auto,Habitation,Transport',
  `opening_hours` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Sun-Thu 08:00-16:00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_agency_code` (`agency_code`),
  KEY `idx_coords` (`latitude`,`longitude`),
  KEY `idx_wilaya` (`wilaya_id`),
  KEY `idx_city` (`city_id`),
  KEY `idx_type` (`agency_type`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agencies`
--

INSERT INTO `agencies` (`id`, `agency_code`, `name`, `address`, `phone`, `fax`, `email`, `wilaya_id`, `city_id`, `latitude`, `longitude`, `agency_type`, `services`, `opening_hours`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 408, 'CAAR — Adrar', 'N° 03, Centre Commercial \"AMRAD\" - Adrar', '049 36 78 83', '049 36 78 85', NULL, 1, 12, 27.8705131, -0.2878242, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(2, 607, 'CAAR — Chlef', 'Rue Ibn Rochd, BP. 137 - Chlef', '027 77 15 73', '027 77 81 58', NULL, 2, 44, 36.1701230, 1.3347410, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(3, 732, 'CAAR — Chlef', 'Cite des fonctionnaires, Bt. 1 N°06 - Chlef', '027 79 04 20', '027 79 04 20', NULL, 2, 44, 36.1693310, 1.3418060, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(4, 621, 'CAAR — Laghouat', 'Bloc H, cité des 600 Logements Makam - Laghouat', '029 11 73 79', '029 11 73 84', NULL, 36, 61, 33.7954963, 2.8569293, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(5, 306, 'CAAR — Meskiana', 'Route Radai Amar, Code 04250, Meskiana - Oum El Bouaghi', '032 47 18 96', '032 66 22 58', NULL, 3, 74, 35.6334765, 7.6674872, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(6, 514, 'CAAR — Oum El Bouaghi', 'Cité Hihi El Mekki, BP 344 - Oum El Bouaghi', '032 56 00 31', '032 56 00 31', NULL, 3, 75, 35.8705589, 7.1146963, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(7, 717, 'CAAR — Aïn Beïda', 'Résidence FLN BP. 369, code 04200, Aïn Beïda - Oum El Bouaghi', '032 68 56 98', '032 68 56 98', NULL, 3, 72, 35.7936670, 7.3776670, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(8, 798, 'CAAR — Aïn M\'lila', '01, Cité des 100 Logements, Aïn M\'lila - Oum El Bouaghi', '032 50 43 31', '032 50 43 31', NULL, 3, 73, 36.0430239, 6.5726147, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(9, 307, 'CAAR — Batna', '02, Rue Hamid Benchaabane, la Verdure - Batna', '033 80 76 14', '033 80 76 29 / 033 36 18 ', NULL, 37, 33, 35.5516010, 6.1723010, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(10, 308, 'CAAR — Aïn Touta', 'BP. 142, Route Maaoufa, Code 05500, Aïn Touta - Batna', '033 35 87 92', '033 35 83 26', NULL, 37, 31, 36.3710676, 5.8920139, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(11, 309, 'CAAR — Barika', '06, Avenue Emir Abdelkader, Barika - Batna', '033 39 18 82', '033 39 18 83', NULL, 37, 32, 35.3839170, 5.3697110, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(12, 759, 'CAAR — Arris', '01, Rue Ahmed Ben Abderezak, Arris - Batna', '033 34 30 83', '033 34 30 83', NULL, 37, 30, 35.2607000, 6.3478700, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(13, 773, 'CAAR — Barika', '06, Rue Bouradi Ismail, Barika - Batna', '033 38 98 01', '033 38 98 02', NULL, 37, 32, 35.3878253, 5.3672937, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(14, 206, 'CAAR — Béjaïa', 'Bt. N° D11 ET D12, Boulevard de la Révolution, Quartier Séghir - Béjaïa', '034 12 56 84', '034 12 56 83', NULL, 4, 43, 36.7492190, 5.0604970, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(15, 216, 'CAAR — Béjaïa', 'Centre des affaires Big Centre Boulevard Krim Belkacem - Béjaïa', '034 11 31 05', '034 11 33 90', NULL, 4, 43, 36.7449320, 5.0481080, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(16, 758, 'CAAR — Béjaïa', '12, Boulevard Bouaouina - Bejaïa', '034 18 64 01', '034 18 64 00', NULL, 4, 43, 36.7567180, 5.0856440, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(17, 774, 'CAAR — Akbou', '26, Rue Larbi Touati, Akbou - Bejaïa', '034 35 86 86', '034 35 98 83', NULL, 4, 42, 36.4777100, 4.5565520, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(18, 776, 'CAAR — Béjaïa', 'Cité Administrative Somacob, Bt. C2, 1er étage, <br>Boulevard Krim Belkacem - Béjaïa', '034 12 01 11', '034 12 00 99', NULL, 4, 43, 36.7446500, 5.0492000, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(19, 509, 'CAAR — Biskra', 'Cité des 1000 logemets, EL Amel, BP 88 - Biskra', '033 54 15 22', '033 54 10 32', NULL, 38, 34, 34.8451721, 5.7126274, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(20, 406, 'CAAR — Béchar', 'N° 65, Four à chaux, Rue Guyen Van Troy - Béchar', '049 21 52 35', '049 21 52 36', NULL, 39, 41, 31.6187349, -2.2182855, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(21, 604, 'CAAR — Blida', '77, Boulevard Mohamed Boudiaf - Blida', '025 21 58 26', '025 21 58 27', NULL, 5, 35, 36.4784627, 2.8192483, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(22, 215, 'CAAR — Lakhdaria', 'Cité des 39 Logts., Route Nationale N° 05, BP 127, Lakhdaria - Bouira', '026 71 20 39', '026 71 20 40', NULL, 40, 38, 36.5639390, 3.5966010, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(23, 223, 'CAAR — Bouira', 'Axe des Finances - Bouira', '026 73 93 01', '026 73 93 62', NULL, 40, 37, 36.3760850, 3.8890710, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(24, 749, 'CAAR — Bouira', 'Cité LSP 50 Lgts. Hamana Omar, local N° 49, Bloc A12,<br>Lakhdaria - Bouira', '026 70 53 01', '026 70 53 01', NULL, 40, 37, 36.7696110, 3.0552040, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(25, 310, 'CAAR — Tebessa', 'Bordj Larbi Boudiba, BP. 198 - Tebessa', '037 55 54 61', '037 55 50 67', NULL, 41, 100, 35.4020860, 8.1157160, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(26, 312, 'CAAR — Ouenza', 'Boulevard 1er Novembre 1954, BP. 171, Ouenza - Tebessa', '037 67 87 00', '037 67 89 63', NULL, 41, 99, 35.9518380, 8.1329960, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(27, 754, 'CAAR — Tebessa', 'Cité Oued Neghs, Nouvelle Gare Routière - Tébessa', '037 59 24 25', '037 59 24 25', NULL, 41, 100, 35.4151586, 8.1089036, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(28, 404, 'CAAR — Tlemcen', 'Résidence El Mitak 01, Bloc BC El Kiffan - Tlemcen', '043 26 71 46', '043 26 71 49', NULL, 42, 98, 34.8856804, -1.3269377, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(29, 416, 'CAAR — Maghnia', 'Rue Mohamed Khemisti, BP 461, Maghnia - Tlemcen', '043 50 27 23', '043 50 27 24', NULL, 42, 96, 34.8476078, -1.7290205, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(30, 417, 'CAAR — Ghazaouet', 'Porte de Nedroma, Ghazaouet - Tlemcen', '043 46 72 88', '043 46 72 87', NULL, 42, 95, 35.0990207, -1.8580565, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(31, 41750, 'CAAR — Nedroma', 'Ilot N° 36, N° 09, Nedroma - Tlemcen', '043 45 62 99', '043 45 62 95', NULL, 42, 97, 35.0101595, -1.7465460, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(32, 65535, 'CAAR — Tlemcen', '21, Boulevard ZERROUKI Abdelkarim - Tlemcen', '043 42 76 96', '043 42 76 96', NULL, 42, 98, 34.8794147, -1.3081240, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(33, 405, 'CAAR — Tiaret', 'CIA la Colline, Rue de La Palestine - Tiaret', '046 21 29 36', '046 21 29  37', NULL, 35, 85, 35.3775239, 1.3203574, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(34, 205, 'CAAR — Tizi-Ouzou', 'Boulevard des Frères Belhadj, Nouvelle ville - Tizi-Ouzou', '026 11 74 86', '026 11 21 63', NULL, 6, 94, 36.7020340, 4.0497090, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(35, 228, 'CAAR — Larabaâ Nath Irathen', 'Route du Lycée, Larabaâ Nath Irathen -Tizi Ouzou', '026 49 26 28', '026 49 26 32', NULL, 6, 93, 36.6348500, 4.2057650, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(36, 234, 'CAAR — Azzazga', 'Cité 300 Logts. AADL,  Azzazga - Tizi-Ouzou', '026 34 11 96', '026 34 14 16', NULL, 6, 90, 36.7475930, 4.3590770, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(37, 739, 'CAAR — Tizi-Ouzou', 'Tours Villa N° 37, Rue des Frères Slimani - Tizi Ouzou', '026 12 49 31', '026 12 65 17', NULL, 6, 94, 36.7170100, 4.0414600, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(38, 768, 'CAAR — Draa Ben Khedda', 'Rue KASRI Ahmed îlot central N° 39, Draa Ben Khedda - Tizi Ouzou', '026 27 30 28', '026 27 30 28', NULL, 6, 92, 36.7322700, 3.9657900, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(39, 20599, 'CAAR — Beni Douala', 'Bt. N° 06 Appt. N° 04, 2ème Etage, Centre Beni Douala - Tizi-Ouzou', '026 40 63 42', '026 25 63 44', NULL, 6, 91, 36.6231110, 4.0797280, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(40, 203, 'CAAR — Belouizded', '23, Rue Mohamed Belouizded - Alger', '021 65 10 24', '021 66 06 76', NULL, 7, 1, 36.7583300, 3.0559710, 'Main Agency', 'Auto,Habitation,Transport,Claims', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 01:01:03'),
(41, 210, 'CAAR — Kouba', 'Cité Serbat Bt. A9 GARIDI 1, Kouba - Alger', '023 70 01 60', '023 70 01 57', NULL, 7, 2, 36.7301450, 3.0664580, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(42, 212, 'CAAR — Baraki', 'Cité 2004 Logements, Bt. 43 A ET B, Baraki - Alger', '023 90 61 41', '023 90 61 42', NULL, 7, 3, 36.7896350, 3.2623130, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(43, 213, 'CAAR — Hussein-Dey', 'Rue Bachir Aoun, Brossette, Hussein-Dey - Alger', '021 23 46 88', '021 23 23 94', NULL, 7, 24, 36.7397160, 3.1013890, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(44, 226, 'CAAR — Rouiba', '31, Avenue du 1ER Novembre, Rouiba - Alger', '023 85 54 46', '023 85 42 58', NULL, 7, 4, 36.7361130, 3.2808540, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(45, 229, 'CAAR — Chéraga', 'Entrée Esplanade N° 14, Centre Commercial Et d\'Affaires El Qods, Chéraga - Alger', '021 34 10 34', '021 34 10 35', NULL, 7, 10, 36.7599030, 2.9640610, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(46, 230, 'CAAR — Bab Ezzouar', 'Cité EPLF 1408/2038 Logts. N° 67, Bab Ezzouar - Alger', '021 24 18 90', '021 24 19 01', NULL, 7, 17, 36.7192370, 3.1824920, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(47, 232, 'CAAR — El Harrach', '02, Rue  des Frères Djelli, Boumati, El Harrach - Alger', '021 52 30 77', '021 52 61 00', NULL, 7, 23, 36.7185280, 3.1397520, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(48, 601, 'CAAR — Belouizded', 'Cité El Djaouhara, Bt. N° 63, Les Halles, Belouizded - Alger', '021 67 46 93', '021 67 46 92', NULL, 7, 1, 36.7553620, 3.0663070, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(49, 602, 'CAAR — Alger Centre', '74, Rue Didouche Mourad - Alger', '023 50 49 65', '023 50 49 90', NULL, 7, 13, 36.7655880, 3.0503080, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(50, 609, 'CAAR — El Madania', 'Niveau 104, Local 1 A 03, Riadh El Feth, BT. 570,  <br>El Madania - Alger', '021 67 89 07', '021 67 89 06', NULL, 7, 7, 36.7427390, 3.0682460, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(51, 622, 'CAAR — El Biar', '16, Place Kennedy, El Biar - Alger', '023 37 72 15', '023 37 72 17', NULL, 7, 9, 36.7691270, 3.0310040, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(52, 630, 'CAAR — Alger Centre', '27, Rue Didouche Mourad - Alger', '021 63 38 94', '021 63 37 55', NULL, 7, 13, 36.7693625, 3.0550950, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(53, 632, 'CAAR — El Achour', 'Cité 1071 Logts. Bt. D35, Oued Romane, El Achour - Alger', '023 15 31 49', '023 15 31 56', NULL, 7, 22, 36.7475318, 2.9992159, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(54, 633, 'CAAR — Beni Messous', '01, Avenue de la Révolution, Beni Messous - Alger', '023 13 60 72', '023 13 60 74', NULL, 7, 18, 36.7801770, 2.9741030, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(55, 636, 'CAAR — Zeralda', 'Cité 2750 Logts. AADL, Bt. A7-08, Sidi Addellah, Mhalma,<br>Zeralda - Alger', '044 08 50 00', '044 08 50 50', NULL, 7, 26, 36.6905210, 2.8541980, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(56, 701, 'CAAR — Alger Centre', '27, Boulevard Victor Hugo - Alger', '021 73 32 07', '021 73 83 71', NULL, 7, 13, 36.7663060, 3.0525560, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(57, 708, 'CAAR — Bab Ezzouar', 'Cité 2068 logements Lot N° 39, Bab Ezzouar - Alger', '023 93 82 09', '023 93 82 09', NULL, 7, 17, 36.7173000, 3.1868300, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(58, 711, 'CAAR — Rouiba', 'Cité du Lycée Abdelmoumène, Rouiba - ALGER', '021 81 51 10', '021 81 51 10', NULL, 7, 4, 36.7410700, 3.2865500, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(59, 712, 'CAAR — Alger Centre', '31, Rue du Capitaine Menani - Alger', '021 65 84 33', '021 65 20 39', NULL, 7, 13, 36.7638780, 3.0512910, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(60, 713, 'CAAR — Chéraga', '04, Place Ben Badis, Cheraga - Alger', '023 35 81 19', '023 35 81 18', NULL, 7, 10, 36.7671020, 2.9627180, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(61, 718, 'CAAR — Alger Centre', '53, Rue Didouche Mourad - Alger', '021 73 68 69', '021 74 41 47 / 021 71 19 ', NULL, 7, 13, 36.7666920, 3.0527090, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(62, 719, 'CAAR — Chéraga', '20, Lotissement Giroud \"Petit Staoueli\", Cheraga - Alger', '023 36 73 77', '023 36 73 77', NULL, 7, 10, 36.7546030, 2.9637641, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(63, 742, 'CAAR — Reghaïa', 'Coopérative El Mostakbel, Aissat Mustapha, Reghaia - Alger', '023  84 21 51', '023  84 21 51', NULL, 23, 40, 36.7257980, 3.3348010, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(64, 755, 'CAAR — Zeralda', 'Cité 50 logements, Bt. 07 N° 01, Zeralda - Alger', '0657 88 60 64', NULL, NULL, 7, 26, 36.7146066, 2.8446365, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(65, 760, 'CAAR — Ouled Fayet', 'Cooperative El Mostakbal lots N° 01, actuellement cite Mohamed Boudiaf N° 03, Ouled Fayet - Alger', '0560 92 75 30', '023 32 45 64', NULL, 7, 25, 36.7396890, 2.9484040, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(66, 765, 'CAAR — Bab Ezzouar', 'Cité El Djorf, Bt. 57 C N° 02, Baba Ezzouar - Alger', '021 24 82 96', '021 24 82 96', NULL, 7, 17, 36.7224200, 3.1766180, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(67, 770, 'CAAR — Bir Khadem', 'Cité 194 logements, Bt. 07 N°20, Texeraine - Alger', '021 40 20 09', '021 40 20 09', NULL, 7, 19, 36.7263986, 3.0292167, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(68, 781, 'CAAR — El Biar', '72, Boulevard Bougara, El biar - Alger', '021 92 84 15', '021 92 84 15', NULL, 7, 9, 36.7661710, 3.0367400, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(69, 785, 'CAAR — Alger Centre', '1, Rue Didouche Mourad - Alger', '023 49 24 51', '023 49 24 53', NULL, 7, 13, 36.7712920, 3.0572820, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(70, 796, 'CAAR — Hussein-Dey', '71, Rue Djenan Ben Danoune, Hussein Dey - Alger', '023 70 93 05', '023 70 93 05', NULL, 7, 24, 36.7345310, 3.0979180, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(71, 797, 'CAAR — Bab Ezzouar', 'Cité 1577 logts., Bt. 15 S2, 05 Juillet, Bab Ezzouar - Alger', '023 92 86 78', '023 92 86 78', NULL, 7, 17, 36.7157540, 3.1882430, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(72, 799, 'CAAR — Reghaïa', 'Cité Ahmed Faoussi, Reghaia - Alger', '023 74 66 07', '023 74 66 07', NULL, 23, 40, 36.7394580, 3.3560790, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(73, 631, 'CAAR — Djelfa', 'Cité Wiam, BT. N° 30 - Djelfa', '027 92 61 55', '027 92 61 54', NULL, 43, 51, 34.6675500, 3.2756730, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(74, 507, 'CAAR — Jijel', 'Centre Commercial, Rue Larbi Ben M’Hidi - Jijel', '034 47 12 27', '034 47 56 28', NULL, 10, 59, 36.8203690, 5.7685480, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(75, 724, 'CAAR — Jijel', '05, Avenue Emir Abdelkader - Jijel', '034 47 11 90', '034 47 11 90', NULL, 10, 59, 36.8241370, 5.7667310, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(76, 778, 'CAAR — El Milia', '34, Rue de l\'ALN, El Milia - Jijel', '034 52 67 95', '034 52 67 95', NULL, 10, 57, 36.7498562, 6.2728051, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(77, 506, 'CAAR — Sétif', 'Cité Financière, Boulevard Port Said - Sétif', '036 82 56 90', '036 82 56 88', NULL, 33, 84, 36.1944210, 5.4116570, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(78, 511, 'CAAR — El Eulma', 'Cité des 800 logements, locaux N° 33 et 06 , El Eulma - Sétif', '036 48 12 60', '036 48 12 60', NULL, 33, 83, 36.1530100, 5.7022200, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(79, 304, 'CAAR — Béni Malek', 'Cité des Frères KHALDI, Béni Malek - Skikda', '038 76 27 73', '038 76 28 96', NULL, 10, 56, 36.8811840, 6.8970200, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(80, 315, 'CAAR — Skikda', '01, Rue Mohamed Nadir - Skikda', '038 75 75 00', '038 75 75 77', NULL, 20, 81, 36.8828510, 6.9064310, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(81, 316, 'CAAR — Skikda', 'Cité 30 Logts., Mordj Dib,BT. MD 01, les Platanes - Skikda', '038 93 85 90', '038 93 86 09', NULL, 20, 81, 36.7596787, 6.8945243, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(82, 317, 'CAAR — Skikda', 'Rue Omar Tayeb, Ramdane Djamel code 21425 - Skikda', '038 94 11 72', '038 94 11 72', NULL, 20, 81, 36.7534710, 6.8981800, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(83, 318, 'CAAR — El Harrouche', 'Cité 164 Logements, Rue Bachir Boukadoum, El Harrouche - Skikda', '038 79 10 90', '038 79 29 29', NULL, 20, 80, 36.6513080, 6.8341950, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(84, 319, 'CAAR — Azzaba', 'Rue du 1er Novembre 1954, Azzaba - Skikda', '038 96 97 97', '038 96 98 98', NULL, 20, 79, 36.7421060, 7.1089760, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(85, 706, 'CAAR — Skikda', '14, Cité Mohamed Namous - Skikda', '038 75 73 08', '038 75 73 08', NULL, 20, 81, 36.8694780, 6.9064500, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(86, 402, 'CAAR — Sidi Bel Abbès', 'N°04 citè 108 Logements - Sidi Bel Abbes', '048 74 62 72', '048 74 62 71', NULL, 32, 78, 35.1928653, -0.6176928, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(87, 411, 'CAAR — Sidi Bel Abbès', 'N°18, Residence El Feth, 20 Août, 1° Etage - Sidi Bel Abbes', '048 74 13 86', '048 74 13 88', NULL, 32, 78, 35.1890563, -0.6361634, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(88, 786, 'CAAR — Sidi Bel Abbès', '22, Rue Résidence- El Fateh - Sidi Bel Abbes', '048 74 14 14', '048 74 13 83', NULL, 32, 78, 35.1888189, -0.6361371, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(89, 301, 'CAAR — Annaba', '18, Rue ATTIA Ahmed - Annaba', '038 44 53 51', '038 44 53 54 / 038 44 53 ', NULL, 11, 27, 36.8947450, 7.7549080, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(90, 302, 'CAAR — Annaba', '12, Place Salah Eddine El Ayoubi - Annaba', '038 45 79 06', '038 45 79 06', NULL, 11, 27, 36.9013777, 7.7578990, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(91, 323, 'CAAR — Annaba', 'Boulevard Seddik Benyahia, Plaine Ouest - Annaba', '038 48 55 93', '038 48 55 93', NULL, 11, 27, 36.9015770, 7.7370810, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(92, 729, 'CAAR — Annaba', 'Cité les Santos, N° 03 Entrée 01, Local N° 03 - Annaba', '038 45 21 27', '038 45 21 24', NULL, 11, 27, 36.9026594, 7.7592489, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(93, 757, 'CAAR — Annaba', 'Coopérative Menzel El Amel, cité 05 Juillet Bt. N° 05<br>Rez de chaussée - Annaba', '038 42 12 99', '038 42 10 70', NULL, 11, 27, 36.8905743, 7.7165052, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(94, 788, 'CAAR — Annaba', 'Coopérative Basma, Local N° 03, <br>Route de Bouhdid - Annaba', '038 41 08 66', '038 41 08 66', NULL, 11, 27, 36.8928630, 7.7195820, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(95, 321, 'CAAR — Guelma', 'Rue Patrice Lumumba - Guelma', '037 14 37 87', '037 14 37 69', NULL, 12, 55, 36.4644230, 7.4316200, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(96, 727, 'CAAR — Guelma', '15, Rue SERIDI Mohamed Tahar - Guelma', '037 27 46 32', '037 26 74 14', NULL, 12, 55, 36.4641740, 7.4310380, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(97, 502, 'CAAR — Constantine', 'Cité Boussouf, Bt. 7, locaux N° 157/158 - Constantine', '031 60 27 22', '031 60 20 52', NULL, 13, 47, 36.3317410, 6.5813103, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(98, 503, 'CAAR — Constantine', '55, Avenue Aouati Mostefa - Constantine', '031 91 10 10', '031 92 94 91', NULL, 13, 47, 36.3571900, 6.6082360, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(99, 505, 'CAAR — Hamma Bouziane', '01, Boulevard de L\'ALN , Hamma Bouziane - Constantine', '031 84 06 71', '031 84 06 71', NULL, 13, 50, 36.4154200, 6.5972900, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(100, 512, 'CAAR — Daksi', 'Arrondissement administratif Daksi - Constantine', '031 63 80 74', '031 61 11 75', NULL, 13, 48, 36.3576944, 6.6396667, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(101, 515, 'CAAR — Ali Mendjli', 'Unité de voisinage 07 Ali Mendjli - Constantine', '031 74 80 20', '031 74 80 12', NULL, 13, 45, 36.2616759, 6.5826338, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(102, 721, 'CAAR — Aïn El Bey', 'Cité 564 Logements Tour 39 N° 01, Aïn El Bey - Constantine', '031 69 00 41', '031 69 00 40', NULL, 13, 46, 36.2996810, 6.6191570, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(103, 761, 'CAAR — Constantine', 'Cité Boussouf Bt. H N° 01 au RDC - Constantine', '031 60 35 02', '031 60 35 02', NULL, 13, 47, 36.3352360, 6.5764830, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(104, 763, 'CAAR — El Khroub', '12, Rue Izlioui Ali, El Khroub - Constantine', '031 75 86 83', '031 75 86 83', NULL, 13, 49, 36.2621070, 6.6907500, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(105, 769, 'CAAR — Constantine', 'Chalet des Pins N°160 commune et Daïra de Constantine', '031 62 71  23', '031 62 71  23', NULL, 13, 47, 36.3473556, 6.6424260, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(106, 784, 'CAAR — Emir Abdelkader', '01, Rue Chihabi Bachir, Cité Emir Abdelkader - Constantine', '031 84 68 02', '031 84 68 02', NULL, 10, 58, 36.3742569, 6.6234338, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(107, 794, 'CAAR — Constantine', 'Cité Benboulaid Bt. 10  Rez de chaussée N° 07 - Constantine', '031 60 94 49', '031 60 94 49', NULL, 13, 47, 36.3407970, 6.6027170, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(108, 795, 'CAAR — Ali Mendjli', 'Cité Aïn El Bey, 290 Logements, Bt. 138, Nouvelle Ville - Constantine', '031 77 60 69', '031 77 60 69', NULL, 13, 45, 36.2623430, 6.5741340, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(109, 629, 'CAAR — Médéa', 'Tour d\'affaires Theniet El Hadjer - Médéa', '025 73 23 03', '025 73 23 04', NULL, 8, 66, 36.2704504, 2.7771653, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(110, 403, 'CAAR — Mostaganem', '18, Place du 1er Novembre 1954 - Mostaganem', '045 41 32 36', '045 41 32 25', NULL, 21, 65, 35.9327320, 0.0893236, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(111, 419, 'CAAR — Mascara', 'Avenue de L\'ALN, cité Bel-Air - Mascara', '045 72 16 50', '045 72 16 46', NULL, 34, 62, 35.4012054, 0.1408710, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(112, 214, 'CAAR — Ouargla', 'Rue du 24 Février (EX Silice) - Ouargla', '029 71 38 60', '029 71 47 73', NULL, 44, 70, 31.9468580, 5.3186600, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(113, 219, 'CAAR — Hassi Messaoud', 'Cité Chaabani N° 01, BP. 548, Hassi Messaoud - Ouargla', '029 78 96 08', '029 78 96 09', NULL, 44, 69, 31.6862700, 6.0737040, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(114, 314, 'CAAR — Touggourt', 'Place Houari Boumédiene, 2ème étage, BP. 277, Touggourt - Ouargla', '029 66 14 13', '029 66 14 13', NULL, 44, 71, 33.1058600, 6.0672710, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(115, 705, 'CAAR — Hassi Messaoud', 'Coopérative El Wifak N° 2, Hassi Messaoud - Ouargla', '029 79 91 03', '029 79 91 18', NULL, 44, 69, 31.6922170, 6.0580570, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(116, 401, 'CAAR — Oran', '15, Avenue Hammou Mokhtar El Makkari, <br>Ex Saint Eugène - Oran', '041 28 17 52', '041 28 17 48', NULL, 22, 68, 35.6988281, -0.6288325, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(117, 409, 'CAAR — Oran', '04, Rue Belhachemi Mouley - Oran', '041 33 25 66', '041 33 19 50', NULL, 22, 68, 35.7036910, -0.6443364, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(118, 412, 'CAAR — Arzew', '24, Boulevard Emir Abdelkader, Arzew - Oran', '041 77 16 18', '041 77 16 18', NULL, 22, 67, 35.8579178, -0.3089130, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(119, 413, 'CAAR — Oran', 'Cité Administrative Zhun Usto, îlot 26 - Oran', '041 70 68 09', '041 70 68 09', NULL, 22, 68, 35.7006967, -0.5984867, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(120, 752, 'CAAR — Oran', 'Oran Est Millenium Cité Khemisti - Oran', '041 73 54 58', '041 73 54 56', NULL, 22, 68, 35.7173483, -0.5973853, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(121, 792, 'CAAR — Oran', 'Résidence Aribi, 116 logements, Bloc A1 B, Colonel Lotfi - <br>Oran', '041 74 53 34', '041 74 53 33', NULL, 22, 68, 35.7223105, -0.5934420, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(122, 510, 'CAAR — Bordj Bou Arreridj', 'Cité des 500 logements, BP 470 - Bordj Bou Arreridj', '035 69 75 20', '035 69 81 62', NULL, 9, 36, 36.0790676, 4.7647313, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(123, 743, 'CAAR — Bordj Bou Arreridj', 'BP. 484, Villa A1, Promotion EPLF Faubourg des Jardins - Bordj Bou Arréridj', '035 73 00 78', '035 73 00 78', NULL, 9, 36, 36.0756000, 4.7681700, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(124, 231, 'CAAR — Boumerdès', 'Centre Commercial Oued Tatareg, locaux 2 & 3 - Boumerdes', '024 94 77 07', '024 94 77 09', NULL, 23, 39, 36.7630030, 3.4655740, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(125, 303, 'CAAR — 36-El-Tarf', 'Route du Sahara, BP. 62, El Kala - El Taref', '038 35 02 56', '038 66 24 36', NULL, 45, 53, 36.8967260, 8.4457680, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(126, 322, 'CAAR — 36-El-Tarf', 'Rue Frikh Taif - El Taref', '038 30 12 67', '038 30 17 51', NULL, 45, 53, 36.7664850, 8.3121430, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(127, 418, 'CAAR — Tissemsilt', 'Boulevard Zeffan Abed îlot 67, Coopérative 389 - Tissemsilt', '046 57 13 23', '046 57 13 42', NULL, 16, 89, 35.6091011, 1.8115978, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(128, 320, 'CAAR — El Oued', 'Cité du 17 Octobre, BP. 18 - El Oued', '032 11 46 40', '032 11 46 39', NULL, 25, 52, 33.3614860, 6.8459230, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(129, 311, 'CAAR — Khenchela', 'Cité 100 logements, Route de Batna - Khenchella', '032 72 55 39', '032 72 55 38', NULL, 17, 60, 35.4265150, 7.1460940, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(130, 313, 'CAAR — Souk Ahras', 'Cité 1700 Logements, B 30, N° 01 - Souk Ahras', '037 76 70 19', '037 76 70 28', NULL, 18, 82, 36.8828120, 6.9065650, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(131, 620, 'CAAR — Koléa', 'Cité 128 Logts. 13 LSP, Route de Bousmail, Koléa - Tipaza', '024 38 49 00', '024 38 49 01', NULL, 47, 87, 36.6388190, 2.7518810, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(132, 625, 'CAAR — Cherchell', 'Centre Commercial, N° 25, Cherchell - Tipaza', '024 33 51 41', '024 33 51 42', NULL, 47, 86, 36.6055647, 2.1868273, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(133, 634, 'CAAR — Tipaza', 'Cité 150 Logts. LSP, B 03, N° 10 2401 - Tipaza', '024 37 43 75', '024 37 43 73', NULL, 47, 88, 36.5861410, 2.4311190, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(134, 504, 'CAAR — Mila', 'Cité Boutout Salah, BP. 24 - Mila', '031 47 47 21', '031 47 47 20', NULL, 26, 64, 36.4553170, 6.2662230, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(135, 793, 'CAAR — Chelghoum Laid', 'Cité du 1er Nouvembre 1954, Chelghoum Laid - Mila', '031 41 65 18', '031 41 65 18', NULL, 26, 63, 36.1589200, 6.1596970, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(136, 627, 'CAAR — Khemis Miliana', '14, Rue Djitli Mustapha, Khemis Miliana - Aïn Defla', '027 56 38 09', '027 56 38 08', NULL, 27, 28, 36.2595060, 2.2176200, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(137, 415, 'CAAR — Aïn Témouchent', 'Boulevard Mohamed Boudiaf - Aïn Timouchent', '043 77 82 82', '043 77 86 10', NULL, 29, 29, 35.3074184, -1.1384085, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(138, 208, 'CAAR — Sidi Abbaz', 'BP. 24, Sidi Abbaz - Ghardaïa', '029 25 53 25', '029 25 54 60', NULL, 30, 54, 32.4868880, 3.6974820, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25'),
(139, 414, 'CAAR — Relizane', 'Boulevard Mohamed Khemisti - Relizane', '046 72 36 06', '046 72 35 08', NULL, 31, 76, 35.7446713, 0.5564124, 'Agency', 'Auto,Habitation,Transport', 'Sun-Thu 08:00-16:00', 1, '2026-04-01 00:58:25', '2026-04-01 00:58:25');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED DEFAULT NULL,
  `action` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CREATE_CONTRACT, UPDATE_CLAIM_STATUS, etc.',
  `table_name` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int UNSIGNED DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_table` (`table_name`,`record_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `table_name`, `record_id`, `description`, `ip_address`, `created_at`) VALUES
(1, 4, 'CREATE_CONTRACT', 'contracts', 7, 'Roadside Assistance contract created via online payment. Quote #5, Policy: RSA-20260415-000005', NULL, '2026-04-15 19:29:36'),
(2, 4, 'CREATE', 'quotes', 9, 'CATNAT quote created for property_id=4', NULL, '2026-04-16 17:32:57'),
(3, 4, 'CONFIRM', 'quotes', 9, 'CATNAT quote #9 confirmed', NULL, '2026-04-16 17:32:58'),
(4, 4, 'CREATE', 'quotes', 10, 'CATNAT quote created for property_id=5', NULL, '2026-04-16 18:40:57'),
(5, 4, 'CONFIRM', 'quotes', 10, 'CATNAT quote #10 confirmed', NULL, '2026-04-16 18:40:57'),
(6, 4, 'CREATE_CONTRACT', 'contracts', 11, 'CATNAT contract created via online payment. Quote #10, Policy: CAT-20260416-000010', NULL, '2026-04-16 18:41:26'),
(7, 4, 'CREATE_CONTRACT', 'contracts', 15, 'Roadside Assistance contract created via online payment. Quote #14, Policy: RSA-20260416-000014', NULL, '2026-04-16 19:39:26'),
(8, 8, 'CREATE', 'quotes', 15, 'CATNAT quote created for property_id=6', NULL, '2026-04-17 00:40:17'),
(9, 8, 'CONFIRM', 'quotes', 15, 'CATNAT quote #15 confirmed', NULL, '2026-04-17 00:40:17'),
(10, 8, 'CREATE_CONTRACT', 'contracts', 16, 'CATNAT contract created via online payment. Quote #15, Policy: CAT-20260417-000015', NULL, '2026-04-17 00:40:43'),
(11, 4, 'CREATE_CONTRACT', 'contracts', 17, 'Roadside Assistance contract created via online payment. Quote #17, Policy: RSA-20260417-000017', NULL, '2026-04-17 12:08:10'),
(12, 17, 'CREATE', 'quotes', 18, 'CATNAT quote created for property_id=7', NULL, '2026-04-21 10:48:01'),
(13, 17, 'CONFIRM', 'quotes', 18, 'CATNAT quote #18 confirmed', NULL, '2026-04-21 10:48:01'),
(14, 17, 'CREATE_CONTRACT', 'contracts', 18, 'CATNAT contract created via online payment. Quote #18, Policy: CAT-20260421-000018', NULL, '2026-04-21 10:48:38'),
(15, 4, 'CREATE', 'quotes', 19, 'CATNAT quote created for property_id=8', NULL, '2026-04-27 14:48:11'),
(16, 4, 'CONFIRM', 'quotes', 19, 'CATNAT quote #19 confirmed', NULL, '2026-04-27 14:48:11'),
(17, 4, 'CREATE_CONTRACT', 'contracts', 19, 'CATNAT contract created via online payment. Quote #19, Policy: CAT-20260427-000019', NULL, '2026-04-27 14:52:09'),
(18, 20, 'CREATE_CONTRACT', 'contracts', 20, 'Roadside Assistance contract created via online payment. Quote #20, Policy: RSA-20260427-000020', NULL, '2026-04-27 15:02:23');

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

DROP TABLE IF EXISTS `cities`;
CREATE TABLE IF NOT EXISTS `cities` (
  `id` mediumint UNSIGNED NOT NULL AUTO_INCREMENT,
  `wilaya_id` smallint UNSIGNED NOT NULL,
  `name_fr` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_city_wilaya` (`wilaya_id`,`name_fr`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cities`
--

INSERT INTO `cities` (`id`, `wilaya_id`, `name_fr`, `name_ar`) VALUES
(1, 7, 'Belouizded', NULL),
(2, 7, 'Kouba', NULL),
(3, 7, 'Baraki', NULL),
(4, 7, 'Rouiba', NULL),
(5, 7, 'Ain Naadja', NULL),
(6, 7, 'Didouche Mourad', NULL),
(7, 7, 'El Madania', NULL),
(8, 7, 'Bouzareah', NULL),
(9, 7, 'El Biar', NULL),
(10, 7, 'Cheraga', NULL),
(11, 7, 'Ain Benian', NULL),
(12, 1, 'Adrar', NULL),
(13, 7, 'Alger Centre', NULL),
(16, 7, 'Bab El Oued', NULL),
(17, 7, 'Bab Ezzouar', NULL),
(18, 7, 'Beni Messous', NULL),
(19, 7, 'Bir Khadem', NULL),
(21, 7, 'Douira', NULL),
(22, 7, 'El Achour', NULL),
(23, 7, 'El Harrach', NULL),
(24, 7, 'Hussein-Dey', NULL),
(25, 7, 'Ouled Fayet', NULL),
(26, 7, 'Zeralda', NULL),
(27, 11, 'Annaba', NULL),
(28, 27, 'Khemis Miliana', NULL),
(29, 29, 'Aïn Témouchent', NULL),
(30, 37, 'Arris', NULL),
(31, 37, 'Aïn Touta', NULL),
(32, 37, 'Barika', NULL),
(33, 37, 'Batna', NULL),
(34, 38, 'Biskra', NULL),
(35, 5, 'Blida', NULL),
(36, 9, 'Bordj Bou Arreridj', NULL),
(37, 40, 'Bouira', NULL),
(38, 40, 'Lakhdaria', NULL),
(39, 23, 'Boumerdès', NULL),
(40, 23, 'Reghaïa', NULL),
(41, 39, 'Béchar', NULL),
(42, 4, 'Akbou', NULL),
(43, 4, 'Béjaïa', NULL),
(44, 2, 'Chlef', NULL),
(45, 13, 'Ali Mendjli', NULL),
(46, 13, 'Aïn El Bey', NULL),
(47, 13, 'Constantine', NULL),
(48, 13, 'Daksi', NULL),
(49, 13, 'El Khroub', NULL),
(50, 13, 'Hamma Bouziane', NULL),
(51, 43, 'Djelfa', NULL),
(52, 25, 'El Oued', NULL),
(53, 45, '36-El-Tarf', NULL),
(54, 30, 'Sidi Abbaz', NULL),
(55, 12, 'Guelma', NULL),
(56, 10, 'Béni Malek', NULL),
(57, 10, 'El Milia', NULL),
(58, 10, 'Emir Abdelkader', NULL),
(59, 10, 'Jijel', NULL),
(60, 17, 'Khenchela', NULL),
(61, 36, 'Laghouat', NULL),
(62, 34, 'Mascara', NULL),
(63, 26, 'Chelghoum Laid', NULL),
(64, 26, 'Mila', NULL),
(65, 21, 'Mostaganem', NULL),
(66, 8, 'Médéa', NULL),
(67, 22, 'Arzew', NULL),
(68, 22, 'Oran', NULL),
(69, 44, 'Hassi Messaoud', NULL),
(70, 44, 'Ouargla', NULL),
(71, 44, 'Touggourt', NULL),
(72, 3, 'Aïn Beïda', NULL),
(73, 3, 'Aïn M\'lila', NULL),
(74, 3, 'Meskiana', NULL),
(75, 3, 'Oum El Bouaghi', NULL),
(76, 31, 'Relizane', NULL),
(78, 32, 'Sidi Bel Abbès', NULL),
(79, 20, 'Azzaba', NULL),
(80, 20, 'El Harrouche', NULL),
(81, 20, 'Skikda', NULL),
(82, 18, 'Souk Ahras', NULL),
(83, 33, 'El Eulma', NULL),
(84, 33, 'Sétif', NULL),
(85, 35, 'Tiaret', NULL),
(86, 47, 'Cherchell', NULL),
(87, 47, 'Koléa', NULL),
(88, 47, 'Tipaza', NULL),
(89, 16, 'Tissemsilt', NULL),
(90, 6, 'Azzazga', NULL),
(91, 6, 'Beni Douala', NULL),
(92, 6, 'Draa Ben Khedda', NULL),
(93, 6, 'Larabaâ Nath Irathen', NULL),
(94, 6, 'Tizi-Ouzou', NULL),
(95, 42, 'Ghazaouet', NULL),
(96, 42, 'Maghnia', NULL),
(97, 42, 'Nedroma', NULL),
(98, 42, 'Tlemcen', NULL),
(99, 41, 'Ouenza', NULL),
(100, 41, 'Tebessa', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `claims`
--

DROP TABLE IF EXISTS `claims`;
CREATE TABLE IF NOT EXISTS `claims` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int UNSIGNED NOT NULL,
  `contract_id` int UNSIGNED NOT NULL,
  `agency_id` int UNSIGNED DEFAULT NULL COMMENT 'Nearest agency auto-assigned',
  `expert_id` int UNSIGNED DEFAULT NULL COMMENT 'Assigned by admin',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `claim_date` date NOT NULL,
  `incident_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `incident_wilaya_id` smallint UNSIGNED DEFAULT NULL,
  `status` enum('pending','under_review','expert_assigned','reported','approved','rejected','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_claim_contract` (`contract_id`),
  KEY `idx_claim_agency` (`agency_id`),
  KEY `idx_claim_expert` (`expert_id`),
  KEY `idx_claim_status` (`status`),
  KEY `fk_claim_wilaya` (`incident_wilaya_id`),
  KEY `fk_claim_client` (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `claims`
--

INSERT INTO `claims` (`id`, `client_id`, `contract_id`, `agency_id`, `expert_id`, `description`, `claim_date`, `incident_location`, `incident_wilaya_id`, `status`, `rejection_reason`, `created_at`, `updated_at`) VALUES
(3, 3, 15, NULL, 1, 'stopped in middle of road', '2026-04-16', 'alger1', NULL, 'approved', NULL, '2026-04-16 23:38:47', '2026-04-19 10:34:01'),
(4, 3, 7, NULL, 1, 'my tires broke', '2026-04-19', 'alger1 cheraga', NULL, 'rejected', NULL, '2026-04-19 10:42:53', '2026-04-19 10:47:59'),
(5, 3, 15, NULL, 1, 'qwertyuiobv67y hgi', '2026-04-19', 'alger1 cheraga', NULL, 'rejected', NULL, '2026-04-19 11:34:51', '2026-05-02 21:42:34'),
(6, 3, 8, NULL, 1, 'qawsedfghijm xser6tyu', '2026-04-19', 'alger1 cheraga', NULL, 'expert_assigned', NULL, '2026-04-19 11:58:48', '2026-04-20 14:46:10'),
(7, 3, 17, NULL, 1, 'okokokokokokokokokokok', '2026-04-19', 'alger1 cheraga', NULL, 'reported', NULL, '2026-04-19 12:08:38', '2026-04-19 12:40:07'),
(8, 3, 8, NULL, 1, ';lkuytrewqCVNJU EDFGBHJYTRE', '2026-04-20', 'alger1 cheraga', NULL, 'expert_assigned', NULL, '2026-04-20 13:28:34', '2026-04-20 13:45:08'),
(9, 3, 11, NULL, 5, '3wtryukigfdc', '2026-04-20', 'alger1', NULL, 'approved', NULL, '2026-04-20 14:00:15', '2026-04-21 10:56:38');

--
-- Triggers `claims`
--
DROP TRIGGER IF EXISTS `before_claim_insert`;
DELIMITER $$
CREATE TRIGGER `before_claim_insert` BEFORE INSERT ON `claims` FOR EACH ROW BEGIN
  IF NEW.status = 'expert_assigned' AND NEW.expert_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'expert_id required when status = expert_assigned';
  END IF;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `before_claim_update`;
DELIMITER $$
CREATE TRIGGER `before_claim_update` BEFORE UPDATE ON `claims` FOR EACH ROW BEGIN
  IF NEW.status = 'expert_assigned' AND NEW.expert_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'expert_id required when status = expert_assigned';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `insurance_number` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wilaya_id` smallint UNSIGNED DEFAULT NULL COMMENT 'Home wilaya',
  `city_id` mediumint UNSIGNED DEFAULT NULL COMMENT 'Home city',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_insurance_number` (`insurance_number`),
  UNIQUE KEY `unique_user_client` (`user_id`),
  UNIQUE KEY `uq_clients_user_id` (`user_id`),
  KEY `fk_client_wilaya` (`wilaya_id`),
  KEY `fk_client_city` (`city_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `user_id`, `insurance_number`, `wilaya_id`, `city_id`, `address`, `created_at`) VALUES
(2, 2, 'CLIENT-001', 16, 1, 'Alger test', '2026-04-13 14:59:29'),
(3, 4, 'CAAR-20260414-A47A', NULL, NULL, NULL, '2026-04-14 15:05:54'),
(4, 5, 'CAAR-20260416-1DC7', NULL, NULL, NULL, '2026-04-16 13:00:59'),
(5, 6, 'CAAR-20260416-18BD', NULL, NULL, NULL, '2026-04-16 13:17:23'),
(6, 7, 'CAAR-20260416-8E26', NULL, NULL, NULL, '2026-04-16 13:49:37'),
(7, 8, 'CAAR-20260417-06F6', NULL, NULL, NULL, '2026-04-17 00:40:17'),
(8, 9, 'CAAR-20260417-728B', NULL, NULL, NULL, '2026-04-17 12:05:16'),
(9, 16, 'CAAR-20260421-6C30', NULL, NULL, NULL, '2026-04-21 10:42:20'),
(10, 17, 'CAAR-20260421-F2D0', NULL, NULL, NULL, '2026-04-21 10:48:01'),
(11, 19, 'CAAR-20260427-D19C', NULL, NULL, NULL, '2026-04-27 14:58:10'),
(12, 20, 'CAAR-20260427-97D7', NULL, NULL, NULL, '2026-04-27 14:59:01');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('new','read','replied') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `sender_user_id` int UNSIGNED DEFAULT NULL COMMENT 'Populated when a logged-in user submits the form',
  `sender_role` enum('client','expert','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Role snapshot at submission time',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_msg_status` (`status`),
  KEY `idx_msg_sender` (`sender_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `full_name`, `email`, `phone`, `subject`, `message`, `status`, `sender_user_id`, `sender_role`, `created_at`) VALUES
(2, 'MOUFOUKI', 'aida.moufouki@gmail.com', '0549025814', 'General Information', 'i like this very very muchoo', 'new', 4, 'client', '2026-04-16 23:53:31'),
(3, 'MOUFOUKI', 'farida.nawal@gmail.com', '0549025814', 'General Information', 'yadra yadra zwin', 'new', 4, 'client', '2026-04-17 00:35:49');

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int UNSIGNED NOT NULL,
  `vehicle_id` int UNSIGNED DEFAULT NULL,
  `property_id` int UNSIGNED DEFAULT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `plan_id` int UNSIGNED DEFAULT NULL,
  `agency_id` int UNSIGNED DEFAULT NULL COMMENT 'Managing agency',
  `policy_reference` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `premium_amount` decimal(12,2) NOT NULL,
  `status` enum('active','expired','cancelled','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_policy_reference` (`policy_reference`),
  KEY `idx_contract_client` (`client_id`),
  KEY `idx_contract_status` (`status`),
  KEY `idx_contract_agency` (`agency_id`),
  KEY `fk_contract_vehicle` (`vehicle_id`),
  KEY `fk_contract_product` (`product_id`),
  KEY `fk_contract_property` (`property_id`),
  KEY `fk_contract_plan` (`plan_id`)
) ;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `client_id`, `vehicle_id`, `property_id`, `product_id`, `plan_id`, `agency_id`, `policy_reference`, `start_date`, `end_date`, `premium_amount`, `status`, `created_at`, `updated_at`) VALUES
(7, 3, 7, NULL, 2, 1, NULL, 'RSA-20260415-000005', '2026-04-15', '2027-04-14', 4900.00, 'active', '2026-04-15 19:29:36', '2026-04-15 19:29:36'),
(8, 3, NULL, NULL, 2, NULL, NULL, 'CAT-20260416-000001', '2026-04-16', '2027-04-15', 7900.00, 'suspended', '2026-04-16 13:04:49', '2026-04-20 14:48:51'),
(9, 5, NULL, 2, 3, NULL, NULL, 'CAT-20260416-000007', '2026-04-16', '2027-04-15', 6949.60, 'active', '2026-04-16 13:18:33', '2026-04-16 13:18:33'),
(11, 3, NULL, 5, 3, NULL, NULL, 'CAT-20260416-000010', '2026-04-16', '2027-04-15', 12875.80, 'active', '2026-04-16 18:41:23', '2026-04-16 18:41:23'),
(15, 3, 11, NULL, 2, 1, NULL, 'RSA-20260416-000014', '2026-04-16', '2027-04-15', 4900.00, 'active', '2026-04-16 19:39:26', '2026-04-16 19:39:26'),
(16, 7, NULL, 6, 3, NULL, NULL, 'CAT-20260417-000015', '2026-04-17', '2027-04-16', 247.52, 'active', '2026-04-17 00:40:40', '2026-04-17 00:40:40'),
(17, 3, 13, NULL, 2, 3, NULL, 'RSA-20260417-000017', '2026-04-17', '2027-04-16', 11500.00, 'active', '2026-04-17 12:08:10', '2026-04-17 12:08:10'),
(18, 10, NULL, 7, 3, NULL, NULL, 'CAT-20260421-000018', '2026-04-21', '2027-04-20', 17731.00, 'active', '2026-04-21 10:48:34', '2026-04-21 10:48:34'),
(19, 3, NULL, 8, 3, NULL, NULL, 'CAT-20260427-000019', '2026-04-27', '2027-04-26', 58072.00, 'active', '2026-04-27 14:52:05', '2026-04-27 14:52:05'),
(20, 12, 14, NULL, 2, 1, NULL, 'RSA-20260427-000020', '2026-04-27', '2027-04-26', 4900.00, 'active', '2026-04-27 15:02:23', '2026-04-27 15:02:23');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int UNSIGNED DEFAULT NULL,
  `contract_id` int UNSIGNED DEFAULT NULL,
  `claim_id` int UNSIGNED DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MIME type',
  `file_size` int UNSIGNED DEFAULT NULL COMMENT 'Bytes',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_client` (`client_id`),
  KEY `idx_doc_contract` (`contract_id`),
  KEY `idx_doc_claim` (`claim_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experts`
--

DROP TABLE IF EXISTS `experts`;
CREATE TABLE IF NOT EXISTS `experts` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `specialization` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g. Auto, Property, Industrial',
  `agency_id` int UNSIGNED DEFAULT NULL COMMENT 'Home agency',
  `wilaya_id` smallint UNSIGNED DEFAULT NULL COMMENT 'Operating wilaya',
  `license_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_expert_user` (`user_id`),
  KEY `fk_expert_agency` (`agency_id`),
  KEY `fk_expert_wilaya` (`wilaya_id`)
) ;

--
-- Dumping data for table `experts`
--

INSERT INTO `experts` (`id`, `user_id`, `specialization`, `agency_id`, `wilaya_id`, `license_number`, `is_available`, `created_at`) VALUES
(1, 10, 'Auto', NULL, NULL, NULL, 1, '2026-04-19 09:56:27'),
(3, 14, 'Auto', NULL, NULL, NULL, 1, '2026-04-20 16:38:28'),
(4, 15, 'Auto', NULL, NULL, NULL, 1, '2026-04-20 19:29:51'),
(5, 18, 'Auto', NULL, NULL, NULL, 1, '2026-04-21 10:51:18');

-- --------------------------------------------------------

--
-- Table structure for table `expert_reports`
--

DROP TABLE IF EXISTS `expert_reports`;
CREATE TABLE IF NOT EXISTS `expert_reports` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `claim_id` int UNSIGNED NOT NULL,
  `expert_id` int UNSIGNED NOT NULL,
  `report` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimated_damage` decimal(14,2) NOT NULL,
  `report_date` date NOT NULL,
  `conclusion` enum('covered','partially_covered','not_covered','pending_review') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_report_claim` (`claim_id`) COMMENT 'One report per claim',
  KEY `idx_report_expert` (`expert_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expert_reports`
--

INSERT INTO `expert_reports` (`id`, `claim_id`, `expert_id`, `report`, `estimated_damage`, `report_date`, `conclusion`, `created_at`) VALUES
(1, 3, 1, 'test test nawal chabaaaaaaaaaaaaaaaaa', 120000.00, '2026-04-19', 'covered', '2026-04-19 10:33:09'),
(2, 4, 1, 'nawaaaaaaaaaaaaaaaaaaaaaaal', 12345678.00, '2026-04-19', 'covered', '2026-04-19 10:47:18'),
(3, 5, 1, 'tire_damage_report.pdf', 80000.00, '2026-04-19', 'covered', '2026-04-19 11:52:55'),
(4, 7, 1, 'report 5 of jaja', 5678.00, '2026-04-19', 'not_covered', '2026-04-19 12:40:07'),
(5, 9, 5, 'rapport villa aida', 9999999999.99, '2026-04-21', 'covered', '2026-04-21 10:56:00');

-- --------------------------------------------------------

--
-- Table structure for table `homepage_products`
--

DROP TABLE IF EXISTS `homepage_products`;
CREATE TABLE IF NOT EXISTS `homepage_products` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cta_label` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Subscribe',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `product_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_hp_active_order` (`is_active`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Controls the Online Products section on the homepage (CATNAT + Roadside only)';

--
-- Dumping data for table `homepage_products`
--

INSERT INTO `homepage_products` (`id`, `name`, `description`, `image_url`, `cta_label`, `is_active`, `display_order`, `created_at`, `updated_at`, `product_id`) VALUES
(1, 'Natural Disaster (CATNAT)', 'Mandatory coverage by Algerian law (Ordonnance 03-12) protecting your property against earthquakes, floods, storms, landslides and ground movements.', 'img/catnat.webp', 'Get a Quote', 1, 1, '2026-04-28 21:48:49', '2026-04-30 21:52:33', NULL),
(2, 'Roadside Assistance', 'Emergency vehicle assistance available 24/7 across all 48 wilayas — towing, on-site repair, replacement vehicle, and hotel coverage.', 'img/onlinecar.webp', 'Subscribe Now', 1, 2, '2026-04-28 21:48:49', '2026-04-30 21:52:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

DROP TABLE IF EXISTS `job_applications`;
CREATE TABLE IF NOT EXISTS `job_applications` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_of_interest` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position_sought` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `cv_file` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','reviewed','accepted','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `news_articles`
--

DROP TABLE IF EXISTS `news_articles`;
CREATE TABLE IF NOT EXISTS `news_articles` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','published') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_news_status_created` (`status`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `news_articles`
--

INSERT INTO `news_articles` (`id`, `title`, `content`, `image_url`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Algeria\'s Luca Zidane doubt for World Cup after jaw fracture', 'Algeria goalkeeper Luca Zidane is a doubt for the World Cup after suffering a jaw and chin fracture while playing for his club Granada in Spain\'s second tier.', NULL, 'published', '2026-04-28 22:28:24', '2026-04-28 22:28:24'),
(2, 'Agency 602 Renovated – Didouche Mourad', 'CAAR modernized Agency 602 in Didouche Mourad to enhance customer experience and improve service quality for policyholders.', 'img/art1.png', 'published', '2026-04-28 22:59:58', '2026-04-30 14:18:08'),
(3, 'Agency 228 Renovated – Larbaa Nath Irathen', 'Agency 228 was renovated as part of CAAR’s ongoing distribution network modernization to improve accessibility and service.', 'img/art2.png', 'published', '2026-04-28 23:00:10', '2026-04-30 14:18:08'),
(4, 'CAAR Information Day – Bejaia', 'CAAR organized an information day in Bejaia during its 60th anniversary celebrations to engage clients and present services.', 'img/art3.png', 'published', '2026-04-28 23:00:21', '2026-04-30 14:18:08'),
(5, 'CAAR at the African Business Forum – SADA 2025', 'CAAR took part in SADA 2025 in Oran, strengthening its presence in the African business community and promoting partnerships.', 'img/art4.png', 'published', '2026-04-28 23:00:29', '2026-04-30 14:18:08'),
(7, 'warda is studying', 'Warda has been studying for the past two years and is tired and wants to retire', NULL, 'draft', '2026-05-01 10:37:42', '2026-05-01 10:38:08');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'contract|claim|payment|system',
  `event_type` enum('claim_created','claim_status_updated','expert_assigned','roadside_created','message_received','contract_created','payment_received','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Machine-readable trigger that created this notification',
  `entity_type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g. claim | contract | message',
  `entity_id` int UNSIGNED DEFAULT NULL COMMENT 'PK of the related entity row',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_read` (`is_read`),
  KEY `idx_notif_user_read` (`user_id`,`is_read`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `event_type`, `entity_type`, `entity_id`, `is_read`, `created_at`) VALUES
(1, 4, 'Your Roadside Assistance contract is active', 'Your policy (RSA-20260415-000005) has been created and is valid from 2026-04-15 to 2027-04-14.', 'contract', 'contract_created', NULL, NULL, 1, '2026-04-15 19:29:36'),
(2, 4, 'Quote created', 'Your CATNAT quote #9 has been created.', 'info', NULL, NULL, NULL, 1, '2026-04-16 17:32:57'),
(3, 4, 'Quote confirmed', 'Your quote #9 has been confirmed.', 'success', NULL, NULL, NULL, 1, '2026-04-16 17:32:58'),
(4, 4, 'Quote created', 'Your CATNAT quote #10 has been created.', 'info', NULL, NULL, NULL, 1, '2026-04-16 18:40:57'),
(5, 4, 'Quote confirmed', 'Your quote #10 has been confirmed.', 'success', NULL, NULL, NULL, 1, '2026-04-16 18:40:57'),
(6, 4, 'Payment successful', 'Your policy CAT-20260416-000010 is now active.', 'success', 'payment_received', NULL, NULL, 1, '2026-04-16 18:41:26'),
(10, 1, 'New Claim Submitted', 'Claim #3 was submitted by Aida Moufouki (contract #15).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-16 23:38:47'),
(11, 1, 'New Roadside Request', 'Aida Moufouki submitted roadside request RSA-REQ-20260416-5DCE1F for contract #15.', 'roadside', 'roadside_created', NULL, NULL, 0, '2026-04-16 23:39:30'),
(12, 1, 'New Contact Message', 'MOUFOUKI sent a message: \"General Information\". (Message #2)', 'system', 'system', NULL, NULL, 0, '2026-04-16 23:53:31'),
(13, 1, 'New Contact Message', 'MOUFOUKI sent a message: \"General Information\". (Message #3)', 'system', 'system', NULL, NULL, 0, '2026-04-17 00:35:49'),
(14, 8, 'Quote created', 'Your CATNAT quote #15 has been created.', 'info', NULL, NULL, NULL, 0, '2026-04-17 00:40:17'),
(15, 8, 'Quote confirmed', 'Your quote #15 has been confirmed.', 'success', NULL, NULL, NULL, 0, '2026-04-17 00:40:17'),
(16, 8, 'Payment successful', 'Your policy CAT-20260417-000015 is now active.', 'success', 'payment_received', NULL, NULL, 0, '2026-04-17 00:40:43'),
(17, 1, 'New Roadside Assistance Request', 'Aida MOUFOUKI submitted a new Roadside Assistance subscription (quote #16).', 'contract', 'roadside_created', NULL, NULL, 0, '2026-04-17 00:41:30'),
(18, 1, 'New Roadside Assistance Request', 'Moufouki warda submitted a new Roadside Assistance subscription (quote #17).', 'contract', 'roadside_created', NULL, NULL, 0, '2026-04-17 12:07:44'),
(19, 4, 'Claim Status Updated', 'Your claim #3 is now under review.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 10:24:23'),
(20, 10, 'New Claim Assignment', 'You have been assigned to claim #3. Please review it at your earliest convenience.', 'claim', 'expert_assigned', NULL, NULL, 0, '2026-04-19 10:24:31'),
(21, 4, 'Claim Status Updated', 'Your claim #3 has been approved.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 10:34:01'),
(22, 1, 'New Claim Submitted', 'Claim #4 was submitted by Aida Moufouki (contract #7).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 10:42:53'),
(23, 12, 'New Claim Submitted', 'Claim #4 was submitted by Aida Moufouki (contract #7).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 10:42:53'),
(24, 4, 'Claim Status Updated', 'Your claim #4 is now under review.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 10:43:49'),
(25, 10, 'New Claim Assignment', 'You have been assigned to claim #4. Please review it at your earliest convenience.', 'claim', 'expert_assigned', NULL, NULL, 0, '2026-04-19 10:44:01'),
(26, 4, 'Claim Status Updated', 'Your claim #4 has been rejected.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 10:47:59'),
(27, 1, 'New Claim Submitted', 'Claim #5 was submitted by Aida Moufouki (contract #15).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 11:34:51'),
(28, 12, 'New Claim Submitted', 'Claim #5 was submitted by Aida Moufouki (contract #15).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 11:34:51'),
(29, 4, 'Claim Status Updated', 'Your claim #5 is now under review.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 11:35:20'),
(30, 10, 'New Claim Assignment', 'You have been assigned to claim #5. Please review it at your earliest convenience.', 'claim', 'expert_assigned', NULL, NULL, 0, '2026-04-19 11:39:38'),
(31, 1, 'New Claim Submitted', 'Claim #6 was submitted by Aida Moufouki (contract #8).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 11:58:48'),
(32, 12, 'New Claim Submitted', 'Claim #6 was submitted by Aida Moufouki (contract #8).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 11:58:48'),
(33, 4, 'Claim Status Updated', 'Your claim #6 is now under review.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 11:59:30'),
(34, 10, 'New Claim Assignment', 'You have been assigned to claim #6. Please review it at your earliest convenience.', 'claim', 'expert_assigned', NULL, NULL, 0, '2026-04-19 11:59:35'),
(35, 4, 'Claim Status Updated', 'Your claim #6 has received an expert report.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 11:59:48'),
(36, 1, 'New Claim Submitted', 'Claim #7 was submitted by Aida Moufouki (contract #17).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 12:08:38'),
(37, 12, 'New Claim Submitted', 'Claim #7 was submitted by Aida Moufouki (contract #17).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-19 12:08:38'),
(38, 4, 'Claim Status Updated', 'Your claim #7 is now under review.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-19 12:08:55'),
(39, 10, 'New Claim Assignment', 'You have been assigned to claim #7. Please review it at your earliest convenience.', 'claim', 'expert_assigned', NULL, NULL, 0, '2026-04-19 12:08:58'),
(40, 1, 'New Claim Submitted', 'Claim #8 was submitted by Aida Moufouki (contract #8).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-20 13:28:34'),
(41, 12, 'New Claim Submitted', 'Claim #8 was submitted by Aida Moufouki (contract #8).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-20 13:28:34'),
(42, 4, 'Claim Status Updated', 'Your claim #8 is now under review.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-20 13:44:20'),
(43, 10, 'New Claim Assignment', 'You have been assigned to claim #8. Please review it at your earliest convenience.', 'claim', 'expert_assigned', NULL, NULL, 0, '2026-04-20 13:45:08'),
(44, 1, 'New Claim Submitted', 'Claim #9 was submitted by Aida Moufouki (contract #11).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-20 14:00:15'),
(45, 12, 'New Claim Submitted', 'Claim #9 was submitted by Aida Moufouki (contract #11).', 'claim', 'claim_created', NULL, NULL, 0, '2026-04-20 14:00:15'),
(46, 4, 'Claim Status Updated', 'Your claim #9 is now under review.', 'claim', 'claim_status_updated', NULL, NULL, 1, '2026-04-20 14:00:31'),
(47, 17, 'Quote created', 'Your CATNAT quote #18 has been created.', 'info', NULL, NULL, NULL, 0, '2026-04-21 10:48:01'),
(48, 17, 'Quote confirmed', 'Your quote #18 has been confirmed.', 'success', NULL, NULL, NULL, 0, '2026-04-21 10:48:01'),
(49, 17, 'Payment successful', 'Your policy CAT-20260421-000018 is now active.', 'success', NULL, NULL, NULL, 0, '2026-04-21 10:48:38'),
(50, 18, 'New Claim Assignment', 'You have been assigned to claim #9. Please review it at your earliest convenience.', 'claim', NULL, NULL, NULL, 0, '2026-04-21 10:54:20'),
(51, 4, 'Claim Status Updated', 'Your claim #9 has been approved.', 'claim', NULL, NULL, NULL, 1, '2026-04-21 10:56:38'),
(52, 4, 'Quote created', 'Your CATNAT quote #19 has been created.', 'info', NULL, NULL, NULL, 1, '2026-04-27 14:48:11'),
(53, 4, 'Quote confirmed', 'Your quote #19 has been confirmed.', 'success', NULL, NULL, NULL, 1, '2026-04-27 14:48:11'),
(54, 4, 'Payment successful', 'Your policy CAT-20260427-000019 is now active.', 'success', NULL, NULL, NULL, 1, '2026-04-27 14:52:09'),
(55, 1, 'New Roadside Assistance Request', 'Ibrahim Zaidi submitted a new Roadside Assistance subscription (quote #20).', 'contract', NULL, NULL, NULL, 0, '2026-04-27 15:01:54'),
(56, 12, 'New Roadside Assistance Request', 'Ibrahim Zaidi submitted a new Roadside Assistance subscription (quote #20).', 'contract', NULL, NULL, NULL, 0, '2026-04-27 15:01:54'),
(57, 4, 'Claim Status Updated', 'Your claim #5 has been rejected.', 'claim', NULL, NULL, NULL, 1, '2026-05-02 21:42:34');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `contract_id` int UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` date NOT NULL,
  `method` enum('cash','card','transfer','dahabia','cib') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'paid',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_contract` (`contract_id`),
  KEY `idx_payment_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `contract_id`, `amount`, `payment_date`, `method`, `reference`, `status`, `created_at`) VALUES
(3, 9, 6949.60, '2026-04-16', NULL, NULL, 'paid', '2026-04-16 13:18:33'),
(4, 11, 12875.80, '2026-04-16', NULL, NULL, 'paid', '2026-04-16 18:41:23'),
(8, 15, 4900.00, '2026-04-16', NULL, NULL, 'paid', '2026-04-16 19:39:26'),
(9, 16, 247.52, '2026-04-17', NULL, NULL, 'paid', '2026-04-17 00:40:40'),
(10, 17, 11500.00, '2026-04-17', NULL, NULL, 'paid', '2026-04-17 12:08:10'),
(11, 18, 17731.00, '2026-04-21', NULL, NULL, 'paid', '2026-04-21 10:48:34'),
(12, 19, 58072.00, '2026-04-27', NULL, NULL, 'paid', '2026-04-27 14:52:05'),
(13, 20, 4900.00, '2026-04-27', NULL, NULL, 'paid', '2026-04-27 15:02:23');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` int UNSIGNED NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `features` json DEFAULT NULL COMMENT 'Array of feature strings',
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plan_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `product_id`, `name`, `price`, `description`, `features`, `is_popular`, `is_active`, `created_at`) VALUES
(1, 2, 'Basic', 4900.00, 'Essential roadside coverage', '[\"Towing 50km\", \"Repair attempt\", \"Hotline\", \"1 intervention\"]', 0, 1, '2026-04-14 21:54:45'),
(2, 2, 'Plus', 7900.00, 'Extended coverage', '[\"Towing 150km\", \"Repair\", \"Hotline\", \"Replacement car\", \"3 interventions\"]', 1, 1, '2026-04-14 21:54:45'),
(3, 2, 'Premium', 11500.00, 'Full coverage', '[\"Unlimited towing\", \"Repair\", \"Priority hotline\", \"Hotel\", \"Unlimited interventions\"]', 0, 1, '2026-04-14 21:54:45'),
(4, 1, 'RC Seule (Third Party Only)', 25000.00, 'Mandatory minimum civil liability', '[\"Bodily injury liability\", \"Material damage liability\", \"Passenger coverage\", \"Legal defence\"]', 0, 1, '2026-04-14 21:58:49'),
(5, 1, 'Tous Risques (Comprehensive)', 55000.00, 'Full coverage', '[\"All RC benefits\", \"Collision damage\", \"Theft\", \"Fire\", \"Glass breakage\"]', 1, 1, '2026-04-14 21:58:49'),
(6, 1, 'Tous Risques + Assistance', 65000.00, 'Premium auto package', '[\"All comprehensive benefits\", \"Roadside assistance\", \"Replacement vehicle\", \"Hotel stay\"]', 0, 1, '2026-04-14 21:58:49'),
(7, 3, 'Basique', 12000.00, 'Couverture de base obligatoire — séismes et inondations', '[\"Séismes et activité sismique\", \"Inondations et crues\", \"Plafond 10 000 000 DZD\", \"1 sinistre / an\"]', 0, 1, '2026-04-14 22:00:01'),
(8, 3, 'Plus', 20000.00, 'Couverture étendue — tous risques naturels courants', '[\"Tous les avantages Basique\", \"Tempêtes et vents violents\", \"Mouvements de terrain\", \"Plafond 30 000 000 DZD\", \"Délai de traitement prioritaire\"]', 1, 1, '2026-04-14 22:00:01'),
(9, 3, 'Premium', 35000.00, 'Couverture maximale — tous risques et relogement temporaire', '[\"Tous les avantages Plus\", \"Relogement temporaire jusqu\'à 6 mois\", \"Prise en charge des frais de déblaiement\", \"Plafond 100 000 000 DZD\", \"Expertise en 48h\", \"Traitement accéléré des sinistres\"]', 0, 1, '2026-04-16 11:06:05');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `insurance_type` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `is_online` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Available for online subscription',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `insurance_type`, `base_price`, `is_online`, `is_active`, `created_at`) VALUES
(1, 'Auto Insurance', 'Motor vehicle insurance covering mandatory civil liability, theft, fire, and accidental damage to third parties.', 'Auto', 0.00, 0, 1, '2026-04-13 19:13:05'),
(2, 'Roadside Assistance', 'Emergency vehicle assistance available 24/7 across all 48 wilayas — towing, on-site repair, replacement vehicle, and hotel coverage.', 'Auto', 0.00, 1, 1, '2026-04-14 21:29:20'),
(3, 'Natural Disaster (CATNAT)', 'Mandatory coverage by Algerian law (Ordonnance 03-12) against earthquakes, floods, storms, landslides and ground movements.', 'Property', 0.00, 1, 1, '2026-04-14 21:29:20');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
CREATE TABLE IF NOT EXISTS `properties` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int UNSIGNED NOT NULL,
  `construction_type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Individual Home | Apartment | Villa | Commercial | Industrial',
  `usage_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Personal | Professional | Mixed',
  `built_area` decimal(8,2) DEFAULT NULL COMMENT 'Surface en m²',
  `num_floors` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ground | 1 | 2 | ... | 6+',
  `year_construction` smallint UNSIGNED DEFAULT NULL,
  `declared_value` decimal(14,2) DEFAULT NULL COMMENT 'Valeur déclarée en DZD',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wilaya_id` smallint UNSIGNED DEFAULT NULL,
  `city_id` mediumint UNSIGNED DEFAULT NULL,
  `is_seismic_compliant` tinyint(1) NOT NULL DEFAULT '0',
  `has_notarial_deed` tinyint(1) NOT NULL DEFAULT '0',
  `is_commercial` tinyint(1) NOT NULL DEFAULT '0',
  `extra_coverages` json DEFAULT NULL COMMENT 'e.g. ["floods","storms","ground"]',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prop_client` (`client_id`),
  KEY `idx_prop_wilaya` (`wilaya_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `client_id`, `construction_type`, `usage_type`, `built_area`, `num_floors`, `year_construction`, `declared_value`, `address`, `wilaya_id`, `city_id`, `is_seismic_compliant`, `has_notarial_deed`, `is_commercial`, `extra_coverages`, `created_at`) VALUES
(2, 5, 'Villa', 'Residential', 200.00, NULL, 2010, 8000000.00, NULL, NULL, NULL, 1, 1, 0, '[\"floods\"]', '2026-04-16 13:17:23'),
(3, 6, 'Villa', 'Residential', 450.00, NULL, 2011, 8000000.00, NULL, NULL, NULL, 1, 1, 0, '[\"floods\"]', '2026-04-16 13:49:37'),
(4, 3, 'Villa', 'Personal', 249.00, '2', 2006, 9000000.00, 'iujkl', 7, 13, 0, 0, 0, '[]', '2026-04-16 17:32:57'),
(5, 3, 'Villa', 'Personal', 199.00, '3', 2005, 9000000.00, 'iujkl', 7, 24, 0, 0, 1, '[\"floods\", \"ground\"]', '2026-04-16 18:40:57'),
(6, 7, 'Individual Home', 'Personal', 100.00, '1', 2009, 400000.00, 'mosta', 29, 29, 0, 0, 0, '[]', '2026-04-17 00:40:17'),
(7, 10, 'Villa', 'Professional', 180.00, '6+', 2004, 20000000.00, 'bouira 280', 40, 37, 1, 1, 0, '[\"floods\", \"storms\", \"ground\"]', '2026-04-21 10:48:01'),
(8, 3, 'Apartment / Building', 'Personal', 150.00, '1', 2022, 90000000.00, 'bouira 280', 11, 27, 0, 0, 0, '[\"floods\"]', '2026-04-27 14:48:10');

-- --------------------------------------------------------

--
-- Table structure for table `quotes`
--

DROP TABLE IF EXISTS `quotes`;
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int UNSIGNED NOT NULL,
  `vehicle_id` int UNSIGNED DEFAULT NULL,
  `property_id` int UNSIGNED DEFAULT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `plan_id` int UNSIGNED DEFAULT NULL,
  `estimated_amount` decimal(12,2) NOT NULL,
  `status` enum('pending','confirmed','accepted','expired','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quote_client` (`client_id`),
  KEY `idx_quote_status` (`status`),
  KEY `fk_quote_vehicle` (`vehicle_id`),
  KEY `fk_quote_product` (`product_id`),
  KEY `fk_quote_property` (`property_id`),
  KEY `fk_quote_plan` (`plan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotes`
--

INSERT INTO `quotes` (`id`, `client_id`, `vehicle_id`, `property_id`, `product_id`, `plan_id`, `estimated_amount`, `status`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 3, 3, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-15 10:43:31', '2026-04-15 10:43:31'),
(2, 3, 4, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-15 15:26:40', '2026-04-15 15:26:40'),
(3, 3, 5, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-15 15:33:21', '2026-04-15 15:33:21'),
(4, 3, 6, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-15 19:02:54', '2026-04-15 19:02:54'),
(5, 3, 7, NULL, 2, 1, 4900.00, 'accepted', NULL, '2026-04-15 19:29:10', '2026-04-15 19:29:36'),
(6, 4, NULL, NULL, 3, NULL, 5236.00, 'pending', NULL, '2026-04-16 13:00:59', '2026-04-16 13:00:59'),
(7, 5, NULL, 2, 3, NULL, 6949.60, 'confirmed', NULL, '2026-04-16 13:17:23', '2026-04-16 13:18:21'),
(8, 6, NULL, 3, 3, NULL, 6949.60, 'pending', NULL, '2026-04-16 13:49:37', '2026-04-16 13:49:37'),
(9, 3, NULL, 4, 3, NULL, 6683.04, 'confirmed', NULL, '2026-04-16 17:32:57', '2026-04-16 17:32:58'),
(10, 3, NULL, 5, 3, NULL, 12875.80, 'accepted', NULL, '2026-04-16 18:40:57', '2026-04-16 18:41:26'),
(11, 3, 8, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-16 18:45:03', '2026-04-16 18:45:03'),
(12, 3, 9, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-16 19:14:24', '2026-04-16 19:14:24'),
(13, 3, 10, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-16 19:23:16', '2026-04-16 19:23:16'),
(14, 3, 11, NULL, 2, 1, 4900.00, 'accepted', NULL, '2026-04-16 19:38:59', '2026-04-16 19:39:26'),
(15, 7, NULL, 6, 3, NULL, 247.52, 'accepted', NULL, '2026-04-17 00:40:17', '2026-04-17 00:40:43'),
(16, 7, 12, NULL, 2, 2, 7900.00, 'confirmed', NULL, '2026-04-17 00:41:30', '2026-04-17 00:41:30'),
(17, 3, 13, NULL, 2, 3, 11500.00, 'accepted', NULL, '2026-04-17 12:07:44', '2026-04-17 12:08:10'),
(18, 10, NULL, 7, 3, NULL, 17731.00, 'accepted', NULL, '2026-04-21 10:48:01', '2026-04-21 10:48:38'),
(19, 3, NULL, 8, 3, NULL, 58072.00, 'accepted', NULL, '2026-04-27 14:48:10', '2026-04-27 14:52:09'),
(20, 12, 14, NULL, 2, 1, 4900.00, 'accepted', NULL, '2026-04-27 15:01:54', '2026-04-27 15:02:23');

-- --------------------------------------------------------

--
-- Table structure for table `roadside_requests`
--

DROP TABLE IF EXISTS `roadside_requests`;
CREATE TABLE IF NOT EXISTS `roadside_requests` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `contract_id` int UNSIGNED NOT NULL,
  `client_id` int UNSIGNED NOT NULL,
  `request_reference` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `problem_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_phone` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wilaya_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','dispatched','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roadside_request_reference` (`request_reference`),
  KEY `idx_roadside_request_contract` (`contract_id`),
  KEY `idx_roadside_request_client` (`client_id`),
  KEY `idx_roadside_request_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roadside_requests`
--

INSERT INTO `roadside_requests` (`id`, `contract_id`, `client_id`, `request_reference`, `problem_type`, `contact_phone`, `location_address`, `wilaya_code`, `city`, `description`, `status`, `created_at`, `updated_at`) VALUES
(2, 15, 3, 'RSA-REQ-20260416-5DCE1F', 'Flat Tyre', '0549025814', 'iujkl', '16', 'delly ibrahim', 'i have a flat tire', 'pending', '2026-04-16 23:39:30', '2026-04-16 23:39:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('client','expert','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `role`, `is_active`, `must_change_password`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'Ad', 'admin@test.com', '$2b$12$3eYwfKSAolqx8RIQkbqeiuibWoS7ADbm95PCDp4vSbobpCurJUJ2W', NULL, 'admin', 1, 0, '2026-04-13 12:02:30', '2026-04-13 14:58:40'),
(2, 'Client', 'User', 'client@test.com', '$2b$10$ntnCCsuDWmVDc.UmDdRX8OLFcPMrGQ6vI/p.7/RPWxsBjBBD33IYm', NULL, 'client', 1, 0, '2026-04-13 14:59:13', '2026-04-13 20:33:28'),
(3, 'Admin', 'User', 'admin@test1.com', '$2b$12$9OBt/kQSErEyk7JhhCQeAeHvMkSzbjN/d7zBWRX30/JXHayBlG8Hm', NULL, 'client', 1, 0, '2026-04-13 15:48:51', '2026-04-13 15:48:51'),
(4, 'Aida', 'Moufouki', 'aida.moufouki@gmail.com', '$2b$12$ZX27LH0k2YEhvsfxvWPzO.hS2IV5QikfSLOY6KD.WL5LqOP7/20.S', '+213549025814', 'client', 1, 0, '2026-04-14 15:05:54', '2026-04-14 15:05:54'),
(5, 'Test', 'User', 'test@test.com', '$2b$12$9m89QJFfWJLX6aYg309WnOoti7seFZJUPxS.7XUiVY90h2E.FPXvu', '0555555555', 'client', 0, 0, '2026-04-16 13:00:59', '2026-04-20 16:31:12'),
(6, 'Aida', 'Test', 'aida@test.com', '$2b$12$1WuTK6.PqhvWmr2Ach9PReqo9EUK89r.timnqKdZOLsxCAwvLxDCm', '0550000000', 'client', 1, 0, '2026-04-16 13:17:23', '2026-04-16 13:17:23'),
(7, 'Amel', 'Test', 'amel@test.com', '$2b$12$wryn3rdT1OiB4MyzGqQ4xuuYKZZjiJYHxfcHfGJ45FCkXRG4z5JVu', '0550000009', 'client', 1, 0, '2026-04-16 13:49:37', '2026-04-16 13:49:37'),
(8, 'Riham', 'MOHAMED KEBIR', 'mohamedkbirr@gmail.com', '$2b$12$wScrdX.5Ntq.TlUi4jW7gOvxvBk7SgGvi/o8L91hKFf0fm2JFfZBy', '0541775494', 'client', 1, 0, '2026-04-17 00:40:17', '2026-04-17 00:40:17'),
(9, 'Warda', 'MOUFOUKI', 'warda.moufouki@gmail.com', '$2b$12$sCDGkFJZp/zvbNdw7pMmre5pu/Mm8qkTI6.nX2XpxKEG8zbFmXR9i', '+213541775494', 'client', 1, 0, '2026-04-17 12:05:16', '2026-04-17 12:05:16'),
(10, 'Karim', 'Expert', 'expert@caar.dz', '$2b$10$CEzbSrKvO7vGcw8JTAGPD.vU4XPV60YEszlIzxm785TPV/v424h/6', '0550000001', 'expert', 1, 0, '2026-04-19 09:56:16', '2026-04-19 10:32:10'),
(12, 'Admin', 'Main', 'admin@caar.dz', '$2b$10$hash', NULL, 'admin', 1, 0, '2026-04-19 10:21:23', '2026-04-19 10:21:23'),
(14, 'Nawal', 'Messouaf', 'nawalmessouaf@expert.com', '$2b$12$CQCICTTx0DFxZTTSo9YkQ.nF9FkQYHUKzX8CYXBDDnNOmXhdw/IYq', NULL, 'expert', 1, 0, '2026-04-20 16:38:28', '2026-04-20 16:38:28'),
(15, 'Riham', 'MOHAMEDKebir', 'kebir.riham@expert.com', '$2b$12$/sfU3aOb.VOsv/AGS5fSAej2nkeWHuMcUcUSaYVmHjuYnx52EulAq', NULL, 'expert', 1, 0, '2026-04-20 19:29:51', '2026-04-20 19:33:11'),
(16, 'messouaf', 'nawal', 'nawal-2004@hotmail.com', '$2b$12$XFe50Wp2tdDbZ1vmrCmSpujqh3ZVR1HClZzqohw6dhj1yKWdZVn9W', '0795917323', 'client', 1, 0, '2026-04-21 10:42:20', '2026-04-21 10:42:20'),
(17, 'Nawal', 'MESSOUAF', 'nawalmessouaf04@outlook.fr', '$2b$12$LrES1HgjksVYwkH6mn/AuOMFOI3ctCl6xZeco2CR.MuaWOAjxXIdy', '0795917323', 'client', 1, 0, '2026-04-21 10:48:01', '2026-04-21 10:48:01'),
(18, 'MESSOUAF', 'Nawal', 'nawalmssf@exper.caar', '$2b$12$RJe8vmcH3RRXjjt6jOKE4.cqL715uHJ1bti8gRSvRwq0mwZk4wHL.', NULL, 'expert', 1, 0, '2026-04-21 10:51:18', '2026-04-21 10:53:22'),
(19, 'Ibrahim', 'Zaidi', 'zaidiibrahim@gmail.com', '$2b$12$fAq4XOgCGFna.3ld5mEGcu6J3QR2aVNITxRWAgCBP5xXzkZFUPtCO', '+213541775494', 'client', 1, 0, '2026-04-27 14:58:10', '2026-04-27 14:58:10'),
(20, 'Ibrahim', 'Zaidi', 'zaidiibrahim520@gmail.com', '$2b$12$xm4tQqHHBItruRkJu4hauecqKd2LgSEN5xfhN7myIqChm9keyyIzG', '+213541775494', 'client', 1, 0, '2026-04-27 14:59:01', '2026-04-27 14:59:01'),
(21, 'ghanou', 'ghanou', 'ghanou@gmail.com', '$2b$12$oPE5lDPanHlidyyAzL90y.mNdtJsKq49A/6/6PiEMFoS9l.BIQSo6', '+213795917323', 'client', 1, 0, '2026-05-04 14:05:09', '2026-05-04 14:05:09');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_id` int UNSIGNED NOT NULL,
  `license_plate` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` smallint NOT NULL,
  `wilaya` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Wilaya name as entered in the online form (e.g. "16 _ ALGER")',
  `wilaya_id` smallint UNSIGNED DEFAULT NULL COMMENT 'Registration wilaya',
  `color` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engine_cc` smallint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_client` (`client_id`),
  KEY `idx_license_plate` (`license_plate`),
  KEY `fk_vehicle_wilaya` (`wilaya_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `client_id`, `license_plate`, `brand`, `model`, `year`, `wilaya`, `wilaya_id`, `color`, `engine_cc`, `created_at`) VALUES
(2, 2, '123-ALG-456', 'Toyota', 'Yaris', 2020, NULL, 16, 'White', 1300, '2026-04-13 19:06:07'),
(3, 3, '12345-65702022', 'Renault', 'clio 4', 2016, '16 _ ALGER', 7, NULL, NULL, '2026-04-15 10:43:31'),
(4, 3, '12345-65702022', 'Renault', 'clio 4', 2017, '16', 7, NULL, NULL, '2026-04-15 15:26:40'),
(5, 3, '12345-65702022', 'Renault', 'clio 4', 2019, '16', 7, NULL, NULL, '2026-04-15 15:33:21'),
(6, 3, '12345-65702022', 'Renault', 'clio 4', 2020, '16', 7, NULL, NULL, '2026-04-15 19:02:54'),
(7, 3, '12345-65702022', 'Renault', 'clio 4', 2024, '16', 7, NULL, NULL, '2026-04-15 19:29:10'),
(8, 3, '12345-65702022', 'Renault', 'clio 4', 2023, '16 — Alger', 7, NULL, NULL, '2026-04-16 18:45:03'),
(9, 3, '12345-65702022', 'Renault', 'clio 4', 2024, '16 — Alger', 7, NULL, NULL, '2026-04-16 19:14:24'),
(10, 3, '12345-65702022', 'Renault', 'clio 4', 2024, '16 — Alger', 7, NULL, NULL, '2026-04-16 19:23:16'),
(11, 3, '12345-65702022', 'Renault', 'clio 4', 2024, '16 — Alger', 7, NULL, NULL, '2026-04-16 19:38:59'),
(12, 7, '12345-65702022', 'Skoda', 'clio 4', 2012, '44 — Aïn Defla', 27, NULL, NULL, '2026-04-17 00:41:30'),
(13, 3, '12345-65702022', 'Volkswagen', 'polo', 2023, '7 — Biskra', 38, NULL, NULL, '2026-04-17 12:07:44'),
(14, 12, '12345-65702022', 'Skoda', 'clio 4', 2021, '6 — Béjaïa', NULL, NULL, NULL, '2026-04-27 15:01:54');

-- --------------------------------------------------------

--
-- Table structure for table `wilayas`
--

DROP TABLE IF EXISTS `wilayas`;
CREATE TABLE IF NOT EXISTS `wilayas` (
  `id` smallint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` tinyint UNSIGNED NOT NULL COMMENT 'Official wilaya number 1-58',
  `name_fr` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'French official name',
  `name_ar` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Arabic official name',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wilaya_code` (`code`),
  UNIQUE KEY `uq_wilaya_name` (`name_fr`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wilayas`
--

INSERT INTO `wilayas` (`id`, `code`, `name_fr`, `name_ar`) VALUES
(1, 1, 'Adrar', 'أدرار'),
(2, 2, 'Chlef', 'الشلف'),
(3, 4, 'Oum El Bouaghi', 'أم البواقي'),
(4, 6, 'Béjaïa', 'بجاية'),
(5, 9, 'Blida', 'البليدة'),
(6, 15, 'Tizi Ouzou', 'تيزي وزو'),
(7, 16, 'Alger', 'الجزائر'),
(8, 18, 'Médéa', 'المدية'),
(9, 19, 'Bordj Bou Arréridj', 'الجلفة'),
(10, 20, 'Jijel', 'جيجل'),
(11, 23, 'Annaba', 'عنابة'),
(12, 24, 'Guelma', 'قالمة'),
(13, 25, 'Constantine', 'قسنطينة'),
(14, 28, 'M\'Sila', 'المسيلة'),
(16, 38, 'Tissemsilt', 'تيسمسيلت'),
(17, 40, 'Khenchela', 'خنشلة'),
(18, 41, 'Souk Ahras', 'سوق أهراس'),
(20, 21, 'Skikda', 'سكيكدة'),
(21, 27, 'Mostaganem', 'مستغانم'),
(22, 31, 'Oran', 'وهران'),
(23, 35, 'Boumerdès', 'بومرداس'),
(24, 37, 'Tindouf', 'تندوف'),
(25, 39, 'El Oued', 'الوادي'),
(26, 43, 'Mila', 'ميلة'),
(27, 44, 'Aïn Defla', 'عين الدفلى'),
(28, 45, 'Naâma', 'النعامة'),
(29, 46, 'Aïn Témouchent', 'عين تموشنت'),
(30, 47, 'Ghardaïa', 'غرداية'),
(31, 48, 'Relizane', 'غليزان'),
(32, 22, 'Sidi Bel Abbès', 'سيدي بلعباس'),
(33, 26, 'Sétif', 'سطيف'),
(34, 29, 'Mascara', 'معسكر'),
(35, 14, 'Tiaret', 'تيارت'),
(36, 3, 'Laghouat', 'الأغواط'),
(37, 5, 'Batna', 'باتنة'),
(38, 7, 'Biskra', 'بسكرة'),
(39, 8, 'Béchar', 'بشار'),
(40, 10, 'Bouira', 'البويرة'),
(41, 12, 'Tébessa', 'تبسة'),
(42, 13, 'Tlemcen', 'تلمسان'),
(43, 17, 'Djelfa', 'الجلفة'),
(44, 30, 'Ouargla', 'ورقلة'),
(45, 36, 'El Tarf', 'الطارف'),
(47, 42, 'Tipaza', 'تيبازة');

-- --------------------------------------------------------

--
-- Table structure for table `_remediation_log`
--

DROP TABLE IF EXISTS `_remediation_log`;
CREATE TABLE IF NOT EXISTS `_remediation_log` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `part` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_value` text COLLATE utf8mb4_unicode_ci,
  `new_value` text COLLATE utf8mb4_unicode_ci,
  `note` text COLLATE utf8mb4_unicode_ci,
  `fixed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_remediation_log`
--

INSERT INTO `_remediation_log` (`id`, `part`, `issue_code`, `table_name`, `record_id`, `field`, `old_value`, `new_value`, `note`, `fixed_at`) VALUES
(1, 'PART-2', 'ISSUE-21', 'users', '3', 'role', 'client', 'client (FLAGGED)', 'User id=3 has name=Admin User but role=client. No client profile exists. Flagged for manual review — do NOT assume admin without business confirmation.', '2026-04-20 14:42:57'),
(2, 'PART-3', 'ISSUE-17', 'clients', NULL, 'FK', 'fk_clients_user', 'DROPPED', 'Redundant duplicate of fk_client_user on clients.user_id', '2026-04-20 14:44:57'),
(3, 'PART-3', 'ISSUE-17', 'experts', NULL, 'FK', 'fk_experts_user', 'DROPPED', 'Redundant duplicate of fk_expert_user on experts.user_id', '2026-04-20 14:45:24'),
(4, 'PART-3', 'ISSUE-18', 'experts', NULL, 'INDEX', 'unique_user_expert', 'DROPPED', 'Redundant duplicate of uq_expert_user UNIQUE index on experts.user_id', '2026-04-20 14:45:24'),
(5, 'PART-4', 'ISSUE-09', 'claims', '6', 'status', 'reported', 'expert_assigned', 'No expert_report exists for claim_id=6. Status rolled back to expert_assigned. Expert (id=1) must now submit a report before re-advancing to reported.', '2026-04-20 14:46:01'),
(6, 'PART-4', 'ISSUE-07', 'claims', NULL, 'status ENUM', 'pending/under_review/expert_assigned/reported/approved/rejected', '+ closed added', 'Value \"closed\" exists in the claims.status ENUM. No data currently uses it. Retained — document this in the API layer.', '2026-04-20 14:46:27'),
(7, 'PART-5', 'INFO', 'experts', '1', 'is_available', '0', '0 (no change)', 'Expert id=1 is marked NOT available (is_available=0). All active claims are still assigned to this expert. Admin should either: (a) make available again once workload clears, or (b) reassign open claims before setting a new expert.', '2026-04-20 14:47:50'),
(8, 'PART-6', 'ISSUE-21', 'users', '3', 'client_profile', 'MISSING', 'FLAGGED', 'User id=3 (admin@test1.com, role=client) has no client profile, no contracts, no claims. Likely abandoned test account. Recommended: deactivate with UPDATE users SET is_active=0 WHERE id=3 after confirming with stakeholders.', '2026-04-20 14:48:14'),
(9, 'PART-7', 'ISSUE-16', 'contracts', '8', 'status', 'active', 'suspended', 'Roadside Assistance contract id=8 has no vehicle_id. Claims #6 and #8 reference it. Status set to suspended pending vehicle data correction by the client or admin.', '2026-04-20 14:48:29'),
(10, 'PART-7', 'ISSUE-19', 'expert_reports', '3', 'report_date', '2023-04-15', '2026-04-19', 'report_date was 3 years in the past. Corrected to match created_at date.', '2026-04-20 14:49:08'),
(11, 'PART-7', 'ISSUE-23', 'vehicles', '3,4,5,6,7,8,9,10,11', 'wilaya_id', 'NULL', '7 (Alger, code=16)', 'Vehicles belonging to client_id=3 had wilaya text \"16...\" but NULL wilaya_id. Resolved to wilayas.id=7 (Alger, code=16).', '2026-04-20 14:49:50'),
(12, 'PART-7', 'ISSUE-23', 'vehicles', '13', 'wilaya_id', 'NULL', '38 (Biskra, code=7)', 'Vehicle id=13 wilaya text \"7 — Biskra\" → wilayas.id=38 (Biskra, code=7).', '2026-04-20 14:49:50'),
(13, 'PART-7', 'ISSUE-23', 'vehicles', '12', 'wilaya_id', 'NULL', '27 (Aïn Defla, code=44)', 'Vehicle id=12 wilaya text \"44 — Aïn Defla\" → wilayas.id=27 (Aïn Defla, code=44).', '2026-04-20 14:49:50'),
(14, 'PART-8', 'ISSUE-20', 'vehicles', '3,4,5,6,7,8,9,10,11', 'license_plate', '12345-65702022 (all 9 rows)', 'FLAGGED', 'Client_id=3 has 9 vehicles sharing the same license plate. This is test data. Vehicles 3,4,5,6 have no active contracts. Admin should correct real plate numbers. Vehicles referenced by active contracts: 7 (contract 7), 11 (contract 15), 13 (contract 17).', '2026-04-20 14:51:27'),
(15, 'PART-8', 'NULL-METHOD', 'payments', '3,4,8,9,10', 'method', 'NULL', 'FLAGGED', 'Payments id 3,4,8,9,10 have method=NULL. Online payments should record method=\'card\' or \'dahabia\'. Update via: UPDATE payments SET method=\'card\' WHERE id IN (3,4,8,9,10) after confirming the payment gateway used.', '2026-04-20 14:51:55'),
(16, 'PART-8', 'NULL-EVENT_TYPE', 'notifications', 'ALL', 'event_type', 'NULL', 'Backfilled from type+title heuristics', 'event_type was NULL for all rows. Backfilled using type column and title pattern. Remaining NULLs (quote events) left as NULL — add \'quote_created\'/\'quote_confirmed\' to the ENUM and backfill separately if needed.', '2026-04-20 14:58:10'),
(17, 'PART-8', 'NULL-EVENT_TYPE', 'notifications', 'ALL', 'event_type', 'NULL', 'Backfilled from type+title heuristics', 'event_type was NULL for all rows. Backfilled using type column and title pattern. Remaining NULLs (quote events) left as NULL — add \'quote_created\'/\'quote_confirmed\' to the ENUM and backfill separately if needed.', '2026-04-20 15:02:55'),
(18, 'PART-9', 'CONSTRAINT', 'claims', NULL, 'CHECK', 'none', 'chk_expert_assigned_has_expert added', 'Prevents setting status=expert_assigned without an expert_id', '2026-04-20 15:07:06'),
(19, 'PART-9', 'CONSTRAINT', 'experts', NULL, 'CHECK', 'none', 'chk_is_available_bool added', 'Enforces boolean 0/1 for is_available', '2026-04-20 15:08:57'),
(20, 'PART-9', 'CONSTRAINT', 'contracts', NULL, 'CHECK', 'none', 'chk_contract_dates added', 'start_date must be before end_date', '2026-04-20 15:10:11'),
(21, 'PART-9', 'CONSTRAINT', 'audit_logs', NULL, 'FK', 'none', 'fk_audit_user added (ON DELETE SET NULL)', 'Audit history is preserved even if user is deleted', '2026-04-20 15:12:13');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agencies`
--
ALTER TABLE `agencies`
  ADD CONSTRAINT `fk_agency_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_agency_wilaya` FOREIGN KEY (`wilaya_id`) REFERENCES `wilayas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `cities`
--
ALTER TABLE `cities`
  ADD CONSTRAINT `fk_city_wilaya` FOREIGN KEY (`wilaya_id`) REFERENCES `wilayas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `claims`
--
ALTER TABLE `claims`
  ADD CONSTRAINT `fk_claim_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_claim_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_claim_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_claim_expert` FOREIGN KEY (`expert_id`) REFERENCES `experts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_claim_wilaya` FOREIGN KEY (`incident_wilaya_id`) REFERENCES `wilayas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_client_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_wilaya` FOREIGN KEY (`wilaya_id`) REFERENCES `wilayas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD CONSTRAINT `fk_msg_sender_user` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `fk_contract_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_contract_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_contract_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_contract_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_contract_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_contract_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `fk_doc_claim` FOREIGN KEY (`claim_id`) REFERENCES `claims` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_doc_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_doc_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `experts`
--
ALTER TABLE `experts`
  ADD CONSTRAINT `fk_expert_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expert_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expert_wilaya` FOREIGN KEY (`wilaya_id`) REFERENCES `wilayas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expert_reports`
--
ALTER TABLE `expert_reports`
  ADD CONSTRAINT `fk_report_claim` FOREIGN KEY (`claim_id`) REFERENCES `claims` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_expert` FOREIGN KEY (`expert_id`) REFERENCES `experts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_user_v2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `plans`
--
ALTER TABLE `plans`
  ADD CONSTRAINT `fk_plan_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `fk_property_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `quotes`
--
ALTER TABLE `quotes`
  ADD CONSTRAINT `fk_quote_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quote_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quote_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quote_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quote_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `roadside_requests`
--
ALTER TABLE `roadside_requests`
  ADD CONSTRAINT `fk_roadside_request_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_roadside_request_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicle_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_vehicle_wilaya` FOREIGN KEY (`wilaya_id`) REFERENCES `wilayas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
