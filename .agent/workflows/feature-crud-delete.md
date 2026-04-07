---
description: Workflow for implementing the Delete operation
---

# Delete Workflow

Follow this sequence to implement a standardized Delete operation.

## 1. Controller Method
```typescript
@Permission('module.manage')
@LogRequest({ fileBaseName: 'module_delete' })
@Delete(':id')
async delete(@Param('id') id: any) {
  return this.service.delete(id);
}
```

## 2. Service Execution Flow (`BaseService.delete`)
1.  **Call `beforeDelete(id)`**: (Override this!)
    - **Crucial**: Call `this.getOne(id)` to verify ownership.
    - Resulting `false` cancels the operation.
2.  **Repository Call**: `this.repository.delete(id)`.
3.  **Hook Call**: `this.afterDelete(id)`.
    - Cleanup related files or logs.
4.  **Final Response**: Returns the result of the repository operation (boolean).

## 3. Key rules
- **Consistency**: Always verify existence and ownership before deleting.
- **Side Effects**: Use `afterDelete` for cleaning up uploaded files or external resources.
