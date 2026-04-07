---
description: Workflow for implementing the Get List operation
---

# Get List Workflow

Follow this sequence to implement a standardized List operation.

## 1. Controller Method
```typescript
@Permission('module.manage')
@Get()
async getList(@Query() query: any) {
  return this.service.getList(query);
}
```

## 2. Service Execution Flow (`BaseService.getList`)
1.  **Call `prepareQuery(query)`**: Separates filters from pagination options.
2.  **Call `prepareOptions(options)`**: Normalizes `page`, `limit`, and `sort`.
3.  **Call `prepareFilters(filter, normalized)`**: (Override this!)
    - Use `getGroupFilter(filter)` to apply tenancy rules.
    - Return `false` to prevent query if unauthorized.
4.  **Repository Call**: `this.repository.findAll(normalized)`.
5.  **Transformation**: Calls `this.transform(row)` for each record.
6.  **Hook Call**: `this.afterGetList(result)`.

## 3. Key rules
- **Consistency**: Always return `IPaginatedResult<T>`.
- **Performance**: Use `cacheForGetList` if the data doesn't change frequently.
