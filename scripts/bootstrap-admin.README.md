# First admin setup

The application has no public bootstrap or sign-up endpoint. To provision the
first admin, set `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`
in your local environment (or an uncommitted `.env.local`), then run:

```sh
pnpm exec tsx scripts/bootstrap-admin.ts
```

Use a unique password of 8–128 characters. Run once against the intended database;
the script refuses to run if an admin already exists and never promotes an
existing account. Remove the admin credentials from your environment after use.
Subsequent users are created through the admin UI and complete normal onboarding.

If the old bootstrap endpoint was exposed, review existing accounts and revoke
any unauthorized accounts/sessions; removing the route does not remove accounts
it already created.
