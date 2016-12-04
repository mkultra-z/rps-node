var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8080);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};

var gameInputA = {};
var gameInputB = {};

// rooms which are currently available in chat
var rooms = ['room1','room2','room3','room4'];
var round2Rooms = ['room1r2','room2r2'];
var finalRoom = ['roomf'];

io.sockets.on('connection', function (socket) {

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
    if (gameInputA[0] == null) {
      gameInputA[0] = socket.username;
      gameInputA[1] = data;
      io.sockets.in(socket.room).emit('updatechat', 'Game', 'Waiting...');
    }
    else if (gameInputB[0] == null) {
      gameInputB[0] = socket.username;
      gameInputB[1] = data;

      var result = getResult(gameInputA, gameInputB);
      io.sockets.in(socket.room).emit('updatechat', 'Game', 'winner = ' + result);

      gameInputA = {};
      gameInputB = {};
    }

    // while (gameInputB == null) {
    //   io.sockets.in(socket.room).emit('updatechat', 'Game', 'Waiting...');
    // }

		// we tell the client to execute 'updatechat' with 2 parameters
		// io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});


	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});

function getResult (playerA, playerB){
  if (playerA[1] == 'rock'){
    if (playerB[1] == 'scissors') return playerA[0]
    else if (playerB[1] == 'paper') return playerB[0]
    else return 'draw'
  }
  else if (playerA[1] == 'paper') {
    if (playerB[1] == 'scissors') return playerB[0]
    else if (playerB[1] == 'paper') return 'draw'
    else return playerA[0]
  }
  else {
    if (playerB[1] == 'scissors') return 'draw'
    else if (playerB[1] == 'paper') return playerA[0]
    else return playerB[0]
  }
}
