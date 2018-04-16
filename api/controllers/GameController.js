/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var gameRooms = [];
var passport= require('passport');

module.exports = {
  ensureAuthenticated: function(req,res){
    //console.log('isAuthenticated called');
    if(ensureAuthenticated(req,res)){
      console.log("user is authenticated");
      return res.render('game');
      //return true;
    }else{
      console.log("user is not authenticated");
      return res.redirect('/');
      //return false
    }
   // console.log('req in endusreAuthenticated'+req);
    //sails.log(req);
  },
  createGameRoom: function(req,res){
    console.log('createGameRoom called');
    if( typeof req.session.passport == "undefined" || typeof req.session.passport.user == undefined){
      sails.sockets.broadcast(sails.sockets.getId(req), 'errorAlert', {message:'Session Expired. Please login again'})
      return res.send(500, {error: 'sessione expired'})

    }
    console.log(req.session.passport.user);
    userId = req.session.passport.user;
    //var username;

    var username;
    var currentSessionId = req.headers.cookie.split(/[;= ]/);
    //console.log("userName" + userName);
    // here we are finding the user that requested to create a room
    Users.find({id:userId}).exec(function(err, user){
      if(err){
        console.log('error finding user');
        res.send(500, {error:'database error'});
      }else{
        var username = user[0].username;
        //console.log('username:' + username);
        //socket.username = username;
//        console.log('sails.socket:'+ socket);

        let randomNum = Math.floor(Math.random() * Math.floor(1000000));
        let roomName = "room" + randomNum;
        //console.log("creating and joing room:" + roomName);
        gameRooms.push({name:randomNum, host:username, numActivePlayers:1, userOneId:userId, userOneSocketId: sails.sockets.getId(req)});
        sails.sockets.join(req, roomName);
        //sails.sockets.broadcast('GameRoom1', 'addRoomToView', {roomName:"GameRoo12"});
        // add a room to all
        //sails.log("\n\n\n\n cookie" + sails.config.session.cookie);
        //sails.log("\n\n\n\n" + sails.config.session.secret);

        //sails.log("\n\n\n\n\n\n Hearrs" +req.headers.cookie);

        let indexOfSession;
        for(let i=0; i < currentSessionId.length; i++){
          if(currentSessionId[i] == "sails.sid"){
            console.log("find the index of the session id in createGameROom");
            indexOfSession = i + 1;
          }
        }
        sails.log("\ncurrentSessionId: " + currentSessionId + "\nindexOfSessionId: " + indexOfSession);
        let actualSessionId = currentSessionId[indexOfSession];
        console.log("\nactualSessionId" + actualSessionId);

        //console.log("actualSessionId" + actualSessionId);

        //sails.log(currentSessionId);
        //console.log("\n\n\n\nsid:" + req.sessionId);


        sails.sockets.blast('addRoomToView', {roomName:roomName, host:username, ourSessionId:actualSessionId});
        sails.sockets.broadcast(sails.sockets.getId(req), 'saveUserSID', {ourSessionId: actualSessionId })
        // emit a socket to the current user to send them to a waiting room;
        sails.sockets.broadcast(sails.sockets.getId(req),'takePlayerToWaitingRoom');


        // after this we should emit a socket to send the calling user to the "waiting" game room to wait for a game
        return res.json({
          message:'Successfully created room'
        });
      }
    });

    console.log('username' + username);
    //console.log('username' + username);

  },
  joinGameRoom: function(req,res){
    // if the current user isn't authenticated then redirect them to the login page
    //console.log((req.session.passport.user == "undefined") )
    console.log('\n In joinGameRoom');
    if( typeof req.session.passport == "undefined" || typeof req.session.passport.user == "undefined"){
      console.log("in joinGameRoom the session expired, redirecting to login page");
      sails.sockets.broadcast(sails.sockets.getId(req), 'errorAlert', {message:'Session Expired. Please login again'});
      return res.redirect('/'); // /////
    }
    var userId = req.session.passport.user;
    var requestedGameRoom = req.body.roomRequested;
    console.log("User with this id" + userId +  "wants to join the game room:" + requestedGameRoom);
    var canJoin = canJoinRoom(requestedGameRoom, userId);
    if( canJoin.canJoin == true){
      console.log("we are able to join this game room");
      //console.log("socketIdOfRequestingUser" +req.socket);
      //sails.log(req.socket);
      //sails.sockets.broadcast()
      // add the player to the room
      // emit a socket to take the player to the game room
      // must update number of players already in the game room
      gameRooms[canJoin.roomIndex].numActivePlayers += 1;
      gameRooms[canJoin.roomIndex].userTwoId = userId;
      gameRooms[canJoin.roomIndex].userTwoSocketId = sails.sockets.getId(req);
      console.log("canJoin.roomIndex.name" + gameRooms[canJoin.roomIndex].name )
      let roomWeShouldJoin = "room" + gameRooms[canJoin.roomIndex].name;
      sails.sockets.join(req, roomWeShouldJoin);
      console.log("sails.sockets.getId(req)" + sails.sockets.getId(req));
      // emit a socket saying we have joined the game room
      // we should now start the game if there are two players in the current gameRooms
      hostSocketId = gameRooms[canJoin.roomIndex].userOneSocketId;



      let currentSessionId = req.headers.cookie.split(/[ ;=]/);
      let indexOfSession;
      for(let i=0; i < currentSessionId.length; i++){
        if(currentSessionId[i] == "sails.sid"){
          indexOfSession = i + 1;
        }
      }
      sails.log("\nreq.headers.split: " + currentSessionId);
      sails.log("\n indexOfSessionid: " + indexOfSession);
      let actualSessionId = currentSessionId[indexOfSession];
      console.log("actualSessionId" + actualSessionId);

      sails.sockets.broadcast(sails.sockets.getId(req), 'saveUserSID', {ourSessionId:actualSessionId});
      sails.sockets.broadcast([sails.sockets.getId(req), hostSocketId], 'startGame', {sessionId: 'one'});

    }
    else{
      console.log("we can't join this game room")
      // notify the player that they can't join the game room  or do nothing
      sails.sockets.broadcast(sails.sockets.getId(req),'errorAlert', {message:'Cannot Join Room'});

    }

  },
  transferBoard: function(req,res){
    // figure out what room we are currently in
    console.log("req.isSocket1" + req.isSocket === true);
    console.log("transfer board called");
    sails.log('date sent was:' + req.body.playerBoard);
    // check the room and find the other player in the room
    //then send them the eid
    //sails.log(req);
    console.log('\n\n\n\n\n\n\n\n trying to find room');
    //sails.log(req.socket);
    //sails.sockets.broadcast('')
    var roomToEmitTo = findRoom(req.session.passport.user);
    console.log("roomTOEmmitTo"  + roomToEmitTo);
    sails.log(roomToEmitTo);
    if(roomToEmitTo.roomFound == true){
      sendToThisRoom = "room" + roomToEmitTo.roomName;
      console.log("broadcasting to room:" + sendToThisRoom + "omitting this socket:" + sails.sockets.getId(req));
      //sails.sockets.blast('yell', {message: 'anything'});
     // sails.sockets.blast('yell', {message:'message'});
      //sails.sockets.broadcast(sendToThisRoom, 'receiveBoard', req.body.playerBoard, sails.sockets.getId(req))
      let currentSessionId = req.headers.cookie.split("=");
      let indexOfSession;
      for(let i=0; i < currentSessionId.length; i++){
        if(currentSessionId[i] == "sails.sid"){
          indexOfSession = i + 1;
        }
      }

      let actualSessionId = currentSessionId[indexOfSession].split(";")[0];
      console.log("actual Session" + actualSessionId);
      console.log("checking to make sure request is a socket: " + req.isSocket === true)
      sails.sockets.broadcast(sendToThisRoom, 'receiveBoard', {board: req.body.playerBoard, ourSessionId: actualSessionId});




    }else{
      console.log("no room found");
      sails.sockets.broadcast(sails.sockets.getId(req), {message: 'Error sending eid to other socket'});

    }



    //sails.sockets.broadcast('', 'receiveTorpedo', eid);
  },
  transferTorpedo: function(req,res){
    //socket.broadcast.emit('receiveTorpedo', eid);
    var roomToEmitTo = findRoom(req.session.passport.user);
    console.log("roomTOEmmitTo"  + roomToEmitTo);
    sails.log(roomToEmitTo);
    if(roomToEmitTo.roomFound == true){
      sendToThisRoom = "room" + roomToEmitTo.roomName;
      console.log("broadcasting to room:" + sendToThisRoom + "omitting this socket:" + sails.sockets.getId(req));
      //sails.sockets.blast('yell', {message: 'anything'});
      // sails.sockets.blast('yell', {message:'message'});
      //sails.sockets.broadcast(sendToThisRoom, 'receiveBoard', req.body.playerBoard, sails.sockets.getId(req))
      sails.log("eid: " + req.body.eid );
      let currentSessionId = req.headers.cookie.split(/[=;]/);
      let indexOfSession;
      for(let i=0; i < currentSessionId.length; i++){
        if(currentSessionId[i] == "sails.sid"){
          indexOfSession = i + 1;
        }
      }
      let actualSessionId = currentSessionId[indexOfSession].split(/[;=]/)[0];
      sails.sockets.broadcast(sendToThisRoom, 'receiveTorpedo', {eid: req.body.eid, ourSessionId:actualSessionId}, req);

    }else{
      console.log("no room found");
      sails.sockets.broadcast(sails.sockets.getId(req), {message: 'Error sending eid to other socket'});

    }

  },
  chat: function(req,res){
    var d = new Date();
    h = d.getHours().toString();
    m = d.getMinutes().toString();
    //minute length should be 2 digits ex 01
    if(m.length == 1) {
      m = '0' + m;
    }
    msg = h + ':' + m + ')' + req.body.msg;
    console.log("message: " + msg);




    var roomToEmitTo = findRoom(req.session.passport.user);
    console.log("roomTOEmmitTo"  + roomToEmitTo);
    sails.log(roomToEmitTo);
    if(roomToEmitTo.roomFound == true){
      sendToThisRoom = "room" + roomToEmitTo.roomName;
      console.log("broadcasting to room:" + sendToThisRoom + "omitting this socket:" + sails.sockets.getId(req));
      //sails.sockets.blast('yell', {message: 'anything'});
      // sails.sockets.blast('yell', {message:'message'});
      //sails.sockets.broadcast(sendToThisRoom, 'receiveBoard', req.body.playerBoard, sails.sockets.getId(req))
      sails.socket.broadcast(sendToThisRoom, 'chat', msg);

    }else{
      console.log("no room found");
      sails.sockets.broadcast(sails.sockets.getId(req), {message: 'Error sending eid to other socket'});

    }

    },
  disconnected: function(req,res){
    console.log("A user disconnected" + req.session.passport.user);
  }
};

