let myId = null;
let lastUserMessagePseudo = null;


(function () {
    const sendBtn = document.querySelector('#send');
    const messages = document.querySelector('#messages');
    const messageBox = document.querySelector('#messageBox');

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
            
            document.getElementById('urlToShare').innerText = window.location.href.replace(('/' + myPseudo), '');
            
        } else if (meta === 'connexion') {
            if (id !== myId) {
                showMessage('>> ' + pseudo + ' est connecté', pseudo);
            } else {
                const history = obj.history;
                console.log(history);
                messages.textContent = '';
                history.forEach(h => {
                    let d = decryptAndShow(h[1])
                    let repText = ((h[3]=== myPseudo)?d:`${h[3]} dit: ${d}`);
                    showMessage(repText, h[3]);
                });
                showMessage('vous est connecté à la room ' + room, pseudo);
            }
        } else if (meta === 'message') {
            let decrypted = decryptAndShow(message);
            let repText = `- ${pseudo} dit: ${decrypted}`
            if(id !== myId)showMessage(repText, pseudo);
        } else if (meta === 'leave') {
            showMessage('>> ' + pseudo + ' est parti', pseudo);
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

    function showMessage(message, pseudo) {        
        console.log(lastUserMessagePseudo, pseudo, (lastUserMessagePseudo === pseudo));
        let spacer = '\n';
        if (pseudo !== myPseudo) {
            spacer = '\n\t';            
        }
        lastUserMessagePseudo = pseudo;
        messages.textContent += `${spacer}${message}`;
        messages.scrollTop = messages.scrollHeight;
        
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
            showMessage("Déconnecté tentative de reconnexion ...", 'msgInfo');
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
    }

    messageBox.addEventListener('keypress', function (evt) {
        let enterKeyCode = 13;
        if (evt.keyCode === enterKeyCode) {
            sendMessageHandler();
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