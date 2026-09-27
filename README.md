# Unfazed — Therapy Practice Management Platform

A full-stack SaaS application for therapists to manage clients, sessions, notes, billing, and analytics.

## Stack

| Layer    | Tech                                                |
|----------|-----------------------------------------------------|
| Frontend | React 18 + Vite, Tailwind CSS v4, React Router DOM  |
| Backend  | Node.js + Express 5, MongoDB + Mongoose             |
| Auth     | JWT (jsonwebtoken) + bcryptjs                       |
| Payments | Razorpay                                            |
| Realtime | Socket.io (WebRTC signaling for video sessions)     |
| Notes    | TipTap rich-text editor                             |
| Charts   | Recharts                                            |
| Calendar | react-big-calendar                                  |

---

## Project Structure

```
Major Project/
├── unfazed-backend/          # Express API server
│   ├── src/
│   │   ├── config/           # DB + multer config
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/        # Auth, error handling, validation
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Email service
│   │   ├── sockets/          # Socket.io video signaling
│   │   ├── utils/            # Helpers (asyncHandler, apiResponse, token)
│   │   └── validators/       # express-validator rules
│   ├── uploads/              # User-uploaded files
│   ├── app.js                # Express app (routes, middleware)
│   ├── server.js             # HTTP + Socket.io server entry
│   ├── .env                  # Local environment variables (gitignored)
│   └── .env.example          # Template for env vars
│
└── unfazed-frontend/         # React + Vite SPA
    ├── src/
    │   ├── api/              # Axios API modules per resource
    │   ├── components/       # Reusable UI components
    │   │   ├── common/       # Button, Input, Modal, Badge, Avatar, Toast, Spinner
    │   │   ├── layout/       # AppLayout, Sidebar, Topbar
    │   │   ├── clients/      # ClientForm
    │   │   ├── sessions/     # SessionForm
    │   │   ├── billing/      # InvoiceForm
    │   │   └── video/
    │   ├── context/          # AuthContext, NotificationContext
    │   ├── hooks/            # Custom hooks
    │   ├── pages/            # Route-level page components
    │   │   ├── auth/         # LoginPage, RegisterPage
    │   │   ├── dashboard/    # DashboardPage
    │   │   ├── clients/      # ClientsPage, ClientDetailPage
    │   │   ├── sessions/     # SessionsPage, SessionDetailPage
    │   │   ├── notes/        # NotesPage, NoteEditorPage
    │   │   ├── billing/      # BillingPage
    │   │   ├── analytics/    # AnalyticsPage
    │   │   └── settings/     # SettingsPage
    │   └── utils/
    └── index.html
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- npm

### 1. Backend setup

```bash
cd unfazed-backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Razorpay keys, SMTP credentials
npm run dev
```

Backend runs on `http://localhost:5000`

### 2. Frontend setup

```bash
cd unfazed-frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## API Endpoints

| Resource       | Base path           |
|----------------|---------------------|
| Health check   | GET /api/health     |
| Auth           | /api/auth           |
| Profile        | /api/profile        |
| Clients        | /api/clients        |
| Sessions       | /api/sessions       |
| Notes          | /api/notes          |
| Invoices       | /api/invoices       |
| Analytics      | /api/analytics      |
| Notifications  | /api/notifications  |

---

## Key Features

- **Authentication** — JWT-based register/login, role-based access (therapist / admin)
- **Client management** — Full CRUD, status tracking, intake forms, session history
- **Session scheduling** — Create, update, cancel, complete sessions with billing rates
- **Video sessions** — WebRTC peer-to-peer video via Socket.io signaling, in-session chat
- **Session notes** — SOAP, DAP, free-form, and progress note formats; TipTap rich text; sign & lock
- **Billing** — Invoice creation, line items, Razorpay payment integration, payment verification
- **Analytics** — Revenue charts, session trends, client growth (Recharts)
- **Notifications** — In-app notification center with real-time badge count
- **Settings** — Profile, avatar upload, password change, working hours

---

## Environment Variables (backend)

See `.env.example` for the full list. Key variables:

```
MONGODB_URI        — MongoDB connection string
JWT_SECRET         — Secret for signing JWTs
RAZORPAY_KEY_ID    — Razorpay API key ID
RAZORPAY_KEY_SECRET— Razorpay API key secret
CLIENT_URL         — Frontend URL for CORS
SMTP_*             — Nodemailer SMTP config
```
