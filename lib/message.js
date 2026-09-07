const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { logError, logInfo } = require('./logger');
const { delay } = require('./utils');

const messageQueue = [];
let isProcessingQueue = false;
let lastSendTime = 0;
const MIN_SEND_DELAY_MS = 2000;

async function processQueue() {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
        const task = messageQueue.shift();
        
        const now = Date.now();
        const timeSinceLastSend = now - lastSendTime;
        
        if (timeSinceLastSend < MIN_SEND_DELAY_MS) {
            await delay(MIN_SEND_DELAY_MS - timeSinceLastSend);
        }

        try {
            await task.execute();
        } catch (err) {
            logError("Error executing queued message task:", err);
        }
        
        lastSendTime = Date.now();
    }

    isProcessingQueue = false;
}

function enqueueMessage(executeFn) {
    return new Promise((resolve, reject) => {
        messageQueue.push({
            execute: async () => {
                try {
                    const result = await executeFn();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            }
        });
        processQueue();
    });
}

async function safeSendMessage(sock, jid, content, options = {}) {
    return enqueueMessage(() => sock.sendMessage(jid, content, options));
}

async function safeRelayMessage(sock, jid, message, options = {}) {
    return enqueueMessage(() => sock.relayMessage(jid, message, options));
}

async function sendInteractiveUrlButton(sock, jid, text, buttonText, buttonUrl) {
    try {
        const interactiveMessage = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: text
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: " " 
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            title: "",
                            subtitle: "",
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: buttonText,
                                        url: buttonUrl,
                                        merchant_url: buttonUrl
                                    })
                                }
                            ]
                        })
                    })
                }
            }
        }, { userJid: sock.user.id });

        await safeRelayMessage(sock, jid, interactiveMessage.message, { messageId: interactiveMessage.key.id });
    } catch (err) {
        logError("Failed to send native flow message. Compatibility error:", err);
    }
}

module.exports = { safeSendMessage, safeRelayMessage, sendInteractiveUrlButton };
