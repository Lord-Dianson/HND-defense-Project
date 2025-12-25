-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 22, 2025 at 01:11 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS HosteLink;
USE HosteLink;

-- ----------------------------
-- Table: Users
-- ----------------------------
CREATE TABLE IF NOT EXISTS `Users` (
  `ID` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','agent','admin') NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `profile` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: Landlord
-- ----------------------------
CREATE TABLE IF NOT EXISTS `Landlord` (
  `landlordID` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`landlordID`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: Hostel
-- ----------------------------
CREATE TABLE IF NOT EXISTS `Hostel` (
  `hostelID` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `location` varchar(255) NOT NULL,
  `capacity` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `facilities` text DEFAULT NULL,
  `status` enum('available','full','maintenance') DEFAULT 'available',
  `agentID` char(36) DEFAULT NULL,
  `landLordID` char(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`hostelID`),
  KEY `agentID` (`agentID`),
  KEY `landLordID` (`landLordID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: Payment
-- ----------------------------
CREATE TABLE IF NOT EXISTS `Payment` (
  `paymentID` char(36) NOT NULL,
  `studentID` char(36) NOT NULL,
  `hostelID` char(36) NOT NULL,
  `landlordID` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `reference` varchar(100) DEFAULT NULL,
  `paidAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`paymentID`),
  UNIQUE KEY `reference` (`reference`),
  KEY `studentID` (`studentID`),
  KEY `hostelID` (`hostelID`),
  KEY `landlordID` (`landlordID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table: Booking
-- ----------------------------
CREATE TABLE IF NOT EXISTS `Booking` (
  `bookingID` char(36) NOT NULL,
  `studentID` char(36) NOT NULL,
  `hostelID` char(36) NOT NULL,
  `landlordID` char(36) NOT NULL,
  `paymentID` char(36) DEFAULT NULL,
  `agentID` char(36) DEFAULT NULL,
  `checkIn` date NOT NULL,
  `checkOut` date NOT NULL,
  `receipt` varchar(50) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`bookingID`),
  UNIQUE KEY `receipt` (`receipt`),
  KEY `studentID` (`studentID`),
  KEY `hostelID` (`hostelID`),
  KEY `landlordID` (`landlordID`),
  KEY `paymentID` (`paymentID`),
  KEY `agentID` (`agentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Foreign Key Constraints
-- ----------------------------
ALTER TABLE `Booking`
  ADD CONSTRAINT `fk_booking_student` FOREIGN KEY (`studentID`) REFERENCES `Users` (`ID`),
  ADD CONSTRAINT `fk_booking_agent` FOREIGN KEY (`agentID`) REFERENCES `Users` (`ID`),
  ADD CONSTRAINT `fk_booking_hostel` FOREIGN KEY (`hostelID`) REFERENCES `Hostel` (`hostelID`),
  ADD CONSTRAINT `fk_booking_landlord` FOREIGN KEY (`landlordID`) REFERENCES `Landlord` (`landlordID`),
  ADD CONSTRAINT `fk_booking_payment` FOREIGN KEY (`paymentID`) REFERENCES `Payment` (`paymentID`);

ALTER TABLE `Hostel`
  ADD CONSTRAINT `fk_hostel_agent` FOREIGN KEY (`agentID`) REFERENCES `Users` (`ID`),
  ADD CONSTRAINT `fk_hostel_landlord` FOREIGN KEY (`landLordID`) REFERENCES `Landlord` (`landlordID`);

ALTER TABLE `Payment`
  ADD CONSTRAINT `fk_payment_student` FOREIGN KEY (`studentID`) REFERENCES `Users` (`ID`),
  ADD CONSTRAINT `fk_payment_hostel` FOREIGN KEY (`hostelID`) REFERENCES `Hostel` (`hostelID`),
  ADD CONSTRAINT `fk_payment_landlord` FOREIGN KEY (`landlordID`) REFERENCES `Landlord` (`landlordID`);

COMMIT;
