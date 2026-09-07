const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { logError } = require('./logger');

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

        await sock.relayMessage(jid, interactiveMessage.message, { messageId: interactiveMessage.key.id });
    } catch (err) {
        logError("Failed to send native flow message. Compatibility error:", err);
    }
}

module.exports = { sendInteractiveUrlButton };
