# Task: Make the backend own the streak freeze-token limit

Status: planned. Created after the unused-code audit identified a duplicated
business rule. This task records the follow-up; no implementation is included.

## Problem

The backend owns `MAX_FREEZE_TOKENS = 3` in
`backend/src/streak/streak.service.ts` and enforces it when purchasing a token.
The frontend independently defines `STREAK_MAX_FREEZE_TOKENS = 3` in
`frontend/features/streak/constants.ts`. StreakFreezeCard uses that duplicate to
display the token count and disable purchases.

Changing the backend limit can therefore leave the UI showing the wrong capacity
or disabling valid purchases. The streak response already supplies freezeTokens
and freezeTokenPrice, but does not supply the maximum token count.

## Scope

1. Add a required `maxFreezeTokens` field to the streak profile/state response.
   Populate it from the same backend-owned constant used for purchase validation;
   keep the current value and business behavior unchanged. Update the domain type,
   response DTO and Swagger metadata together. Cover every endpoint returning
   this response, including mutation responses.
2. Regenerate `backend/openapi/openapi.json` and
   `frontend/api/generated/transport.d.ts` through repository commands. Never
   edit generated artifacts manually or import backend source into frontend code.
3. Pass the response field through the owning frontend screen to StreakFreezeCard.
   Use it for the capacity display and purchase-button state. Remove the frontend
   constant and its file if nothing else remains. Do not introduce another numeric
   fallback duplicating the backend rule.
4. Update affected fixtures, mocks and any runtime response validation. Preserve
   auth/session handling and mutation cache behavior. Keep the backend purchase
   check authoritative even when the client bypasses its disabled button.

Read repository instructions, frontend conventions and
[the OpenAPI contract guide](../openapi-contract.md) before implementation.
Keep this separate from streak localization and unused-code cleanup. Do not
change pricing, rewards, freeze application rules, persistence or unrelated UI.

## Acceptance and verification

- HTTP contract tests verify the actual serialized maxFreezeTokens field and its
  required numeric schema across the affected responses.
- Backend tests preserve rejection at capacity and successful purchase below it.
- Frontend tests supply a server limit different from three and verify both the
  displayed capacity and enabled/disabled purchase behavior at its boundary.
  Preserve balance and in-progress purchase safeguards.
- There is one backend-owned limit; the frontend has no hardcoded replacement.
- Run `npm run contracts:generate`, `npm run contracts:check`,
  `npm run ci:backend`, `npm run ci:frontend` and `npm run audit:unused`.
  Run `npm run check:staged` when a staged snapshot exists, preserving user staging.
- Consider deployment order: the backend must expose the required field before
  an updated mobile client depends on it. Document any compatibility requirement
  without silently falling back to a duplicated frontend limit.

Delete this task document after implementation and verification are complete.
