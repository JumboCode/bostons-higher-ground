# Draft question for PM / tech lead

> I found the handoff's Neon project link and shared Google sign-in instructions.
> For #114, can you confirm which branch is production and help us obtain a
> disposable child branch from it? If the shared sign-in needs MFA or additional
> branch-management permissions, who should help with that? I need to verify
> migration-history reconciliation for 0000–0005 and then normal migration of
> 0006 on the disposable branch, without modifying production. Please share
> any branch connection through our usual secret-sharing channel.

Do not paste database credentials into an issue or PR. For a supplied branch,
set `NEON_TEST_DATABASE_URL` in the local `.env.local` and identify the branch's
endpoint separately for the reconciliation tool's target confirmation.

## What was checked

- Recovered the original handoff attachment from the October 27 conversation.
  It contains a direct Neon project/branch console link and says to sign in
  through the shared Google account. Its database endpoint matches the app's
  current `.env.local`; that connection must not be assumed to be disposable.
- The handoff contains no separate disposable branch URL, branch-creation
  instructions, or Neon management API token. Console authentication and
  branch permissions still need to be verified. Do not copy the credentials or
  full handoff into this public repository.

- [Issue #114](https://github.com/JumboCode/bostons-higher-ground/issues/114):
  requires a Neon branch test, but has no comments or access instructions.
- [Issue #103](https://github.com/JumboCode/bostons-higher-ground/issues/103):
  points to a handoff guide in Slack; no guide link or Neon instructions in the issue.
- Issue/PR search for `neon`: #108 supplies no access instructions; #22 contains
  an old database connection, not management access or a disposable branch.

This revised draft is only needed if console access or branch creation cannot
be completed using the handoff. No message or GitHub comment has been sent.
