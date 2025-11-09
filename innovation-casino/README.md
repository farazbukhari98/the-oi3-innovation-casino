## Innovation Casino

A three-screen, real-time voting experience used to reveal an organization's innovation culture during live events. Participants join from their phones, the facilitator guides the session from a control panel, and a projector-ready display visualises progress, results, and the final culture gap reveal. Sessions can now string together multiple scenarios in a single run, letting teams compare perspectives across several strategic bets without restarting the experience.

---

### Project Structure

```
src/
├── app/                 # App Router routes (participant, control, display)
├── components/          # Casino-themed UI, display views, control widgets
├── context/             # Global session & participant providers
├── hooks/               # Firebase-backed real-time hooks
├── lib/                 # Firebase helpers, socket client, utilities
├── styles/              # Tailwind v4 theme + mobile overrides
└── types/               # Shared TypeScript models
server/
└── socket-server.js     # Next.js + Socket.io hybrid server
```

---

### Environment

Create `innovation-casino/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Launches the hybrid Next.js + Socket.io dev server (http://localhost:3000). |
| `npm run dev:next` | Runs plain `next dev` for quick UI iteration without Socket.io. |
| `npm run build` | Builds the production bundle. |
| `npm run start` | Starts the hybrid server in production mode (requires `npm run build`). |
| `npm run lint` | ESLint with Next.js Core Web Vitals rules. |
| `npm run typecheck` | TypeScript static analysis (`--noEmit`). |
| `npm run test` | Convenience smoke test (TypeScript `--noEmit`). |

---

### Local Development Checklist

1. Ensure Firebase Realtime Database is enabled and rules mirror `plans/02-phase-1-infrastructure.md`.
2. Run `npm run dev` and open:
   - `http://localhost:3000` for the landing page.
   - `http://localhost:3000/control` for the facilitator panel.
   - `http://localhost:3000/display` for the projector view.
3. Use the Join QR code or `http://localhost:3000/join?session=<id>` to register participant devices.

---

### Deployment Notes

- A sample `vercel.json` is included to streamline Vercel deployments and map secrets to the production environment.
- The custom Socket.io server must run for both dev and production. Use `npm run start` after `npm run build`, or deploy behind a Node-friendly host (Vercel, Render, Fly.io, etc.).
- Keep Firebase credentials in Vercel’s environment settings (`NEXT_PUBLIC_*` keys).

---

### Testing & Quality

- `npm run test` runs the TypeScript smoke test (`tsc --noEmit`).
- UI polish includes projector-safe typography, mobile-safe touch targets, success overlays, and global error boundaries.
- For manual rehearsal, create a session via the control panel, register a couple of test devices, and walk through both voting phases to the culture gap reveal.
