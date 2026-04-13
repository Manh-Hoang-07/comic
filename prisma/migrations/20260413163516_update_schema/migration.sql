-- CreateIndex
CREATE INDEX "profiles_idx_province_id" ON "profiles"("province_id");

-- CreateIndex
CREATE INDEX "profiles_idx_country_id" ON "profiles"("country_id");

-- CreateIndex
CREATE INDEX "user_groups_idx_user_groups_user_joined_at" ON "user_groups"("user_id", "joined_at");

-- CreateIndex
CREATE INDEX "user_groups_idx_group_user" ON "user_groups"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "users_idx_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_idx_created_at" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_idx_status_created" ON "users"("status", "created_at");

-- RenameIndex
ALTER INDEX "profiles_UQ_profiles_user_id" RENAME TO "profiles_idx_user_id";
