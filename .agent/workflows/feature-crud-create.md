---
description: Workflow for implementing the Create operation
---

# Create Workflow

Follow this sequence to implement a standardized Creation operation.

## 1. Controller Method
```typescript
@Permission('module.manage')
@LogRequest({ fileBaseName: 'module_create' })
@Post()
async create(@Body(ValidationPipe) dto: CreateDto) {
  return this.service.create(dto);
}
```

## 2. Service Execution Flow (`BaseService.create`)
1.  **Call `beforeCreate(data)`**: (Override this!)
    - Hashes passwords.
    - Generates Slugs (`SlugHelper`).
    - **Self-Service**: Sets `group_id` via `assignGroupOwnership(payload)`.
2.  **Repository Call**: `this.repository.create(payload)`.
3.  **Hook Call**: `this.afterCreate(entity, data)`.
    - Use this for manual relationship syncing (e.g., `syncRelations`).
4.  **Transformation**: Calls `this.transform(entity)`.
5.  **Final Response**: Returns the transformed entity.

## 3. Key rules
- **Validation**: Pass `ValidationPipe` in the controller to ensure DTO integrity.
- **Audit**: Always use `@LogRequest` on creation events.
