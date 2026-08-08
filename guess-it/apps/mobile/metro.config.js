const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: engine + content are TS source packages outside the app dir
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.extraNodeModules = {
  '@guess-it/engine': path.resolve(workspaceRoot, 'packages/engine/src'),
  '@guess-it/content': path.resolve(workspaceRoot, 'packages/content/src'),
};

module.exports = config;
