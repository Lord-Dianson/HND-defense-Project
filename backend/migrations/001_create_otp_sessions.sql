CREATE TABLE IF NOT EXISTS `OtpSessions` (
  `id` varchar(36) PRIMARY KEY,
  `jti` varchar(36) NOT NULL UNIQUE,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'student',
  `profile` varchar(512) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  KEY `jti_index` (`jti`),
  KEY `expires_at_index` (`expires_at`)
);
