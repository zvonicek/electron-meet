(() => {

    document.electronMeetStatus = {
        isMediaControlPresent: false,
        isMicrophoneOn: false,
        isCameraOn: false,
        calendarEvents: []
    };

    let electronMeetActions = {

        mediaControlPresent: () => document.querySelectorAll('[data-is-muted]').length > 0,

        domMicrophone: () => document.querySelectorAll('[data-is-muted]')[1],

        domCamera: () => document.querySelectorAll('[data-is-muted]')[3],

        calendarEvents: () => {
            if (document.querySelectorAll('[data-unresolved-meeting-id]').length > 0) {
                return null;
            }

            let elements = document.querySelectorAll('div[data-call-id]');
            var events = [];
            elements.forEach(function(element) {
                events.push({'id': element.getAttribute('data-call-id'), 'name': element.getAttribute('aria-label')});
            });

            return events;
        },

        isMicrophoneOn: () => {
            let selector = electronMeetActions.domMicrophone();
            return selector && selector.dataset.isMuted === "false";
        },

        isCameraOn: () => {
            let selector = electronMeetActions.domCamera();
            return selector && selector.dataset.isMuted === "false";
        },

        setMicrophoneOn: () => {
            let selector = electronMeetActions.domMicrophone();
            if (selector && !electronMeetActions.isMicrophoneOn()) {
                selector.click()
            }
        },

        setMicrophoneOff: () => {
            let selector = electronMeetActions.domMicrophone();
            if (selector && electronMeetActions.isMicrophoneOn()) {
                selector.click()
            }
        },

        setCameraOn: () => {
            let selector = electronMeetActions.domCamera();
            if (selector && !electronMeetActions.isCameraOn()) {
                selector.click()
            }
        },

        setCameraOff: () => {
            let selector = electronMeetActions.domCamera();
            if (selector && electronMeetActions.isCameraOn()) {
                selector.click()
            }
        }
    };
    document.electronMeetActions = electronMeetActions;
})();

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text
    };

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
    window.setInterval(() => {
        document.electronMeetStatus.isMediaControlPresent = document.electronMeetActions.mediaControlPresent();
        document.electronMeetStatus.isMicrophoneOn = document.electronMeetActions.isMicrophoneOn();
        document.electronMeetStatus.isCameraOn = document.electronMeetActions.isCameraOn();
        document.electronMeetStatus.calendarEvents = document.electronMeetActions.calendarEvents();
    }, 300);
});
