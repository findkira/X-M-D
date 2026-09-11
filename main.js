const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

// This function restores the session from the XMD~ string
async function restoreSession(sessionId) {
    const sessionFolder = path.resolve('./auth_info');

    // If the folder doesn't exist, but we have a session string, decode it
    if (!fs.existsSync(sessionFolder) && sessionId && sessionId.startsWith('XMD~')) {
        console.log('Restoring session from XMD~ string...');
        fs.mkdirSync(sessionFolder, { recursive: true });

        try {
            // Remove the 'XMD~' prefix and decode the Base64
            const base64Data = sessionId.split('XMD~')[1];
            const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
            const sessionData = JSON.parse(jsonString);

            // Write every file back into the auth_info folder
            for (const [filename, fileContent] of Object.entries(sessionData)) {
                fs.writeFileSync(
                    path.join(sessionFolder, filename), 
                    JSON.stringify(fileContent, null, 2)
                );
            }
            console.log('Session restored successfully!');
        } catch (err) {
            console.error('Failed to decode session string. Is it valid?', err);
            process.exit(1);
        }
    }

    // Now load Baileys exactly as normal using the newly restored folder
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    return { state, saveCreds };
}

// How to start your bot using the decoder:
async function startBot() {
    // Read the session string from your environment variables
    const SESSION_ID = process.env.SESSION_ID || ""; 
    
    // Restore and load the state
    const { state, saveCreds } = await restoreSession(SESSION_ID);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('X M D WA BOT is online!');
            // Initialize your plugins here...
        }
    });
}

startBot();
