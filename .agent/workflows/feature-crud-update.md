---
description: Workflow for implementing the Update operation
---

# Update Workflow

Follow this sequence to implement a standardized Update operation.

## 1. Controller Method
```typescript
@Permission('module.manage')
@LogRequest({ fileBaseName: 'module_update' })
@Put(':id')
async update(@Param('id') id: any, @Body(ValidationPipe) dto: UpdateDto) {
  return this.service.update(id, dto);
}
```

## 2. Service Execution Flow (`BaseService.update`)
1.  **Call `beforeUpdate(id, data)`**: (Override this!)
    - **Crucial**: Call `this.getOne(id)` to verify existence AND ownership.
    - Refresh Slugs if the title changed.
2.  **Repository Call**: `this.repository.update(id, payload)`.
3.  **Hook Call**: `this.afterUpdate(entity, data)`.
    - Syncing linked tables.
4.  **Transformation**: Calls `this.transform(entity)`.
5.  **Final Response**: Returns the transformed entity.

## 3. Key rules
- **Safety**: Update methods MUST verify ownership before writing to the database.
- **Partial Updates**: Ensure the DTO allows optional fields for PATCH-like behavior in PUT.
