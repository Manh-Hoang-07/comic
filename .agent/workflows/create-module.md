---
description: Create a new module with DDD structure and CRUD boilerplate
---

# Create New Module Workflow

Follow these steps to create a new feature module using the project's DDD/Hexagonal pattern.

## 1. Directory Structure
Create the following structure for `src/modules/[module-name]`:
```text
[module-name]/
├── domain/                    # Interfaces & Entities
├── infrastructure/            # Prisma Implementations
├── admin/                     # Admin endpoints
│   ├── controllers/
│   ├── services/
│   └── dtos/
└── public/                    # (Optional) Public endpoints
```

## 2. Domain Layer
- Define `I[Module]Repository` in `domain/[module].repository.ts`.
- It should extend `IRepository<[Model]>`.

## 3. Infrastructure Layer
- Implement `Prisma[Module]Repository` in `infrastructure/prisma-[module].repository.ts`.
- Register it as a provider using a token in a repository module.

## 4. Admin Layer (CRUD Implementation)
Implement the service and controller by following these detailed sub-workflows:
1.  **[List Workflow](./feature-crud-list.md)**: Implement `getList` and override `prepareFilters`.
2.  **[Detail Workflow](./feature-crud-detail.md)**: Implement `getOne` and Ownership verification.
3.  **[Create Workflow](./feature-crud-create.md)**: Implement `create`, `beforeCreate`, and Slugs.
4.  **[Update Workflow](./feature-crud-update.md)**: Implement `update` and `beforeUpdate`.
5.  **[Delete Workflow](./feature-crud-delete.md)**: Implement `delete` and `beforeDelete`.

## 5. Decision Points
- **Is Tenancy Required?** If yes, set `this.autoAddGroupId = true` in the service constructor and include `group_id` in the DTOs/Schema.
- **Is Soft Delete Required?** If yes, add `deleted_at` to the schema and ensure repository follows the filter.

## 6. Registration
1. Ensure the new repository is provided in the module's providers.
2. Export the repository if other modules need it.
3. Include the module in `app.module.ts`.
