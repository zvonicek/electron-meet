const {app, globalShortcut, BrowserWindow, Tray} = require('electron');
const path = require('path');

const Bus = require('./src/Bus');
const menu = require('./src/MeetMenu');
const ElectronMeet = require('./src/ElectronMeet');
const dataStore = require('./src/DataStore');
const Icons = require('./src/Icons');
const Touchbar = require('./src/Touchbar');
const { exec } = require("child_process");
const {init, action, status} = require('./src/ElectronMeet');

let mainWindow, tray, lastImage;

const addShortcut = () => {
    const ret = globalShortcut.register('CommandOrControl+Shift+D', () => {
        status((currentStatus) => {
            action(currentStatus.isMicrophoneOn ? 'setMicrophoneOff' : 'setMicrophoneOn');
        });
        return 1;
    });

    if (!ret) {
        console.log('Enregistrement racourci échoué')
    }
};

const createMenu = () => {
    tray = new Tray(Icons.microphoneOn);
        
    tray.on('drop-text', function(event, url) {
        if (dataStore.isValidUrl(url)) {
            mainWindow.loadURL(url);
        }
    });    

    menu.displayTrayMenu(tray);
};

const storePosition = () => {
    let position = mainWindow.getPosition();
    let size = mainWindow.getSize();
    dataStore.setPosition(position[0], position[1], size[0], size[1]).flush();
};

const initializePage = ()=> {
    setTimeout(() => {
        mainWindow
            .webContents
            .executeJavaScript(`document.electronMeetActions.mediaControlPresent()`)
            .then(function (mediaControlPresent) {
                if (mediaControlPresent) {
                    if (!dataStore.getPreferences().microphoneOn) {
                        action('setMicrophoneOff')
                    }
                    if (!dataStore.getPreferences().cameraOn) {
                        action('setCameraOff')
                    }
                }
            });
    }, 600)

}

const watcher = () => {
    ElectronMeet.status(function (status) {
        Bus.emit('microphone-status', status.isMicrophoneOn);
        Bus.emit('camera-status', status.isCameraOn);
        Bus.emit('calendar-change', status.calendarEvents);
        let image = status.isMicrophoneOn ? Icons.microphoneOn : Icons.microphoneOff;
        if (lastImage !== image) {
            tray.setImage(image);
            lastImage = image;
        }
    });
};

const createWindow = () => {
    if (mainWindow) {
        mainWindow.show();
        return;
    }
    mainWindow = new BrowserWindow({
        x: dataStore.position.x,
        y: dataStore.position.y,
        width: dataStore.position.width,
        height: dataStore.position.height,
        icon: Icons.application,
        webPreferences: {
            preload: path.join(__dirname, 'web/meet-watcher.js')
        }
    });
    init(mainWindow)

    mainWindow.on('resize', storePosition);

    mainWindow.on('moved', storePosition);

    mainWindow.on('closed', function () {
        mainWindow = null;
        init(mainWindow);
    });

    mainWindow.webContents.on('dom-ready', function () {
        dataStore.addHistory(mainWindow.webContents.history[mainWindow.webContents.history.length - 1]).flush();
        menu.displayTrayMenu(tray);
        initializePage();
    });

    mainWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        require('electron').shell.openExternal(url);
      });

    mainWindow.loadURL(dataStore.getInitialUrl());
    mainWindow.setTouchBar(Touchbar);
};

Bus.on('open-room', (tag) => {
    createWindow();
    mainWindow.loadURL(dataStore.getRoomUrl(tag));
});

Bus.on('home', (tag) => {
    createWindow();
    mainWindow.loadURL(dataStore.getHomeUrl());
});

Bus.on('open-in-chrome', (tag) => {
    exec('/usr/bin/open -a "/Applications/Google Chrome.app" "' + mainWindow.webContents.getURL() + '"');
});

app.whenReady().then(() => {
    addShortcut();
    createMenu();
    createWindow();
    setInterval(watcher, 200);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    createWindow();
});

app.on('will-finish-launching', () => {
    menu.setDockMenu(app);

    app.on('open-url', function(event, url) {
        if (dataStore.isValidUrl(url)) {
            mainWindow.loadURL(url);
        }
    });
});