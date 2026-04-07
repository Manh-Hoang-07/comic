# CRUD Flow Rules

Follow these detailed rules for implementing standard CRUD operations in the application.

## 1. List (GET /)
- **Controller:** Use `@Get()` and `@Query()`. Avoid passing the entire query object directly to the service if specific validation is needed.
- **Service:** Override `prepareFilters` to handle search, status filters, and mandatory `getGroupFilter`.
- **Result:** Ensure the response is paginated (usually handled by `BaseService.getList`).

## 2. Detail (GET /:id)
- **Controller:** Use `@Get(':id')`.
- **Service:** ALWAYS use/override `getOne(id)`.
- **Security:** Inside `getOne`, you MUST call `verifyGroupOwnership(entity)`.

## 3. Create (POST /)
- **Controller:** Use `@Post()`. Validate input with a DTO (e.g., `CreateUserDto`).
- **Service:**
    - Override `beforeCreate(data)` to handle data preparation (e.g., password hashing, slug generation).
    - If many-to-many relations exist, use a `syncRelations` method after the main entity creation.
- **Tenancy:** Ensure `group_id` is set. If `autoAddGroupId = true` in the service, `BaseService` handles this if the user has a group context.

## 4. Update (PUT /:id)
- **Controller:** Use `@Put(':id')` or `@Patch(':id')`.
- **Service:**
    - Override `beforeUpdate(id, data)` to check existence and ownership via `this.getOne(id)`.
    - Apply updates.
    - Sync relations if necessary.

## 5. Delete (DELETE /:id)
- **Controller:** Use `@Delete(':id')`.
- **Service:** Override `beforeDelete(id)` to verify existence and ownership via `this.getOne(id)`.

## Lifecycle Hooks Summary
- `prepareFilters`: Scoping and search logic.
- `beforeCreate`: Data preparation before DB write.
- `beforeUpdate`: Ownership check and data prep.
- `beforeDelete`: Ownership check.
- `transform`: Formatting the entity for the API response (e.g., flattening relations).
