CREATE TABLE `campuskart_db`.`items` (
  `item_id` INT NOT NULL AUTO_INCREMENT,
  `seller_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `listing_status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `image_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  INDEX `fk_items_users_idx` (`seller_id` ASC) VISIBLE,
  CONSTRAINT `fk_items_users`
    FOREIGN KEY (`seller_id`)
    REFERENCES `campuskart_db`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);