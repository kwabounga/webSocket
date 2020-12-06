const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const ChatFront = require('./exports/chatFront');
const {Encrypt, Decrypt} = require('./exports/encryption');
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const rooms = {};
function thereIsPhusion () {
  return typeof(PhusionPassenger) !== 'undefined';
}
if (thereIsPhusion()) {
  PhusionPassenger.configure({ autoInstall: false });
}

function guid() {
  rand = function () {
    return Math.floor(Math.random() * 1250)
  }
  return rand() + '-' + rand() + '-' + rand();
}
const wss = new WebSocket.Server({
  server: server,
  path: ("/msg")
})

wss.on("connection", socket => {
  const uuid = guid(); // create here a uuid for this connection

  const leave = room => {
    // not present: do nothing
    if (!rooms[room][uuid]) return;

    // if the one exiting is the last one, destroy the room
    if (Object.keys(rooms[room]).length === 1) {
      console.log('destruction of the room:', room);
      delete rooms[room];
    } else {
      console.log('rage quit of :', uuid);
      // otherwise simply leave the room
      delete rooms[room][uuid];
    }
  };

  socket.on("message", (data) => {
    let obj = JSON.parse(data);
    console.log(obj);
    const message = obj.message;
    const meta = obj.meta;
    const room = obj.room;

    if (meta === "join") {
      console.log('join');
      if (!rooms[room]) rooms[room] = {}; // create the room
      if (!rooms[room][uuid]) rooms[room][uuid] = socket; // join the room

      //s'envoi un message a lui mem pour  valider et afficher la connexion
      socket.send(JSON.stringify({
        id: uuid,
        room: room,
        meta: 'myconnexion'
      }))
      // envoi un message a tous le monde pour annoncer la connection d'un autre utilisateur
      sendMsgToAll(room, {
        meta: 'connexion',
        id: uuid,
        room: room,
        message: message
      })
    } else if (meta === "leave") {
      console.log('leave');
      // envoi un message  a tou le monde notifiant le depart de l'utilisateur
      sendMsgToAll(room, {
        meta: 'leave',
        id: uuid,
        room: room,
        message: message
      })
      leave(room);
    } else if (!meta) {
      console.log('message');
      sendMsgToAll(room, {
        meta: 'message',
        id: uuid,
        room: room,
        message: message
      })
    }
  });

  socket.on("close", () => {
    // for each room, remove the closed socket
    Object.keys(rooms).forEach(room => leave(room));
  });
});

// send the message to all in the room
function sendMsgToAll(room, objMsg) {
  let msgHandler = JSON.stringify(objMsg);
  Object.entries(rooms[room]).forEach(([key, sock]) => sock.send(msgHandler));
}




app.get('/tchat/', function (req, res, next) {
  res.send('index');
});
// connection à la page , puis renvoi la reponse
app.get('/tchat/room/:id', function (req, res, next) {
  let id = req.params.id;
  console.log('ID:', id);
  next();
}, function (req, res, next ) {
  console.log('creation du front pour la room: ' + req.params.id);
  // degueulasse ! a revoir 
  let htmlResponse = ChatFront(req.params.id);
  res.send(htmlResponse);
});

app.get('/tchat/public/:file', function (req, res, next) {
  res.sendFile(__dirname +'/public/'+ req.params.file);
});

// connection à la page , puis renvoi la reponse
app.get('/tchat/*', function (req, res, next) {
  res.send('forbidden: ' + req.url);
});

if (thereIsPhusion()) {
  server.listen('passenger', function () {
    console.log(`Server is listening with passenger!`)
  });
} else {
  server.listen(port, function () {
    console.log(`Server is listening on ${port}!`)
    console.log('WSS:',wss);
  });
}

/*server.listen(port, function () {
  console.log(`Server is listening on ${port}!`)
})*/