function ensureAuthenticated(req,res){
  if(req.isAuthenticated()){
     console.log("user is authenticated");
      //return res.render('game');
      return true;
  }else{
    console.log("user is not authenticated");
    //return res.redirect('/');
    return false
  }
}

// this function checks to see if a player can join a game
// it checks if the gameRoom trying to connect to exists
// it checks if the host of the game is different from this user,
// it checks if there are less than 2 players in a given game room,
function canJoinRoom(gameRoom, userId){
  for(var i=0; i < gameRooms.length; i++){
    console.log("gameRoom:" + gameRoom + " gameRooms[i].name" + gameRooms[i].name + " userId:" + userId + " userOneId:" + gameRooms[i].userOneId);
    // need to also check to see if this user is the host
    if(gameRooms[i].name == gameRoom && gameRooms[i].numActivePlayers == 1 && gameRooms[i].userOneId != userId){
        return {canJoin: true, roomIndex:i}
    }
  }
  console.log("inCanJoinRoom");
  return {canJoin: false, roomIndex:0}
}

function findRoom(userId){
  console.log("userSocketId" + userId);
  for(var i=0; i < gameRooms.length; i++){
    console.log("GameRoom.name" + gameRooms[i].name + "userOneSocketId" + gameRooms[i].userOneSocketId + "userTwoSocketId" + gameRooms[i].userTwoSocketId)
    if(gameRooms[i].userOneId == userId || gameRooms[i].userTwoId == userId ){
      if(gameRooms[i].userOneId == userId){

      }
      return {roomFound: true, roomName: gameRooms[i].name}
    }
  }
  return {roomFound:false};
}


