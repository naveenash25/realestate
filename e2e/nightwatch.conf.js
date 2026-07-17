const fs = require('fs');
const path = require('path');
const chromedriver = require('chromedriver');

// Populated by `npm install`'s postinstall hook (scripts/setup-edgedriver.mjs).
// Falls back to Chrome-only usage if Edge isn't installed / wasn't found.
const edgedriverCacheFile = path.join(__dirname, '.edgedriver-path.json');
const edgedriverPath = fs.existsSync(edgedriverCacheFile)
  ? JSON.parse(fs.readFileSync(edgedriverCacheFile, 'utf8')).path
  : null;

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';

module.exports = {
  src_folders: ['tests'],
  output_folder: 'reports',

  webdriver: {
    start_process: true,
    port: 9515,
  },

  test_settings: {
    // Default: Microsoft Edge, headless. Windows ships with Edge by default,
    // so this is the environment most likely to work out of the box here —
    // unlike Chrome, which needs a separate manual install.
    default: {
      launch_url: BASE_URL,
      webdriver: {
        server_path: edgedriverPath,
      },
      screenshots: {
        enabled: true,
        on_failure: true,
        path: 'reports/screenshots',
      },
      desiredCapabilities: {
        browserName: 'MicrosoftEdge',
        'ms:edgeOptions': {
          args: ['--headless=new', '--no-sandbox', '--disable-gpu', '--window-size=1440,1000'],
        },
      },
    },

    // `npm run test:headed` — same as default, visible browser window.
    headed: {
      launch_url: BASE_URL,
      webdriver: {
        server_path: edgedriverPath,
      },
      desiredCapabilities: {
        browserName: 'MicrosoftEdge',
        'ms:edgeOptions': { args: ['--window-size=1440,1000'] },
      },
    },

    // `npm run test:chrome` — for machines with Chrome installed instead of/alongside Edge.
    chrome: {
      launch_url: BASE_URL,
      webdriver: {
        server_path: chromedriver.path,
      },
      screenshots: {
        enabled: true,
        on_failure: true,
        path: 'reports/screenshots',
      },
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless=new', '--no-sandbox', '--disable-gpu', '--window-size=1440,1000'],
        },
      },
    },
  },
};
