const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const os = require('os');
const net = require('net');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // Create a relatively unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});
const upload = multer({ storage: storage });

// Configuration for connecting to the Java Chat Server
const JAVA_SERVER_PORT = 12345;
const JAVA_SERVER_HOST = process.env.JAVA_HOST || 'localhost';
const NODE_SERVER_PORT = 44901;

// API endpoint to get LAN IPs
app.get('/api/lan-urls', (req, res) => {
    const interfaces = os.networkInterfaces();
    const urls = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                urls.push(`http://${iface.address}:${NODE_SERVER_PORT}`);
            }
        }
    }

    // Fallback if no external IP found
    if (urls.length === 0) {
        urls.push(`http://localhost:${NODE_SERVER_PORT}`);
    }

    res.json({ urls });
});

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Construct the URL where this file can be accessed
    // Using a relative path so the client can construct the full URL
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
        url: fileUrl,
        filename: req.file.originalname
    });
});

// Handle Socket.IO connections from web clients
io.on('connection', (socket) => {
    console.log(`Web client connected (Socket.IO): ${socket.id}`);

    // Connect to the Java server for this web client
    const javaClient = new net.Socket();

    javaClient.connect(JAVA_SERVER_PORT, JAVA_SERVER_HOST, () => {
        console.log(`Node bridge connected to Java server for client ${socket.id}`);
    });

    // Handle messages coming FROM the web client
    socket.on('chat message', (msg) => {
        // Send to Java server
        if (!javaClient.destroyed) {
            javaClient.write(`${msg}\n`);
        }
    });

    // Handle messages coming FROM the Java server
    javaClient.on('data', (data) => {
        const messageStr = data.toString().trim();
        // Forward back to THIS web client
        if (messageStr) {
            socket.emit('chat message', messageStr);
        }
    });

    // Handle Java server disconnect
    javaClient.on('end', () => {
        console.log(`Disconnected from Java server for client ${socket.id}`);
        socket.emit('chat message', 'System: Disconnected from Java server.');
    });

    javaClient.on('error', (err) => {
        console.error(`Error connecting to Java server for client ${socket.id}:`, err.message);
        socket.emit('chat message', `System: Failed to connect to Java backend. Is the server running?`);
    });

    // Handle Web Client disconnect
    socket.on('disconnect', () => {
        console.log(`Web client disconnected: ${socket.id}`);
        if (!javaClient.destroyed) {
            javaClient.destroy();
        }
    });
});

server.listen(NODE_SERVER_PORT, '0.0.0.0', () => {
    console.log(`Node UI Bridge running at http://localhost:${server.address().port}`);
});
