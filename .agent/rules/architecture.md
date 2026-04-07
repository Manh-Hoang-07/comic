# Full Architectural Standards (DDD/Hexagonal + NestJS)

This document defines the definitive architectural standards for the project. Every developer and AI assistant MUST follow this structure.

## 1. Domain-Driven Layering
Each module in `src/modules/` (e.g., `comics/comic`) follows this structure:

- **`domain/`**:
    - **Entities/Models**: Typescript classes or interfaces representing the core business object.
    - **`[module].repository.ts`**: The Repository Interface (e.g., `IComicRepository`) that extends `IRepository<T>`.
- **`infrastructure/`**:
    - **`prisma-[module].repository.ts`**: The Prisma implementation of the domain repository.
    - **`[module].repository.module.ts`**: Registers the implementation with its Injection Token.
- **`admin/`**: High-privilege CRUD operations.
    - `controllers/`: Protected with `@Permission()`.
    - `services/`: Extends `BaseService`.
    - `dtos/`: Specifically for admin input validation.
- **`public/`**: Public-facing read operations (e.g., website/app API).
    - `controllers/`: Usually read-only or limited access.
    - `services/`: Focused on high-performance reads (caching).

## 2. Service Responsibilities
- **`BaseService` Operations**: Handles standard CRUD with lifecycle hooks (`beforeCreate`, `afterUpdate`, etc.).
- **`ActionService` Pattern**: For complex modules, create a secondary service (e.g., `ComicActionService`) to handle:
    - Many-to-many relationship syncing (`syncRelations`).
    - Large-scale data transformations.
    - Complex business logic that doesn't fit in standard CRUD.
- **Tenancy**: Use `this.autoAddGroupId = true` in constructors if the module requires group isolation.

## 3. Data Integrity & Utilities
- **Dependency Injection**: Use Interface Tokens (e.g., `@Inject(COMIC_REPOSITORY)`) to decouple services from the ORM.
- **Identity & Context**: Use `getGroupFilter(filters)` for querying and `verifyGroupOwnership(entity)` for individual record verification.
- **SEO/Slugs**: Use `SlugHelper` within `beforeCreate` and `beforeUpdate` hooks for all content-based models.
- **Metadata**: Standard tables should include `created_at` and `updated_at`. Add `group_id` or `deleted_at` ONLY if specified in requirements.

## 4. Implementation Checklist for New Modules
1. Define the DB model in `schema.prisma`.
2. Define the `IRepository` interface in the `domain/` layer.
3. Implement the `PrismaRepository` in the `infrastructure/` layer.
4. Create the `AdminService` by extending `BaseService` and overriding lifecycle hooks.
5. Create the `AdminController` with proper `@Permission` and `@LogRequest` decorators.
6. (Optional) Create the `PublicController`/`PublicService` for non-admin API needs.
