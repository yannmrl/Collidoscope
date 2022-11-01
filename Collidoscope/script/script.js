//INIT

var audio;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
ctx = new AudioContext();
var players = {};
var pitches = {};
var lower = 0;
var sel = 10;
var vLvl;

//GET VOLUME LEVEL
async function level() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioContext = new AudioContext();
    const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
    const analyserNode = audioContext.createAnalyser();
    mediaStreamAudioSourceNode.connect(analyserNode);

    const pcmData = new Float32Array(analyserNode.fftSize);
    const onFrame = () => {
        analyserNode.getFloatTimeDomainData(pcmData);
        let sumSquares = 0.0;
        for (const amplitude of pcmData) { sumSquares += amplitude*amplitude; }
        vLvl = Math.sqrt(sumSquares / pcmData.length);
        if (vLvl < 0.0005) {vLvl = 0.0005;}
        window.requestAnimationFrame(onFrame);
    };
    window.requestAnimationFrame(onFrame);
}
level();

//RECORD AUDIO

function rec() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mediaRecorder = new MediaRecorder(stream);

        const audioChunks = [];
        count = 0;
        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
            console.log(vLvl);
            document.getElementsByClassName('wave')[count].style.height = vLvl*200+'vh';
            count ++;
        });

        mediaRecorder.addEventListener("stop", () => {
            onFrame = 0;
            while (audioChunks.length > 50) {
                audioChunks.pop();
            }
            console.log('record finished');
            globalThis.chunks = audioChunks;
            globalThis.audioBlob = new Blob(chunks);
            //console.log(audioBlob.size);
            //const splitted = audioBlob.slice(12000,19970);
            //console.log(splitted);
            audioUrl = URL.createObjectURL(audioBlob);
            console.log(audioUrl);
        });

        mediaRecorder.start(5);

        setTimeout(() => {
            mediaRecorder.stop();
        }, 3000);
    });
}

//WEBSOCKET CONNECTION

socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function () {
	console.log('connected to wss');
});

socket.addEventListener('message', function (event) {
    data = parseInt(event.data);
    p = parseInt((data/1023)*50);
    console.log(p);
    if (p > 49) {p = 49;} else if (p < 0) {p = 0;}
    globalThis.lower = p;
    document.getElementsByClassName('leftSelector')[0].style = "margin-left: "+2*p+"%;";
    rP = 2*(p+sel);
    if (rP > 98) {rP = 98;}
    document.getElementsByClassName('rightSelector')[0].style = "margin-left: "+rP+"%;";
    bars = document.getElementsByClassName('wave');
    for (var i = 0; i < bars.length; i++) {
        if (i <= p || i >= (p+sel)) {
            bars[i].style.backgroundColor = "gray";
        } else {    
            bars[i].style.backgroundColor = "";
        }
    }
});

//MIDI

function midiToFreq(n) {
    a = 440;
    return (a / 32) * (2 ** ((n - 9) / 12));
}

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(success, failure);
}

function success(midiAccess) {
    midiAccess.addEventListener('statechange', updateDevices);

    const inputs = midiAccess.inputs;
    inputs.forEach((input) => {
        input.addEventListener('midimessage', handleInput);
    });
}

function handleInput(event) {
    command = event.data[0];
    note = event.data[1];
    velocity = event.data[2];
    
    switch (command) {
        case 144: //note On
            if (velocity > 0) {
                noteOn(note, velocity);
            } else {
                noteOff(note);
            }
            break;
        case 128: //note Off
            noteOff(note);
            break;
        default:
            console.log(command);
            break;
    }
}

function noteOn(note, velocity) {
    console.log(note, velocity);
    pitches[note.toString()] = new Tone.PitchShift().toDestination();
    pitches[note.toString()].pitch = note - 60;
    sChunks = chunks.slice(lower,lower+sel);
    if (lower != 0) {
        if (lower != 1) {
            sChunks.unshift(chunks[1]);
        }
        sChunks.unshift(chunks[0]);
    }
    sBlob = new Blob(sChunks);
    console.log(sBlob);
    audioUrl = URL.createObjectURL(sBlob);
    console.log(audioUrl);
    players[note.toString()] = new Tone.Player(audioUrl).connect(pitches[note.toString()]);
    players[note.toString()].loop = true;
    players[note.toString()].autostart = true;
}

function noteOff(note) {
    players[note.toString()].stop();
    delete players[note.toString()];
    delete pitches[note.toString()];
}

function updateDevices(event) {
    console.log(event);
}

function failure() {
    console.log("couldn't");
}

//rec();
function joli() {
    elems = document.getElementsByClassName('wave');
    for (var i = 0; i < elems.length; i++) {
        p = Math.random() * 100;
        elems[i].style = "height: "+p+"vh;";
    }
}