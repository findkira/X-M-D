const os = require('os');
require('dotenv').config();

const sudoString = process.env.SUDO || "";
const sudoNumbers = sudoString.split(';')
    .map(num => num.replace(/[^0-9]/g, ''))
    .filter(num => num.length > 0);

function isOwner(sock, senderJid) {
    if (!senderJid) return false;
    
    const cleanSender = senderJid.split('@')[0].replace(/[^0-9]/g, '');
    const cleanBot = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
    
    if (cleanSender === cleanBot) return true;
    return sudoNumbers.includes(cleanSender);
}

function getServerStats() {
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const cpuCores = os.cpus().length;
    const cpuModel = os.cpus()[0].model;
    const sysUptime = (os.uptime() / 3600).toFixed(2);
    const botUptime = (process.uptime() / 3600).toFixed(2);
    const platform = os.platform();
    const arch = os.arch();

    return `*Server Status*
OS: ${platform} (${arch})
CPU: ${cpuModel} (${cpuCores} Cores)
RAM: ${usedMem} GB / ${totalMem} GB
System Uptime: ${sysUptime} hours
Bot Uptime: ${botUptime} hours`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { getServerStats, delay, isOwner };
