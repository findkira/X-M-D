const logInfo = (msg) => console.log(`[INFO] ${msg}`);
const logError = (msg, err) => console.error(`[ERROR] ${msg}`, err || "");

module.exports = { logInfo, logError };
