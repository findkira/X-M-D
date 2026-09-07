const fs = require('fs');
const path = require('path');
const { logInfo, logError } = require('./logger');

function loadPlugins(directory) {
    const plugins = new Map();
    const pluginsPath = path.resolve(directory);
    
    if (!fs.existsSync(pluginsPath)) {
        fs.mkdirSync(pluginsPath, { recursive: true });
    }

    const files = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));
    
    for (const file of files) {
        try {
            const plugin = require(path.join(pluginsPath, file));
            if (plugin.command && plugin.execute) {
                plugins.set(plugin.name || file, plugin);
                logInfo(`Loaded plugin: ${plugin.name || file}`);
            }
        } catch (err) {
            logError(`Failed to load plugin ${file}`, err);
        }
    }
    return plugins;
}

module.exports = { loadPlugins };
