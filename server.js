const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const ChatFront = require('./exports/chatFront');
const {Encrypt, Decrypt} = require('./exports/encryption');
const port = process.env.PORT || 5000;
const app = express();

app.set('view engine', 'ejs');

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
    const pseudo = obj.pseudo;

    if (meta === "join") {
      console.log('join');
      if (!rooms[room]) {
        rooms[room] = {}; // create the room
        rooms[room]['history'] = [];
      }
      if (!rooms[room][uuid]) rooms[room][uuid] = socket; // join the room

      //s'envoi un message a lui meme pour  valider et afficher la connexion
      socket.send(JSON.stringify({
        id: uuid,
        room: room,
        meta: 'myconnexion',
        pseudo:pseudo
      }))
      // envoi un message a tous le monde pour annoncer la connection d'un autre utilisateur
      sendMsgToAll(room, {
        meta: 'connexion',
        id: uuid,
        room: room,
        message: message,
        pseudo:pseudo,
        history: rooms[room]['history']
      })
    } else if (meta === "leave") {
      console.log('leave');
      // envoi un message  a tout le monde notifiant le depart de l'utilisateur
      sendMsgToAll(room, {
        meta: 'leave',
        id: uuid,
        room: room,
        message: message,
        pseudo:pseudo
      })

      leave(room);
    } else if (meta === 'message') {      
      let h = [uuid, obj.message, obj.meta ,obj.pseudo];
      rooms[room]['history'].push(h);
      console.log('message');
      sendMsgToAll(room, {
        meta: 'message',
        id: uuid,
        room: room,
        message: message,
        pseudo: pseudo,
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
  Object.entries(rooms[room]).forEach(([key, sock]) => {
    if(key != 'history')sock.send(msgHandler);
  });
}

app.get('/tchat/', function (req, res, next) {
  setBaseUrl(req);
  // acces de nul part sans invitation
  res.render('pages/index', {
    roomId: '',
    baseSrc: '../'
  });
});


app.get('/tchat/room/:roomId', function (req, res, next) {
  setBaseUrl(req);
  // acces avec invitation
  res.render('pages/index', {
    roomId: req.params.roomId,
    baseSrc: '../../'
  });
});


// connection au chat avec n° de room et pseudo
app.get('/tchat/room/:id/:pseudo', function (req, res, next) {
  setBaseUrl(req);
  let id = req.params.id;
  console.log('ID:', id);
  next();
}, function (req, res, next ) {
  // utilisation de ejs  pour envoyer des parametres au front
  res.render('pages/chat', {
    roomId: req.params.id,
    myPseudo: req.params.pseudo,
    baseSrc: '../../'
  });
});





// route générique pour les fichier dossier public ( resources locales )
app.get('/tchat/public/:file', function (req, res, next) {
  setBaseUrl(req);
  res.sendFile(__dirname +'/public/'+ req.params.file);
});

// TODO: faire un template quand forbidden
app.get('/tchat/*', function (req, res, next) {

  res.send('forbidden: ' + req.url);
});



// anciennemnt pour le serveur o2switch qui tourne avec passener.. mais les web sockets ne fonctionnent pas 
if (thereIsPhusion()) {
  server.listen('passenger', function () {
    console.log(`Server is listening with passenger!`)
  });
} else {
  server.listen(port, function () {
    console.log(`Server is listening on ${port}!`)
    console.log('server:',server.path);
  });
}


function setBaseUrl(req) {
  app.locals.baseUrl = 'https' + '://' + req.hostname+((port === process.env.PORT)?'':(':'+ port)) + '/tchat/';
}

