const btCreate = document.getElementById('create');
const btJoin = document.getElementById('join');
const roomIdField = document.getElementById('roomId');
const pseudoField = document.getElementById('pseudo');
const cguCheckbox = document.getElementById('cgu');


btCreate.addEventListener('click', function () {
    // console.log('click on create');
    if (pseudo()) {
        // console.log('ok pseudo is ', pseudo());
        if(cguAccepted()){
            let url = 'http://' + window.location.host + '/tchat/room/' + generateRoomNewRoomID()+'/'+pseudo();
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
                let url = 'http://' + window.location.host + '/tchat/room/' + room()+'/'+pseudo();     
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
function getResourceUrl(resource) {
    return window.location.host + '/tchat/public/' + resource 
}
window.onload = function(){
    cguCheckbox.checked = false;
}