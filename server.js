const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cookieSession = require('cookie-session');
const {
  Encrypt,
  Decrypt
} = require('./exports/encryption');
const port = process.env.PORT || 5000;
const app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['cgu'],
  // Cookie Options
  maxAge: -1 // 3 hours
}));
app.set('view engine', 'ejs');

const server = http.createServer(app);

const rooms = {};
const userColors = {};

function thereIsPhusion() {
  return typeof (PhusionPassenger) !== 'undefined';
}
if (thereIsPhusion()) {
  PhusionPassenger.configure({
    autoInstall: false
  });
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
    
    // suppression de la couleur
    if (userColors[uuid]){
      delete userColors[uuid];
    }
    // pas de room: ne rien faire
    if (!rooms[room][uuid]) return;

    // l'utilisateur en train de quitter est le dernier: suppression de la room
    if (Object.keys(rooms[room]).length === 1) {
      console.log('destruction of the room:', room);
      delete rooms[room];
    } else {
      console.log('rage quit of :', uuid);
      // sinon suppression de room
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
    const color = obj.color;

    if (meta === "join") {
      console.log('join');
      if (!rooms[room]) {
        rooms[room] = {}; // creation de la room
        rooms[room]['history'] = [];
      }
      if (!rooms[room][uuid]) rooms[room][uuid] = socket; // rejoins la room
      if (!userColors[uuid]) userColors[uuid] = (color!== null)?color:('#' + Math.floor(Math.random()*16777215).toString(16)); // create a random color()

      //s'envoi un message à lui même pour  valider et afficher la connexion
      socket.send(JSON.stringify({
        id: uuid,
        room: room,
        meta: 'myconnexion',
        color: userColors[uuid],
        pseudo: pseudo,
        version: '0.1.7',
      }))
      // envoi un message à tout le monde pour annoncer la connection d'un autre utilisateur
      sendMsgToAll(room, {
        meta: 'connexion',
        id: uuid,
        room: room,
        message: message,
        pseudo: pseudo,
        color: userColors[uuid],
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
        color: userColors[uuid],
        pseudo: pseudo
      })

      leave(room);
    } else if (meta === 'message') {
      // creation d'une entrée pour l'historique temp
      let h = [uuid, obj.message, userColors[uuid], obj.pseudo];
      // ajout de l'entrée
      rooms[room]['history'].push(h);
      // envoi le message à tout le monde
      console.log('message');
      sendMsgToAll(room, {
        meta: 'message',
        id: uuid,
        room: room,
        message: message,
        pseudo: pseudo,
        color: userColors[uuid]
      })
    }
  });

  socket.on("close", () => {
    // pour chaque room on retire le socket
    Object.keys(rooms).forEach(room => leave(room));
  });
});

// send the message to all in the room
function sendMsgToAll(room, objMsg) {
  let msgHandler = JSON.stringify(objMsg);
  Object.entries(rooms[room]).forEach(([key, sock]) => {
    if (key != 'history') sock.send(msgHandler);
  });
}

// index pour créer ou rejoindre une room
app.get('/tchat/', function (req, res, next) {
  setBaseUrl(req);
  // acces de nul part sans invitation
  res.render('pages/index', {
    roomId: ''
  });
});

// rejoindre une room
app.get('/tchat/room/:roomId', function (req, res, next) {
  setBaseUrl(req);
  // acces avec invitation
  res.render('pages/index', {
    roomId: req.params.roomId
  });
});


// connection au chat avec n° de room et pseudo
app.get('/tchat/room/:id/:pseudo', function (req, res, next) {
  setBaseUrl(req);
  // nb: ne sert à rien, sinon a se rappeler qu'on peut faire un next()
  let id = req.params.id;
  console.log('ID:', id);
  next();
}, function (req, res, next) {
  // utilisation de ejs  pour envoyer des parametres au front
  res.render('pages/chat', {
    roomId: req.params.id,
    myPseudo: req.params.pseudo
  });
});

// route générique pour les fichiers dossier public ( resources locales )
app.get('/tchat/public/:file', function (req, res, next) {
  setBaseUrl(req);
  res.sendFile(__dirname + '/public/' + req.params.file);
});

// route cgu
app.get('/tchat/cgu/validate', function (req, res, next) {
  //req.session.cgus = 'accepted';
  res.cookie('cgus', 'accepted',getCookiesOptions(req));
  res.redirect('/tchat/');
});
app.post('/tchat/cgu/validate', function (req, res, next) {
  //req.session.cgus = 'accepted';
  res.cookie('cgus', 'accepted',getCookiesOptions(req));
  res.send('ok');
});
app.get('/tchat/cgu/invalidate', function (req, res, next) {
  //req.session.cgus = 'refused';
  res.cookie('cgus', 'refused',getCookiesOptions(req));
  res.redirect('http://google.fr');
});
app.post('/tchat/cgu/invalidate', function (req, res, next) {
  //req.session.cgus = 'accepted';
  res.cookie('cgus', 'refused', getCookiesOptions(req));
  res.send('ok');
});
app.get('/tchat/cgu', function (req, res, next) {
  setBaseUrl(req);
  res.render('pages/cgu', {
    roomId: req.params.id,
    myPseudo: req.params.pseudo
  });
});

//redirection vers le chat
app.get('/tchat/*', function (req, res, next) {
  res.redirect('/tchat/');
});


// les autres routes : 404 ou 405 à voir
// TODO: faire un template quand forbidden
app.get('/*', function (req, res, next) {
  //req.session.cgus = (req.session.cgus || 'unsigned')
  res.send('forbidden: ' + req.url + 'cookies-sessions: ' + req.session.cgus);
});



// anciennemnt pour le serveur o2switch qui tourne avec passener.. mais les web sockets ne fonctionnent pas 
if (thereIsPhusion()) {
  server.listen('passenger', function () {
    console.log(`Server is listening with passenger!`)
  });
} else {
  server.listen(port, function () {
    console.log(`Server is listening on ${port}!`)
  });
}


function setBaseUrl(req) {
  app.locals.baseUrl = ((req.hostname  === 'localhost') ? 'http' : 'https') + '://' + req.hostname + ((req.hostname  !== 'localhost') ? '' : (':' + port)) + '/tchat/';
}

function getCookiesOptions(req){
  return {
    sameSite: (req.hostname  !== 'localhost')?"None":"Lax",
    secure: (req.hostname  !== 'localhost'),
  }
}