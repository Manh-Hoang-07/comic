-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "password" VARCHAR(255),
    "name" VARCHAR(255),
    "image" VARCHAR(255),
    "googleId" VARCHAR(255),
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "email_verified_at" TIMESTAMP(0),
    "phone_verified_at" TIMESTAMP(0),
    "last_login_at" TIMESTAMP(0),
    "remember_token" VARCHAR(100),
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "birthday" DATE,
    "gender" VARCHAR(20),
    "address" TEXT,
    "country_id" BIGINT,
    "province_id" BIGINT,
    "ward_id" BIGINT,
    "about" TEXT,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contexts" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "ref_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "owner_id" BIGINT,
    "context_id" BIGINT NOT NULL,
    "metadata" JSONB,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "user_id" BIGINT NOT NULL,
    "group_id" BIGINT NOT NULL,
    "joined_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("user_id","group_id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "scope" VARCHAR(30) NOT NULL DEFAULT 'context',
    "name" VARCHAR(150),
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "parent_id" BIGINT,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150),
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "parent_id" BIGINT,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_has_permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,

    CONSTRAINT "role_has_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "role_contexts" (
    "role_id" BIGINT NOT NULL,
    "context_id" BIGINT NOT NULL,

    CONSTRAINT "role_contexts_pkey" PRIMARY KEY ("role_id","context_id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "group_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_configs" (
    "id" BIGSERIAL NOT NULL,
    "site_name" VARCHAR(255) NOT NULL,
    "site_description" TEXT,
    "site_logo" VARCHAR(500),
    "site_favicon" VARCHAR(500),
    "site_email" VARCHAR(255),
    "site_phone" VARCHAR(20),
    "site_address" TEXT,
    "site_country_id" BIGINT,
    "site_province_id" BIGINT,
    "site_ward_id" BIGINT,
    "site_copyright" VARCHAR(255),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'vi',
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "contact_channels" JSONB,
    "meta_title" VARCHAR(255),
    "meta_keywords" TEXT,
    "og_title" VARCHAR(255),
    "og_description" TEXT,
    "og_image" VARCHAR(500),
    "canonical_url" VARCHAR(500),
    "google_analytics_id" VARCHAR(50),
    "google_search_console" VARCHAR(255),
    "facebook_pixel_id" VARCHAR(50),
    "twitter_site" VARCHAR(50),
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "general_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_configs" (
    "id" BIGSERIAL NOT NULL,
    "smtp_host" VARCHAR(255) NOT NULL,
    "smtp_port" INTEGER NOT NULL DEFAULT 587,
    "smtp_secure" BOOLEAN NOT NULL DEFAULT true,
    "smtp_username" VARCHAR(255) NOT NULL,
    "smtp_password" VARCHAR(500) NOT NULL,
    "from_email" VARCHAR(255) NOT NULL,
    "from_name" VARCHAR(255) NOT NULL,
    "reply_to_email" VARCHAR(255),
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "email_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "path" VARCHAR(255),
    "api_path" VARCHAR(255),
    "icon" VARCHAR(120),
    "type" VARCHAR(30) NOT NULL DEFAULT 'route',
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "parent_id" BIGINT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "show_in_menu" BOOLEAN NOT NULL DEFAULT true,
    "group" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "required_permission_id" BIGINT,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_permissions" (
    "id" BIGSERIAL NOT NULL,
    "menu_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,

    CONSTRAINT "menu_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_locations" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "banner_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "subtitle" VARCHAR(255),
    "image" VARCHAR(500) NOT NULL,
    "mobile_image" VARCHAR(500),
    "link" VARCHAR(500),
    "link_target" VARCHAR(20) NOT NULL DEFAULT '_self',
    "description" TEXT,
    "button_text" VARCHAR(100),
    "button_color" VARCHAR(20),
    "text_color" VARCHAR(20),
    "location_id" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(0),
    "end_date" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'info',
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(0),
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcategory" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "parent_id" BIGINT,
    "image" VARCHAR(255),
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "canonical_url" VARCHAR(255),
    "og_image" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "postcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posttag" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "canonical_url" VARCHAR(255),
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "posttag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "image" VARCHAR(255),
    "cover_image" VARCHAR(255),
    "primary_postcategory_id" BIGINT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "post_type" VARCHAR(30) NOT NULL DEFAULT 'text',
    "video_url" VARCHAR(500),
    "audio_url" VARCHAR(500),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(0),
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "canonical_url" VARCHAR(255),
    "og_title" VARCHAR(255),
    "og_description" TEXT,
    "og_image" VARCHAR(255),
    "group_id" BIGINT,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_stats" (
    "post_id" BIGINT NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_stats_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "post_daily_stats" (
    "post_id" BIGINT NOT NULL,
    "stat_date" DATE NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_daily_stats_pkey" PRIMARY KEY ("post_id","stat_date")
);

-- CreateTable
CREATE TABLE "post_postcategory" (
    "post_id" BIGINT NOT NULL,
    "postcategory_id" BIGINT NOT NULL,

    CONSTRAINT "post_postcategory_pkey" PRIMARY KEY ("post_id","postcategory_id")
);

-- CreateTable
CREATE TABLE "post_posttag" (
    "post_id" BIGINT NOT NULL,
    "posttag_id" BIGINT NOT NULL,

    CONSTRAINT "post_posttag_pkey" PRIMARY KEY ("post_id","posttag_id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "guest_name" VARCHAR(255),
    "guest_email" VARCHAR(255),
    "parent_id" BIGINT,
    "content" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'visible',
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "reply" TEXT,
    "replied_at" TIMESTAMP(0),
    "replied_by" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "code_alpha3" VARCHAR(10),
    "name" VARCHAR(255) NOT NULL,
    "official_name" VARCHAR(255),
    "phone_code" VARCHAR(20),
    "currency_code" VARCHAR(20),
    "flag_emoji" VARCHAR(20),
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "phone_code" VARCHAR(20),
    "country_id" BIGINT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "note" TEXT,
    "code_bnv" VARCHAR(20),
    "code_tms" VARCHAR(20),
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" BIGSERIAL NOT NULL,
    "province_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "short_description" VARCHAR(500),
    "cover_image" VARCHAR(500),
    "location" VARCHAR(255),
    "area" DECIMAL(15,2),
    "start_date" TIMESTAMP(0),
    "end_date" TIMESTAMP(0),
    "status" VARCHAR(30) NOT NULL DEFAULT 'planning',
    "client_name" VARCHAR(255),
    "budget" DECIMAL(20,2),
    "images" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "canonical_url" VARCHAR(500),
    "og_image" VARCHAR(500),
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_sections" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "image" VARCHAR(500),
    "video_url" VARCHAR(500),
    "section_type" VARCHAR(30) NOT NULL DEFAULT 'history',
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "about_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "department" VARCHAR(255),
    "bio" TEXT,
    "avatar" VARCHAR(500),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "social_links" JSONB,
    "experience" INTEGER,
    "expertise" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" BIGSERIAL NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "client_position" VARCHAR(255),
    "client_company" VARCHAR(255),
    "client_avatar" VARCHAR(500),
    "content" TEXT NOT NULL,
    "rating" SMALLINT,
    "project_id" BIGINT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo" VARCHAR(500) NOT NULL,
    "website" VARCHAR(500),
    "description" TEXT,
    "type" VARCHAR(30) NOT NULL DEFAULT 'client',
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image" VARCHAR(500),
    "images" JSONB NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "image" VARCHAR(500) NOT NULL,
    "issued_by" VARCHAR(255),
    "issued_date" TIMESTAMP(0),
    "expiry_date" TIMESTAMP(0),
    "certificate_number" VARCHAR(100),
    "description" TEXT,
    "type" VARCHAR(30) NOT NULL DEFAULT 'license',
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" BIGSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "helpful_count" BIGINT NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_templates" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(30) NOT NULL DEFAULT 'render',
    "type" VARCHAR(30) NOT NULL,
    "content" TEXT,
    "file_path" VARCHAR(500),
    "metadata" JSONB,
    "variables" JSONB,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comics" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image" VARCHAR(500),
    "author" VARCHAR(255),
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,
    "last_chapter_id" BIGINT,
    "last_chapter_updated_at" TIMESTAMP(0),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "group_id" BIGINT,

    CONSTRAINT "comics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_stats" (
    "comic_id" BIGINT NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "follow_count" BIGINT NOT NULL DEFAULT 0,
    "rating_count" BIGINT NOT NULL DEFAULT 0,
    "rating_sum" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comic_stats_pkey" PRIMARY KEY ("comic_id")
);

-- CreateTable
CREATE TABLE "comic_daily_stats" (
    "comic_id" BIGINT NOT NULL,
    "stat_date" DATE NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comic_daily_stats_pkey" PRIMARY KEY ("comic_id","stat_date")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" BIGSERIAL NOT NULL,
    "comic_id" BIGINT NOT NULL,
    "team_id" BIGINT,
    "title" VARCHAR(255) NOT NULL,
    "chapter_index" INTEGER NOT NULL,
    "chapter_label" VARCHAR(50),
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,
    "group_id" BIGINT,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,
    "group_id" BIGINT,

    CONSTRAINT "comic_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_category" (
    "comic_id" BIGINT NOT NULL,
    "comic_category_id" BIGINT NOT NULL,

    CONSTRAINT "comic_category_pkey" PRIMARY KEY ("comic_id","comic_category_id")
);

-- CreateTable
CREATE TABLE "comic_comments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "comic_id" BIGINT NOT NULL,
    "chapter_id" BIGINT,
    "parent_id" BIGINT,
    "content" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'visible',
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "comic_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_reviews" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "comic_id" BIGINT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "content" TEXT,
    "created_user_id" BIGINT,
    "updated_user_id" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "comic_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_pages" (
    "id" BIGSERIAL NOT NULL,
    "chapter_id" BIGINT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "file_size" BIGINT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_views" (
    "id" BIGSERIAL NOT NULL,
    "comic_id" BIGINT NOT NULL,
    "chapter_id" BIGINT,
    "user_id" BIGINT,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comic_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_follows" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "comic_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comic_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_histories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "comic_id" BIGINT NOT NULL,
    "chapter_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "reading_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "chapter_id" BIGINT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_UQ_profiles_user_id" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contexts_code_key" ON "contexts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "contexts_idx_contexts_type_ref_id" ON "contexts"("type", "ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_code_key" ON "groups"("code");

-- CreateIndex
CREATE INDEX "groups_IDX_groups_context_id" ON "groups"("context_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_idx_groups_type_code" ON "groups"("type", "code");

-- CreateIndex
CREATE INDEX "user_groups_idx_user_groups_user_id" ON "user_groups"("user_id");

-- CreateIndex
CREATE INDEX "user_groups_idx_user_groups_group_id" ON "user_groups"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_idx_scope" ON "permissions"("scope");

-- CreateIndex
CREATE INDEX "permissions_idx_permissions_parent_id" ON "permissions"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "role_has_permissions_idx_role_has_permissions_role_id" ON "role_has_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_has_permissions_idx_role_has_permissions_permission_id" ON "role_has_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "role_contexts_idx_role_contexts_role_id" ON "role_contexts"("role_id");

-- CreateIndex
CREATE INDEX "role_contexts_idx_role_contexts_context_id" ON "role_contexts"("context_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_idx_user_group" ON "user_role_assignments"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_idx_user_role_assignments_group_id" ON "user_role_assignments"("group_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_idx_user_role_assignments_role_id" ON "user_role_assignments"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_idx_user_role_group_unique" ON "user_role_assignments"("user_id", "role_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "menus_code_key" ON "menus"("code");

-- CreateIndex
CREATE INDEX "menus_idx_code" ON "menus"("code");

-- CreateIndex
CREATE INDEX "menus_idx_parent_id" ON "menus"("parent_id");

-- CreateIndex
CREATE INDEX "menus_idx_required_permission_id" ON "menus"("required_permission_id");

-- CreateIndex
CREATE INDEX "menus_idx_status_show_in_menu" ON "menus"("status", "show_in_menu");

-- CreateIndex
CREATE INDEX "menus_idx_group" ON "menus"("group");

-- CreateIndex
CREATE INDEX "menu_permissions_idx_menu_id" ON "menu_permissions"("menu_id");

-- CreateIndex
CREATE INDEX "menu_permissions_idx_permission_id" ON "menu_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "banner_locations_code_key" ON "banner_locations"("code");

-- CreateIndex
CREATE INDEX "banner_locations_idx_banner_locations_code" ON "banner_locations"("code");

-- CreateIndex
CREATE INDEX "banner_locations_idx_banner_locations_status" ON "banner_locations"("status");

-- CreateIndex
CREATE INDEX "banners_idx_banners_title" ON "banners"("title");

-- CreateIndex
CREATE INDEX "banners_idx_banners_location_id" ON "banners"("location_id");

-- CreateIndex
CREATE INDEX "banners_idx_banners_status" ON "banners"("status");

-- CreateIndex
CREATE INDEX "banners_idx_banners_sort_order" ON "banners"("sort_order");

-- CreateIndex
CREATE INDEX "banners_idx_banners_start_date" ON "banners"("start_date");

-- CreateIndex
CREATE INDEX "banners_idx_banners_end_date" ON "banners"("end_date");

-- CreateIndex
CREATE INDEX "banners_idx_banners_status_sort" ON "banners"("status", "sort_order");

-- CreateIndex
CREATE INDEX "banners_idx_banners_location_status" ON "banners"("location_id", "status");

-- CreateIndex
CREATE INDEX "notifications_idx_notifications_user_id" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_idx_notifications_status" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_idx_notifications_type" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_idx_notifications_read" ON "notifications"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "postcategory_slug_key" ON "postcategory"("slug");

-- CreateIndex
CREATE INDEX "postcategory_idx_name" ON "postcategory"("name");

-- CreateIndex
CREATE INDEX "postcategory_idx_slug" ON "postcategory"("slug");

-- CreateIndex
CREATE INDEX "postcategory_idx_parent_id" ON "postcategory"("parent_id");

-- CreateIndex
CREATE INDEX "postcategory_idx_status" ON "postcategory"("status");

-- CreateIndex
CREATE INDEX "postcategory_idx_sort_order" ON "postcategory"("sort_order");

-- CreateIndex
CREATE INDEX "postcategory_idx_created_at" ON "postcategory"("created_at");

-- CreateIndex
CREATE INDEX "postcategory_idx_status_sort_order" ON "postcategory"("status", "sort_order");

-- CreateIndex
CREATE INDEX "postcategory_idx_parent_status" ON "postcategory"("parent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "posttag_slug_key" ON "posttag"("slug");

-- CreateIndex
CREATE INDEX "posttag_idx_name" ON "posttag"("name");

-- CreateIndex
CREATE INDEX "posttag_idx_slug" ON "posttag"("slug");

-- CreateIndex
CREATE INDEX "posttag_idx_status" ON "posttag"("status");

-- CreateIndex
CREATE INDEX "posttag_idx_created_at" ON "posttag"("created_at");

-- CreateIndex
CREATE INDEX "posttag_idx_status_created_at" ON "posttag"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_idx_name" ON "posts"("name");

-- CreateIndex
CREATE INDEX "posts_idx_slug" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_idx_primary_postcategory_id" ON "posts"("primary_postcategory_id");

-- CreateIndex
CREATE INDEX "posts_idx_status" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_idx_post_type" ON "posts"("post_type");

-- CreateIndex
CREATE INDEX "posts_idx_is_featured" ON "posts"("is_featured");

-- CreateIndex
CREATE INDEX "posts_idx_is_pinned" ON "posts"("is_pinned");

-- CreateIndex
CREATE INDEX "posts_idx_published_at" ON "posts"("published_at");

-- CreateIndex
CREATE INDEX "posts_idx_created_at" ON "posts"("created_at");

-- CreateIndex
CREATE INDEX "posts_idx_status_published_at" ON "posts"("status", "published_at");

-- CreateIndex
CREATE INDEX "posts_idx_is_featured_status" ON "posts"("is_featured", "status");

-- CreateIndex
CREATE INDEX "posts_idx_primary_category_status" ON "posts"("primary_postcategory_id", "status");

-- CreateIndex
CREATE INDEX "posts_idx_posts_group_id" ON "posts"("group_id");

-- CreateIndex
CREATE INDEX "post_stats_idx_view_count" ON "post_stats"("view_count");

-- CreateIndex
CREATE INDEX "post_stats_idx_updated_at" ON "post_stats"("updated_at");

-- CreateIndex
CREATE INDEX "post_daily_stats_idx_stat_date" ON "post_daily_stats"("stat_date");

-- CreateIndex
CREATE INDEX "post_daily_stats_idx_view_count" ON "post_daily_stats"("view_count");

-- CreateIndex
CREATE INDEX "post_comments_idx_post_comment_post_id" ON "post_comments"("post_id");

-- CreateIndex
CREATE INDEX "post_comments_idx_post_comment_user_id" ON "post_comments"("user_id");

-- CreateIndex
CREATE INDEX "post_comments_idx_post_comment_parent_id" ON "post_comments"("parent_id");

-- CreateIndex
CREATE INDEX "post_comments_idx_post_comment_status" ON "post_comments"("status");

-- CreateIndex
CREATE INDEX "contacts_idx_contacts_email" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_idx_contacts_status" ON "contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_idx_contacts_created_at" ON "contacts"("created_at");

-- CreateIndex
CREATE INDEX "contacts_idx_contacts_status_created" ON "contacts"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "countries_idx_countries_status" ON "countries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE INDEX "provinces_idx_provinces_country_id" ON "provinces"("country_id");

-- CreateIndex
CREATE INDEX "provinces_idx_provinces_status" ON "provinces"("status");

-- CreateIndex
CREATE INDEX "wards_idx_wards_province_id" ON "wards"("province_id");

-- CreateIndex
CREATE INDEX "wards_idx_wards_code" ON "wards"("code");

-- CreateIndex
CREATE INDEX "wards_idx_wards_status" ON "wards"("status");

-- CreateIndex
CREATE INDEX "wards_idx_wards_province_status" ON "wards"("province_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_idx_projects_slug" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_idx_projects_status" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_idx_projects_featured" ON "projects"("featured");

-- CreateIndex
CREATE INDEX "projects_idx_projects_sort_order" ON "projects"("sort_order");

-- CreateIndex
CREATE INDEX "projects_idx_projects_created_at" ON "projects"("created_at");

-- CreateIndex
CREATE INDEX "projects_idx_projects_status_featured" ON "projects"("status", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "about_sections_slug_key" ON "about_sections"("slug");

-- CreateIndex
CREATE INDEX "about_sections_idx_about_sections_slug" ON "about_sections"("slug");

-- CreateIndex
CREATE INDEX "about_sections_idx_about_sections_type" ON "about_sections"("section_type");

-- CreateIndex
CREATE INDEX "about_sections_idx_about_sections_status" ON "about_sections"("status");

-- CreateIndex
CREATE INDEX "about_sections_idx_about_sections_sort_order" ON "about_sections"("sort_order");

-- CreateIndex
CREATE INDEX "staff_idx_staff_status" ON "staff"("status");

-- CreateIndex
CREATE INDEX "staff_idx_staff_sort_order" ON "staff"("sort_order");

-- CreateIndex
CREATE INDEX "staff_idx_staff_department" ON "staff"("department");

-- CreateIndex
CREATE INDEX "testimonials_idx_testimonials_status" ON "testimonials"("status");

-- CreateIndex
CREATE INDEX "testimonials_idx_testimonials_featured" ON "testimonials"("featured");

-- CreateIndex
CREATE INDEX "testimonials_idx_testimonials_project_id" ON "testimonials"("project_id");

-- CreateIndex
CREATE INDEX "testimonials_idx_testimonials_sort_order" ON "testimonials"("sort_order");

-- CreateIndex
CREATE INDEX "partners_idx_partners_type" ON "partners"("type");

-- CreateIndex
CREATE INDEX "partners_idx_partners_status" ON "partners"("status");

-- CreateIndex
CREATE INDEX "partners_idx_partners_sort_order" ON "partners"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_slug_key" ON "gallery"("slug");

-- CreateIndex
CREATE INDEX "gallery_idx_gallery_slug" ON "gallery"("slug");

-- CreateIndex
CREATE INDEX "gallery_idx_gallery_status" ON "gallery"("status");

-- CreateIndex
CREATE INDEX "gallery_idx_gallery_featured" ON "gallery"("featured");

-- CreateIndex
CREATE INDEX "gallery_idx_gallery_sort_order" ON "gallery"("sort_order");

-- CreateIndex
CREATE INDEX "certificates_idx_certificates_type" ON "certificates"("type");

-- CreateIndex
CREATE INDEX "certificates_idx_certificates_status" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "certificates_idx_certificates_sort_order" ON "certificates"("sort_order");

-- CreateIndex
CREATE INDEX "faqs_idx_faqs_status" ON "faqs"("status");

-- CreateIndex
CREATE INDEX "faqs_idx_faqs_sort_order" ON "faqs"("sort_order");

-- CreateIndex
CREATE INDEX "faqs_idx_faqs_view_count" ON "faqs"("view_count");

-- CreateIndex
CREATE UNIQUE INDEX "content_templates_code_key" ON "content_templates"("code");

-- CreateIndex
CREATE INDEX "idx_content_templates_code" ON "content_templates"("code");

-- CreateIndex
CREATE INDEX "idx_content_templates_status" ON "content_templates"("status");

-- CreateIndex
CREATE INDEX "idx_content_templates_category" ON "content_templates"("category");

-- CreateIndex
CREATE INDEX "idx_content_templates_type" ON "content_templates"("type");

-- CreateIndex
CREATE UNIQUE INDEX "comics_slug_key" ON "comics"("slug");

-- CreateIndex
CREATE INDEX "comics_idx_slug" ON "comics"("slug");

-- CreateIndex
CREATE INDEX "comics_idx_status" ON "comics"("status");

-- CreateIndex
CREATE INDEX "comics_idx_author" ON "comics"("author");

-- CreateIndex
CREATE INDEX "comics_idx_created_at" ON "comics"("created_at");

-- CreateIndex
CREATE INDEX "comics_idx_created_user_id" ON "comics"("created_user_id");

-- CreateIndex
CREATE INDEX "comics_idx_updated_user_id" ON "comics"("updated_user_id");

-- CreateIndex
CREATE INDEX "comics_idx_last_chapter_updated_at" ON "comics"("last_chapter_updated_at");

-- CreateIndex
CREATE INDEX "comics_idx_is_featured" ON "comics"("is_featured");

-- CreateIndex
CREATE INDEX "comics_idx_comics_group_id" ON "comics"("group_id");

-- CreateIndex
CREATE INDEX "comic_stats_idx_view_count" ON "comic_stats"("view_count");

-- CreateIndex
CREATE INDEX "comic_stats_idx_follow_count" ON "comic_stats"("follow_count");

-- CreateIndex
CREATE INDEX "comic_stats_idx_updated_at" ON "comic_stats"("updated_at");

-- CreateIndex
CREATE INDEX "comic_daily_stats_idx_stat_date" ON "comic_daily_stats"("stat_date");

-- CreateIndex
CREATE INDEX "comic_daily_stats_idx_view_count" ON "comic_daily_stats"("view_count");

-- CreateIndex
CREATE INDEX "chapters_idx_comic_id" ON "chapters"("comic_id");

-- CreateIndex
CREATE INDEX "chapters_idx_comic_chapter_index" ON "chapters"("comic_id", "chapter_index");

-- CreateIndex
CREATE INDEX "chapters_idx_team_id" ON "chapters"("team_id");

-- CreateIndex
CREATE INDEX "chapters_idx_status" ON "chapters"("status");

-- CreateIndex
CREATE INDEX "chapters_idx_view_count" ON "chapters"("view_count");

-- CreateIndex
CREATE INDEX "chapters_idx_created_at" ON "chapters"("created_at");

-- CreateIndex
CREATE INDEX "chapters_idx_created_user_id" ON "chapters"("created_user_id");

-- CreateIndex
CREATE INDEX "chapters_idx_updated_user_id" ON "chapters"("updated_user_id");

-- CreateIndex
CREATE INDEX "chapters_idx_chapters_group_id" ON "chapters"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_idx_comic_chapter_unique" ON "chapters"("comic_id", "chapter_index");

-- CreateIndex
CREATE UNIQUE INDEX "comic_categories_slug_key" ON "comic_categories"("slug");

-- CreateIndex
CREATE INDEX "comic_categories_idx_slug" ON "comic_categories"("slug");

-- CreateIndex
CREATE INDEX "comic_categories_idx_name" ON "comic_categories"("name");

-- CreateIndex
CREATE INDEX "comic_categories_idx_created_at" ON "comic_categories"("created_at");

-- CreateIndex
CREATE INDEX "comic_categories_idx_created_user_id" ON "comic_categories"("created_user_id");

-- CreateIndex
CREATE INDEX "comic_categories_idx_updated_user_id" ON "comic_categories"("updated_user_id");

-- CreateIndex
CREATE INDEX "comic_categories_idx_comic_categories_group_id" ON "comic_categories"("group_id");

-- CreateIndex
CREATE INDEX "comic_comments_idx_comic_comments_user_id" ON "comic_comments"("user_id");

-- CreateIndex
CREATE INDEX "comic_comments_idx_comic_comments_comic_id" ON "comic_comments"("comic_id");

-- CreateIndex
CREATE INDEX "comic_comments_idx_comic_comments_chapter_id" ON "comic_comments"("chapter_id");

-- CreateIndex
CREATE INDEX "comic_comments_idx_comic_comments_parent_id" ON "comic_comments"("parent_id");

-- CreateIndex
CREATE INDEX "comic_comments_idx_status" ON "comic_comments"("status");

-- CreateIndex
CREATE INDEX "comic_comments_idx_created_at" ON "comic_comments"("created_at");

-- CreateIndex
CREATE INDEX "comic_comments_idx_comic_created" ON "comic_comments"("comic_id", "created_at");

-- CreateIndex
CREATE INDEX "comic_comments_idx_chapter_created" ON "comic_comments"("chapter_id", "created_at");

-- CreateIndex
CREATE INDEX "comic_comments_idx_created_user_id" ON "comic_comments"("created_user_id");

-- CreateIndex
CREATE INDEX "comic_comments_idx_updated_user_id" ON "comic_comments"("updated_user_id");

-- CreateIndex
CREATE INDEX "comic_reviews_idx_user_id" ON "comic_reviews"("user_id");

-- CreateIndex
CREATE INDEX "comic_reviews_idx_comic_id" ON "comic_reviews"("comic_id");

-- CreateIndex
CREATE INDEX "comic_reviews_idx_rating" ON "comic_reviews"("rating");

-- CreateIndex
CREATE INDEX "comic_reviews_idx_created_at" ON "comic_reviews"("created_at");

-- CreateIndex
CREATE INDEX "comic_reviews_idx_created_user_id" ON "comic_reviews"("created_user_id");

-- CreateIndex
CREATE INDEX "comic_reviews_idx_updated_user_id" ON "comic_reviews"("updated_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comic_reviews_idx_user_comic" ON "comic_reviews"("user_id", "comic_id");

-- CreateIndex
CREATE INDEX "chapter_pages_idx_chapter_id" ON "chapter_pages"("chapter_id");

-- CreateIndex
CREATE INDEX "chapter_pages_idx_chapter_page" ON "chapter_pages"("chapter_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_pages_idx_chapter_page_unique" ON "chapter_pages"("chapter_id", "page_number");

-- CreateIndex
CREATE INDEX "comic_views_idx_comic_views_comic_id" ON "comic_views"("comic_id");

-- CreateIndex
CREATE INDEX "comic_views_idx_comic_views_chapter_id" ON "comic_views"("chapter_id");

-- CreateIndex
CREATE INDEX "comic_views_idx_comic_views_user_id" ON "comic_views"("user_id");

-- CreateIndex
CREATE INDEX "comic_views_idx_created_at" ON "comic_views"("created_at");

-- CreateIndex
CREATE INDEX "comic_views_idx_comic_created" ON "comic_views"("comic_id", "created_at");

-- CreateIndex
CREATE INDEX "comic_views_idx_chapter_created" ON "comic_views"("chapter_id", "created_at");

-- CreateIndex
CREATE INDEX "comic_follows_idx_comic_follows_user_id" ON "comic_follows"("user_id");

-- CreateIndex
CREATE INDEX "comic_follows_idx_comic_follows_comic_id" ON "comic_follows"("comic_id");

-- CreateIndex
CREATE INDEX "comic_follows_idx_created_at" ON "comic_follows"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "comic_follows_idx_user_comic" ON "comic_follows"("user_id", "comic_id");

-- CreateIndex
CREATE INDEX "reading_histories_idx_reading_histories_user_id" ON "reading_histories"("user_id");

-- CreateIndex
CREATE INDEX "reading_histories_idx_reading_histories_comic_id" ON "reading_histories"("comic_id");

-- CreateIndex
CREATE INDEX "reading_histories_idx_reading_histories_chapter_id" ON "reading_histories"("chapter_id");

-- CreateIndex
CREATE INDEX "reading_histories_idx_updated_at" ON "reading_histories"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "reading_histories_idx_user_comic" ON "reading_histories"("user_id", "comic_id");

-- CreateIndex
CREATE INDEX "bookmarks_idx_bookmarks_user_id" ON "bookmarks"("user_id");

-- CreateIndex
CREATE INDEX "bookmarks_idx_bookmarks_chapter_id" ON "bookmarks"("chapter_id");

-- CreateIndex
CREATE INDEX "bookmarks_idx_user_chapter" ON "bookmarks"("user_id", "chapter_id");

-- CreateIndex
CREATE INDEX "bookmarks_idx_created_at" ON "bookmarks"("created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "contexts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_contexts" ADD CONSTRAINT "role_contexts_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_contexts" ADD CONSTRAINT "role_contexts_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_required_permission_id_fkey" FOREIGN KEY ("required_permission_id") REFERENCES "permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_permissions" ADD CONSTRAINT "menu_permissions_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_permissions" ADD CONSTRAINT "menu_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "banner_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcategory" ADD CONSTRAINT "postcategory_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "postcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_primary_postcategory_id_fkey" FOREIGN KEY ("primary_postcategory_id") REFERENCES "postcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_stats" ADD CONSTRAINT "post_stats_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_daily_stats" ADD CONSTRAINT "post_daily_stats_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_postcategory" ADD CONSTRAINT "post_postcategory_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_postcategory" ADD CONSTRAINT "post_postcategory_postcategory_id_fkey" FOREIGN KEY ("postcategory_id") REFERENCES "postcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_posttag" ADD CONSTRAINT "post_posttag_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_posttag" ADD CONSTRAINT "post_posttag_posttag_id_fkey" FOREIGN KEY ("posttag_id") REFERENCES "posttag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comics" ADD CONSTRAINT "comics_last_chapter_id_fkey" FOREIGN KEY ("last_chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_stats" ADD CONSTRAINT "comic_stats_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_daily_stats" ADD CONSTRAINT "comic_daily_stats_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_category" ADD CONSTRAINT "comic_category_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_category" ADD CONSTRAINT "comic_category_comic_category_id_fkey" FOREIGN KEY ("comic_category_id") REFERENCES "comic_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_comments" ADD CONSTRAINT "comic_comments_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_comments" ADD CONSTRAINT "comic_comments_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_comments" ADD CONSTRAINT "comic_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_comments" ADD CONSTRAINT "comic_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comic_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_reviews" ADD CONSTRAINT "comic_reviews_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_reviews" ADD CONSTRAINT "comic_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_pages" ADD CONSTRAINT "chapter_pages_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_views" ADD CONSTRAINT "comic_views_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_views" ADD CONSTRAINT "comic_views_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_views" ADD CONSTRAINT "comic_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_follows" ADD CONSTRAINT "comic_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_follows" ADD CONSTRAINT "comic_follows_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_histories" ADD CONSTRAINT "reading_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_histories" ADD CONSTRAINT "reading_histories_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_histories" ADD CONSTRAINT "reading_histories_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
