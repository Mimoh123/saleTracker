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

### MongoDB connection on Vercel

If you see a connection error after deploying (e.g. "Could not connect to MongoDB"):

1. **Set the env variable in Vercel**  
   In your Vercel project: **Settings → Environment Variables**. Add `MONGODB_URI` with your Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/`). Redeploy after saving.

2. **Allow Vercel to reach Atlas**  
   In [MongoDB Atlas](https://cloud.mongodb.com): **Network Access → Add IP Address → "Allow Access from Anywhere"** (this adds `0.0.0.0/0`). Vercel uses many IPs, so the app must be allowed from anywhere. Save and wait a minute for the change to apply.

3. **Optional: add database name to the URI**  
   Some setups work better with the database in the URL:  
   `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/sales_tracker`

After that, redeploy the project on Vercel.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
