# WebAR Backend API

A production-ready NestJS backend for the QR-Based WebAR Product Visualization Platform. Features Prisma 7, PostgreSQL, Cloudflare R2 storage, and comprehensive authentication (Email/Password, Google OAuth, Apple Sign In).

## Setup

```bash
pnpm install
pnpm prisma:migrate
pnpm dev
```

## Features

- 3D Product Items CRUD
- Cloudflare R2 file uploads (GLB/USDZ models)
- QR Code generation
- AR scan analytics tracking
- JWT cookie-based authentication
