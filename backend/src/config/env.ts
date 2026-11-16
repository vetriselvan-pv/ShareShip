import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file into process.env
dotenv.config();

/**
 * Zod Schema for Environment Variables Validation
 * Based on: "Validating Environment Variables in Node.js using Zod"
 * Ensures type safety, fail-fast startup, and self-documenting configuration.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  APP_AES_SECRET: z.string().min(16, 'APP_AES_SECRET must be at least 16 characters long'),
  CURRENCY_CODE: z.string().default('INR'),
  CURRENCY_SYMBOL: z.string().default('₹'),
});

// Parse process.env against the schema.
// If any variable is missing or invalid, fail-fast and crash immediately at startup.
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

// Export the validated, type-safe environment configuration
export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;

// Augment NodeJS.ProcessEnv for global TypeScript autocompletion
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
