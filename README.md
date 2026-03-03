# Portfolio Manager

A personal investment portfolio management application built with **Astro**, **Vue**, **DaisyUI**, and **Firebase**.

## 🚀 Features

*   **Google Authentication**.
*   **Real-time Database** (Cloud Firestore).
*   **Astro + Vue**: High performance SSR/SSG with interactive Vue components.
*   **Data Seeding**: Scripts to import CSV transaction history into Firestore.

## 🛠️ Prerequisites

*   **Node.js** (v24.0.0+).
*   **Firebase Project** (with Auth and Firestore enabled).

## 📂 Project Structure

*   **/src**: The main Astro and Vue application logic.
*   **/scripts**: Utility scripts (e.g., seeding database, migrations, lists).
*   **/csv**: Data files for seeding.
*   **/account**: Service account keys for admin operations.
*   **/dist**: The generated build output (Firebase Hosting public directory).

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

## 🚀 Deployment Scripts

The `package.json` includes several scripts for deploying specific parts of the project to Firebase:

*   `npm run deploy:app`: Builds the Astro app and deploys **only** to Firebase Hosting.
*   `npm run deploy:db:rules`: Deploys **only** the Firestore security rules (`firestore.rules`).
*   `npm run deploy:db:indexes`: Deploys **only** the Firestore indexes (`firestore.indexes.json`).
*   `npm run deploy:storage`: Deploys **only** the Firebase Storage rules (`firebase.storage.rules`).
    *   *Note: Firebase Storage is not actively used in this project, but its configuration file is kept here securely in version control.*
*   `npm run deploy:all`: Builds the Astro app and deploys **everything** (app, database rules/indexes, and storage rules) to Firebase.
