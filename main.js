const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
require('dotenv').config();

const { loadPlugins } = require('./lib/loader');
const { handleMessage } = require('./lib/command');
const { logInfo, logError } = require('./lib/logger');

// Restores the local authentication folder from the Base64 session string
async function restoreSession(sessionId) {
    const sessionFolder = path.resolve('./auth_info');

    if (!fs.existsSync(sessionFolder) && sessionId && sessionId.startsWith('XMD~')) {
        logInfo('Restoring session from XMD~ string...');
        fs.mkdirSync(sessionFolder, { recursive: true });

        try {
            const base64Data = sessionId.split('XMD~')[1];
            const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
            const sessionData = JSON.parse(jsonString);

            for (const [filename, fileContent] of Object.entries(sessionData)) {
                fs.writeFileSync(
                    path.join(sessionFolder, filename), 
                    JSON.stringify(fileContent, null, 2)
                );
            }
            logInfo('Session restored successfully!');
        } catch (err) {
            logError('Failed to decode session string. Is it valid?', err);
            process.exit(1);
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    return { state, saveCreds };
}

async function startBot() {
    const SESSION_ID = process.env.SESSION_ID || ""; 
    
    if (!SESSION_ID && !fs.existsSync('./auth_info')) {
        logError("No SESSION_ID found in .env and no existing auth_info folder.");
        process.exit(1);
    }

    const { state, saveCreds } = await restoreSession(SESSION_ID);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const plugins = loadPlugins('./plugins');

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        await handleMessage(sock, m, plugins);
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            logInfo('X M D WA BOT is online!');
            
            try {
                // Get the bot's own WhatsApp number
                const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                
                // Send the startup message to the bot's linked account
                await sock.sendMessage(botNumber, { text: "*XMD STARTED* ✅" });
                logInfo('Startup message sent to owner account.');
            } catch (err) {
                logError('Failed to send startup message:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401; // 401 means logged out
            if (shouldReconnect) {
                logInfo('Connection closed. Reconnecting...');
                startBot();
            } else {
                logError('Device logged out. Please generate a new SESSION_ID.');
                if (fs.existsSync('./auth_info')) {
                    fs.rmSync('./auth_info', { recursive: true, force: true });
                }
                process.exit(1);
            }
        }
    });
}

startBot();
