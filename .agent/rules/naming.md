# Naming Conventions

Follow these naming rules to maintain codebase consistency:

## Files & Directories
- **Directories:** lowercase-kebab-case (e.g., `src/modules/product-category`).
- **Files:** lowercase-kebab-case with suffix (e.g., `product.controller.ts`, `auth.service.ts`).
- **Modules:** Use the NestJS standard (e.g., `user.module.ts`).

## Classes & Interfaces
- **Classes:** PascalCase (e.g., `UserController`, `PrismaService`).
- **Interfaces:** PascalCase, optionally prefixed with `I` if preferred by local style (default to no prefix unless seen in codebase).
- **DTOs:** PascalCase ending in `Dto` (e.g., `CreateUserDto`).

## Variables & Methods
- **Variables/Properties:** camelCase (e.g., `userId`, `groupName`).
- **Methods/Functions:** camelCase (e.g., `findMany()`, `getProfile()`).
- **Constants:** UPPER_SNAKE_CASE (e.g., `JWT_SECRET`).

## Database (Prisma)
- **Models:** PascalCase (Singular) in Prisma schema.
- **Fields:** camelCase (or snake_case if matching legacy DB, check `schema.prisma`).
