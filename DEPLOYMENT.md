# BizLink Services — Operations Management System (OMS)
## Production Deployment & Infrastructure Guide

This guide details the steps to deploy the BizLink OMS architecture to production.

---

### 1. System Architecture Overview

```
                      INTERNET / UAE USERS
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [Vercel Cloud]                   [Node.js Host]
     React + Vite Frontend           Express REST Backend
  https://bizlink-phi.vercel.app      (Render / Railway / VPS)
               │                               │
               │ HTTPS API Requests            │
               │ (Authorization: Bearer <JWT>) │
               └──────────────────────────────►│
                                               ▼
                                      [Persistent Storage]
                                      • Database: db.json
                                      • Documents: /uploads/
```

- **Frontend**: Single Page Application built with React, Vite, and TailwindCSS, hosted statically on Vercel.
- **Backend**: Express.js REST API server with bcrypt password encryption, JWT authentication, and fine-grained RBAC middleware.
- **Database**: Relational-structured persistent store (`db.json`) with atomic transactions and clean zero-state initialization.
- **Documents**: Multer disk-based file vault for UAE passports, Emirates IDs, and visas.

---

### 2. Frontend Deployment (Vercel)

The frontend is already linked to Vercel at `https://bizlink-phi.vercel.app`.

#### Step-by-Step Vercel Configuration:
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Open the **bizlink-phi** project.
3. Navigate to **Settings** > **Environment Variables**.
4. Add the following environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<YOUR-DEPLOYED-BACKEND-URL>` *(e.g. `https://bizlink-api.onrender.com`)*
   - **Target**: Production, Preview, Development (all checked).
5. Click **Save**.
6. Trigger a redeploy:
   - Go to the **Deployments** tab.
   - Click the three dots on the latest deployment and select **Redeploy** (ensure "Use existing Build Cache" is unchecked so the new environment variable is embedded into the Vite bundle).

---

### 3. Backend Deployment (Recommended Hosting Platforms)

Because the Express backend uses long-lived HTTP processes and file writes for UAE documents, choose one of the following production Node.js platforms:

#### Option A: Render (Web Service) — Recommended
1. Sign up / log in to [Render](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`bizlink`).
4. Configure service settings:
   - **Name**: `bizlink-oms-api`
   - **Region**: Frankfurt (EU) or closest to UAE (Singapore / Frankfurt)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start` *(or `npm run server:start`)*
   - **Instance Type**: Starter / Standard
5. Add a Persistent Disk (Crucial for UAE Customer Documents & Database):
   - Under **Disks**, click **Add Disk**.
   - **Name**: `bizlink-data`
   - **Mount Path**: `/var/data`
   - **Size**: 10 GB (or as required)
6. Add Environment Variables (see Section 4).
7. Click **Create Web Service**.

#### Option B: Railway (Docker / Node)
1. Sign up / log in to [Railway](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Add a **Volume** mounted at `/var/data`.
4. Set the start command to: `npm run start`.
5. Configure Environment Variables (Section 4).

#### Option C: Ubuntu VPS / Cloud Server (DigitalOcean / AWS EC2)
1. Clone the repository into `/var/www/bizlink`.
2. Run `npm install && npm run build`.
3. Use **PM2** to manage the backend process:
   ```bash
   pm2 start npm --name "bizlink-api" -- run start
   pm2 startup
   pm2 save
   ```
4. Configure Nginx with SSL (Let's Encrypt) to proxy requests to `http://127.0.0.1:5000`.

---

### 4. Required Production Environment Variables

Configure these variables in your backend hosting dashboard (e.g. Render / Railway environment settings):

