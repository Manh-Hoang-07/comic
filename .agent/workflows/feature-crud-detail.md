---
description: Workflow for implementing the Get One (Detail) operation
---

# Get One (Detail) Workflow

Follow this sequence to implement a standardized Get Detail operation.

## 1. Controller Method
```typescript
@Permission('module.manage')
@Get(':id')
async getOne(@Param('id') id: any) {
  return this.service.getOne(id);
}
```

## 2. Service Execution Flow (`BaseService.getOne`)
1.  **Call `repository.findById(id)`**: Fetches the entity from the database.
2.  **Entity Validation**: Throws `NotFoundException` if no entity is found.
3.  **Transformation**: Calls `this.transform(entity)`.
4.  **Hook Call**: `this.afterGetOne(transformed)`.
    - **Crucial**: Override `afterGetOne` or `getOne` to call `verifyGroupOwnership(entity)`.
5.  **Final Response**: Returns the transformed entity.

## 3. Key rules
- **Security**: Never expose direct DB IDs if not authorized (always `verifyGroupOwnership`).
- **Enrichment**: Use `afterGetOne` to load extra relationships or data.
