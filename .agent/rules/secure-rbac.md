# Secure RBAC & Context-Based Authorization

The system uses a strict dual-context authorization model: **System** vs. **Group**.

## Authorization Levels
1. **System Context:** Only accessible by global administrators.
2. **Group Context:** Scoped to a specific `group_id`.

## Implementation Rules
- **Controller Guards:** Protect routes with `@Permission('key')`.
- **Filtering:** In services, override `prepareFilters` to include `getGroupFilter(filters)`.
- **Verification:** Always call `verifyGroupOwnership(entity)` in `getOne`, `beforeUpdate`, and `beforeDelete`.
- **Payload Security:** Ensure `group_id` is automatically added to creation payloads via `BaseService` or manual injection.

## Utilities
- `getGroupFilter(filters)`: Extracts and returns the filter object for Prisma.
- `verifyGroupOwnership(entity)`: Throws a `ForbiddenException` if the entity doesn't belong to the user's active group context.
