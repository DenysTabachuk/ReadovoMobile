# TODO: Support remote push notifications on iOS

Status: TODO. Current remote registration accepts Android FCM tokens only.

## Current boundary

- Backend `notifications/constants.ts` allows only `android` and `fcm`; request
  validation rejects iOS registration. Delivery currently uses Firebase Admin.
- Frontend `learningReminders/service.ts` rejects native token responses whose
  type is not `android`. Merely widening the generated platform union would not
  enable iOS delivery.
- This task concerns remote delivery and learning reminders. Inventory existing
  local notification behavior separately before claiming that all iOS
  notifications are unsupported.

## Scope

- Inspect the actual Expo/native build configuration and SDK versions. Choose and
  document an iOS delivery path: APNs tokens delivered through APNs, or FCM tokens
  obtained through an appropriate native integration with Firebase/APNs configured.
  Keep platform and provider distinct; do not send an APNs token to the existing
  FCM registration/delivery path as though it were an FCM token.
- Document required Apple/Firebase account configuration, bundle ID, signing,
  push capabilities, entitlements, credentials and development/production
  environments for the chosen path. Verify current platform requirements during
  implementation. Do not commit credentials or log token material.
- Implement permission handling, token acquisition/refresh and device registration
  for iOS. Preserve denied-permission behavior and existing Android delivery.
- Update backend-owned DTO validation, persistence and provider routing as needed.
  Preserve ownership, account/device changes, logout/deactivation and invalid-token
  cleanup. Follow the multi-step session-safety rules so an old session cannot
  register a token for a newly signed-in account.
- Extend test push and learning reminder dispatch with the chosen iOS provider
  path, safe failure diagnostics, deduplication and delivery counters. Keep the
  existing distinction between failed delivery results and HTTP request errors.
- Regenerate OpenAPI and frontend transport types from backend contracts; remove
  Android-only assumptions only where iOS is actually supported. Keep native
  platform behavior and UI models owned by the feature.
- Document supported build/device environments and limitations. Keep the offline
  OpenAPI export free of SDK initialization, credentials, network access and jobs.

## Acceptance and verification

- Mock native SDK, persistence and delivery boundaries in automated tests. Cover
  Android regression, iOS registration/provider matching, denied permissions,
  changed accounts, token refresh/deactivation, safe failures and partial delivery.
- Verify test push and scheduled reminder delivery on a suitable physical iOS
  device with the configured build, including foreground/background behavior and
  notification interaction. Record the environments actually tested. Any live
  delivery/configuration work requires the user's intended device/account access;
  do not claim it passed from mocked tests alone.
- Run backend/frontend CI, relevant tests, contract freshness, documentation
  formatting and the actual staged snapshot checks when staged changes exist.
- Coordinate with [learning reminder workflow organization](learning-reminders-service-organization.md)
  rather than recreating the aggregate service. Existing abuse/logging concerns
  remain tracked in the [application abuse audit](application-abuse-risk-audit.md).

Delete this task once support is implemented and verified; keep lasting setup and
provider documentation outside `docs/tasks/`.
