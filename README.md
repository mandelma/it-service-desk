# IT Service Desk

A full-stack IT support ticket management application built with **React**, **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, and **Prisma**.

> **Work in progress:** This project is actively being developed. Core backend functionality and initial frontend workflows are implemented, but the interface and additional features are still being refined. It is not yet a production-ready service.

## Overview

IT Service Desk is a portfolio project designed to demonstrate practical full-stack development: building a REST API, implementing authentication and role-based access control, working with a relational database, writing automated integration tests, and connecting a React frontend to a backend service.

Users can create and manage support tickets, while technicians and administrators have additional permissions for handling requests.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React, JavaScript (JSX), Vite, React Router, Material UI, Axios |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Authentication | JWT, bcrypt |
| Validation | Zod |
| Testing | Vitest, Supertest, PostgreSQL test database |
| CI | GitHub Actions |

## Implemented functionality

- JWT-based login and protected API routes.
- Role-based access control for **USER**, **TECHNICIAN**, and **ADMIN**.
- Ticket creation, listing, detail views, and editing workflows.
- Ticket status and priority management.
- Technician self-assignment with safeguards against concurrent assignment.
- Administrative ticket management, including reopening closed tickets.
- User management endpoints with validation and access restrictions.
- Backend integration tests using a separate PostgreSQL test database.
- Automated backend test execution through GitHub Actions.
- Initial responsive application layout using Material UI, including navigation and a mobile sidebar.

## Ticket workflow

The application uses the following ticket statuses:

`OPEN` → `IN_PROGRESS` → `WAITING` / `RESOLVED` → `CLOSED`

Available transitions depend on the user's role and the application's validation rules. Tickets can have the priorities `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.

## Project structure

```text
react-it-service-desk/
├── client/                  # React frontend (Vite)
├── server/                  # Express API (TypeScript)
│   ├── prisma/              # Prisma schema and migrations
│   └── src/
│       ├── routers/         # API routes
│       └── tests/
│           └── integration/ # Backend integration tests
├── docs/                    # Project documentation and test cases
└── .github/
    └── workflows/
        └── backend-tests.yml
```

## Running locally

### Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/mandelma/it-service-desk.git
cd it-service-desk
```

### 2. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Configure the backend

Create a `server/.env` file and configure the database connection and JWT secret for your local environment. For example:

```dotenv
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/it_service_desk?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
```

Create the PostgreSQL database referenced in `DATABASE_URL`, then apply the existing Prisma migrations and generate the Prisma client:

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

> Do not commit `.env` files, database credentials, or JWT secrets to Git.

### 4. Start the backend and frontend

Run these commands in separate terminals:

```bash
# Terminal 1
cd server
npm run dev
```

```bash
# Terminal 2
cd client
npm run dev
```

Open the local address shown by Vite in the terminal. The backend and frontend must both be running for the full application to work.

> **Note:** Depending on your local setup, you may also need to configure the frontend API base URL and create initial user accounts. Setup instructions will be expanded as development continues.

## Testing and continuous integration

Backend integration tests are written with **Vitest** and **Supertest** and run against a **dedicated test database** to avoid modifying development data.

The backend currently has **58 passing integration tests**. GitHub Actions runs the backend test suite on pushes and pull requests to `main`, using a PostgreSQL service container.

```bash
cd server
npm test -- --run
```

For local test execution, configure the separate test database and `server/.env.test` as required by the project's test setup.

## Development status and roadmap

**Current status: Active development.** The API, authentication, core ticket workflows, automated tests, and initial frontend are in place. The UI is being redesigned with Material UI.

Planned improvements include:

- [ ] Complete the responsive navigation and user account menu.
- [ ] Improve ticket list presentation, filtering, and search.
- [ ] Refine ticket forms, validation feedback, and loading states.
- [ ] Add dashboard views and useful ticket statistics.
- [ ] Polish accessibility and mobile usability.
- [ ] Expand frontend testing and project documentation.
- [ ] Add screenshots and deployment/demo instructions when available.

These are development goals, not promises of specific release dates.

## Purpose

This is a **personal learning and portfolio project** showcasing frontend and backend development, database design, API security, testing, and CI practices. The codebase is evolving as new features and improvements are implemented.