# 🔧 JoinUP Environment Setup Guide

This guide will help you get all the required environment variables and API keys for the JoinUP platform.

## 📋 **Services Required:**

1. ✅ **Firebase** (Auth + Firestore) - NO Storage needed
2. ✅ **Google Drive API** - For certificate storage  
3. ✅ **Gmail SMTP** - For email notifications
4. ✅ **JWT Secret** - For secure tokens

---

## 🔥 **1. Firebase Setup (Auth + Firestore Only)**

### Step 1: Create Firebase Project
```bash
# Open Firebase Console
https://console.firebase.google.com
```

1. Click "Create a project"
2. Name: `joinup-platform` (or your choice)
3. **Disable** Google Analytics (not needed)
4. Click "Create project"

### Step 2: Enable Required Services

**Authentication:**
1. Go to "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Enable "Email/Password"
4. Add `localhost` to authorized domains

**Firestore Database:**
1. Go to "Firestore Database" → "Create database"
2. Choose "Start in production mode"
3. Select closest location
4. Click "Done"

**❌ Skip Firebase Storage** - We're using Google Drive instead!

### Step 3: Get Frontend Keys

1. Go to "Project Settings" (gear icon)
2. Scroll to "Your apps" → Click Web icon `</>`
3. Register app: `JoinUP Frontend`
4. Copy the config values to your `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Get Backend Keys

1. In "Project Settings" → "Service accounts" tab
2. Click "Generate new private key"
3. Download JSON file (keep it secure!)
4. Extract values for `server/.env`:

```env
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=abc123def456
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
```

---

## 📁 **2. Google Drive API Setup**

### Step 1: Enable Drive API
```bash
# Open Google Cloud Console
https://console.cloud.google.com
```

1. Select your Firebase project (same project ID)
2. Go to "APIs & Services" → "Library"
3. Search "Google Drive API" → Enable

### Step 2: Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name: `joinup-drive-service`
4. Description: `Certificate storage for JoinUP`
5. Skip role assignment → Click "Done"

### Step 3: Generate Key
1. Click on created service account
2. Go to "Keys" tab
3. "Add Key" → "Create New Key" → "JSON"
4. Download the JSON file

### Step 4: Create & Share Drive Folder
1. Go to drive.google.com
2. Create folder: "JoinUP Certificates"
3. Right-click → "Share"
4. Add the service account email: `joinup-drive-service@your-project-id.iam.gserviceaccount.com`
5. Give "Editor" permissions
6. Copy folder ID from URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

### Step 5: Add to Environment
```env
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_DRIVE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_CLIENT_EMAIL=joinup-drive-service@your-project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-from-step-4
```

---

## 📧 **3. Gmail SMTP Setup**

### Step 1: Enable 2FA
1. Go to Google Account → Security
2. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. In Security settings, search "App passwords"
2. Generate password for "Mail"
3. Copy the 16-character password

### Step 3: Configure Environment
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@tce.edu
SMTP_PASS=your-16-character-app-password
```

---

## 🔐 **4. Other Configuration**

### JWT Secret
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Complete server/.env
```env
# Server
PORT=5000
NODE_ENV=development

# Firebase (from steps above)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase keys

# JWT
JWT_SECRET=your-generated-64-char-hex-secret

# Email (from step 3)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@tce.edu
SMTP_PASS=your-app-password

# Google Drive (from step 2)
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_CLIENT_EMAIL=joinup-drive-service@your-project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@tce.edu,faculty@tce.edu

# Frontend URL
CLIENT_URL=http://localhost:5173

# Gamification settings
DAILY_LOGIN_POINTS=10
WEEKLY_LOGIN_BONUS=50
MONTHLY_LOGIN_BONUS=200
```

---

## 🔒 **5. Setup Firestore Rules**

1. In Firebase Console → Firestore Database → Rules
2. Copy content from `firestore.rules` file
3. Click "Publish"

---

## 🚀 **6. Test the Setup**

### Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### Start Servers
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server
npm run dev
```

### Test Everything
1. Open http://localhost:5173
2. Try registering with @student.tce.edu email (use 16-digit register number)
3. Check console logs for any errors
4. Upload a test file to verify Google Drive integration

---

## ❌ **What We DON'T Use:**

- ❌ Firebase Storage (we use Google Drive instead)
- ❌ Firebase Cloud Functions (we use Express server)
- ❌ Firebase Hosting (separate deployment)
- ❌ Any other Google Cloud services

---

## 🆘 **Troubleshooting**

**Firebase Auth Error:**
- Check if email domain validation is working
- Verify all Firebase keys are correct

**Google Drive Upload Fails:**
- Verify service account has access to shared folder
- Check Drive API is enabled
- Ensure private key format is correct (with \n characters)

**Email Not Sending:**
- Verify Gmail app password (not regular password)
- Check 2FA is enabled on Gmail account

**CORS Errors:**
- Add localhost to Firebase authorized domains
- Check backend CORS configuration in server.ts

Need help? Check the logs in both frontend and backend consoles for specific error messages!
