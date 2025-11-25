/**
 * @file checkPermissions.ts
 * @description Utility functions for role-based access control (RBAC)
 */

"use server";

import { getUserPermission } from "./usersFunction";

/**
 * Check if a user has admin role
 * @param userId - The user ID to check
 * @returns true if user has admin role, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
    const permissions = await getUserPermission(userId);
    return permissions === "admin";
}

/**
 * Get user role based on permissions
 * @param userId - The user ID to check
 * @returns "admin" if user has admin permissions, "user" otherwise
 */
export async function getUserRole(userId: string): Promise<"admin" | "user"> {
    const permissions = await getUserPermission(userId);
    return permissions === "admin" ? "admin" : "user";
}

/**
 * Check if user has required permission
 * @param userId - The user ID to check
 * @param requiredPermission - The required permission level
 * @returns true if user has the required permission or higher
 */
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

