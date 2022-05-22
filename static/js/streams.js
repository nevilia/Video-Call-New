console.log('In stream.js')


function webSocketOnMessage(event){
    var parsedData = JSON.parse(event.data);
    var message = parsedData['message'];

    console.log('message: ', message);
}

    var loc = window.location;
    var wsStart = 'ws://';
    var webSocket;


    if(loc.protocol == 'https:'){
        wsStart = 'wss://';
    }

    var endPoint = wsStart + loc.host + loc.pathname;

    console.log('endPoint: ', endPoint);

    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', (e) => {
        console.log('Connection Opened!');

        var jsonStr = JSON.stringify({
            'message': 'This is a message',
        });

        webSocket.send(jsonStr);

    });
    webSocket.addEventListener('message', webSocketOnMessage);
    webSocket.addEventListener('close', (e) => {
        console.log('Connection Closed!');
    });
    webSocket.addEventListener('error', (e) => {
        console.log('Error Occurred!');
    });


// local audio video

var localStream = new MediaStream();

const constraints = {
    'video' : true,
    'audio' : true
};

const localVideo = document.querySelector('#local-video'); //57:07

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;
    })
    .catch(error => {
        console.log('Error accessing media devices.', error);
    });