const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const souceBtn = document.getElementById('sourceBtn');

const { desktopCapturer, remote } = require('electron');
const { Menu, dialog } = remote;
const { writeFile } = require('fs');

window.onload = async () => {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
    });
    let srcs = inputSources.filter(src => src.name.toLowerCase().indexOf('screen') != -1)
    selectSource(srcs[0]);
}

const getVideoSources = async () => {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(src => {
            return {
                label: src.name,
                click: () => selectSource(src)
            };
        })
    );
    videoOptionsMenu.popup();
}

souceBtn.onclick = getVideoSources;

let mediaRecorder;
const recordedChunks = [];

startBtn.onclick = () => { mediaRecorder.start() }

const selectSource = async (src) => {
    souceBtn.innerText = src.name;
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: src.id,
            },
        },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

const handleDataAvailable = (e) => {
    recordedChunks.push(e.data);
}

const handleStop = async (e) => {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`,
    });
    writeFile(filePath, buffer, () => { console.log('Video saved successfully!') });
}

stopBtn.onclick = () => { mediaRecorder.stop() };