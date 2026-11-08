# Draft question for PM / tech lead

> For #114's migration-history stretch goal, which Neon project owns our
> production database, and who can create a disposable child branch from it?
> Could you grant the appropriate branch-management access or provide a test
> branch connection through our usual secret-sharing channel? I need to test
> marking migrations 0000–0005 as applied and then running the normal migrator
> for 0006, without changing production. #103 mentions a Slack handoff guide;
> could you point me to the current guide if it includes Neon setup?

Do not paste database credentials into an issue or PR. For a supplied branch,
set `NEON_TEST_DATABASE_URL` in the local `.env.local` and identify the branch's
endpoint separately for the reconciliation tool's target confirmation.

## What was checked

- [Issue #114](https://github.com/JumboCode/bostons-higher-ground/issues/114):
  requires a Neon branch test, but has no comments or access instructions.
- [Issue #103](https://github.com/JumboCode/bostons-higher-ground/issues/103):
  points to a handoff guide in Slack; no guide link or Neon instructions in the issue.
- Issue/PR search for `neon`: #108 supplies no access instructions; #22 contains
  an old database connection, not management access or a disposable branch.

This is a draft only. No message or GitHub comment has been sent.
