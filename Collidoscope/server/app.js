const express = require('express');
const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');

const wss = new WebSocket.Server({ server: server });

wss.on('connection', function connection(ws) {
    console.log('connected');
    global.websocket = ws;
    socket_set();
    ws.on('message', function incoming(message) {
        console.log('message : '+message);
    });
});

server.listen(3000, () => console.log(`Listening`));

var { SerialPort } = require("serialport");
var port = "COM5";

function socket_set() {

    var serialPort = new SerialPort({
        path: port,
        baudRate: 9600
    });
    
    serialPort.on("open", function() {
        console.log("-- Connection opened --");
        serialPort.on("data", function(data) {
            console.log("Data received: " + data);
            websocket.send(parseInt(data));
        });
    });

}