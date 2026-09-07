const os = require('os');

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

module.exports = { getServerStats, delay };
