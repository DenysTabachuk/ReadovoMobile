# HTTP transport

Application-owned outbound HTTP uses Axios. SDK-managed traffic (Firebase, Groq,
Expo, Google native sign-in), database connections and inbound servers remain
owned by their respective libraries.

## Frontend

`frontend/api/httpClient` provides the public `httpClient`. The auth feature
exports `api`, an ordinary Axios instance with auth interceptors. Both use the
shared `createHttpClient` factory; neither stores credentials in defaults. Shared
infrastructure does not import features, React or React Query.

Feature requests live in `features/<feature>/api/requests/<name>/index.ts` and
return domain data. Public requests use `httpClient`. Authenticated requests use
the `api` instance exported by the auth feature. Components keep calling their
existing request/query/mutation APIs; no session argument or client hook is needed.

The request interceptor checks the destination origin, captures the session
version before awaiting token storage, and adds the current JWT to Axios's cloned
headers. The response interceptor rejects stale responses and handles 401 with
exactly one refresh/retry. Refresh is shared
within the initiating session version and uses the public client, so it cannot
recursively refresh. Old responses cannot replace or clear a newer session's
tokens. Session changes reject authenticated operations with `AbortError`.

```ts
import { api } from "@/features/auth";

const { data } = await api.get<StreakState>("/streak/profile/me");
```

Interceptors are registered once when the instance is created, not during React
renders. They run before shared error sanitization so auth can retry using the
original Axios config; request config and tokens never escape into UI errors.

## Responses and errors

- Responses use Axios `status` and `data`, never fetch `Response` methods.
- Axios rejects non-2xx responses using its default status validation. The shared
  client converts them to a credential-safe `HttpError`. Request functions return
  successful data directly; `mapHttpError` maps rejections to their domain-specific
  translation keys. Status mappings are reserved for meaningful business cases,
  such as invalid credentials or a duplicate registration.
- Auth handles rejected 401 responses before feature error mapping. Refresh denial
  and a repeated 401 reject the operation; they never resolve as successful data.
- Successful JSON is parsed strictly. Non-JSON error bodies remain available for
  status-based error mapping. Text endpoints must explicitly use
  `responseType: 'text'`. Push-token registration uses this because it does not
  consume a response body; an empty successful response is valid there.
- Axios cancellation becomes `AbortError`, preserving React Query's cancellation
  retry policy. Network and timeout errors are sanitized: callers do not receive
  Axios request/config objects containing credentials or personal payloads.
- Do not log raw Axios errors/configuration, auth response bodies, passwords,
  access/refresh/Google tokens, provider API keys or notification payloads.

No automatic Axios retry or global timeout is introduced. Existing React Query
retry behavior remains unchanged. Quiz generation retains its 60-second abort
timer; with Axios it covers the complete HTTP operation, including body transfer,
rather than ending when fetch received headers. JSON parse failures propagate and
the timer is always cleared. Other requests retain their existing timeout policy.

## Backend

`OutboundHttpModule` provides an injected Nest `HttpService` backed by Axios.
Auth, translations and article discovery import it and use `axiosRef` for their
Promise-based methods. The client has no provider credentials in defaults:
provider-specific URLs, parameters and headers stay in the owning services.

Google tokeninfo and Translate retain their parameter encoding and existing
validation/exception mapping. Wikipedia retains language hosts, encoded titles
and user-agent headers; its HTML endpoint explicitly requests text. The client
follows up to 20 redirects and decompresses responses. Implicit environment proxy
configuration is disabled to retain the previous native-fetch routing behavior.
Transport failures are sanitized before they reach Nest error handling.

Axios 1.21 is used in both projects. `@nestjs/axios` 4.0.1 matches Nest 11 and the
repository's CommonJS/Jest setup; newer ESM-only majors require a separate module
system migration.

## Verification

Frontend tests inject deterministic Axios adapters while retaining real request
serialization, response transforms and interceptors. Existing session-race and
domain contract tests remain in place. Backend tests cover provider contracts and
an actual local HTTP server through the injected module, including redirects,
gzip, JSON/text/empty responses and credential-safe transport failures.

Run `npm run ci:frontend`, `npm run ci:backend`, `npm run typecheck` and
`npm --prefix backend run test:e2e -- --runInBand`. Run `npm run check:staged` when
there is an actual staged snapshot. Expo exports check bundling compatibility;
they do not replace runtime testing on physical devices.
