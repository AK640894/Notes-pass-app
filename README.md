# Offline Password Notes App

A secure, offline-first password manager and secure notes application.

## 🔒 Security Features

- **100% Offline**: No data ever leaves your device.
- **AES-GCM Encryption**: All notes are encrypted using AES-GCM (256-bit).
- **PBKDF2 Key Derivation**: Encryption keys are derived from your PIN on-the-fly.
- **Zero-Knowledge**: Keys are never stored; they exist only in memory while unlocked.
- **Secure PIN Storage**: PIN is stored as a SHA-256 hash with a random salt.

## 🚀 How to Run Locally

You need [Node.js](https://nodejs.org/) installed.

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```

3.  **Open in Browser**
    Click the link shown in the terminal (usually `http://localhost:5173`).

## 📱 Features

- **Setup**: Create a 4-digit PIN on first launch.
- **Lock Screen**: App locks on refresh or restart.
- **Secure Notes**: Add, Edit, and Delete notes.
- **Masking**: Secrets are hidden by default.

## 🛠 Tech Stack

- **React 18**
- **Vite**
- **Web Crypto API** (Native Browser Security)
