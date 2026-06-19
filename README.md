# Gurujan - Collaborative Publishing Portal

Gurujan is a collaborative space for writers, educators, and creators to share and discover articles on education, society, spirituality, and mental health. 

This repository has been structured with a clean separation between the Frontend and Backend services.

---

## Directory Structure

```text
Blog-Publisher-Pro/
├── Backend/                 # Standalone Express + MongoDB Server (Node/TypeScript)
└── Blog-Publisher-Pro/      # Frontend React + Vite Application (TypeScript/Tailwind CSS)
```

---

## 1. Backend Setup & Run

The backend is built with **Node.js**, **Express**, **TypeScript**, and **MongoDB** (Mongoose).

### Prerequisites
- Make sure you have **Node.js** installed.
- Ensure **MongoDB** is running locally on your system (`mongodb://localhost:27017`) or have a MongoDB Atlas connection string ready.

### Installation
Go to the `Backend` directory:
```bash
cd Backend
```
Install the dependencies:
```bash
npm install
```

### Environment Variables
Configure your environment variables in the `.env` file inside the `Backend` folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog_publisher_pro
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### Run Server
- **Development Mode** (with hot-reloading using `tsx`):
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

---

## 2. Frontend Setup & Run

The frontend is built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, using **pnpm** for package management.

### Installation
Go to the `Blog-Publisher-Pro` directory:
```bash
cd Blog-Publisher-Pro
```
Install the dependencies:
```bash
pnpm install
```

### Run Application
- **Development Mode**:
  ```bash
  pnpm run dev
  ```
  The app will run at `http://localhost:5173/`. 
  
  *Note: Vite dev server is preconfigured with a proxy that routes `/api` requests to the backend server running at `http://localhost:5000`.*

- **Production Build**:
  ```bash
  pnpm run build
  ```
  This generates the static site bundle inside the `dist` folder.

---

## Technical Details & Architecture

- **Database:** MongoDB (Mongoose models for User, Blog, Category, Album, Media, Comment, ContactMessage, PageView).
- **Authentication:** Cookie-based JWT authentication (`/api/auth`).
- **Media Support:** Supports uploading images and organizing them into albums.
- **Analytics:** Internal dashboard tracking page views and visitor statistics.
