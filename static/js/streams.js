console.log('In stream.js')

var mapPeers
// var usernameInput = document.querySelector('#username');
// var btnJoin = document.querySelector('#btn-join');
// var username;

// username = usernameInput.value;

// console.log('username: ', username);
// btnJoin.addEventListener('click', () => {

//     if(username == ''){
//         return;
//     }

//     usernameInput.value = '';

// });


function webSocketOnMessage(event){
    var parsedData = JSON.parse(event.data);
    var peerUsername = parsedData['peer'];
    var action = parsedData['action'];

    if(username == peerUsername){
        return;
    }

    var receiver_channel_name = parsedData['message']['receiver_channel_name'];

    if(action == 'new-peer'){
        createOfferer(peerUsername, receiver_channel_name);
        return;
    }

    if(action == 'new-offer'){
        var offer = parsedData['message']['sdp'];

        createAnswerer(offer, peerUsername, receiver_channel_name);
    }

    if(action == 'new-answer'){
        var answer = parsedData['message']['sdp'];

        var peer = mapPeers[peerUsername][0];

        peer.setRemoteDescription(answer);

        return;
    }
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

        sendSignal('new-peer', {});
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

const micBtn = document.querySelector('#mic-btn'); 

const cameraBtn = document.querySelector('#camera-btn'); 

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        var audioTracks = streams.getAudioTracks();
        var videoTracks = streams.getVideoTracks();

        audioTracks[0].enable = true;
        videoTracks[0].enable = true;

        micBtn.addEventListener('click', () => {
            audioTracks[0].enable = !audioTracks[0].enable;

            if(audioTracks[0].enable){
                micBtn.innerHTML = 'Audio Mute';
                return;
            }
            micBtn.innerHTML = 'Audio Unmute';
        });        

        cameraBtn.addEventListener('click', () => {
            videoTracks[0].enable = !videoTracks[0].enable;

            if(videoTracks[0].enable){
                cameraBtn.innerHTML = 'Video Off';
                return;
            }
            cameraBtn.innerHTML = 'Video On';
        });        


    })
    .catch(error => {
        console.log('Error accessing media devices.', error);
    });

    
function sendSignal(action, message){
    var jsonStr = JSON.stringify({
        'peer' : username,
        'action' : action,
        'message' : message,
    });
    
    webSocket.send(jsonStr);
}

function createOfferer(peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(null); //connect 2 devices on the same network like same home wifi

    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => {
        console.log('Connection opened!');
    });

    dc.addEventListener('message', dcOnMessage);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceconnectionstatechange = peer.iceConnectionState;

        if(iceconnectionstate === 'failed' || iceconnectionstate === 'disconnected' || iceconnectionstate === 'closed'){
            delete mapPeers[peerUsername];

            if(iceConnectionState != 'closed'){
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));

            return;
        }

        sendSignal('new-offer', {
            'sdp' : peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Local description set successfully.');
        });
}

function createAnswerer(offer, peerUsername, receiver_channel_name){
    var peer = new RTCPeerConnection(null); //connect 2 devices on the same network like same home wifi

    addLocalTracks(peer);

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        peer.dc = e.channel;
        peer.dc.addEventListener('open', () => {
            console.log('Connection opened!');
        });
        peer.dc.addEventListener('message', dcOnMessage);

        mapPeers[peerUsername] = [peer, peer.dc];
    });


    peer.addEventListener('iceconnectionstatechange', () => {
        var iceconnectionstatechange = peer.iceConnectionState;

        if(iceconnectionstate === 'failed' || iceconnectionstate === 'disconnected' || iceconnectionstate === 'closed'){
            delete mapPeers[peerUsername];

            if(iceConnectionState != 'closed'){
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if(event.candidate){
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));

            return;
        }

        sendSignal('new-answer', {
            'sdp' : peer.localDescription,
            'receiver_channel_name': reveive_channel_name
        });
    });

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Rrmote description set successfully for %s.', peerUsername);

            return peer.createAnswer();
        })
        .then(a => {
            console.log('Answer created!');

            peer.setLocalDescription(a);
        })

    
}

function addLocalTracks(peer){
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    return;
}

var messageList = document.querySelector('#message-list');
function dcOnMessage(event){
    var message = event.data;

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
}

function createVideo(peerUsername){
    var videoContainer = document.querySelector('#video-container');

    var remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    var videowrapper = document.createElement('div');

    videoContainer.appendChild(videowrapper);
    videowrapper.appendChild(remoteVideo);
    return remoteVideo;

}

function setOnTrack(peer, remoteVideo){
    var remoteStream = new MediaStream;

    remoteStream.srcObject = remoteStream;

    peer.addEventListener('track', async(event => {
        remoteStream.addTrack(event.track, remoteStream)
    }));
}

function removeVideo(video){
    var videowrapper = video.parentNode;

    videowrapper.parentNode.removeChild(videowrapper);
}