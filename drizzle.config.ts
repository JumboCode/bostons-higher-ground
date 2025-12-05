import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './src/lib/schema.ts',
    // dialect: 'postgresql',
    driver: "pg",
    dbCredentials: {
        // url: process.env.DATABASE_URL!,
        connectionString: process.env.DATABASE_URL!,
    },
});

