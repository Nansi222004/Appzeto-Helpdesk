# Appzeto Helpdesk

A robust, real-time support ticket system built with Node.js, Express, MongoDB, and React. 
This project perfectly satisfies all the advanced requirements including optimistic locking, SLA computation, load balancing, strict state machines, and background polling.

## Project Structure

This repository is split into three main parts:
- `/backend`: The Node.js + Express + Mongoose API server.
- `/frontend`: The React + Vite client-facing application (Helpdesk Dashboard).
- `/admin`: The React + Vite Admin Panel.

## Features & Implementation Notes

- **Optimistic Locking & Conflict Resolution**: Tested by opening a ticket in two windows. If Window A modifies the status and Window B tries to modify it without refreshing, the backend throws a `409 Conflict`. The UI catches this and displays a side-by-side comparison modal with options to "Take Theirs" or "Retry Mine".
- **Load Balancing**: Tickets are automatically assigned to Riya (max 3), Karan (max 4), or Dev (max 5) based on the lowest percentage of active tickets. If all are full, the ticket is `Queued`.
- **Auto-Assignment**: When an active ticket is `Resolved` or `Closed`, the oldest `Queued` ticket is automatically assigned to the newly freed agent, tracked in the ticket history.
- **Strict State Machine**: The status dropdown only displays legal transitions (`Open` → `In Progress` → `Resolved` → `Closed`). Invalid API requests return a `400 Bad Request`.
- **SLA & Priority Bump**: SLAs are computed in real-time. If an SLA breaches and the ticket is still active, the system automatically bumps the priority exactly once and logs it in the history.
- **Non-intrusive Polling**: The Home Page polls the backend every 5 seconds. State updates gracefully show a toast notification without interrupting scrolling, typing, or dropdown interactions.
- **Glassmorphism UI**: High-end, premium dynamic UI.

---

## Setup & Run Instructions

You will need **three terminal windows** to run the complete environment.

### 1. Run the Backend API
1. Open your first terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Seed the database with sample tasks:
   ```bash
   node seed.js
   ```
4. Start the backend server (runs on `http://localhost:5000`):
   ```bash
   npm run dev
   ```

### 2. Run the Main Helpdesk Frontend
1. Open your second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server (runs on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

### 3. Run the Admin Panel Frontend
1. Open your third terminal and navigate to the admin directory:
   ```bash
   cd admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Admin Vite server (runs on `http://localhost:5174`):
   ```bash
   npm run dev
   ```

You can now open the Helpdesk and Admin panels side-by-side to evaluate the end-to-end functionality!
