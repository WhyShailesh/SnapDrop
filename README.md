# Snapdrop

A **secure, code-based data sharing platform**. Upload a file, image, or text and get a short unique code. Anyone with the code can access the content. Data is encrypted (AES-256), temporary, and privacy-focused.

## Features

- **Upload** files, images, or text (drag & drop)
- **Short codes** (6–8 characters, uppercase alphanumeric)
- **Code-only access** — no login required
- **End-to-end style encryption** (AES-256-GCM; key derived from code)
- **Self-destruct**: delete after one download, or after X minutes/hours
- **Real-time transfer**: receiver can download while upload is in progress (WebSocket)
- **LAN support**: use the same WiFi without internet by pointing the app to your machine’s IP

## Tech Stack

| Layer    | Stack                          |
|----------|---------------------------------|
| Frontend | React, Vite, Tailwind CSS, Axios, Socket.io client |
| Backend  | Node.js, Express, Socket.io, Multer, Crypto |
| Database | MongoDB (with TTL index for auto-delete) |

## Project structure

```
codedrop/
├── backend/           # Express + Socket.io API
│   ├── config/        # DB connection
│   ├── middleware/    # Rate limiting
│   ├── models/        # MongoDB Drop schema
│   ├── routes/        # REST: create drop, upload, get by code
│   ├── utils/         # Crypto, code generation
│   ├── server.js      # Entry + WebSocket logic
│   └── .env.example
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── components/ # Upload, Code display, Code entry, Download
│   │   └── lib/        # API, crypto, socket, stream upload/receive
│   └── .env.example
└── README.md
```

## Setup

### Prerequisites

- **Node.js** 18>
- **MongoDB** (local or Atlas)

### 1. Backend

```bash
cd codedrop/backend
cp .env.example .env
# Edit .env: set MONGODB_URI and optionally ENCRYPTION_PEPPER (32-byte hex)
npm install
npm run dev
```

Server runs at **http://localhost:3001** (or `PORT` from `.env`).

### 2. Frontend

```bash
cd codedrop/frontend
cp .env.example .env
# Optional: set VITE_API_URL for LAN (e.g. http://192.168.1.100:3001)
npm install
npm run dev
```

App runs at **http://localhost:5173**. API and Socket.io are proxied to the backend when `VITE_API_URL` is not set.

### 3. Environment variables

**Backend (`.env`)**

| Variable              | Description |
|-----------------------|-------------|
| `PORT`                | Server port (default 3001) |
| `MONGODB_URI`         | MongoDB connection string |
| `ENCRYPTION_PEPPER`   | Optional 32-byte hex; used only for code hash (not key derivation) |
| `RATE_LIMIT_WINDOW_MS`| Rate limit window (default 15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window (default 100) |

**Frontend (`.env`)**

| Variable        | Description |
|-----------------|-------------|
| `VITE_API_URL`  | Backend URL. Leave empty for same-origin (proxy). Set to `http://<your-ip>:3001` for LAN. |

### LAN (same WiFi, no internet)

1. On the machine running the backend, find your local IP (e.g. `192.168.1.100`).
2. Start backend: `cd backend && npm run dev` (listens on `0.0.0.0`).
3. On other devices, set `VITE_API_URL=http://192.168.1.100:3001` and build, or run the frontend with that env and open `http://192.168.1.100:5173`.
4. Alternatively, run frontend with `VITE_API_URL=http://192.168.1.100:3001 npm run dev` and share `http://192.168.1.100:5173` so others use your machine as the server.

## API

| Method | Path               | Description |
|--------|--------------------|-------------|
| POST   | `/api/drops`       | Create drop (JSON: `text`, `oneTime`, `expiresInMinutes`/`expiresInHours`) → returns `code` |
| POST   | `/api/drops/upload`| Create drop from multipart file |
| GET    | `/api/drops/:code` | Get drop by code (returns encrypted payload + salt/iv/authTag for client decryption) |

Rate limiting applies; code-check endpoint has a stricter limit (e.g. 30 attempts per 15 min).

## WebSocket (Socket.io)

- **`create_stream_drop`** — Create a streaming drop; server returns `code`. Then send **`stream_chunk`** (base64 chunks) and **`stream_complete`** when done. Server encrypts and stores in MongoDB.
- **`join_drop`** — Receiver joins by code; gets existing chunks and new **`stream_chunk`** events; **`stream_complete`** when sender finishes.

## Security

- Files/content are encrypted (AES-256-GCM) before storage; key derived from code + salt (PBKDF2).
- Only a hash of the code is stored (for validation).
- Code validation is rate-limited.
- TTL index in MongoDB deletes expired drops automatically.

## License

MIT.
