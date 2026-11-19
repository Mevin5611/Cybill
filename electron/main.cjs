const {
  app,
  BrowserWindow,
  dialog
} = require('electron');

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const http = require('http');

const isDev = !app.isPackaged;
const PORT = 5000;

let mainWindow = null;
let serverProcess = null;
let newAdminCredentials = null;

function getIconPath() {
  const appPath = app.getAppPath();

  const candidates = [
    path.join(appPath, 'build', 'icon.ico'),
    path.join(appPath, 'build', 'icon.png'),
    path.join(__dirname, '..', 'build', 'icon.ico'),
    path.join(__dirname, '..', 'build', 'icon.png')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function getJwtSecret() {
  const dataDirectory = app.getPath('userData');

  fs.mkdirSync(dataDirectory, {
    recursive: true
  });

  const secretPath = path.join(
    dataDirectory,
    'jwt-secret'
  );

  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(
      secretPath,
      'utf8'
    ).trim();
  }

  const secret = crypto.randomBytes(48).toString('hex');

  fs.writeFileSync(secretPath, secret, {
    mode: 0o600,
    flag: 'wx'
  });

  return secret;
}

function getAdminCredentials() {
  const dataDirectory = app.getPath('userData');

  fs.mkdirSync(dataDirectory, {
    recursive: true
  });

  const credentialsPath = path.join(
    dataDirectory,
    'admin-credentials.json'
  );

  if (fs.existsSync(credentialsPath)) {
    return JSON.parse(
      fs.readFileSync(credentialsPath, 'utf8')
    );
  }

  const credentials = {
    username: 'admin',
    password: 'Admin5611#@'
  };

  fs.writeFileSync(
    credentialsPath,
    JSON.stringify(credentials, null, 2),
    {
      mode: 0o600,
      flag: 'wx'
    }
  );

  newAdminCredentials = credentials;

  return credentials;
}

function startBackend() {
  if (isDev) {
    return;
  }

  const appPath = app.getAppPath();

  const serverPath = path.join(
    appPath,
    'server',
    'dist',
    'server',
    'index.js'
  );

  const clientPath = path.join(
    appPath,
    'client',
    'dist'
  );

  const admin = getAdminCredentials();
  const jwtSecret = getJwtSecret();

  serverProcess = spawn(
    process.execPath,
    [serverPath],
    {
      env: {
        ...process.env,

        ELECTRON_RUN_AS_NODE: '1',

        NODE_ENV: 'production',

        PORT: String(PORT),

        MONGODB_URI:
          'mongodb://127.0.0.1:27017/furnibill',

        CLIENT_DIST_PATH: clientPath,

        JWT_SECRET: jwtSecret,

        ADMIN_JWT_SECRET: jwtSecret,
        ADMIN_USERNAME: admin.username,
        ADMIN_PASSWORD: admin.password
      },

      windowsHide: true,

      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data}`);
  });

  serverProcess.on('error', (error) => {
    console.error(error);
  });
}

function waitForBackend() {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function check() {
      const request = http.get(
        `http://127.0.0.1:${PORT}/health`,
        (response) => {
          response.resume();

          if (response.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        }
      );

      request.on('error', retry);

      request.setTimeout(1000, () => {
        request.destroy();
      });
    }

    function retry() {
      attempts++;

      if (attempts >= 60) {
        reject(
          new Error(
            'Unable to start Cybill backend. Check MongoDB.'
          )
        );

        return;
      }

      setTimeout(check, 1000);
    }

    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    icon: getIconPath(),

    webPreferences: {
      preload: path.join(
        __dirname,
        'preload.cjs'
      ),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    await mainWindow.loadURL(
      'http://localhost:5173'
    );
  } else {
    await mainWindow.loadURL(
      `http://127.0.0.1:${PORT}`
    );
  }
}

app.whenReady().then(async () => {
  try {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.cybill.desktop');
    }

    startBackend();

    await waitForBackend();

    await createWindow();

    // if (newAdminCredentials) {
    //   dialog.showMessageBox(mainWindow, {
    //     type: 'info',
    //     title: 'Cybill admin login',
    //     message: 'Your admin login was created. Save it now.',
    //     detail:
    //       `Username: ${newAdminCredentials.username}\n` +
    //       `Password: ${newAdminCredentials.password}`
    //   });
    // }
  } catch (error) {
    console.error(error);

    dialog.showErrorBox(
      'Cybill Error',
      error.message
    );

    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});