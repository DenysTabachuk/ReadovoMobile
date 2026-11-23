---
name: readovo-emulator-check
description: Run Readovo Android emulator checks after substantial user-facing changes or when a device walkthrough is requested. Verify affected flows against the local API, preserve emulator accounts and app data, and report observed results.
---

# Readovo emulator check

Read repository instructions and the current feature task before testing. Use this
workflow proactively after substantial UI, navigation or API-to-UI integration
changes. A small documentation or isolated utility edit does not need a device run.

## Start the existing local environment

- Inspect running services, ADB devices and installed app before launching more.
  Use the existing AVD and `com.readovo.mobile`; preserve its app data and accounts.
- Check Docker Engine availability first. If it is stopped, start the existing
  Docker Desktop in the background, then use root `npm run db:up` to start the
  configured PostgreSQL service. Wait for database readiness; preserve volumes.
  Do not recreate or reseed an existing database merely to launch the app.
- Use repository scripts: backend `npm --prefix backend run start:dev`, frontend
  `npm --prefix frontend run start:local -- --dev-client`. Check script output for
  the actual API/Metro address. Use ADB reverse for local ports where appropriate.
  Prefer reusing the installed development client over rebuilding unchanged native
  code. Do not silently switch to a deployed backend or a mock server.
- Verify that the development client is connected to the current Metro instance
  and local API. Before the walkthrough, reload JavaScript or restart only
  `com.readovo.mobile` if it restored stale state. ADB `am force-stop` followed by
  reopening its development-client link preserves data and login. Do not wipe
  app storage, reinstall or cold-boot the whole emulator as a routine refresh.
- If ordinary startup is blocked by the sandbox, request the specific execution
  escalation rather than changing application code to bypass the restriction.
- Prefer device-scoped ADB screenshots and input for Android UI checks, as described
  below. Native Windows computer-use is a fallback when the user makes the desktop
  available; follow that tool's observation/action rules and restrictions.
- Run staged-snapshot checks before starting the walkthrough or after finishing it.
  Lint-staged temporarily hides unstaged/untracked dependencies and can cause Metro
  resolution errors. After restoration, reload; if the error persists despite the
  file existing, restart only the identified Metro process with `--clear` and reload.

## Avoid interfering with the user's desktop

Capture only the selected Android device display or emulator window for visual
checks. Do not request a whole-desktop screenshot by default. If a window capture unexpectedly shows
another app, discard it as an unusable observation rather than inspecting that
app. Full-desktop capture is reserved for a concrete diagnostic need the user
has been told about.

Use an explicit serial from `adb devices -l` on every command, for example
`adb -s emulator-5554`. ADB `shell input tap`, `swipe` and `keyevent` address the
Android device without moving the Windows pointer, activating a Windows window or
typing into another desktop app. Do not replace them with global Windows input.
For example, `adb -s emulator-5554 shell input tap <x> <y>` taps a device pixel;
`adb -s emulator-5554 shell input swipe <x1> <y1> <x2> <y2> 400` scrolls the device.
ADB control does not depend on the Windows computer-use helper being available.

Observe the Android display before selecting coordinates. Capture with
`adb -s <serial> shell screencap -p /data/local/tmp/readovo-qa.png`, then pull that
file to a host temporary directory and inspect it with the image-viewing tool.
This captures the device display, not the Windows desktop. The device-file/pull
sequence also avoids PNG corruption from binary redirection in older PowerShell.
Perform one state-derived action, capture again and inspect its outcome before
choosing the next action. Refresh observations after navigation or layout changes;
do not reuse coordinates from stale screens. UI hierarchy dumps may supplement
screenshots, but do not extract credentials or unrelated account data.

Keep screenshots temporary and remove task-created captures after verification.
Use ordinary app navigation and existing authorization; device-scoped input does
not authorize bypassing authentication, permission prompts or other tool restrictions.
If using Windows computer-use instead, check its real behavior: methods that
activate their target window are foreground input. Stop those actions while the
user works; do not repeatedly raise the emulator or retry clicks against another app.

## Authorization and sign-in

Starting the emulator and walking through the affected local feature are part of
the user's requested development verification. Do not ask again whether to run
them. Reuse an authenticated app session first.

The user has authorized the existing emulator Google account for Readovo local
checks. If signed out, use the ordinary Google sign-in route when the available
tool permits it; do not ask the user to choose Google versus supplying credentials
again. This does not authorize a different account, new OAuth scopes or account
creation. Do not request, extract, log or store account passwords or tokens.

If the selected tool prohibits authentication interaction, respect that concrete
restriction: leave the login visible and request only the required user takeover,
explaining the exact tool/skill restriction. Resume independent checks while
waiting, then continue the same walkthrough after login. Do not invent an auth
bypass or weaken production authentication.

## Verify the affected behavior

Derive a focused walkthrough from the actual diff and feature acceptance criteria.
Exercise the real UI-to-API path, correct/incorrect actions, feedback, navigation,
results and retry where relevant. Check loading/error recovery without corrupting
local data. Include supported locale/theme combinations when the change affects
text, layout or theme. Inspect scoped runtime errors without exposing credentials.

For Vocabulary, cover catalogue, lesson overview, both ten-word card blocks,
word-to-picture, audio-to-picture, sentence gaps and mixed practice. Verify locked
choices, correct/incorrect feedback, result counts and retry reset. Sample images
may still be placeholders; do not report actual image delivery or persisted
progress as working until implemented. Distinguish speech controls from audible
playback: a screenshot alone does not establish that sound was heard.

Fix task-related regressions, rerun affected automated checks and repeat the failed
device path. Keep unrelated problems separate. Avoid expanding into an entire-app
audit or claiming every scenario was covered.

Record what was observed, what failed and what remains untested in the feature task
or review report. Leave the emulator and development services available unless the
user requests shutdown. Preserve staging; follow repository snapshot-check rules.
