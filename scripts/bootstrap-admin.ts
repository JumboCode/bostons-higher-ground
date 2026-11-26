import { config } from "dotenv";

async function main() {
    config({ path: ".env.local", quiet: true });
    config({ quiet: true });

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME;
    if (!email || !password || !name || !process.env.DATABASE_URL) {
        throw new Error("Set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME");
    }

    // Load DB modules only after loading the local environment.
    const { db } = await import("../src/lib/db");
    const { userInfo } = await import("../src/lib/schema");
    const { eq } = await import("drizzle-orm");
    const { createUser } = await import("../src/lib/create-user");
    const existingAdmin = await db.query.userInfo.findFirst({
        where: eq(userInfo.permissions, "admin"),
    });
    if (existingAdmin) {
        throw new Error("An admin already exists; use the admin UI to manage users");
    }

    await createUser({ email, password, name, firstAdmin: true });
    console.log("First admin created successfully");
}

main().catch(() => {
    // Avoid printing database errors that may contain credential parameters.
    console.error("Admin setup failed. Check required environment variables, password length (8–128), and that neither the email nor an admin already exists.");
    process.exitCode = 1;
});
