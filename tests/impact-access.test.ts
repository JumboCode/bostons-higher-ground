import test from "node:test";
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { NextRequest } from "next/server";
const load = createRequire(import.meta.url);
const loader = Module as unknown as {
    _load: (id: string, ...args: unknown[]) => unknown;
};
const original = loader._load;
let authCalls = 0;
loader._load = function (id, ...args) {
    if (id === "./lib/auth")
        return {
            auth: {
                api: {
                    getSession: async () => {
                        authCalls++;
                        throw new Error("auth unavailable");
                    },
                },
            },
        };
    if (id === "./lib/checkPermissions") return { isAdmin: async () => false };
    return original.call(this, id, ...args);
};
const { middleware } = load(
    "../src/middleware"
) as typeof import("../src/middleware");
loader._load = original;
test("public impact does not depend on a working authenticated session", async () => {
    const response = await middleware(
        new NextRequest("http://localhost/impact?design=c")
    );
    assert.equal(response.status, 200);
    assert.equal(authCalls, 0);
});
