const { logError, logInfo } = require('./logger');

const messageCount = {};
const commandPrefix = '.';

async function handleMessage(sock, m, plugins) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    messageCount[sender] = (messageCount[sender] || 0) + 1;
    
    if (messageCount[sender] > 7) {
        logInfo(`Spam detected from ${sender}. Blocking user.`);
        await sock.updateBlockStatus(sender, 'block');
        return;
    }

    setTimeout(() => {
        if (messageCount[sender] > 0) messageCount[sender]--;
    }, 10000);

    if (!text.startsWith(commandPrefix)) return;

    const args = text.slice(commandPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    let activePlugin = null;
    for (const [name, plugin] of plugins.entries()) {
        if (plugin.command.includes(commandName) || (plugin.aliases && plugin.aliases.includes(commandName))) {
            activePlugin = plugin;
            break;
        }
    }

    if (activePlugin) {
        try {
            const context = { sock, msg, from: sender, sender, args, text, command: commandName };
            await activePlugin.execute(context);
        } catch (err) {
            logError(`Error executing ${commandName}:`, err);
        }
    }
}

module.exports = { handleMessage };