| Variable Name | Required | Description | Example / Recommended Value |
|---|---|---|---|
| `PORT` | Auto | Port on which Express listens | Automatically set by Render/Railway |
| `CORS_ORIGIN` | **YES** | Allowed frontend origin | `https://bizlink-phi.vercel.app` |
| `JWT_SECRET` | **YES** | Cryptographic secret for signing staff JWTs | Generate via `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Optional | Initial administrator email | `admin@bizlink.ae` |
| `ADMIN_INITIAL_PASSWORD` | Optional | Initial administrator setup password | Secure custom password (min 8 chars) |
| `DATA_DIR` | Optional | Mount path for database storage | `/var/data` (if using persistent disk) |
| `UPLOADS_DIR` | Optional | Mount path for customer uploaded files | `/var/data/uploads` (if using persistent disk) |

---

### 5. CORS Configuration

The Express server (`server/src/index.ts`) allows authenticated requests from:
- `https://bizlink-phi.vercel.app`
- Any additional origins passed to the `CORS_ORIGIN` environment variable.
- Local development origins: `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`.

If you ever change your Vercel production domain (e.g. `https://oms.bizlink.ae`), simply update `CORS_ORIGIN` in your backend dashboard.

---

### 6. Initial Administrator Account Setup

BizLink OMS provides two secure methods to create or update the system administrator account without exposing passwords in source code.

#### Method 1: Environment Variables on First Boot
Set in your backend environment variables:
```env
ADMIN_EMAIL=admin@bizlink.ae
ADMIN_INITIAL_PASSWORD=YourSecureProductionPassword2026!
```
When the database initializes for the first time, it automatically creates the administrator account with these credentials, active status, and full permissions.

#### Method 2: CLI Setup Command (SSH or Render Shell)
In your hosting platform's web console or SSH terminal:
```bash
npm run server:create-admin -- --email="admin@bizlink.ae" --password="YourSecureProductionPassword2026!" --name="Ismail KK"
```
The script will securely hash the password with bcrypt, assign the System Administrator role and all permissions, write to disk, and record the action in the audit log.

---

### 7. How to Test the Backend API

Once deployed, test your backend directly in your terminal:

#### 1. Public Health Check
```bash
curl -X GET "https://<YOUR-BACKEND-URL>/api/health"
```
**Expected Response:**
```json
{
  "status": "online",
  "portal": "BizLink Operations Management System",
  "location": "Dubai, UAE",
  "timestamp": "2026-09-24T..."
}
```

#### 2. Staff Authentication Test (Valid Credentials)
```bash
curl -X POST "https://<YOUR-BACKEND-URL>/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bizlink.ae","password":"YourSecureProductionPassword2026!"}'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr-admin",
    "employeeId": "BL-EMP-0001",
    "name": "System Administrator",
    "email": "admin@bizlink.ae",
    "role": "admin",
    "status": "active"
  }
}
```

#### 3. Rejection Test (Invalid Credentials)
```bash
curl -X POST "https://<YOUR-BACKEND-URL>/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bizlink.ae","password":"wrongpassword"}'
```
**Expected Response (HTTP 401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

#### 4. Protected Route Test (Without Token)
```bash
curl -X GET "https://<YOUR-BACKEND-URL>/api/customers"
```
**Expected Response (HTTP 401 Unauthorized):**
```json
{
  "error": "Access token required"
}
```

---

### 8. Production Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| **"Backend service unavailable (API endpoint not found)"** | `VITE_API_URL` is missing or incorrect in Vercel | Verify that `VITE_API_URL` in Vercel Settings points to your live backend HTTPS URL (e.g. `https://bizlink-api.onrender.com`) and redeploy. |
| **"Unable to connect to the operations server"** | Backend service is sleeping or network error | If using Render Free tier, initial wake-up may take 30–50 seconds. Upgrade to Starter or check the backend hosting logs. |
| **"CORS blocked for origin"** | Frontend origin does not match allowed list | Ensure `CORS_ORIGIN` on your backend contains `https://bizlink-phi.vercel.app` (without trailing slash). |
| **"Invalid email or password"** | Incorrect credentials entered | Use the CLI script `npm run server:create-admin -- --password="..."` to set a known password. |
| **Uploaded files disappear after deployment** | Ephemeral file system without persistent disk | Attach a persistent disk volume to your container (mounted at `/var/data`) and configure `DATA_DIR=/var/data` and `UPLOADS_DIR=/var/data/uploads`. |
