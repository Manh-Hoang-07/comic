-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `password` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `image` VARCHAR(255) NULL,
    `googleId` VARCHAR(255) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `email_verified_at` TIMESTAMP(0) NULL,
    `phone_verified_at` TIMESTAMP(0) NULL,
    `last_login_at` TIMESTAMP(0) NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_googleId_key`(`googleId`),
    INDEX `users_idx_status`(`status`),
    INDEX `users_idx_created_at`(`created_at`),
    INDEX `users_idx_status_created`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `birthday` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `country_id` BIGINT NULL,
    `province_id` BIGINT NULL,
    `ward_id` BIGINT NULL,
    `about` TEXT NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `profiles_user_id_key`(`user_id`),
    INDEX `profiles_idx_province_id`(`province_id`),
    INDEX `profiles_idx_country_id`(`country_id`),
    INDEX `profiles_idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contexts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `ref_id` BIGINT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `contexts_code_key`(`code`),
    UNIQUE INDEX `contexts_idx_contexts_type_ref_id`(`type`, `ref_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `owner_id` BIGINT NULL,
    `context_id` BIGINT NOT NULL,
    `metadata` JSON NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `groups_code_key`(`code`),
    INDEX `groups_IDX_groups_context_id`(`context_id`),
    UNIQUE INDEX `groups_idx_groups_type_code`(`type`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_groups` (
    `user_id` BIGINT NOT NULL,
    `group_id` BIGINT NOT NULL,
    `joined_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_groups_idx_user_groups_user_id`(`user_id`),
    INDEX `user_groups_idx_user_groups_user_joined_at`(`user_id`, `joined_at`),
    INDEX `user_groups_idx_user_groups_group_id`(`group_id`),
    INDEX `user_groups_idx_group_user`(`group_id`, `user_id`),
    PRIMARY KEY (`user_id`, `group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(120) NOT NULL,
    `scope` VARCHAR(30) NOT NULL DEFAULT 'context',
    `name` VARCHAR(150) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `parent_id` BIGINT NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_idx_scope`(`scope`),
    INDEX `permissions_idx_permissions_parent_id`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `parent_id` BIGINT NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_has_permissions` (
    `role_id` BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,

    INDEX `role_has_permissions_idx_role_has_permissions_role_id`(`role_id`),
    INDEX `role_has_permissions_idx_role_has_permissions_permission_id`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_contexts` (
    `role_id` BIGINT NOT NULL,
    `context_id` BIGINT NOT NULL,

    INDEX `role_contexts_idx_role_contexts_role_id`(`role_id`),
    INDEX `role_contexts_idx_role_contexts_context_id`(`context_id`),
    PRIMARY KEY (`role_id`, `context_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_role_assignments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    `group_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_role_assignments_idx_user_group`(`user_id`, `group_id`),
    INDEX `user_role_assignments_idx_user_role_assignments_group_id`(`group_id`),
    INDEX `user_role_assignments_idx_user_role_assignments_role_id`(`role_id`),
    UNIQUE INDEX `user_role_assignments_idx_user_role_group_unique`(`user_id`, `role_id`, `group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `general_configs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `site_name` VARCHAR(255) NOT NULL,
    `site_description` TEXT NULL,
    `site_logo` VARCHAR(500) NULL,
    `site_favicon` VARCHAR(500) NULL,
    `site_email` VARCHAR(255) NULL,
    `site_phone` VARCHAR(20) NULL,
    `site_address` TEXT NULL,
    `site_country_id` BIGINT NULL,
    `site_province_id` BIGINT NULL,
    `site_ward_id` BIGINT NULL,
    `site_copyright` VARCHAR(255) NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    `locale` VARCHAR(10) NOT NULL DEFAULT 'vi',
    `currency` VARCHAR(10) NOT NULL DEFAULT 'VND',
    `contact_channels` JSON NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_keywords` TEXT NULL,
    `og_title` VARCHAR(255) NULL,
    `og_description` TEXT NULL,
    `og_image` VARCHAR(500) NULL,
    `canonical_url` VARCHAR(500) NULL,
    `google_analytics_id` VARCHAR(50) NULL,
    `google_search_console` VARCHAR(255) NULL,
    `facebook_pixel_id` VARCHAR(50) NULL,
    `twitter_site` VARCHAR(50) NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_configs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `smtp_host` VARCHAR(255) NOT NULL,
    `smtp_port` INTEGER NOT NULL DEFAULT 587,
    `smtp_secure` BOOLEAN NOT NULL DEFAULT true,
    `smtp_username` VARCHAR(255) NOT NULL,
    `smtp_password` VARCHAR(500) NOT NULL,
    `from_email` VARCHAR(255) NOT NULL,
    `from_name` VARCHAR(255) NOT NULL,
    `reply_to_email` VARCHAR(255) NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(120) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `path` VARCHAR(255) NULL,
    `api_path` VARCHAR(255) NULL,
    `icon` VARCHAR(120) NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'route',
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `parent_id` BIGINT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `show_in_menu` BOOLEAN NOT NULL DEFAULT true,
    `group` VARCHAR(50) NOT NULL DEFAULT 'admin',
    `required_permission_id` BIGINT NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `menus_code_key`(`code`),
    INDEX `menus_idx_code`(`code`),
    INDEX `menus_idx_parent_id`(`parent_id`),
    INDEX `menus_idx_required_permission_id`(`required_permission_id`),
    INDEX `menus_idx_status_show_in_menu`(`status`, `show_in_menu`),
    INDEX `menus_idx_group`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_permissions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `menu_id` BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,

    INDEX `menu_permissions_idx_menu_id`(`menu_id`),
    INDEX `menu_permissions_idx_permission_id`(`permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banner_locations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `banner_locations_code_key`(`code`),
    INDEX `banner_locations_idx_banner_locations_code`(`code`),
    INDEX `banner_locations_idx_banner_locations_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `image` VARCHAR(500) NOT NULL,
    `mobile_image` VARCHAR(500) NULL,
    `link` VARCHAR(500) NULL,
    `link_target` VARCHAR(20) NOT NULL DEFAULT '_self',
    `description` TEXT NULL,
    `button_text` VARCHAR(100) NULL,
    `button_color` VARCHAR(20) NULL,
    `text_color` VARCHAR(20) NULL,
    `location_id` BIGINT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `start_date` TIMESTAMP(0) NULL,
    `end_date` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `banners_idx_banners_title`(`title`),
    INDEX `banners_idx_banners_location_id`(`location_id`),
    INDEX `banners_idx_banners_status`(`status`),
    INDEX `banners_idx_banners_sort_order`(`sort_order`),
    INDEX `banners_idx_banners_start_date`(`start_date`),
    INDEX `banners_idx_banners_end_date`(`end_date`),
    INDEX `banners_idx_banners_status_sort`(`status`, `sort_order`),
    INDEX `banners_idx_banners_location_status`(`location_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'info',
    `data` JSON NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` TIMESTAMP(0) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `notifications_idx_notifications_user_id`(`user_id`),
    INDEX `notifications_idx_notifications_status`(`status`),
    INDEX `notifications_idx_notifications_type`(`type`),
    INDEX `notifications_idx_notifications_read`(`is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postcategory` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `parent_id` BIGINT NULL,
    `image` VARCHAR(255) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `canonical_url` VARCHAR(255) NULL,
    `og_image` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `postcategory_slug_key`(`slug`),
    INDEX `postcategory_idx_name`(`name`),
    INDEX `postcategory_idx_slug`(`slug`),
    INDEX `postcategory_idx_parent_id`(`parent_id`),
    INDEX `postcategory_idx_status`(`status`),
    INDEX `postcategory_idx_sort_order`(`sort_order`),
    INDEX `postcategory_idx_created_at`(`created_at`),
    INDEX `postcategory_idx_status_sort_order`(`status`, `sort_order`),
    INDEX `postcategory_idx_parent_status`(`parent_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posttag` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `canonical_url` VARCHAR(255) NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `posttag_slug_key`(`slug`),
    INDEX `posttag_idx_name`(`name`),
    INDEX `posttag_idx_slug`(`slug`),
    INDEX `posttag_idx_status`(`status`),
    INDEX `posttag_idx_created_at`(`created_at`),
    INDEX `posttag_idx_status_created_at`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `image` VARCHAR(255) NULL,
    `cover_image` VARCHAR(255) NULL,
    `primary_postcategory_id` BIGINT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
    `post_type` VARCHAR(30) NOT NULL DEFAULT 'text',
    `video_url` VARCHAR(500) NULL,
    `audio_url` VARCHAR(500) NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `published_at` TIMESTAMP(0) NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `canonical_url` VARCHAR(255) NULL,
    `og_title` VARCHAR(255) NULL,
    `og_description` TEXT NULL,
    `og_image` VARCHAR(255) NULL,
    `group_id` BIGINT NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `posts_idx_name`(`name`),
    INDEX `posts_idx_slug`(`slug`),
    INDEX `posts_idx_primary_postcategory_id`(`primary_postcategory_id`),
    INDEX `posts_idx_status`(`status`),
    INDEX `posts_idx_post_type`(`post_type`),
    INDEX `posts_idx_is_featured`(`is_featured`),
    INDEX `posts_idx_is_pinned`(`is_pinned`),
    INDEX `posts_idx_published_at`(`published_at`),
    INDEX `posts_idx_created_at`(`created_at`),
    INDEX `posts_idx_status_published_at`(`status`, `published_at`),
    INDEX `posts_idx_is_featured_status`(`is_featured`, `status`),
    INDEX `posts_idx_primary_category_status`(`primary_postcategory_id`, `status`),
    INDEX `posts_idx_posts_group_id`(`group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_stats` (
    `post_id` BIGINT NOT NULL,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `post_stats_idx_view_count`(`view_count`),
    INDEX `post_stats_idx_updated_at`(`updated_at`),
    PRIMARY KEY (`post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_daily_stats` (
    `post_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `post_daily_stats_idx_stat_date`(`stat_date`),
    INDEX `post_daily_stats_idx_view_count`(`view_count`),
    PRIMARY KEY (`post_id`, `stat_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_postcategory` (
    `post_id` BIGINT NOT NULL,
    `postcategory_id` BIGINT NOT NULL,

    PRIMARY KEY (`post_id`, `postcategory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_posttag` (
    `post_id` BIGINT NOT NULL,
    `posttag_id` BIGINT NOT NULL,

    PRIMARY KEY (`post_id`, `posttag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `post_id` BIGINT NOT NULL,
    `user_id` BIGINT NULL,
    `guest_name` VARCHAR(255) NULL,
    `guest_email` VARCHAR(255) NULL,
    `parent_id` BIGINT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'visible',
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `post_comments_idx_post_comment_post_id`(`post_id`),
    INDEX `post_comments_idx_post_comment_user_id`(`user_id`),
    INDEX `post_comments_idx_post_comment_parent_id`(`parent_id`),
    INDEX `post_comments_idx_post_comment_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `reply` TEXT NULL,
    `replied_at` TIMESTAMP(0) NULL,
    `replied_by` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `contacts_idx_contacts_email`(`email`),
    INDEX `contacts_idx_contacts_status`(`status`),
    INDEX `contacts_idx_contacts_created_at`(`created_at`),
    INDEX `contacts_idx_contacts_status_created`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(10) NOT NULL,
    `code_alpha3` VARCHAR(10) NULL,
    `name` VARCHAR(255) NOT NULL,
    `official_name` VARCHAR(255) NULL,
    `phone_code` VARCHAR(20) NULL,
    `currency_code` VARCHAR(20) NULL,
    `flag_emoji` VARCHAR(20) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `countries_code_key`(`code`),
    INDEX `countries_idx_countries_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provinces` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `phone_code` VARCHAR(20) NULL,
    `country_id` BIGINT NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `note` TEXT NULL,
    `code_bnv` VARCHAR(20) NULL,
    `code_tms` VARCHAR(20) NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `provinces_code_key`(`code`),
    INDEX `provinces_idx_provinces_country_id`(`country_id`),
    INDEX `provinces_idx_provinces_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wards` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `province_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `wards_idx_wards_province_id`(`province_id`),
    INDEX `wards_idx_wards_code`(`code`),
    INDEX `wards_idx_wards_status`(`status`),
    INDEX `wards_idx_wards_province_status`(`province_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `short_description` VARCHAR(500) NULL,
    `cover_image` VARCHAR(500) NULL,
    `location` VARCHAR(255) NULL,
    `area` DECIMAL(15, 2) NULL,
    `start_date` TIMESTAMP(0) NULL,
    `end_date` TIMESTAMP(0) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'planning',
    `client_name` VARCHAR(255) NULL,
    `budget` DECIMAL(20, 2) NULL,
    `images` JSON NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `canonical_url` VARCHAR(500) NULL,
    `og_image` VARCHAR(500) NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `projects_slug_key`(`slug`),
    INDEX `projects_idx_projects_slug`(`slug`),
    INDEX `projects_idx_projects_status`(`status`),
    INDEX `projects_idx_projects_featured`(`featured`),
    INDEX `projects_idx_projects_sort_order`(`sort_order`),
    INDEX `projects_idx_projects_created_at`(`created_at`),
    INDEX `projects_idx_projects_status_featured`(`status`, `featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `about_sections` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `image` VARCHAR(500) NULL,
    `video_url` VARCHAR(500) NULL,
    `section_type` VARCHAR(30) NOT NULL DEFAULT 'history',
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `about_sections_slug_key`(`slug`),
    INDEX `about_sections_idx_about_sections_slug`(`slug`),
    INDEX `about_sections_idx_about_sections_type`(`section_type`),
    INDEX `about_sections_idx_about_sections_status`(`status`),
    INDEX `about_sections_idx_about_sections_sort_order`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `position` VARCHAR(255) NOT NULL,
    `department` VARCHAR(255) NULL,
    `bio` TEXT NULL,
    `avatar` VARCHAR(500) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `social_links` JSON NULL,
    `experience` INTEGER NULL,
    `expertise` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `staff_idx_staff_status`(`status`),
    INDEX `staff_idx_staff_sort_order`(`sort_order`),
    INDEX `staff_idx_staff_department`(`department`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `client_name` VARCHAR(255) NOT NULL,
    `client_position` VARCHAR(255) NULL,
    `client_company` VARCHAR(255) NULL,
    `client_avatar` VARCHAR(500) NULL,
    `content` TEXT NOT NULL,
    `rating` SMALLINT NULL,
    `project_id` BIGINT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `testimonials_idx_testimonials_status`(`status`),
    INDEX `testimonials_idx_testimonials_featured`(`featured`),
    INDEX `testimonials_idx_testimonials_project_id`(`project_id`),
    INDEX `testimonials_idx_testimonials_sort_order`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partners` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `logo` VARCHAR(500) NOT NULL,
    `website` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'client',
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `partners_idx_partners_type`(`type`),
    INDEX `partners_idx_partners_status`(`status`),
    INDEX `partners_idx_partners_sort_order`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `cover_image` VARCHAR(500) NULL,
    `images` JSON NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `gallery_slug_key`(`slug`),
    INDEX `gallery_idx_gallery_slug`(`slug`),
    INDEX `gallery_idx_gallery_status`(`status`),
    INDEX `gallery_idx_gallery_featured`(`featured`),
    INDEX `gallery_idx_gallery_sort_order`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `image` VARCHAR(500) NOT NULL,
    `issued_by` VARCHAR(255) NULL,
    `issued_date` TIMESTAMP(0) NULL,
    `expiry_date` TIMESTAMP(0) NULL,
    `certificate_number` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'license',
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `certificates_idx_certificates_type`(`type`),
    INDEX `certificates_idx_certificates_status`(`status`),
    INDEX `certificates_idx_certificates_sort_order`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `helpful_count` BIGINT NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `faqs_idx_faqs_status`(`status`),
    INDEX `faqs_idx_faqs_sort_order`(`sort_order`),
    INDEX `faqs_idx_faqs_view_count`(`view_count`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_templates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(30) NOT NULL DEFAULT 'render',
    `type` VARCHAR(30) NOT NULL,
    `content` TEXT NULL,
    `file_path` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `variables` JSON NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `content_templates_code_key`(`code`),
    INDEX `idx_content_templates_code`(`code`),
    INDEX `idx_content_templates_status`(`status`),
    INDEX `idx_content_templates_category`(`category`),
    INDEX `idx_content_templates_type`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `cover_image` VARCHAR(500) NULL,
    `author` VARCHAR(255) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_chapter_id` BIGINT NULL,
    `last_chapter_updated_at` TIMESTAMP(0) NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `group_id` BIGINT NULL,

    UNIQUE INDEX `comics_slug_key`(`slug`),
    INDEX `comics_idx_slug`(`slug`),
    INDEX `comics_idx_status`(`status`),
    INDEX `comics_idx_author`(`author`),
    INDEX `comics_idx_created_at`(`created_at`),
    INDEX `comics_idx_created_user_id`(`created_user_id`),
    INDEX `comics_idx_updated_user_id`(`updated_user_id`),
    INDEX `comics_idx_last_chapter_updated_at`(`last_chapter_updated_at`),
    INDEX `comics_idx_is_featured`(`is_featured`),
    INDEX `comics_idx_comics_group_id`(`group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_stats` (
    `comic_id` BIGINT NOT NULL,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `follow_count` BIGINT NOT NULL DEFAULT 0,
    `rating_count` BIGINT NOT NULL DEFAULT 0,
    `rating_sum` BIGINT NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `comic_stats_idx_view_count`(`view_count`),
    INDEX `comic_stats_idx_follow_count`(`follow_count`),
    INDEX `comic_stats_idx_updated_at`(`updated_at`),
    PRIMARY KEY (`comic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_daily_stats` (
    `comic_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `comic_daily_stats_idx_stat_date`(`stat_date`),
    INDEX `comic_daily_stats_idx_view_count`(`view_count`),
    PRIMARY KEY (`comic_id`, `stat_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapters` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `comic_id` BIGINT NOT NULL,
    `team_id` BIGINT NULL,
    `title` VARCHAR(255) NOT NULL,
    `chapter_index` INTEGER NOT NULL,
    `chapter_label` VARCHAR(50) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `group_id` BIGINT NULL,

    INDEX `chapters_idx_comic_id`(`comic_id`),
    INDEX `chapters_idx_comic_chapter_index`(`comic_id`, `chapter_index`),
    INDEX `chapters_idx_team_id`(`team_id`),
    INDEX `chapters_idx_status`(`status`),
    INDEX `chapters_idx_view_count`(`view_count`),
    INDEX `chapters_idx_created_at`(`created_at`),
    INDEX `chapters_idx_created_user_id`(`created_user_id`),
    INDEX `chapters_idx_updated_user_id`(`updated_user_id`),
    INDEX `chapters_idx_chapters_group_id`(`group_id`),
    UNIQUE INDEX `chapters_idx_comic_chapter_unique`(`comic_id`, `chapter_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `group_id` BIGINT NULL,

    UNIQUE INDEX `comic_categories_slug_key`(`slug`),
    INDEX `comic_categories_idx_slug`(`slug`),
    INDEX `comic_categories_idx_name`(`name`),
    INDEX `comic_categories_idx_created_at`(`created_at`),
    INDEX `comic_categories_idx_created_user_id`(`created_user_id`),
    INDEX `comic_categories_idx_updated_user_id`(`updated_user_id`),
    INDEX `comic_categories_idx_comic_categories_group_id`(`group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_category` (
    `comic_id` BIGINT NOT NULL,
    `comic_category_id` BIGINT NOT NULL,

    PRIMARY KEY (`comic_id`, `comic_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `comic_id` BIGINT NOT NULL,
    `chapter_id` BIGINT NULL,
    `parent_id` BIGINT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'visible',
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `comic_comments_idx_comic_comments_user_id`(`user_id`),
    INDEX `comic_comments_idx_comic_comments_comic_id`(`comic_id`),
    INDEX `comic_comments_idx_comic_comments_chapter_id`(`chapter_id`),
    INDEX `comic_comments_idx_comic_comments_parent_id`(`parent_id`),
    INDEX `comic_comments_idx_status`(`status`),
    INDEX `comic_comments_idx_created_at`(`created_at`),
    INDEX `comic_comments_idx_comic_created`(`comic_id`, `created_at`),
    INDEX `comic_comments_idx_chapter_created`(`chapter_id`, `created_at`),
    INDEX `comic_comments_idx_created_user_id`(`created_user_id`),
    INDEX `comic_comments_idx_updated_user_id`(`updated_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_reviews` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `comic_id` BIGINT NOT NULL,
    `rating` SMALLINT NOT NULL,
    `content` TEXT NULL,
    `created_user_id` BIGINT NULL,
    `updated_user_id` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `comic_reviews_idx_user_id`(`user_id`),
    INDEX `comic_reviews_idx_comic_id`(`comic_id`),
    INDEX `comic_reviews_idx_rating`(`rating`),
    INDEX `comic_reviews_idx_created_at`(`created_at`),
    INDEX `comic_reviews_idx_created_user_id`(`created_user_id`),
    INDEX `comic_reviews_idx_updated_user_id`(`updated_user_id`),
    UNIQUE INDEX `comic_reviews_idx_user_comic`(`user_id`, `comic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapter_pages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chapter_id` BIGINT NOT NULL,
    `page_number` INTEGER NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `file_size` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `chapter_pages_idx_chapter_id`(`chapter_id`),
    INDEX `chapter_pages_idx_chapter_page`(`chapter_id`, `page_number`),
    UNIQUE INDEX `chapter_pages_idx_chapter_page_unique`(`chapter_id`, `page_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_views` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `comic_id` BIGINT NOT NULL,
    `chapter_id` BIGINT NULL,
    `user_id` BIGINT NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `comic_views_idx_comic_views_comic_id`(`comic_id`),
    INDEX `comic_views_idx_comic_views_chapter_id`(`chapter_id`),
    INDEX `comic_views_idx_comic_views_user_id`(`user_id`),
    INDEX `comic_views_idx_created_at`(`created_at`),
    INDEX `comic_views_idx_comic_created`(`comic_id`, `created_at`),
    INDEX `comic_views_idx_chapter_created`(`chapter_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comic_follows` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `comic_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `comic_follows_idx_comic_follows_user_id`(`user_id`),
    INDEX `comic_follows_idx_comic_follows_comic_id`(`comic_id`),
    INDEX `comic_follows_idx_created_at`(`created_at`),
    UNIQUE INDEX `comic_follows_idx_user_comic`(`user_id`, `comic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_histories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `comic_id` BIGINT NOT NULL,
    `chapter_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `reading_histories_idx_reading_histories_user_id`(`user_id`),
    INDEX `reading_histories_idx_reading_histories_comic_id`(`comic_id`),
    INDEX `reading_histories_idx_reading_histories_chapter_id`(`chapter_id`),
    INDEX `reading_histories_idx_updated_at`(`updated_at`),
    UNIQUE INDEX `reading_histories_idx_user_comic`(`user_id`, `comic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `chapter_id` BIGINT NOT NULL,
    `page_number` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `bookmarks_idx_bookmarks_user_id`(`user_id`),
    INDEX `bookmarks_idx_bookmarks_chapter_id`(`chapter_id`),
    INDEX `bookmarks_idx_user_chapter`(`user_id`, `chapter_id`),
    INDEX `bookmarks_idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_context_id_fkey` FOREIGN KEY (`context_id`) REFERENCES `contexts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_groups` ADD CONSTRAINT `user_groups_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_groups` ADD CONSTRAINT `user_groups_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `permissions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_contexts` ADD CONSTRAINT `role_contexts_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_contexts` ADD CONSTRAINT `role_contexts_context_id_fkey` FOREIGN KEY (`context_id`) REFERENCES `contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role_assignments` ADD CONSTRAINT `user_role_assignments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role_assignments` ADD CONSTRAINT `user_role_assignments_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role_assignments` ADD CONSTRAINT `user_role_assignments_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `menus_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `menus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `menus_required_permission_id_fkey` FOREIGN KEY (`required_permission_id`) REFERENCES `permissions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_permissions` ADD CONSTRAINT `menu_permissions_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_permissions` ADD CONSTRAINT `menu_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banners` ADD CONSTRAINT `banners_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `banner_locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postcategory` ADD CONSTRAINT `postcategory_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `postcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_primary_postcategory_id_fkey` FOREIGN KEY (`primary_postcategory_id`) REFERENCES `postcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_stats` ADD CONSTRAINT `post_stats_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_daily_stats` ADD CONSTRAINT `post_daily_stats_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_postcategory` ADD CONSTRAINT `post_postcategory_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_postcategory` ADD CONSTRAINT `post_postcategory_postcategory_id_fkey` FOREIGN KEY (`postcategory_id`) REFERENCES `postcategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_posttag` ADD CONSTRAINT `post_posttag_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_posttag` ADD CONSTRAINT `post_posttag_posttag_id_fkey` FOREIGN KEY (`posttag_id`) REFERENCES `posttag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `post_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provinces` ADD CONSTRAINT `provinces_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wards` ADD CONSTRAINT `wards_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comics` ADD CONSTRAINT `comics_last_chapter_id_fkey` FOREIGN KEY (`last_chapter_id`) REFERENCES `chapters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_stats` ADD CONSTRAINT `comic_stats_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_daily_stats` ADD CONSTRAINT `comic_daily_stats_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_category` ADD CONSTRAINT `comic_category_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_category` ADD CONSTRAINT `comic_category_comic_category_id_fkey` FOREIGN KEY (`comic_category_id`) REFERENCES `comic_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_comments` ADD CONSTRAINT `comic_comments_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_comments` ADD CONSTRAINT `comic_comments_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_comments` ADD CONSTRAINT `comic_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_comments` ADD CONSTRAINT `comic_comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comic_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_reviews` ADD CONSTRAINT `comic_reviews_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_reviews` ADD CONSTRAINT `comic_reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapter_pages` ADD CONSTRAINT `chapter_pages_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_views` ADD CONSTRAINT `comic_views_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_views` ADD CONSTRAINT `comic_views_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_views` ADD CONSTRAINT `comic_views_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_follows` ADD CONSTRAINT `comic_follows_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comic_follows` ADD CONSTRAINT `comic_follows_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_histories` ADD CONSTRAINT `reading_histories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_histories` ADD CONSTRAINT `reading_histories_comic_id_fkey` FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_histories` ADD CONSTRAINT `reading_histories_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
