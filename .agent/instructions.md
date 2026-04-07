# Agent Instructions - Comic Project

Welcome, Antigravity. You are assisting in the development of a NestJS backend platform for a comic/e-commerce system.

## Project Context
- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** MySQL/MariaDB (containerized via Docker)
- **Caching:** Redis
- **Security:** Passport JWT + Context-based RBAC (System vs. Group)

## Core Principles
1. **Consistency:** Always follow the existing architectural patterns (Controller -> Service -> Repository/Prisma).
2. **Security First:** Every administrative action MUST be validated against the user's context (Check if they are System Admin or have access to a specific Group).
3. **Type Safety:** Ensure all data transfer objects (DTOs) and entities are properly typed using class-validator and class-transformer.

## Navigating the Project
- See [rules/architecture.md](./rules/architecture.md) for structural guidelines.
- See [rules/secure-rbac.md](./rules/secure-rbac.md) for authorization details.
- See [rules/crud-flows.md](./rules/crud-flows.md) for detailed CRUD implementation rules.
- **Detailed Workflows:**
    - [List Flow](./workflows/feature-crud-list.md)
    - [Detail Flow](./workflows/feature-crud-detail.md)
    - [Create Flow](./workflows/feature-crud-create.md)
    - [Update Flow](./workflows/feature-crud-update.md)
    - [Delete Flow](./workflows/feature-crud-delete.md)
- Use [workflows/](./workflows/) for automated task execution.

## Communication Style
- Be concise and technical.
- Propose implementation plans before major changes.
- Use artifacts for architectural discussions.
