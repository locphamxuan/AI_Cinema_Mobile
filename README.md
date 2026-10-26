# AI Cinema - Mobile

Expo (React Native) app for viewers: browse the catalog, watch episodes, manage the Coin wallet and
membership plan. It talks to the backend (`AI_Cinema_BE`) only through its REST API.

## Getting started

Needs Node.js 20.19+ and the backend running on port 3001 (`docker compose up -d --build` in the
backend repo).

```bash
npm ci
cp .env.example .env     # optional: only needed for a phone on the LAN or a release build
npm start                # Expo dev server; press a (Android), i (iOS) or w (web)
```

`EXPO_PUBLIC_API_URL` points the app at the backend. Without it the Android emulator uses
`http://10.0.2.2:3001/api`, the iOS simulator `http://localhost:3001/api` and web the `/api` proxy of
Metro (`metro.config.js`).

Video is served from the bucket behind `S3_PUBLIC_BASE_URL`. On web the browser needs a CORS rule on
that bucket for the origin the app runs on (for example `http://localhost:8081`).

## Quality gate

```bash
npm run lint
npm run typecheck
npm test               # Jest; `npm run test:cov` also writes coverage/lcov.info for SonarCloud
npx expo export --platform android   # the release bundle must build
```

Rules the code must keep (also enforced in review):

- every playback screen shows the AI label overlay (BR-10);
- an unlock shows how many main and bonus Coins it uses, main first (BR-01);
- the cancel screen shows which side of the 24 h line the member is on (BR-05);
- access is always decided by `GET /episodes/:id/access`, never inferred from client cache.

## Structure

```
app/            Expo Router screens (tabs, movie/[id], watch/[id])
src/components  UI, grouped by feature (player, wallet, chat, auth, ...)
src/services    one module per backend area; apiClient.ts is the only HTTP client
src/store       Zustand store (useAppStore)
src/types       DTOs and view models
src/lib, utils  small helpers (orientation lock, ids, storage, dates)
```

## CI/CD

`.github/workflows/ci.yml`: lint, typecheck, tests with coverage, Android bundle, SonarCloud quality
gate (needs the `SONAR_TOKEN` repository secret) and a production dependency audit. Release builds go
through EAS (`eas.json`: `development`, `preview` APK, `production`):

```bash
npx eas-cli build --platform android --profile preview
```
