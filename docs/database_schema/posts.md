# posts

**Mục đích**: Bài viết

## Columns

```sql
id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
name                    VARCHAR(255) NOT NULL
slug                    VARCHAR(255) NOT NULL UNIQUE
excerpt                 TEXT NULL
content                 LONGTEXT NOT NULL
image                   VARCHAR(255) NULL
cover_image             VARCHAR(255) NULL
primary_postcategory_id BIGINT UNSIGNED NULL
status                  ENUM('draft', 'scheduled', 'published', 'archived') DEFAULT 'draft'
is_featured             BOOLEAN DEFAULT FALSE
is_pinned               BOOLEAN DEFAULT FALSE
published_at            DATETIME NULL
meta_title              VARCHAR(255) NULL
meta_description        TEXT NULL
canonical_url           VARCHAR(255) NULL
og_title                VARCHAR(255) NULL
og_description          TEXT NULL
og_image                VARCHAR(255) NULL
created_user_id         BIGINT UNSIGNED NULL
updated_user_id         BIGINT UNSIGNED NULL
created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
deleted_at              DATETIME NULL
```

## Relations

- many-to-one → postcategory (primary category)
- many-to-many → postcategories (via post_postcategory)
- many-to-many → posttags (via post_posttag)

## Foreign Keys

- primary_postcategory_id → postcategory.id (SET NULL)

---

## 2. `post_stats`

**Mục đích**: Thống kê lượt xem tổng cho bài viết (tách riêng để tránh lock table `posts` khi cập nhật view count).

### Columns

```sql
post_id                BIGINT UNSIGNED NOT NULL PRIMARY KEY
view_count             BIGINT UNSIGNED DEFAULT 0
updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### Indexes

```sql
INDEX idx_view_count (view_count)
INDEX idx_updated_at (updated_at)
```

### Relations

- many-to-one → posts

### Foreign Keys

- post_id → posts(id) ON DELETE CASCADE

### Ghi chú

- Không update trực tiếp vào `posts` để đếm view, mọi cập nhật view đi qua cơ chế buffer Redis + cron, sau đó aggregate vào `post_stats`.
- Có thể dùng `post_stats.view_count` để sort/lọc các bài viết xem nhiều nhất tương tự `comic_stats.view_count`.

