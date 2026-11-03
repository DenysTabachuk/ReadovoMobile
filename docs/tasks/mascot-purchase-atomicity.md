# TODO: Make mascot purchases atomic

Status: TODO. Found during OpenAPI migration; existing behavior was preserved.

## Observed boundary

`backend/src/mascot/mascot.service.ts`, `buyItem`, reads ownership and balance,
then debits the user before calling `addOwnedItem`. These writes do not share a
transaction. A persistence failure after the debit can leave coins deducted
without granting the item. Concurrent purchase safety also needs verification.
This finding comes from code review; no live database or deployment was tested.

## Work and verification

- Make the balance/ownership check, debit and ownership grant one atomic workflow.
  Handle concurrent purchases, including the existing already-owned success,
  without duplicate charges, lost owned items or spending below the allowed balance.
- Preserve authorization, HTTP statuses, successful profiles and public errors;
  update the OpenAPI contract if intentional behavior changes require it.
- Add a rollback regression for an ownership-write failure after a successful
  debit, and database-backed concurrent purchase tests with controlled fixtures.
  Use mocked/local boundaries; do not spend real user coins.
- Run backend checks and relevant purchase HTTP/transaction tests.

This is a focused follow-up to the
[application abuse risk audit](application-abuse-risk-audit.md).
