# Portfolio Manager

A personal investment portfolio management application built with **Flutter** and **Firebase**.

## 🚀 Features

*   **Google Authentication** (Web & Mobile).
*   **Real-time Database** (Cloud Firestore).
*   **Clean Architecture**: Separated Logic (`services`) and UI (`screens`).
*   **Data Seeding**: Scripts to import CSV transaction history.

## 🛠️ Prerequisites

*   **Node.js** (for seeding scripts).
*   **Flutter SDK** (v3.10+).
*   **Firebase Project** (with Auth and Firestore enabled).

## 📂 Project Structure

*   **/portfolio_app**: The main Flutter application.
*   **/scripts**: Utility scripts (e.g., seeding database).
*   **/csv**: Data files for seeding.
*   **/account**: Service account keys for admin operations.

## ⚙️ Setup

### 1. Install Dependencies

**Root (Scripts):**
```bash
npm install
```

**Flutter App:**
```bash
cd portfolio_app
flutter pub get
```

### 2. Configuration

You need to configure your Firebase credentials in two places:

1.  **Flutter Config**: Edit `portfolio_app/lib/firebase_options.dart` with your API Keys.
2.  **Web Config**: Edit `portfolio_app/web/index.html` and enable the `google-signin-client_id` meta tag.

### 3. Seed Database (Optional)

If you have transaction history in CSV format:

1.  Place your CSV in `csv/`.
2.  Update `scripts/seed_database.js` with your specific **User UID** and file path.
3.  Run the seed script:
    ```bash
    node scripts/seed_database.js
    ```

## ▶️ Running the App

To start the development server (Web):

```bash
cd portfolio_app
flutter run -d chrome
```
