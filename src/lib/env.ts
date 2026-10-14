import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("anon-key-placeholder"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default("service-role-placeholder"),
  DATABASE_URL: z.string().optional().default("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().default("mailto:transport@college.edu"),
  DRIVER_JWT_SECRET: z.string().min(16).default("super-secret-driver-jwt-key-minimum-32-chars"),
  CRON_SECRET: z.string().default("super-secret-cron-token"),
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().default("https://tiles.openfreemap.org/styles/positron"),
  NEXT_PUBLIC_DEFAULT_CENTER: z.string().default("78.4867,17.3850"),
  NEXT_PUBLIC_CAMPUS_NAME: z.string().default("Main campus"),
  ALLOWED_EMAIL_DOMAIN: z.string().optional().default(""),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  DRIVER_JWT_SECRET: process.env.DRIVER_JWT_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
  NEXT_PUBLIC_DEFAULT_CENTER: process.env.NEXT_PUBLIC_DEFAULT_CENTER,
  NEXT_PUBLIC_CAMPUS_NAME: process.env.NEXT_PUBLIC_CAMPUS_NAME,
  ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN,
});
