CREATE TABLE `campuskart_db`.`users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `usiu_email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `usiu_email_UNIQUE` (`usiu_email` ASC) VISIBLE);
  
  ALTER TABLE `campuskart_db`.`users` 
ADD COLUMN `verification_token` VARCHAR(255) NULL,
ADD COLUMN `verification_token_expires` DATETIME NULL;

