const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Endpoint to receive form data
app.post('/api/send-messages', upload.single('messageFile'), async (req, res) => {
    const { yourNumber, targetNumber, delayTime } = req.body;
    const messageFilePath = req.file.path;
    const messages = fs.readFileSync(messageFilePath, 'utf-8').split('\n').filter(Boolean);
    
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);

    const MznKing = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
    });

    MznKing.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;

        if (connection === 'open') {
            console.log('Successfully paired!');

            for (const message of messages) {
                await MznKing.sendMessage(targetNumber + '@c.us', { text: message });
                console.log(`Message sent: ${message}`);
                await new Promise(resolve => setTimeout(resolve, delayTime * 1000)); // Delay between messages
            }

            res.json({ pairingCode: 'Successfully Paired' });
        }

        if (qr) {
            res.json({ pairingCode: qr });
        }
    });

    MznKing.ev.on('creds.update', saveCreds);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
