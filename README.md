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


