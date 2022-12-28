const { app, BrowserWindow, ipcMain, Tray, nativeImage } = require("electron"), server = require("./server");
const url = require("url");
const path = require("path");

app.disableHardwareAcceleration();
function onReady() {
  win = new BrowserWindow({
    title: "RBS",
    width: 1024,
    height: 1024,
    resizable: true,
    devTools: false,
    zoom: false,
    reload: false,
    forceReload: false,
    frame: true,
    menu: false,
  });

  /**
   * Set Icon App
   */
  const icon = nativeImage.createFromPath(
    path.join(app.getAppPath(), "compiler/assets/images/icon/",
      process.platform === "win32" ? "favicon.png" : "favicon.png"
    )
  );
  win.setIcon(icon);
  win.setOverlayIcon(icon, "RBS");

  /**
   * Disable Menu For Production
   */
  win.setMenu(null);
  win.maximize();
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "compiler/index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  // win.loadURL(`http://localhost:4300`)

  /**
   * Dissable open dev tools
   */
  // win.webContents.openDevTools();
}
app.on("ready", onReady);
app.on("window-all-closed", () => {
  app.quit();
});
