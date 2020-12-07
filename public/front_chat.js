let myId = null;
let lastUserMessagePseudo = null;

let timeOutTitle;
(function () {
    const sendBtn = document.querySelector('#send');
    const messages = document.querySelector('#messages');
    const messageBox = document.querySelector('#messageBox');
    const urlToShare = document.querySelector('#urlToShare');

    let ws;

    function wsResponse(data) {
        const obj = JSON.parse(data);

        const message = obj.message;
        const meta = obj.meta;
        const room = obj.room;
        const id = obj.id;
        const pseudo = obj.pseudo;
        if (meta === 'myconnexion') {
            myId = id;
            
            urlToShare.innerText = window.location.href.replace(('/' + myPseudo), '');
            
        } else if (meta === 'connexion') {
            if (id !== myId) {
                showMessage('>> ' + pseudo + ' est connecté', pseudo, true);
            } else {
                const history = obj.history;
                console.log(history);
                messages.textContent = '';
                history.forEach(h => {
                    let d = decryptAndShow(h[1])
                    let repText = ((h[3]=== myPseudo)?d:`${h[3]} dit: ${d}`);
                    showMessage(repText, h[3]);
                });
                showMessage('vous est connecté à la room ' + room, pseudo, true);
            }
        } else if (meta === 'message') {
            let decrypted = decryptAndShow(message);
            let repText = `(${pseudo}) - ${decrypted}`
            if(id !== myId) {
                showMessage(repText, pseudo);
                changeTitle(pseudo + ' à envoyé un message!')
            }
        } else if (meta === 'leave') {
            showMessage('>> ' + pseudo + ' est parti', pseudo, true);
        }
    }

    function getSalt() {
        return document.getElementById('salt').value;
    }

    function decryptAndShow(encryptedMessage) {
        let decrypted = Decrypt(encryptedMessage, getSalt());
        if (decrypted.trim() === ''){
            decrypted = '** mauvaise clé de cryptage **';
        }
        return decrypted;
    }

    

    function init() {
        if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
        }
        console.log(window.location.origin);
        console.log(window.location.host);
        console.log(window.location.href);
        console.log(window.location.protocol);
        let isSecur = (window.location.protocol === 'https:');
        console.log('isSecur?:', isSecur);
        ws = new WebSocket(((isSecur ? 'wss://' : 'ws://') + window.location.host + '/msg'));
        ws.onopen = () => {
            console.log('Connection opened!');
            ws.send(JSON.stringify({
                meta: 'join',
                room: roomId,
                pseudo: myPseudo
            }));
        }
        ws.onmessage = ({
            data
        }) => wsResponse(data);

        ws.onclose = function () {
            ws = null;
            showMessage("Déconnecté tentative de reconnexion ...", 'msgInfo', true);
            init();
        }
        window.onbeforeunload = function () {
            ws.send(JSON.stringify({
                meta: 'leave',
                room: roomId,
                pseudo: myPseudo,
            }));
        }
    }


    function sendMessageHandler(evt) {
        
        let message = messageBox.value.trim();
        if (message === '') {
            return;
        }

        if (!ws) {
            showMessage("No WebSocket connection :(", 'msgInfo');
            return;
        }
        
        
        let msgEnc = Encrypt(message, getSalt());
        console.log('encrypted msg:', msgEnc);

        ws.send(JSON.stringify({
            meta: 'message',
            message: msgEnc,
            room: roomId,
            pseudo: myPseudo,
        }));
        
        showMessage(messageBox.value, myPseudo);
        messageBox.value = '';
        messageBox.style.height = '0';
    }

    messageBox.addEventListener('keypress', function (evt) {
        console.log(evt.code, evt.keyCode, evt.key);
        
        let enterKeyCode = 13;
        if (evt.keyCode === enterKeyCode) {
            if (evt.shiftKey){
                this.style.height = this.scrollHeight + 24 + 'px';
                //messageBox.value += '\n';
            }else {
                evt.preventDefault();
                
                sendMessageHandler();
            }
        }
    })
    sendBtn.onclick = sendMessageHandler

    init();
})();



// function de  chiffrage et dechiffrage pour les messages
function Encrypt(msg, keyPhrase) {
    encrypted = CryptoJS.AES.encrypt(msg, keyPhrase);
    console.log(encrypted.toString());
    return encrypted.toString();
}

function Decrypt(encrypted, keyPhrase) {
    let decrypted = CryptoJS.AES.decrypt(encrypted, keyPhrase);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function showMessage(message, pseudo, isInfo = false) {        
    console.log(lastUserMessagePseudo, pseudo, (lastUserMessagePseudo === pseudo));
    let spacer = '\n';
    if (pseudo !== myPseudo) {
        spacer = '\n\t';            
    }
    lastUserMessagePseudo = pseudo;
    let mb = isInfo?createInfoMessage(message, pseudo):createMessage(message, pseudo)
    // messages.textContent += `${spacer}${message}`;
    messages.appendChild(mb);
    messages.scrollTop = messages.scrollHeight;
    
}


function createMessage(message, pseudo) {
    console.log(message, pseudo);
    let msgBox = document.createElement('div');
    msgBox.classList.add('msgBox');
    if (pseudo === myPseudo) {
        msgBox.classList.add('myMsgs');
        msgBox.setAttribute('title','(vous)');            
    } else {
        msgBox.setAttribute('title','('+pseudo+')');
    }
    let avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerHTML = pseudo.slice(0,2);
    
    let msgText = document.createElement('div');
    msgText.classList.add('msgText');
    msgText.innerText = message;

    msgBox.appendChild(avatar);
    msgBox.appendChild(msgText);
    return msgBox;

}
function createInfoMessage(message, pseudo) {
    console.log(message, pseudo);
    let msgBox = document.createElement('div');
    msgBox.classList.add('infoBox');  
    
    let msgText = document.createElement('div');
    msgText.classList.add('msgText');
    msgText.innerText = message;
    
    msgBox.appendChild(msgText);
    return msgBox;

}

function changeTitle(tmpTitle) {
    if(timeOutTitle)clearTimeout(timeOutTitle);
    timeOutTitle = setTimeout(function(){
        window.document.title = 'Chat';
    },2000)
    window.document.title = tmpTitle;
}