# Medusa + Astro Storefront Starter

A blazing fast MedusaJS + Astro storefront starter with React islands, optimized for sub-second LCP and 95+ Lighthouse scores. Monorepo setup using Turborepo with pnpm workspaces.

## Using This Template

```bash
# Create a new repo from this template
gh repo create my-store --template christiananese/astro-starter --clone --public

# Or use GitHub's "Use this template" button above
```

## Project Structure

This is a monorepo containing:

- **/apps/backend**: MedusaJS v2 backend (provided from dtc-starter)
- **/apps/storefront**: Astro 5.x + React storefront
- **turborepo**: Manages build and dev pipelines

## Prerequisites

- Node.js v20+
- pnpm installed globally (`npm install -g pnpm`)
- PostgreSQL database

## Setup

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Setup**
   Copy the example environment file in the storefront:

   ```bash
   cp apps/storefront/.env.example apps/storefront/.env
   ```

   Update `apps/storefront/.env` with your Medusa backend URL and publishable key.

3. **Database Setup**
   Ensure your PostgreSQL database is running and configured for the backend. You may need to seed the database:
   ```bash
   pnpm backend:seed
   ```

## Development

Start the development environment for both backend and storefront:

```bash
pnpm dev
```

This will run:

- **Backend:** http://localhost:9000
- **Storefront:** http://localhost:4321

### Specific Commands

- `pnpm backend:dev` - Run only the backend
- `pnpm storefront:dev` - Run only the storefront
- `pnpm lint` - Run linting across all apps
- `pnpm build` - Build all apps for production

## Deployment

### Storefront (Cloudflare Pages)

The storefront is configured for deployment on Cloudflare Pages.

1. Set the build command to: `pnpm --filter @dtc/storefront build`
2. Set the output directory to: `apps/storefront/dist`
3. Add the following environment variables in Cloudflare:
   - `MEDUSA_BACKEND_URL`
   - `MEDUSA_PUBLISHABLE_KEY`
   - `PUBLIC_MEDUSA_PUBLISHABLE_KEY`

### Backend

Deploy the backend to a Node.js compatible hosting provider (e.g., Railway, DigitalOcean). Ensure environment variables are set correctly for database connection and Redis (if used).

## Tech Stack

- **Storefront:** Astro 5.x, Preact/React, Tailwind CSS, Nanostores
- **Backend:** MedusaJS v2, PostgreSQL
- **Tooling:** Turborepo, pnpm
