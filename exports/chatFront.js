const fs = require('fs');

function ChatFront(idRoom, pseudo) {
    let html = getHtmlFromFile('./template_chat.html');
    
    return html.replace('**theRoom**', idRoom).replace('**thePseudo**', pseudo);
}

function getHtmlFromFile(filepath){
    return fs.readFileSync(filepath,'utf-8');
     
}

module.exports = ChatFront;
