const { getServerStats, delay } = require('../lib/utils');

module.exports = {
    name: "ping",
    command: ["ping"],
    aliases: ["p"],
    description: "Server monitoring command",
    category: "main",
    execute: async (context) => {
        const { sendMessage, from } = context;
        
        const start = Date.now();
        const stats = getServerStats();
        
        await delay(3000);
        
        const latency = Date.now() - start - 3000; 
        
        const responseText = `Pong! Latency: ${latency}ms\n\n${stats}`;
        await sendMessage(from, { text: responseText });
    }
};
