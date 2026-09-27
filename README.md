# Unfazed — Therapy Practice Management Platform

> A full-stack SaaS platform for therapists to manage clients, sessions, clinical notes, billing, and analytics.

**Live demo:** https://unfazed-seven.vercel.app  
**API:** https://unfazed-3t20.onrender.com/api/health

---

## Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 18 + Vite, Tailwind CSS v4, React Router v7    |
| Backend  | Node.js 20 + Express 5, MongoDB + Mongoose           |
| Auth     | JWT (jsonwebtoken) + bcryptjs                        |
| Payments | Razorpay                                             |
| Realtime | Socket.io (WebRTC signaling for video sessions)      |
| Notes    | TipTap rich-text editor                              |
| Charts   | Recharts                                             |
| Calendar | react-big-calendar                                   |
| Email    | Nodemailer                                           |
| PDF      | PDFKit                                               |
| Security | Helmet + express-rate-limit                          |
| Deploy   | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## Features

- **Authentication** — JWT register/login, role-based access (therapist / admin)
- **Client management** — profiles, status tracking, intake forms, session history
- **Session scheduling** — create, update, cancel, complete; recurring sessions; calendar view
- **Video sessions** — WebRTC peer-to-peer via Socket.io signaling, in-session chat
- **Clinical notes** — SOAP, DAP, free-form, progress formats; TipTap rich text; sign & lock
- **Billing** — invoice creation with line items, Razorpay payment flow, payment verification
- **Exports** — invoice PDF, note PDF, sessions/invoices/clients CSV
- **Analytics** — revenue trends, session frequency, client growth (Recharts)
- **Availability** — working hours management with slot calculator
- **Subscription plans** — Free / Basic / Pro / Enterprise via Razorpay
- **Admin panel** — platform-wide user management and stats
- **Notifications** — in-app notification centre with badge count
- **Settings** — profile, avatar upload, password change, working hours

---

## Project Structure

```
Unfazed/
├── unfazed-backend/          # Express API
│   ├── src/
│   │   ├── config/           # DB + multer
│   │   ├── controllers/      # 12 controllers
│   │   ├── middleware/       # auth, errorHandler, validate
│   │   ├── models/           # 7 Mongoose models
│   │   ├── routes/           # 12 route files
│   │   ├── services/         # email, PDF, recurring
│   │   ├── sockets/          # WebRTC signaling
│   │   ├── utils/            # asyncHandler, apiResponse, token
│   │   └── validators/
│   ├── app.js
│   ├── server.js
│   └── .env.example
│
└── unfazed-frontend/         # React + Vite SPA
    ├── src/
    │   ├── api/              # 11 Axios API modules
    │   ├── components/       # Button, Input, Modal, Badge, Avatar, Toast, Spinner, ErrorBoundary
    │   ├── context/          # AuthContext, NotificationContext
    │   ├── hooks/            # useDebounce, useLocalStorage, usePagination, useApi
    │   ├── pages/            # LandingPage + 15 app pages
    │   └── utils/            # download.js, formatters.js
    ├── vercel.json           # SPA routing rewrites
    └── .env.example
```

---

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB (local) or MongoDB Atlas URI

### Backend

```bash
cd unfazed-backend
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, RAZORPAY keys, SMTP creds
npm run dev
# → http://localhost:5000
```

### Frontend

```bash
cd unfazed-frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
# → http://localhost:5173
```

---

## Deployment

### Backend → Render

| Setting        | Value             |
| -------------- | ----------------- |
| Root Directory | `unfazed-backend` |
| Build Command  | `npm install`     |
| Start Command  | `node server.js`  |
| Node version   | 20                |

**Required environment variables on Render:**

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32+ char random string>
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=<gmail app password>
FROM_EMAIL=your@gmail.com
FROM_NAME=Unfazed
CLIENT_URL=https://unfazed-seven.vercel.app
MAX_FILE_SIZE=5242880
```

### Frontend → Vercel

| Setting          | Value              |
| ---------------- | ------------------ |
| Root Directory   | `unfazed-frontend` |
| Framework        | Vite               |
| Build Command    | `npm run build`    |
| Output Directory | `dist`             |

**Required environment variables on Vercel:**

```
VITE_API_URL=https://unfazed-3t20.onrender.com/api
VITE_SOCKET_URL=https://unfazed-3t20.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_test_...
VITE_APP_NAME=Unfazed
```

---

## API Endpoints

| Resource      | Base path            |
| ------------- | -------------------- |
| Health        | `GET /api/health`    |
| Auth          | `/api/auth`          |
| Profile       | `/api/profile`       |
| Clients       | `/api/clients`       |
| Sessions      | `/api/sessions`      |
| Notes         | `/api/notes`         |
| Invoices      | `/api/invoices`      |
| Analytics     | `/api/analytics`     |
| Notifications | `/api/notifications` |
| Exports       | `/api/export`        |
| Availability  | `/api/availability`  |
| Subscription  | `/api/subscription`  |
| Admin         | `/api/admin`         |

---

## License

MIT
