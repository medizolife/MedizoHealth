const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;
let server;

const PORT = 3005;
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain'
};

function createLocalServer(callback) {
  const staticPath = path.join(__dirname, 'out');
  const publicPath = path.join(__dirname, 'public');

  server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';

    let filePath = path.join(staticPath, reqUrl);

    // Try reading file from staticPath (out/) or publicPath
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // Try reading from public folder
        const pubPath = path.join(publicPath, reqUrl);
        fs.readFile(pubPath, (pubErr, pubData) => {
          if (!pubErr) {
            const ext = path.extname(pubPath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            return res.end(pubData);
          }

          // SPA Fallback: check if .html extension works or fallback to index.html
          const htmlPath = filePath.endsWith('.html') ? filePath : filePath + '.html';
          fs.readFile(htmlPath, (htmlErr, htmlData) => {
            if (!htmlErr) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              return res.end(htmlData);
            }

            const indexPath = path.join(staticPath, 'index.html');
            fs.readFile(indexPath, (indexErr, indexData) => {
              if (!indexErr) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end(indexData);
              }

              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Not Found');
            });
          });
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`ASAR-native local server running at http://127.0.0.1:${PORT}`);
    callback(`http://127.0.0.1:${PORT}`);
  }).on('error', (err) => {
    callback(`http://127.0.0.1:${PORT}`);
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
      userAgent: CHROME_USER_AGENT
    },
    autoHideMenuBar: true
  });

  Menu.setApplicationMenu(null);

  // Configure window open handler for Google OAuth popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 600,
        height: 700,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          userAgent: CHROME_USER_AGENT
        }
      }
    };
  });

  mainWindow.loadURL(startUrl, { userAgent: CHROME_USER_AGENT });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createLocalServer((localUrl) => {
    createWindow(localUrl);
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

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow(`http://127.0.0.1:${PORT}`);
  }
});
