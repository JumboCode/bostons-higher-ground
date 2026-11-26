const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute actual route handlers with isolated auth/storage/database dependencies.
function load(file, mocks) {
    const exports = {};
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
        exports, Response, Request, crypto, process, console,
        require: (id) => {
            if (id in mocks) return mocks[id];
            throw new Error(`Unexpected dependency: ${id}`);
        },
    });
    return exports;
}
const request = (body) => new Request('https://example.com/api', {
    method: 'POST', body: JSON.stringify(body),
});

for (const role of [null, undefined, 'none', 'user', 'admin']) {
    test(`user creation enforces admin permission: ${role}`, async () => {
        let created = 0;
        const route = load('src/app/api/users/route.ts', {
            '@/lib/auth': { auth: { api: { getSession: async () => role === null ? null : { user: { id: 'u1' } } } } },
            '@/lib/db': { db: {} }, '@/lib/schema': {}, 'drizzle-orm': {},
            '@/lib/usersFunction': { getUserPermission: async () => role },
            '@/lib/create-user': { createUser: async () => { created++; return { id: 'new' }; } },
        });
        const result = await route.POST(request({ email: 'new@example.com', name: 'New' }));
        assert.equal(result.status, role === null ? 401 : role === 'admin' ? 200 : 403);
        assert.equal(created, role === 'admin' ? 1 : 0);
    });
}

test('unsafe routes and status mutation are removed', () => {
    assert.equal(existsSync('src/app/api/admin/bootstrap/route.ts'), false);
    assert.equal(existsSync('src/app/api/users/permssions/route.ts'), false);
    const route = load('src/app/api/users/status/route.ts', {
        '@/lib/auth': {}, '@/lib/db': {}, '@/lib/schema': {}, 'drizzle-orm': {},
    });
    assert.equal(route.POST, undefined);
    assert.equal(typeof route.GET, 'function');
});

test('password and OTP sign-up are disabled', () => {
    let options;
    load('src/lib/auth.ts', {
        'better-auth': { betterAuth: (config) => { options = config; } },
        'better-auth/adapters/drizzle': { drizzleAdapter: () => ({}) },
        '@/lib/db': { db: {} },
        'better-auth/next-js': { nextCookies: () => ({}) },
        'better-auth/plugins': { emailOTP: (config) => config }, './email': {},
    });
    assert.equal(options.emailAndPassword.disableSignUp, true);
    assert.equal(options.plugins[1].disableSignUp, true);
});

for (const target of [
    'https://store.public.blob.vercel-storage.com/reports/u1/ok.pdf',
    'https://store.public.blob.vercel-storage.com/private/file.pdf',
    'https://store.public.blob.vercel-storage.com/reports/u2/other.pdf',
    'https://evil.example/reports/u1/ok.pdf',
    'https://store.public.blob.vercel-storage.com/reports/u1/../../private/file.pdf',
    'https://store.public.blob.vercel-storage.com/reports/u1/%2e%2e/private.pdf',
    'not a URL',
]) {
    test(`report deletion checks store and ownership: ${target}`, async () => {
        const owned = 'https://store.public.blob.vercel-storage.com/reports/u1/ok.pdf';
        const deleted = [];
        const route = load('src/app/api/reports/upload-pdf/route.ts', {
            '@/lib/auth': { auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } } },
            '@/lib/db': {}, '@/lib/schema': {}, 'drizzle-orm': {},
            '@/lib/generateChart': {}, '@/lib/chart-filter-labels': {}, '@/lib/upload-file': {},
            react: {}, path: require('node:path'),
            '@react-pdf/renderer': { Font: { register() {} }, StyleSheet: { create: (s) => s } },
            '@vercel/blob': {
                list: async ({ prefix, cursor }) => {
                    assert.equal(prefix, 'reports/u1/');
                    return cursor ? { blobs: [{ url: owned, pathname: 'reports/u1/ok.pdf' }], hasMore: false }
                        : { blobs: [], hasMore: true, cursor: 'page2' };
                },
                del: async (url) => { deleted.push(url); },
            },
        });
        const result = await route.DELETE(request({ url: target }));
        assert.equal(result.status, target === owned ? 200 : 403);
        assert.deepEqual(deleted, target === owned ? [owned] : []);
    });
}

test('provisioning hashes credentials and writes all account records in one batch', async () => {
    const { hashPassword, verifyPassword } = await import('better-auth/crypto');
    const batches = [];
    const db = {
        insert: (table) => ({ values: (values) => ({ table, values, returning() { return this; } }) }),
        batch: async (statements) => {
            batches.push(statements);
            return [[statements[0].values], [], []];
        },
    };
    const { createUser } = load('src/lib/create-user.ts', {
        'better-auth/crypto': { hashPassword }, './db': { db },
        './schema': { user: 'user', account: 'account', userInfo: 'userInfo' },
    });
    for (const firstAdmin of [false, true]) {
        const result = await createUser({ email: ' Admin@Example.com ', name: ' Admin ', password: 'unique-local-test-password', firstAdmin });
        const records = batches.at(-1);
        assert.equal(records.length, 3);
        assert.equal(result.email, 'admin@example.com');
        assert.equal(records[1].values.userId, result.id);
        assert.equal(records[1].values.accountId, result.id);
        assert.equal(records[1].values.providerId, 'credential');
        assert.equal(await verifyPassword({ hash: records[1].values.password, password: 'unique-local-test-password' }), true);
        assert.equal(records[2].values.permissions, firstAdmin ? 'admin' : 'none');
        assert.equal(records[2].values.authorized, firstAdmin);
    }
    await assert.rejects(createUser({ email: 'a@example.com', name: 'A', password: 'short' }));
    assert.equal(batches.length, 2);
});
