# Development Setup

## Starting Development Environment

Run both Firebase Emulator and Vite dev server together:

```bash
npm run start-dev
```

This will:
- Start **Firebase Emulator** on `http://localhost:4000` (UI dashboard)
  - Auth emulator: `localhost:9099`
  - Firestore emulator: `localhost:8080`
- Start **Vite dev server** on `http://localhost:5173`

### Individual Commands

If you need to run them separately:

```bash
# Start only Firebase Emulator
npm run start-emulator

# In another terminal, start only Vite dev server
npm run start-vite
```

## Firebase Emulator UI

When running `npm run start-dev`, access the Firebase Emulator UI at:
- **http://localhost:4000**

This dashboard shows:
- Authentication state
- Firestore database documents
- Real-time activity logs

## Environment Variables for Emulator

When using the emulator, set `VITE_USE_EMULATOR=true` in `.env.local`:

```env
VITE_USE_EMULATOR=true
VITE_FIREBASE_API_KEY=any_value_works_with_emulator
VITE_FIREBASE_PROJECT_ID=pb-jam-dev
```

## Troubleshooting

**Port already in use?**
```bash
# Kill process on port 5000 (hosting emulator)
lsof -ti:5000 | xargs kill -9

# Kill process on port 8080 (firestore)
lsof -ti:8080 | xargs kill -9
```

**Emulator won't start?**
```bash
# Clear emulator data and restart
rm -rf ~/.cache/firebase/emulators
npm run start-dev
```

## Next Steps

1. Run `npm run start-dev`
2. Open browser to `http://localhost:5173` (your app)
3. Open another tab to `http://localhost:4000` (Firebase Emulator UI)
4. Test Firebase Auth and Firestore operations
