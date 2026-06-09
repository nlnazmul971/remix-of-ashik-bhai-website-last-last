-- ============================================================
-- MySQL Schema (converted from PostgreSQL/Supabase schema)
-- Generated: 2026-06-09T19:23:59Z
-- Engine: InnoDB, Charset: utf8mb4
-- NOTE: MySQL has no Row-Level Security (RLS). Access control
--       must be enforced in your application layer.
-- NOTE: Auth/users are managed by Supabase Auth in the original.
--       For MySQL, you need your own `users` table (template below).
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Optional: a users table to replace Supabase auth.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL,
  `phone` VARCHAR(32) NULL,
  `email_verified_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: action_logs
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `action_logs`;
CREATE TABLE `action_logs` (
  `id` CHAR(36) NOT NULL,
  `actor_id` CHAR(36) NULL,
  `actor_email` TEXT NULL,
  `actor_role` TEXT NULL,
  `entity_type` TEXT NOT NULL,
  `entity_id` TEXT NULL,
  `action` TEXT NOT NULL,
  `summary` TEXT NULL,
  `details` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: approval_requests
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `approval_requests`;
CREATE TABLE `approval_requests` (
  `id` CHAR(36) NOT NULL,
  `requested_by` CHAR(36) NULL,
  `requester_email` TEXT NULL,
  `entity_type` TEXT NOT NULL,
  `entity_id` TEXT NULL,
  `action` TEXT NOT NULL,
  `payload` JSON NULL,
  `reason` TEXT NULL,
  `status` TEXT NOT NULL DEFAULT 'pending',
  `reviewed_by` CHAR(36) NULL,
  `reviewer_note` TEXT NULL,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: blog_authors
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `blog_authors`;
CREATE TABLE `blog_authors` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `bio` TEXT NULL DEFAULT '',
  `avatar_url` TEXT NULL DEFAULT '',
  `social` JSON NOT NULL DEFAULT ('{}'),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_blog_authors_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: blog_categories
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `blog_categories`;
CREATE TABLE `blog_categories` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `description` TEXT NULL DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_blog_categories_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: blog_comments
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `blog_comments`;
CREATE TABLE `blog_comments` (
  `id` CHAR(36) NOT NULL,
  `blog_id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `email` TEXT NULL,
  `comment` TEXT NOT NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: blog_tags
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `blog_tags`;
CREATE TABLE `blog_tags` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_blog_tags_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: blogs
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `blogs`;
CREATE TABLE `blogs` (
  `id` CHAR(36) NOT NULL,
  `title` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `excerpt` TEXT NULL DEFAULT '',
  `content` TEXT NOT NULL DEFAULT '',
  `cover_image` TEXT NULL DEFAULT '',
  `category_id` CHAR(36) NULL,
  `author_id` CHAR(36) NULL,
  `tags` TEXT NOT NULL DEFAULT '{}',
  `status` TEXT NOT NULL DEFAULT 'draft',
  `published_at` TIMESTAMP NULL,
  `reading_time` INT NOT NULL DEFAULT 0,
  `view_count` INT NOT NULL DEFAULT 0,
  `seo_title` TEXT NULL,
  `seo_description` TEXT NULL,
  `seo_keywords` TEXT NULL,
  `seo_canonical` TEXT NULL,
  `seo_og_image` TEXT NULL,
  `seo_focus_keyword` TEXT NULL,
  `seo_no_index` TINYINT(1) NOT NULL DEFAULT 0,
  `seo_schema` JSON NULL,
  `faq` JSON NOT NULL DEFAULT ('[]'),
  `related_post_ids` TEXT NOT NULL DEFAULT '{}',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_blogs_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: checkout_payment_settings
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `checkout_payment_settings`;
CREATE TABLE `checkout_payment_settings` (
  `id` CHAR(36) NOT NULL,
  `provider` TEXT NOT NULL,
  `number` TEXT NOT NULL DEFAULT '',
  `instructions` TEXT NOT NULL DEFAULT '',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_checkout_payment_settings_0` (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: coupons
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL DEFAULT '',
  `code` TEXT NOT NULL,
  `discount_type` TEXT NOT NULL DEFAULT 'fixed',
  `discount_value` INT NOT NULL DEFAULT 0,
  `min_order_amount` INT NOT NULL DEFAULT 0,
  `max_uses` INT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_coupons_0` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: custom_pages
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `custom_pages`;
CREATE TABLE `custom_pages` (
  `id` CHAR(36) NOT NULL,
  `slug` TEXT NOT NULL,
  `title` TEXT NOT NULL DEFAULT '',
  `banner_url` TEXT NOT NULL DEFAULT '',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `product_ids` TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_custom_pages_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: delivery_zones
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `delivery_zones`;
CREATE TABLE `delivery_zones` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `fee` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: fraud_checks
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `fraud_checks`;
CREATE TABLE `fraud_checks` (
  `id` CHAR(36) NOT NULL,
  `phone` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'Unknown',
  `score` INT NOT NULL DEFAULT 0,
  `total_parcel` INT NOT NULL DEFAULT 0,
  `success_parcel` INT NOT NULL DEFAULT 0,
  `cancel_parcel` INT NOT NULL DEFAULT 0,
  `response` JSON NOT NULL DEFAULT ('{}'),
  `source` TEXT NOT NULL DEFAULT 'LIVE',
  `checked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fraud_checks_0` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: header_categories
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `header_categories`;
CREATE TABLE `header_categories` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_header_categories_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: landing_page_analytics
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `landing_page_analytics`;
CREATE TABLE `landing_page_analytics` (
  `id` CHAR(36) NOT NULL,
  `landing_page_id` CHAR(36) NOT NULL,
  `event_type` TEXT NOT NULL,
  `metadata` JSON NOT NULL DEFAULT ('{}'),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: landing_pages
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `landing_pages`;
CREATE TABLE `landing_pages` (
  `id` CHAR(36) NOT NULL,
  `slug` TEXT NOT NULL,
  `title` TEXT NOT NULL,
  `description` TEXT NULL DEFAULT '',
  `blocks` JSON NOT NULL DEFAULT ('[]'),
  `status` TEXT NOT NULL DEFAULT 'draft',
  `published_at` TIMESTAMP NULL,
  `seo_title` TEXT NULL,
  `seo_description` TEXT NULL,
  `seo_keywords` TEXT NULL,
  `seo_focus_keyword` TEXT NULL,
  `seo_og_image` TEXT NULL,
  `seo_canonical` TEXT NULL,
  `seo_no_index` TINYINT(1) NOT NULL DEFAULT 0,
  `seo_schema` JSON NULL,
  `view_count` INT NOT NULL DEFAULT 0,
  `conversion_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `custom_domain` TEXT NULL,
  `custom_path` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_landing_pages_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: newsletter_subscribers
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `newsletter_subscribers`;
CREATE TABLE `newsletter_subscribers` (
  `id` CHAR(36) NOT NULL,
  `email` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_newsletter_subscribers_0` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: orders
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `items` JSON NOT NULL,
  `total` INT NOT NULL,
  `customer_name` TEXT NOT NULL,
  `customer_phone` TEXT NOT NULL,
  `customer_address` TEXT NOT NULL,
  `customer_city` TEXT NOT NULL,
  `delivery_method` TEXT NOT NULL DEFAULT 'standard',
  `payment_method` TEXT NOT NULL DEFAULT 'cod',
  `status` TEXT NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `consignment_id` TEXT NULL,
  `tracking_code` TEXT NULL,
  `courier_provider` TEXT NULL,
  `transaction_id` TEXT NULL,
  `payment_sender_number` TEXT NULL,
  `customer_note` TEXT NULL,
  `deleted_at` TIMESTAMP NULL,
  `order_token` TEXT NULL,
  `customer_email` TEXT NULL,
  `discount` INT NOT NULL DEFAULT 0,
  `delivery_charge` INT NOT NULL DEFAULT 0,
  `courier_fee` INT NOT NULL DEFAULT 0,
  `source` TEXT NOT NULL DEFAULT 'website',
  `advance_payment` INT NOT NULL DEFAULT 0,
  `call_attempts` INT NOT NULL DEFAULT 0,
  `admin_notes` TEXT NULL,
  `return_received` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_0` (`order_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: packaging_options
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `packaging_options`;
CREATE TABLE `packaging_options` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `fee` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: product_images
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `product_images`;
CREATE TABLE `product_images` (
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `image_url` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: product_size_stock
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `product_size_stock`;
CREATE TABLE `product_size_stock` (
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `size` TEXT NOT NULL,
  `total_stock` INT NOT NULL DEFAULT 0,
  `sold_count` INT NOT NULL DEFAULT 0,
  `cancelled_count` INT NOT NULL DEFAULT 0,
  `returned_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_size_stock_0` (`product_id`, `size`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: products
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `price` INT NOT NULL,
  `original_price` INT NULL,
  `image_url` TEXT NOT NULL DEFAULT '',
  `category` TEXT NOT NULL,
  `description` TEXT NOT NULL DEFAULT '',
  `sizes` TEXT NOT NULL,
  `colors` JSON NOT NULL DEFAULT ('[]'),
  `stock` INT NOT NULL DEFAULT 0,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `brand` TEXT NOT NULL DEFAULT '',
  `sku` TEXT NOT NULL DEFAULT '',
  `size_chart` JSON NULL DEFAULT ('[]'),
  `subcategory` TEXT NULL,
  `is_new_drop` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `seo_title` TEXT NULL,
  `seo_description` TEXT NULL,
  `seo_keywords` TEXT NULL,
  `seo_slug` TEXT NULL,
  `seo_canonical` TEXT NULL,
  `seo_og_image` TEXT NULL,
  `seo_focus_keyword` TEXT NULL,
  `seo_no_index` TINYINT(1) NOT NULL DEFAULT 0,
  `seo_faq` JSON NOT NULL DEFAULT ('[]'),
  `seo_schema` JSON NULL,
  `homepage_placements` TEXT NOT NULL DEFAULT '{}',
  `is_new_arrival` TINYINT(1) NOT NULL DEFAULT 0,
  `is_trending` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: profiles
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `display_name` TEXT NULL,
  `phone` TEXT NULL,
  `address` TEXT NULL,
  `city` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profiles_0` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: pseo_pages
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `pseo_pages`;
CREATE TABLE `pseo_pages` (
  `id` CHAR(36) NOT NULL,
  `template_id` CHAR(36) NULL,
  `slug` TEXT NOT NULL,
  `title` TEXT NOT NULL DEFAULT '',
  `description` TEXT NOT NULL DEFAULT '',
  `h1` TEXT NOT NULL DEFAULT '',
  `content` TEXT NOT NULL DEFAULT '',
  `variables` JSON NOT NULL DEFAULT ('{}'),
  `seo_keywords` TEXT NULL DEFAULT '',
  `seo_og_image` TEXT NULL,
  `seo_schema` JSON NULL,
  `status` TEXT NOT NULL DEFAULT 'published',
  `view_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pseo_pages_0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: pseo_templates
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `pseo_templates`;
CREATE TABLE `pseo_templates` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `url_pattern` TEXT NOT NULL,
  `title_template` TEXT NOT NULL DEFAULT '',
  `description_template` TEXT NOT NULL DEFAULT '',
  `h1_template` TEXT NOT NULL DEFAULT '',
  `content_template` TEXT NOT NULL DEFAULT '',
  `variables` JSON NOT NULL DEFAULT ('[]'),
  `seo_keywords_template` TEXT NULL DEFAULT '',
  `schema_template` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: redirects
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `redirects`;
CREATE TABLE `redirects` (
  `id` CHAR(36) NOT NULL,
  `from_path` TEXT NOT NULL,
  `to_path` TEXT NOT NULL,
  `status_code` INT NOT NULL DEFAULT 301,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `hit_count` INT NOT NULL DEFAULT 0,
  `last_hit_at` TIMESTAMP NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_redirects_0` (`from_path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: reviews
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `name` TEXT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NOT NULL DEFAULT '',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: stock_logs
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `stock_logs`;
CREATE TABLE `stock_logs` (
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `size` TEXT NOT NULL,
  `change_type` TEXT NOT NULL DEFAULT 'manual',
  `quantity` INT NOT NULL DEFAULT 0,
  `order_id` CHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: store_settings
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `store_settings`;
CREATE TABLE `store_settings` (
  `id` CHAR(36) NOT NULL,
  `key` TEXT NOT NULL,
  `value` TEXT NOT NULL DEFAULT '',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_store_settings_0` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: subcategories
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `subcategories`;
CREATE TABLE `subcategories` (
  `id` CHAR(36) NOT NULL,
  `parent_category` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `slug` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: tracking_settings
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `tracking_settings`;
CREATE TABLE `tracking_settings` (
  `id` CHAR(36) NOT NULL,
  `key` TEXT NOT NULL,
  `value` TEXT NOT NULL DEFAULT '',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tracking_settings_0` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: trash_users
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `trash_users`;
CREATE TABLE `trash_users` (
  `id` CHAR(36) NOT NULL,
  `original_user_id` CHAR(36) NOT NULL,
  `email` TEXT NULL,
  `display_name` TEXT NULL,
  `phone` TEXT NULL,
  `city` TEXT NULL,
  `address` TEXT NULL,
  `role` TEXT NULL DEFAULT 'user',
  `deleted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: user_roles
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `role` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_roles_0` (`user_id`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: wishlist_items
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `wishlist_items`;
CREATE TABLE `wishlist_items` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlist_items_0` (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- End of schema
-- Reminders:
--   * Generate UUIDs in your app (e.g., uuid v4) or use UUID() on insert.
--   * Use MySQL 8.0+ (required for JSON defaults and CHECK constraints).
--   * Add foreign keys manually if you want referential integrity.
--   * Implement role/permission checks in application code.
-- ============================================================