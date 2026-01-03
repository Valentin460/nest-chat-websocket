# Real-Time Chat App — Backend (NestJS)

This repository contains the backend of a real-time chat application built with **NestJS**, **WebSockets**, **TypeORM**, and **PostgreSQL**.  
It provides authentication, room management, and real-time message streaming.

## Technologies Used

- NestJS
- WebSockets (Gateway)
- TypeScript
- TypeORM
- PostgreSQL
- JWT authentication

## Features

- Real-time messaging
- Multiple chat rooms
- Basic JWT authentication
- PostgreSQL database
- TypeORM entities and migrations

## Installation

```bash
pnpm install
pnpm start:dev
```

The backend runs on:

```
http://localhost:3001
```

## Environment Variables

Create a `.env` file:

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# JWT
JWT_SECRET=""
```

## Database

Requires a running **PostgreSQL** instance.  
Run migrations if needed:

```bash
pnpm typeorm migration:run
```

## Frontend Communication

- REST endpoints for authentication and metadata
- WebSockets for real-time events

## Author

**Salim Njikam (Art Sider)**  
Web developer learning by building complete, real-time architectures.
