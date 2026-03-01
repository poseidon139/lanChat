# lanChat Development Guide

This guide explains how to run, develop, and test the lanChat application locally.

## Architecture 
The project has two components:
1. **Java Backend Server:** Handles the raw TCP socket connections and broadcasts messages to all connected clients.
2. **Node.js Bridge & UI:** Serves a modern HTML/CSS/JS frontend via Express and bridges WebSockets (Browser) to TCP (Java).

---

## 🐳 Running with Docker (Recommended)

The easiest way to run the entire stack and make it accessible across your LAN is via Docker Compose.

### Prerequisites
- Docker Engine & Docker Compose installed

### Commands
1. **Start the application:**
   Because the Docker configuration uses `network_mode: "host"`, the Web UI automatically detects your computer's correct LAN IP.
   ```bash
   # On Linux:
   docker compose up -d --build
   ```
   *(If you are just testing locally and don't care about the LAN UI link, simply run `docker compose up -d --build`)*

2. **Access the Web UI:**
   Open [http://localhost:44901](http://localhost:44901) in your browser.

3. **Stop the application:**
   ```bash
   docker compose down
   ```

---

## 💻 Running Natively (Without Docker)

If you need to debug the code directly without containerizing, you can run the services natively.

### Prerequisites
- Java Development Kit (JDK) 21+ installed
- Node.js 20+ installed

### Step 1: Start the Java Backend
Open a terminal in the project root and run:
```bash
cd backend

# Compile the Java files
javac ChatServer.java ChatClient.java

# Run the server
java ChatServer
```
*(Keep this terminal open)*

### Step 2: Start the Node.js Bridge
Open a second terminal in the project root and run:
```bash
cd bridge

# Install dependencies (only needed the first time)
npm install

# Start the Node UI Bridge
node server.js
```

### Step 3: Use the App
- Open [http://localhost:44901](http://localhost:44901) in your browser.
- You can also connect via the old command line Java Client by running `java ChatClient` inside the `backend/` folder in a third terminal.
