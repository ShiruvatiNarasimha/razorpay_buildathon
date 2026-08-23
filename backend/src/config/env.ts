import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';

// Load .env from backend directory or current working directory
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional().default(() => process.env.GOOGLE_GENAI_API_KEY || ''),
  GEMINI_MODEL: z.string().default('gemini-3.7-flash'),
  OPENAI_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  DEFAULT_USER_ID: z.string().default('usr_demo_fintech_01'),
});

export const env = EnvSchema.parse(process.env);
