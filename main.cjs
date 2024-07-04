const {
    app,
    Tray,
    Menu,
    nativeImage,
    ipcMain,
    globalShortcut,
    screen,
    shell,
    BrowserWindow,
} = require("electron");
try {
    require("electron-reloader")(module);
} catch (_) {}
const path = require("node:path");
const { getInstalledApps } = require("get-installed-apps");
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 60,
        frame: false,
        vibrancy: 'fullscreen-ui',    // on MacOS
        backgroundMaterial: 'acrylic', // on Windows 11
        icon: path.join(__dirname, "assets/logo/512x.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    mainWindow.loadFile("index.html");
    mainWindow.on("closed", function () {
        mainWindow = null;
    });
};
async function getApps() {
    try {
        const apps = await getInstalledApps();

        await Promise.all(apps.map(async (application) => {
            try {
                const fileIcon = await app.getFileIcon(application.DisplayIcon);
                application.iconPath = fileIcon.toDataURL();
            } catch (error) {
                try {
                    application.iconPath = "data:image/x-icon;base64," + base64_encode(path.join(application.InstallLocation, "app.ico"));
                } catch (error2) {
                    application.iconPath = path.join(__dirname, "assets/extensions/application.png");
                }
            }
        }));

        console.log("Sent apps");
        mainWindow.webContents.send("getApps", apps);
    } catch (error) {
        console.error("Error fetching or processing apps:", error);
    }
}

ipcMain.on("apps", (event) => {
    getApps();
    fs.readFile(path.join(__dirname, "packages.json"), (err, data) => {
        if (err) {
            console.error("Error reading packages.json:", err);
            return;
        }
        try {
            const packages = JSON.parse(data);
            mainWindow.webContents.send("loadPackages", packages);
        } catch (parseErr) {
            console.error("Error parsing packages.json:", parseErr);
        }
    });
});

ipcMain.on("close", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.hide();
    console.log("Window closed");
});

function runApp(img, installLocation) {
    if (img !== undefined) {
        exec(`"${img}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error running the application: ${err.message}`);
                runApp(undefined, installLocation);
            }
            console.log(`Application started successfully!`);
        });
    } else {
        fs.readdir(installLocation, (err, files) => {
            if (err) {
                exec(`"${installLocation}"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Error reading directory: ${err}`);
                        return;
                    }
                    console.log(`Application started successfully!`);
                });
            }

            const exeFiles = files.filter(file => file.endsWith('.exe'));

            if (exeFiles.length === 0) {
                console.error('No executable (.exe) files found in the directory: ' + installLocation);
                return;
            }

            const filteredExeFiles = exeFiles.filter(file => {
                const lowerCaseFileName = file.toLowerCase();
                return !(
                    lowerCaseFileName.includes('uninstall') ||
                    lowerCaseFileName.includes('update') ||
                    lowerCaseFileName.includes('unins')
                );
            });

            if (filteredExeFiles.length === 0) {
                console.error('No suitable executable files found in the directory: ' + installLocation);
                return;
            }

            const executablePath = path.join(installLocation, filteredExeFiles[0]);

            exec(`"${executablePath}"`, (err, stdout, stderr) => {
                if (err) {
                    console.error(`Error running the application: ${err.message}`);
                    return;
                }
                console.log(`Application started successfully!`);
            });
        });
    }
}

ipcMain.on("openApp", (event, app) => {
    try {
        runApp(app.DisplayIcon, app.InstallLocation);
    } catch (err) {
        console.error(err);
    }
});

ipcMain.on("openBrowser", (event, url) => {
    if (typeof url === 'string' && /^https?:\/\/[^\s$.?#].[^\s]*$/.test(url)) {
        shell.openExternal(url);
    } else {
        console.error("Invalid URL");
    }
});

ipcMain.on("setSize", (event, size) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.setSize(800, size);
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(parseInt((width - 800) / 2), 100);
});

let tray;
app.whenReady().then(() => {
    const ret = globalShortcut.register("Control+Space", () => {
        console.log("Control+Space is pressed");
        toggleWindow();
    });
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/logo/32x.png'));
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit WindCast', type: 'normal', click: () => {
            globalShortcut.unregister("Control+Space");
            tray.destroy();
            app.quit();
        }},
    ]);
    tray.addListener("click", () => {
        toggleWindow();
    });
    tray.setToolTip('WindCast');
    tray.setTitle('WindCast');
    tray.setContextMenu(contextMenu);
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
    return Buffer.from(bitmap).toString('base64');
}

const toggleWindow = () => {
    if (mainWindow) {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    } else {
        createWindow();
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        mainWindow.setPosition(parseInt((width - 800) / 2), 100);
    }
};

app.on('before-quit', function() {
    tray.destroy();
});
