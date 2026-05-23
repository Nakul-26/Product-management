# Quick Start (MERN + TypeScript)

```bash
npm install
cp backend/.env.example backend/.env
```

Set a valid `MONGODB_URI` in `backend/.env`.

Start backend and frontend in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open:
- Frontend: `http://localhost:5173`
- API health: `http://localhost:5000/health`
