const fs = require('fs');

function ChatFront(idRoom) {
    let html = getHtmlFromFile('./template_chat.html');
    
    return html.replace('**theRoom**', idRoom);
}

function getHtmlFromFile(filepath){
    return fs.readFileSync(filepath,'utf-8');
     
}

module.exports = ChatFront;
