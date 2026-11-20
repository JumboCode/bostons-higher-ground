import { hashPassword } from "better-auth/crypto";
import { db } from "./db";
import { account, user, userInfo } from "./schema";

// Server-only provisioning: callers must enforce their own admin/local access.
// Do not add "use server": this helper must never become a public server action.
export async function createUser(input: {
    email: string;
    name: string;
    password: string;
    firstAdmin?: boolean;
}) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
        throw new Error("A valid email and name are required");
    }
    if (input.password.length < 8 || input.password.length > 128) {
        throw new Error("Password must contain 8 to 128 characters");
    }

    const id = crypto.randomUUID();
    const password = await hashPassword(input.password);
    // Neon HTTP batch executes all three inserts in one transaction.
    const [users] = await db.batch([
        db.insert(user).values({ id, email, name }).returning(),
        db.insert(account).values({
            id: crypto.randomUUID(),
            userId: id,
            accountId: id,
            providerId: "credential",
            password,
            updatedAt: new Date(),
        }),
        db.insert(userInfo).values({
            id: crypto.randomUUID(),
            userId: id,
            authorized: input.firstAdmin === true,
            permissions: input.firstAdmin ? "admin" : "none",
        }),
    ]);
    return users[0];
}
