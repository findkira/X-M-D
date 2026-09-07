const { loadPlugins } = require('./lib/loader');
const { handleMessage } = require('./lib/command');
const { logInfo } = require('./lib/logger');

function initBot(sock) {
    logInfo("Initializing X M D WA BOT logic...");
    
    const plugins = loadPlugins('./plugins');

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        await handleMessage(sock, m, plugins);
    });

    logInfo("Bot is active and listening for events on the provided socket.");
}

module.exports = { initBot };

// Usage example for your external authentication repository:
// const { initBot } = require('./x-m-d-wa-bot/main.js');
// const sock = makeWASocket({ ... auth state ... });
// initBot(sock);
