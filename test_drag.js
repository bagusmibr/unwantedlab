const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({
    webPreferences: { contextIsolation: true }
  });
  win.loadURL('data:text/html,<body><div id="d" style="width:100px;height:100px;background:red;">Drop here</div><script>document.getElementById("d").addEventListener("dragover", e=>e.preventDefault()); document.getElementById("d").addEventListener("drop", e=>{e.preventDefault(); console.log(e.dataTransfer.files[0].path);});</script></body>');
});
