# Backend (NestJS + Prisma)

This is a modern, high-performance backend application built with **NestJS**, following **DDD (Domain-Driven Design)** and **Hexagonal Architecture** principles.

## 🚀 Key Features

- **DDD Architecture**: Structured into Domain, Infrastructure, and Application layers.
- **Repository Pattern**: Database-agnostic data access using Prisma.
- **Multi-Tenant RBAC**: Strict context-based authorization (System Admin vs. Group Admin).
- **Core Modules**: Comics management, Content CMS (Posts, Categories), User Identity, and Storage.
- **Automated Workflows**: Integrated with AI Agent instructions for consistent development.

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: MySQL / MariaDB
- **Caching**: Redis
- **Auth**: Passport JWT
- **Container**: Docker & Docker Compose

## 📦 Installation

```bash
# 1. Clone & Install
npm install

# 2. Environment Setup
cp .env.example .env

# 3. Database Migration
npx prisma migrate dev

# 4. Seed Initial Data
npm run seed

# 5. Start Development
npm run start:dev
```

## 🐳 Docker Deployment

```powershell
docker compose --env-file .env.docker up --build
```

## 🤖 AI Agent Integration

This project is optimized for AI-assisted development. We use the `.agent/` directory to store project-specific context, rules, and workflows.

- **Instructions**: [instructions.md](./.agent/instructions.md)
- **Architecture Rules**: [architecture.md](./.agent/rules/architecture.md)
- **CRUD Workflows**: [feature-crud-list.md](./.agent/workflows/feature-crud-list.md)
- **New Module Workflow**: Run `/create-module` if using a compatible AI agent.

## 📑 Documentation

The legacy `docs/` directory has been replaced by the dynamic documentation in [.agent/](./.agent/). Please refer to the Agent instructions for the most up-to-date coding standards.
