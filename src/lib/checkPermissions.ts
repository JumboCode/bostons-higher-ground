"use server";

import { getUserPermission } from "./usersFunction";

export async function isAdmin(userId: string): Promise<boolean> {
    const permissions = await getUserPermission(userId);
    return permissions === "admin";
}

export async function getUserRole(userId: string): Promise<"admin" | "user"> {
    const permissions = await getUserPermission(userId);
    return permissions === "admin" ? "admin" : "user";
}

export async function hasPermission(
    userId: string,
    requiredPermission: "admin" | "user"
): Promise<boolean> {
    if (requiredPermission === "user") {
        // All logged-in users have "user" permission
        return true;
    }
    // For admin, check if user is admin
    return await isAdmin(userId);
}

