const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/views'));

// Serve the HTML file for the frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

let MznKing; // Store the WhatsApp connection globally to access it later

io.on('connection', (socket) => {
    console.log("New client connected");

    socket.on('start-session', async () => {
        try {
            console.log("Initializing WhatsApp session...");
            const { state, saveCreds } = await useMultiFileAuthState(`./session`);
            MznKing = makeWASocket({
                auth: state,
                logger: { level: 'silent' },
                printQRInTerminal: false, // Disable QR printing in terminal
            });

            MznKing.ev.on('connection.update', async (update) => {
                const { connection, qr } = update;

                if (qr) {
                    console.log("Sending QR code to client...");
                    const qrCodeUrl = await QRCode.toDataURL(qr);
                    socket.emit('qr', qrCodeUrl); // Emit the QR code URL to the frontend
                }

                if (connection === 'open') {
                    socket.emit('status', 'Successfully connected! You can now enter message details.');
                    console.log("WhatsApp connection successfully established.");
                }
            });

            MznKing.ev.on('creds.update', saveCreds);
        } catch (error) {
            console.error("Error during session setup:", error);
            socket.emit('status', 'Error setting up session.');
        }
    });

    socket.on('send-messages', async ({ targetNumber, messages, interval }) => {
        console.log("Received details to send messages.");
        try {
            for (const message of messages) {
                await MznKing.sendMessage(targetNumber + '@s.whatsapp.net', { text: message });
                console.log(`Message sent: ${message}`);
                socket.emit('status', `Message sent: ${message}`);
                await new Promise((resolve) => setTimeout(resolve, interval * 1000));
            }
            socket.emit('status', 'All messages sent!');
        } catch (error) {
            console.error("Error sending messages:", error);
            socket.emit('status', 'Failed to send messages.');
        }
    });

    socket.on('disconnect', () => {
        console.log("Client disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
