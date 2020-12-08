const btCreate = document.getElementById('create');
const btJoin = document.getElementById('join');
const roomIdField = document.getElementById('roomId');
const pseudoField = document.getElementById('pseudo');
const cguCheckbox = document.getElementById('cgu');

cguCheckbox.addEventListener('click', function(){
    if(cguCheckbox.checked){
        ajaxPost(baseUrl + 'cgu/validate',null,function(data){

        })
    }else {
        ajaxPost(baseUrl + 'cgu/invalidate',null,function(data){
            
        })
    }
})

btCreate.addEventListener('click', function () {
    // console.log('click on create');
    if (pseudo()) {
        // console.log('ok pseudo is ', pseudo());
        if(cguAccepted()){
            let url = baseUrl + 'room/' + generateRoomNewRoomID()+'/'+pseudo();
            window.location = url;
        } else {
            cguCheckbox.focus();
        }
        
    } else {
        pseudoField.focus();
    }
})

btJoin.addEventListener('click', function () {
    // console.log('click on join');
    if (pseudo()) {
        // console.log('ok pseudo is ', pseudo());
        if(room()){
            if(cguAccepted()){
                let url = baseUrl + 'room/' + room()+'/'+pseudo();     
            window.location = url;
            } else {
                cguCheckbox.focus();
            }
            
        }else {
            roomIdField.focus();
        }        
    }else {
        pseudoField.focus();
    }
})
// read cookie by name

function cguAccepted() {
    return (cguCheckbox.checked);
}
function pseudo() {
    return (pseudoField.value.trim() !== '' ? pseudoField.value.trim() : false);
}
function room() {
    return (roomIdField.value.replaceAll('/','').trim() !== '' ? roomIdField.value.replaceAll('/','').trim() : false);
}
function generateRoomNewRoomID() {
    rand = function () {
        return Math.floor(Math.random() * 1250)
    }
    return rand() + '-' + rand() + '-' + rand() + '-' + rand() + '-' + rand();
}

function ajaxPost (url, data, callback, isJson = true) {
    var req = new XMLHttpRequest()
    req.open('POST', url)
    req.addEventListener('load', function () {
        if (req.status >= 200 && req.status < 400) {
            // Appelle la fonction callback en lui passant la réponse de la requête
            callback(req.responseText)
        } else {
            console.error(req.status + ' ' + req.statusText + ' ' + url)
        }
    })
    req.addEventListener('error', function () {
        console.error('Erreur réseau avec l\'URL ' + url)
    })
    if (isJson) {
        // Définit le contenu de la requête comme étant du JSON
        req.setRequestHeader('Content-Type', 'application/json')
        // Transforme la donnée du format JSON vers le format texte avant l'envoi
        data = JSON.stringify(data)
    }
    req.send(data)
}
window.onload = function(){
    console.log('cookies cgu:',getCookie('cgus'));
    let cguAreAccepted = getCookie('cgus') === 'accepted';
    if(cguAreAccepted){
        cguCheckbox.checked = true;
    } else {
        cguCheckbox.checked = false;
    }
}