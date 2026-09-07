const { sendInteractiveUrlButton } = require('../lib/message');
const { delay } = require('../lib/utils');

module.exports = {
    name: "alive",
    command: ["alive"],
    aliases: [],
    description: "Check bot status",
    category: "main",
    execute: async (context) => {
        const { sock, from } = context;
        
        await delay(3000);
        
        await sendInteractiveUrlButton(
            sock, 
            from, 
            "Running!", 
            "Check", 
            "https://instagram.com/"
        );
    }
};
