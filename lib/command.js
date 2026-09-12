const { logError, logInfo } = require('./logger');
const { safeSendMessage } = require('./message');
const { isOwner } = require('./utils');
require('dotenv').config();

const messageCount = {};
const processedMessages = new Set();
const botAct = (process.env.BOT_ACT || 'public').toLowerCase();

// Parse PREFIX from environment variable
let prefixes = ['.'];
if (process.env.PREFIX) {
    const rawPrefix = process.env.PREFIX.trim().toLowerCase();
    if (rawPrefix === 'null' || rawPrefix === 'false' || rawPrefix === '') {
        prefixes = ['']; // Empty string means no prefix is required
    } else {
        // Support multiple prefixes separated by commas (e.g., ".,#,$")
        prefixes = process.env.PREFIX.split(',').map(p => p.trim()).filter(p => p.length > 0);
    }
}

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

    // Check if the message starts with any of the allowed prefixes
    let matchedPrefix = null;
    for (const p of prefixes) {
        if (text.startsWith(p)) {
            matchedPrefix = p;
            break;
        }
    }

    if (matchedPrefix === null) return; // Not a command

    const ownerStatus = isOwner(sock, sender);

    if (botAct === 'private' && !ownerStatus) {
        return;
    }

    // Extract command name and arguments dynamically based on prefix length
    const textWithoutPrefix = text.slice(matchedPrefix.length).trim();
    if (!textWithoutPrefix) return; // Ignore if user only sends the prefix symbol alone
    
    const args = textWithoutPrefix.split(/ +/);
    const commandName = args.shift().toLowerCase();

    let activePlugin = null;
    for (const [name, plugin] of plugins.entries()) {
        if (plugin.command.includes(commandName) || (plugin.aliases && plugin.aliases.includes(commandName))) {
            activePlugin = plugin;
            break;
        }
    }

    if (activePlugin) {
        if (activePlugin.ownerOnly && !ownerStatus) {
            return;
        }

        try {
            const context = { 
                sock, 
                msg, 
                from: sender, 
                sender, 
                args, 
                text, 
                command: commandName,
                isOwner: ownerStatus,
                sendMessage: (jid, content, options) => safeSendMessage(sock, jid, content, options)
            };
            await activePlugin.execute(context);
        } catch (err) {
            logError(`Error executing ${commandName}:`, err);
        }
    }
}

module.exports = { handleMessage };
