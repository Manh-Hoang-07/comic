# Database & Data Access Architecture

This project uses a database-agnostic repository pattern implemented with Prisma.

## Access Hierarchy
1. **Service Layer (`BaseService`):** Orchestrates business logic and calls the Repository Interface.
2. **Repository Interface (`IRepository`):** Defines standard database operations (findAll, findById, create, etc.).
3. **Infrastructure Layer (`PrismaRepository`):** Implements the interface using Prisma.
4. **Prisma Client:** Communicates with MySQL/MariaDB.

## Core Data Concepts (Optional/Conditional)
- **Tenancy (`group_id`):** Used in modules where data must be isolated per shop/user group. Enable in `BaseService` by setting `this.autoAddGroupId = true`.
- **Soft Delete (`deleted_at`):** Used where archival is needed instead of hard deletion. Repositories will automatically filter these out if implemented in the model.
- **Pagination:** Uses `IPaginatedResult<T>` with standard meta (page, limit, total).

## Schema Management
- **Prisma Schema:** Located at `prisma/schema.prisma`.
- **Naming:** Database tables use `snake_case`, Prisma models use `PascalCase`, and model fields use `snake_case` (mapping to DB columns).
