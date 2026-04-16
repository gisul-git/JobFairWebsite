# GISUL Job Fair Landing

Next.js 14 (App Router) + TypeScript + Tailwind + MongoDB (Mongoose) + NextAuth + Resend + Azure Blob.

## Setup

### 1) Clone repo

```bash
git clone <your-repo-url>
cd jobfair-landing
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment variables

Copy the example env file and fill in real values:

```bash
cp .env.example .env.local
```

Required keys live in `.env.local`:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_STORAGE_KEY`
- `AZURE_CONTAINER_NAME`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_*` social/base URLs
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (Credentials provider for admin)

### 4) MongoDB Atlas

- Create an Atlas cluster
- Add a database user
- Whitelist your IP (or allow access from anywhere for development)
- Copy the connection string into `MONGODB_URI`

### 5) Azure Blob Storage

- Create a Storage Account
- Create a container (name = `AZURE_CONTAINER_NAME`)
- Put the storage account name/key into:
  - `AZURE_STORAGE_ACCOUNT`
  - `AZURE_STORAGE_KEY`

### 6) Run dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Admin

### Login

Admin login uses the Credentials provider configured by:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Go to `/admin/login`.

### Create the first admin user (MongoDB)

If you want a real user document to be an admin:

1. Register a normal user via the funnel (Step 2), then find the user in MongoDB.
2. In MongoDB (Compass or shell), set `isAdmin: true`.

Example (Mongo shell):

```js
use <your-db-name>;
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { isAdmin: true } }
);
```

After that, you can adapt the auth flow to use that admin user (instead of env credentials).

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
