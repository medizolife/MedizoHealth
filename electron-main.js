const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');

let mainWindow;
let server;

function createServer(callback) {
  const expressApp = express();
  const PORT = process.env.PORT || 3005;

  const staticPath = path.join(__dirname, 'out');
  const publicPath = path.join(__dirname, 'public');

  expressApp.use(express.static(staticPath));
  expressApp.use(express.static(publicPath));

  expressApp.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Medizo Life Desktop</title>
            <style>
              body { font-family: sans-serif; display: flex; height: 100vh; justify-content: center; align-items: center; background: #142823; color: white; margin: 0; }
              .card { text-align: center; padding: 40px; border-radius: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(102,205,170,0.3); }
              h1 { color: #66CDAA; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Medizo Life Desktop</h1>
              <p>Connecting to Medizo healthcare services...</p>
            </div>
            <script>
              setTimeout(() => { window.location.href = "http://localhost:3000/login"; }, 1500);
            </script>
          </body>
          </html>
        `);
      }
    });
  });

  server = http.createServer(expressApp);
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
    callback(`http://127.0.0.1:${PORT}`);
  }).on('error', (err) => {
    console.log('Using default local server');
    callback('http://localhost:3000/login');
  });
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 900,
    minHeight: 600,
    title: 'Medizo Life Desktop',
    icon: path.join(__dirname, 'public', 'LOGO.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    autoHideMenuBar: true
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Check if dev server is running on 3000, otherwise create embedded server
  const req = http.get('http://localhost:3000/login', (res) => {
    createWindow('http://localhost:3000/login');
  });

  req.on('error', () => {
    createServer((url) => {
      createWindow(url);
    });
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
