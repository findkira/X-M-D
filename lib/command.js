const { logError, logInfo } = require('./logger');
const { safeSendMessage } = require('./message');

const messageCount = {};
const processedMessages = new Set();
const commandPrefix = '.';

async function handleMessage(sock, m, plugins) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const msgId = msg.key.id;
    if (processedMessages.has(msgId)) return;
    processedMessages.add(msgId);

    if (processedMessages.size > 500) {
        const iterator = processedMessages.values();
        for (let i = 0; i < 100; i++) {
            processedMessages.delete(iterator.next().value);
        }
    }

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
            const context = { 
                sock, 
                msg, 
                from: sender, 
                sender, 
                args, 
                text, 
                command: commandName,
                sendMessage: (jid, content, options) => safeSendMessage(sock, jid, content, options)
            };
            await activePlugin.execute(context);
        } catch (err) {
            logError(`Error executing ${commandName}:`, err);
        }
    }
}

module.exports = { handleMessage };
