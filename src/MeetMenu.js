const {Menu, app} = require('electron');
const dataStore = require('./DataStore');
const Bus = require('./Bus');
const Icons = require('./Icons');
const ElectronMeet = require('./ElectronMeet');

let contextMenu;
let _tray;

const displayTrayMenu = (tray) => {
    _tray = tray;

    let localPreferences = dataStore.getPreferences();
    const mainMenuTemplate = [{
        label: 'Microphone',
        id: 'is-microphone-on',
        type: 'checkbox',
        accelerator: 'CommandOrControl+Shift+D',
        icon: Icons.microphoneOn,
        click: function () {
            ElectronMeet.status(function (status) {
                Bus.emit('change-microphone', !status.isMicrophoneOn);
            });
        }
    }, {
        label: 'Camera',
        id: 'is-camera-on',
        type: 'checkbox',
        icon: Icons.camera,
        click: function () {
            ElectronMeet.status(function (status) {
                Bus.emit('change-camera', !status.isCameraOn);
            });
            //ElectronMeet.action(mainWindow, lastElectronMeetStatus.isCameraOn ? 'setCameraOff' : 'setCameraOn');
        }
    }, {
        type: 'separator'
    }, {
        label: 'Home',
        click: function () {
            Bus.emit('home');
        }
    }, { 
        label: 'Open in Google Chrome',
        click: function () {
            Bus.emit('open-in-chrome');
        }
    }, {                
        type: 'separator'
    }, {
        label: 'Autoreconnect on startup',
        type: 'checkbox',
        checked: localPreferences.reconnectOnStartup,
        click: function (item) {
            let preferences = dataStore.getPreferences();
            dataStore.setReconnectOnStartup(!preferences.reconnectOnStartup).flush();
            displayMenu(tray)
        }
    }, {
        label: 'Microphone On by default',
        type: 'checkbox',
        checked: localPreferences.microphoneOn,
        click: function (item) {
            let preferences = dataStore.getPreferences();
            dataStore.setPreferenceMicrophoneOn(!preferences.microphoneOn).flush();
            displayMenu(tray)
        }
    }, {
        label: 'Camera On by default',
        type: 'checkbox',
        checked: localPreferences.cameraOn,
        click: function (item) {
            let preferences = dataStore.getPreferences();
            dataStore.setPreferenceCameraOn(!preferences.cameraOn).flush();
            displayMenu(tray)
        }
    }, {
        type: 'separator'
    }];

    dataStore.getCalendar().forEach(function (event) {
        mainMenuTemplate.push({
            label: event.name,
            click: function (menuItem) {
                Bus.emit('open-room', event.id);
            }
        });    
    });

    contextMenu = Menu.buildFromTemplate(mainMenuTemplate);
    tray.setContextMenu(contextMenu);
};

Bus.on('microphone-status', (value) => {
    contextMenu.getMenuItemById('is-microphone-on').checked = value;
});
Bus.on('camera-status', (value) => {
    contextMenu.getMenuItemById('is-camera-on').checked = value;
});
Bus.on('calendar-change', (value) => {
    if (value == null) {
        return;
    }

    if (JSON.stringify(value) == JSON.stringify(dataStore.getCalendar())) {
        return;
    }

    dataStore.setCalendar(value).flush();        
    displayTrayMenu(_tray);
});

const setDockMenu = (app) => {
    const mainMenuTemplate = [{
        label: 'Home',
        click: function () {
            Bus.emit('home');
        }
    }];
    app.dock.setMenu(Menu.buildFromTemplate(mainMenuTemplate));
};

module.exports = {
    displayTrayMenu,
    setDockMenu
}
