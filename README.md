# Portfolio Manager

A personal investment portfolio management application built with **Astro**, **Vue**, **DaisyUI**, and **Firebase**.

## 🚀 Features

- **Google Authentication**.
- **Real-time Database** (Cloud Firestore).
- **Astro + Vue**: High performance SSR/SSG with interactive Vue components.
- **Data Seeding**: Scripts to import CSV transaction history into Firestore.

## 🛠️ Prerequisites

- **Node.js** (v24.0.0+).
- **Firebase Project** (with Auth and Firestore enabled).
- **Security Scanners (macOS)**: Required for local Git hooks and manual secret scanning:
  ```bash
  brew install gitleaks trufflehog
  ```

## 📂 Project Structure

- **/src**: The main Astro and Vue application logic.
- **/scripts**: Utility scripts (e.g., seeding database, migrations, lists).
- **/csv**: Data files for seeding.
- **/account**: Service account keys for admin operations.
- **/dist**: The generated build output (Firebase Hosting public directory).

## ⚙️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configuration

You need to configure your Firebase credentials via environment variables:

1.  Copy the sample `.env.example` (or create one) to `.env`.
2.  Add your `PUBLIC_FIREBASE_*` variables for the frontend.
3.  Add the `USER_ID` variable for the database seeding scripts.

### 3. Seed Database (Optional)

If you have transaction history in CSV format:

1.  Place your CSV files in `csv/`.
2.  Update your `USER_ID` in `.env`.
3.  Run the seed script:
    ```bash
    npm run seed
    ```

## ▶️ Running the App

To start the development server:

```bash
npm run dev
```

## 🛡️ Security & DevSecOps

This project implements a multi-layered security pipeline to ensure safe code deployments and prevent secret leaks (such as Firebase Admin credentials or API tokens).

### 1. Local Pre-commit Hook (Gitleaks)

To prevent accidentally committing sensitive information, we use **Husky** and **Gitleaks**.
Every time you run `git commit`, Husky triggers Gitleaks (`gitleaks protect -v --staged`).
If Gitleaks detects a potential secret in the files you are trying to commit, **the commit will be blocked immediately**.

### 2. Manual Deep Scanner (TruffleHog)

While Gitleaks is fast and runs on every commit, **TruffleHog** is used for deep, comprehensive scanning of the entire repository history. To run a full audit locally:

```bash
npm run scan:secrets
```

_(Requires `trufflehog` to be installed on your system)._

### 3. GitHub Actions CI/CD (CodeQL)

The repository uses a automated **Security Verification** workflow (`.github/workflows/security.yml`).
On every push or pull request to the main branches, **GitHub CodeQL** performs Static Application Security Testing (SAST). Additionally, Firebase deployments are blocked unless both the build CI and CodeQL security checks pass successfully.

_(Note: Ensure you activate Dependabot in GitHub repository settings to keep `package.json` dependencies secure and up-to-date)._

## 🚀 Deployment Scripts

The `package.json` includes several scripts for deploying specific parts of the project to Firebase:

- `npm run deploy:app`: Builds the Astro app and deploys **only** to Firebase Hosting.
- `npm run deploy:db:rules`: Deploys **only** the Firestore security rules (`firestore.rules`).
- `npm run deploy:db:indexes`: Deploys **only** the Firestore indexes (`firestore.indexes.json`).
- `npm run deploy:storage`: Deploys **only** the Firebase Storage rules (`firebase.storage.rules`).
  - _Note: Firebase Storage is not actively used in this project, but its configuration file is kept here securely in version control._
- `npm run deploy:all`: Builds the Astro app and deploys **everything** (app, database rules/indexes, and storage rules) to Firebase.
