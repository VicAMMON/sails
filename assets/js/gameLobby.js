var hostGameBtn = document.getElementById('hostGameBtn');
var rooms = document.getElementById('rooms');
var searchPlayerBtn = document.getElementById('searchPlayerBtn');
var playerToSearchFor = document.getElementById('playerToSearchFor');
//var joinGameButtons = [];
var searchResultModal = document.getElementById('searchResultModal');
var span = document.getElementsByClassName("close")[0];
var searchResults = document.getElementById('searchResults');
var sessionId;

searchPlayerBtn.addEventListener('click', function(){
  console.log("searching for player:" + playerToSearchFor.value);
  io.socket.get('/users/searchUser', {playerToFind: playerToSearchFor.value})

});

span.onclick = function() {
  searchResultModal.style.display = "none";
};

window.onclick = function(event) {
  console.log("window was clicked");
  if (event.target === searchResultModal) {
    console.log("player clicked on somewhere and should be closed")
    searchResultModal.style.display = "none";
  }

  // here display the users found
};

io.socket.on('noPlayerFound', function(){
  alert("No Player Found");
});


io.socket.on('addRoomToView', function(data){
  console.log('addRoomToView called');
  rooms.innerHTML += '<div class="availableGames"> <strong>' + data.roomName + '</strong> ' +
    '<button class="button btn-default joinRoom" id="joinBtn' + data.roomName +'">Join</button> ' +
    '<button class="button btn-default spectateRoom" id="spectateBtn">Spectate</button> ' +
    '<p id="gameNameHostname">' + 'Game host:' + data.host + '</p> ' +
    '</div>';

});


io.socket.on('takePlayerToWaitingRoom', function(){
  alert("take player to waiting room");
  $("body").load('awaitingPlayer');
  document.cookie = "actualSessionId=" + data.ourSessionId + ";"
});


hostGameBtn.addEventListener('click', function(){
  console.log('asked to host game');
  io.socket.get('/game/createGameRoom', function gotResponse(data, jwRes){
    console.log("server responded to createGameRoom");
  })
});

io.socket.on('saveUserSID', function(data){
  alert("saving userSID");
  document.cookie = "actualSessionId=" + data.ourSessionId;
})

// Get the element, add a click listener...
rooms.addEventListener("click", function(e) {
  // e.target is the clicked element!
  // If it was a list item
  console.log("room was clicked");
  console.log("e.target:"+ e.target);
  console.log("e.target.nodeName:" + e.target.nodeName);
  console.log("e.target.className:" + e.target.className.split(" ")[0]);
  buttonClassName = e.target.className.split(" ")[2];
  // handles a click on a joimGame Button
  if (e.target && e.target.nodeName == "BUTTON" && buttonClassName == "joinRoom") {
    // List item found!  Output the ID!
    console.log("Button ", e.target.id.replace("post-", ""), " was clicked!");
    //window.location = "www.example.com"
    //$("body").load('gameMatchRoom');
    gameRoom = e.target.id;
    gameRoom = gameRoom.split("joinBtnroom")[1];
    console.log('requesting to join game Room:'+ gameRoom);
    io.socket.post('/game/joinGameRoom', {roomRequested: gameRoom})
    //$("body").load('gameMatchRoom');
  }

  // handles when a spectate room button is clicked
  if (e.target && e.target.nodeName == "BUTTON" && buttonClassName == "spectateRoom") {
    // List item found!  Output the ID!
    console.log("Button ", e.target.id.replace("post-", ""), " was clicked!");
    //window.location = "www.example.com"
    //$("body").load('gameMatchRoom');
  }

  $(e.target.id.replace("post-", "")).ready(function(){
      $("#div1").load("www.google.ca");
  });

})

io.socket.on('startGame', function(data){
  //console.log('about to add this user to this room:' + data.user);
  //window.location = "gameMatchRoom";
  //alert("starting game");
  $("body").load('gameMatchRoom');
});

io.socket.on('errorAlert', function(data){
  alert(data.message);
})

io.socket.on('addToSpectatorRoom', function(data){

})

io.socket.on('disconnect', function(){
  io.socket.post('/game/disconnectedUser')
  alert("disconnected")
})


io.socket.on('receiveBoard', function(newBoard) {
  //alert("received board");

  let currentSessionId = document.cookie.split("=");
  let indexOfSession;
  for(let i=0; i < currentSessionId.length; i++){
    if(currentSessionId[i] == "actualSessionId"){
      indexOfSession = i + 1;
    }
  }
  let actualSessionId = currentSessionId[indexOfSession];

  console.log("\n actualSessionId:" + actualSessionId);
  console.log("\n newBoard.ourSessionId");
  console.log(newBoard.ourSessionId);

  if(newBoard.ourSessionId != actualSessionId){
    alert("Received board that wasn't ours");
    enemyBoard = newBoard.board;
    enemyBoard = newBoard.board;
    enemyReady = true;
    if(playerReady && enemyReady) {
      //remove the place ships ui and replace it with the opponents board
      var p = document.getElementById("placeShips");
      p.style.display = "none";
      var en = document.getElementById("enemyBoard");
      en.style.display = "inline-block";
      //the player that finishes setting up their board first gets to go first
      myTurn = true;
      document.getElementById("turnTracker").innerHTML = "Your Turn!";
      document.getElementById("informationBar").innerHTML = "You finished placing ships first so you get to take the first shot!";
    }
  }


});



io.socket.on('receiveTorpedo', function(data) {
  //alert("receivedTorpedo")
  eid = data.eid;
  let currentSessionId = document.cookie.split("=");
  let indexOfSession;
  for(let i=0; i < currentSessionId.length; i++){
    if(currentSessionId[i] == "actualSessionId"){
      indexOfSession = i + 1;
    }
  }
  let actualSessionId = currentSessionId[indexOfSession];

  console.log("\n actualSessionId:" + actualSessionId);
  console.log("\n newBoard.ourSessionId");
  console.log(data.ourSessionId);

  if(data.ourSessionId != actualSessionId) {
    alert("received torpedo that wasn't ours ");
    var row = eid.substring(1,2);
    var col = eid.substring(2,3);
    myTurn = true;
    document.getElementById("turnTracker").innerHTML = "Your Turn!";
    // if enemy clicks a square with no ship, change the color and change square's value
    if (playerBoard[row][col] == 0) {
      document.getElementById(eid).style.background = '#bbb';
      // set this square's value to 3 to indicate that they fired and missed
      playerBoard[row][col] = 3;
      document.getElementById("informationBar").innerHTML = "Your opponent missed!"
      // if enemy clicks a square with a ship, change the color and change square's value
    } else if (playerBoard[row][col] == 1) {
      document.getElementById(eid).style.backgroundImage = "url('/images/Explosion.png'), " + document.getElementById(eid).style.backgroundImage;
      // set this square's value to 2 to indicate the ship has been hit
      playerBoard[row][col] = 2;
      document.getElementById("informationBar").innerHTML = "Your opponent hit one of your ships!"
      // increment hitCount each time a ship is hit
      playerHealth--;
      // this definitely shouldn't be hard-coded, but here it is anyway. lazy, simple solution:
      if (playerHealth == 0) {
        document.getElementById("informationBar").innerHTML = "All your ships have been defeated! You lose!"
        document.getElementById("turnTracker").innerHTML = "Game Over!"
        gameOver = true;
        myTurn = false;
      }
    }
  }

});


// battleship

// set grid rows and columns and the size of each square
var rows = 10;
var cols = 10;
var squareSize = 35;
//set to true once player has placed ships
var enemyReady = false;
var playerReady = false;
//whether or not it is this players turn
var myTurn = false;
var gameOver = false;
// get the container element
var enemyBoardContainer = document.getElementById("enemyBoard");
var playerBoardContainer = document.getElementById("playerBoard");

// make the grid columns and rows for the player
//initial code via https://github.com/LearnTeachCode/Battleship-JavaScript
for (i = 0; i < cols; i++) {
  for (j = 0; j < rows; j++) {

    // create a new div HTML element for each grid square and make it the right size
    var square = document.createElement("div");
    playerBoardContainer.appendChild(square);

    // give each div element a unique id based on its row and column, like "s00"
    square.id = 'p' + j + i;
    // set each grid square's coordinates: multiples of the current row or column number
    var topPosition = j * squareSize;
    var leftPosition = i * squareSize;

    // set the background based on the location of the square
    var position = j * 35 + "px " + i * 35 + "px"
    square.style.backgroundImage = "url('/images/Grid.png')";
    square.style.backgroundPosition = position;

    // use CSS absolute positioning to place each grid square on the page
    square.style.top = topPosition + 'px';
    square.style.left = leftPosition + 'px';
  }
}

// make the grid columns and rows for the opponent
for (i = 0; i < cols; i++) {
  for (j = 0; j < rows; j++) {

    // create a new div HTML element for each grid square and make it the right size
    var square = document.createElement("div");
    enemyBoardContainer.appendChild(square);

    // give each div element a unique id based on its row and column, like "s00"
    square.id = 'e' + j + i;

    // set each grid square's coordinates: multiples of the current row or column number
    var topPosition = j * squareSize;
    var leftPosition = i * squareSize;

    // set the background based on the location of the square
    var position = j * 35 + "px " + i * 35 + "px"
    square.style.backgroundImage = "url('/images/Grid.png')";
    square.style.backgroundPosition = position;

    // use CSS absolute positioning to place each grid square on the page
    square.style.top = topPosition + 'px';
    square.style.left = leftPosition + 'px';
  }
}

/* lazy way of tracking when the game is won: just increment hitCount on every hit
   in this version, and according to the official Hasbro rules (http://www.hasbro.com/common/instruct/BattleShip_(2002).PDF)
   there are 17 hits to be made in order to win the game:
      Carrier     - 5 hits
      Battleship  - 4 hits
      Destroyer   - 3 hits
      Submarine   - 3 hits
      Patrol Boat - 2 hits
*/
var hitCount = 0;
var playerHealth = 17;

//ship array
var ships = [5, 4, 3, 3, 2];

//initial code via https://github.com/LearnTeachCode/Battleship-JavaScript
/* create the 2d array that will contain the status of each square on the board
   and place ships on the board (initial enemyBoard has values but will be overwritten!)
   0 = empty, 1 = part of a ship, 2 = a sunken part of a ship, 3 = a missed shot
*/
var enemyBoard = [
  [0,0,0,1,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,0],
  [1,0,0,0,0,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0],
  [1,0,0,1,0,0,0,0,0,0],
  [1,0,0,1,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0]
]

var playerBoard = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0]
]
playerBoardContainer.addEventListener("click", placeShip, false);

//Determines if ship is being placed horizontally or not
var horizontal = true;
//Place ships one by one
shipNumber = 0;
function placeShip(e) {
  if(shipNumber < 5) {
    // if item clicked (e.target) is not the parent element on which the event listener was set (e.currentTarget)
    if (e.target !== e.currentTarget) {
      // extract row and column # from the HTML element's id
      var r = e.target.id.substring(1,2);
      var c = e.target.id.substring(2,3);
      //alert("Clicked on row " + row + ", col " + col);

      var fit = true;
      //console.log("placeShip1");
      //The following code makes sure the ships do not extend beyond the edge of the board
      if(horizontal){
        if(+ships[shipNumber] + +c > 10){
          fit = false;
        }
      }
      else{
        if(+ships[shipNumber] + +r > 10){
          fit = false;
        }
      }

      //console.log("placeShip2");
      //console.log(fit);
      if(fit) {
        fit = check(horizontal, ships[shipNumber], r, c);
      }
      //console.log("placeShip3");
      //console.log(fit);
      if(fit) {
        var len = ships[shipNumber];
        place(len, r, c, horizontal);
        shipNumber++;
        if(shipNumber == 1) {
          document.getElementById("aircraftCarrier").style.textDecoration = "line-through";
          document.getElementById("informationBar").innerHTML = "Click on the grid to place your Battleship";
        }
        else if(shipNumber == 2) {
          document.getElementById("battleship").style.textDecoration = "line-through";
          document.getElementById("informationBar").innerHTML = "Click on the grid to place your Submarine";
        }
        else if(shipNumber == 3) {
          document.getElementById("submarine").style.textDecoration = "line-through";
          document.getElementById("informationBar").innerHTML = "Click on the grid to place your Destroyer";
        }
        else if(shipNumber == 4) {
          document.getElementById("destroyer").style.textDecoration = "line-through";
          document.getElementById("informationBar").innerHTML = "Click on the grid to place your Patrol Boat";
        }
        else if(shipNumber == 5) {
          document.getElementById("patrolBoat").style.textDecoration = "line-through";
          document.getElementById("informationBar").innerHTML = "You are done placing your ships! Waiting on Opponent...";
        }
        //once ship placement is finished, send board configuration to opponent
        if (shipNumber == 5) {
          console.log(document.cookie);

          io.socket.post('/game/transferBoard', playerBoard);
          playerReady = true;
          if(playerReady && enemyReady) {
            //remove the place ships ui and replace it with the opponents board
            var p = document.getElementById("placeShips");
            p.style.display = "none";
            var en = document.getElementById("enemyBoard");
            en.style.display = "inline-block";
            document.getElementById("turnTracker").innerHTML = "Opponent's Turn!";
            document.getElementById("informationBar").innerHTML = "You finished placing ships second so your opponent gets to take the first shot!";
          }
        }
      } else {
        if(shipNumber == 0) {
          document.getElementById("informationBar").innerHTML = "You can't place your Aircraft Carrier here!";
        }
        else if(shipNumber == 1) {
          document.getElementById("informationBar").innerHTML = "You can't place your Battleship here!";
        }
        else if(shipNumber == 2) {
          document.getElementById("informationBar").innerHTML = "You can't place your Submarine here!";
        }
        else if(shipNumber == 3) {
          document.getElementById("informationBar").innerHTML = "You can't place your Destroyer here!"
        }
        else if(shipNumber == 4) {
          document.getElementById("informationBar").innerHTML = "You can't place your Patrol Boat here!";
        }
      }
      //console.log("placeShip4");
    }
  }
  e.stopPropagation();
}

//the function makes sure there are no overlaps between ships
function check(h_alignment, len, r, c){
  //console.log("check1");
  if(h_alignment){
    for(var i = 0; i < len; i++){
      //If a section of the board contains a ship, it's marked with a one
      //thus, if the function detects the section is marked with one, it returns false
      if(playerBoard[r][+c + +i] == 1){
        return false;
      }
    }
  }
  else{
    for(var i = 0; i < len; i++){
      if(playerBoard[+r + +i][c] == 1){
        return false;
      }
    }
  }
  //console.log("check2");
  return true;
}

//when this reaches 3, the destroyer will be placed instead of the submarine
var submarinePlaced = 0;
//places the ships onto the board
function place(ship_length, r, c, h_alignment){
  //console.log("place1");
  for(var i = 0; i < ship_length; i++){
    //console.log("place2");
    if(h_alignment){
      playerBoard[r][+c + +i] = 1;
      var column = +c + +i;
      var eid = "p" + r + column;
      var xpos = ship_length * 35 - 35 * i;
      var position = xpos + "px 0px"
      if(ship_length == 5)
        document.getElementById(eid).style.backgroundImage = "url('/images/CarrierHorizontal.png'), " + document.getElementById(eid).style.backgroundImage;
      else if(ship_length == 4)
        document.getElementById(eid).style.backgroundImage = "url('/images/BattleshipHorizontal.png'), " + document.getElementById(eid).style.backgroundImage;
      else if(ship_length == 3 && submarinePlaced < 3) {
        document.getElementById(eid).style.backgroundImage = "url('/images/SubmarineHorizontal.png'), " + document.getElementById(eid).style.backgroundImage;
        submarinePlaced++;
      }
      else if(ship_length == 3 && submarinePlaced == 3)
        document.getElementById(eid).style.backgroundImage = "url('/images/DestroyerHorizontal.png'), " + document.getElementById(eid).style.backgroundImage;
      else if(ship_length == 2)
        document.getElementById(eid).style.backgroundImage = "url('/images/PatrolHorizontal.png'), " + document.getElementById(eid).style.backgroundImage;
      document.getElementById(eid).style.backgroundPosition = position;
    }
    else{
      playerBoard[+r + +i][c] = 1;
      var row = +r + +i;
      var eid = "p" + row + c;
      var ypos = ship_length * 35 - 35 * i;
      var position = "0px " + ypos + "px"
      if(ship_length == 5)
        document.getElementById(eid).style.backgroundImage = "url('/images/CarrierVertical.png'), " + document.getElementById(eid).style.backgroundImage;
      else if(ship_length == 4)
        document.getElementById(eid).style.backgroundImage = "url('/images/BattleshipVertical.png'), " + document.getElementById(eid).style.backgroundImage;
      else if(ship_length == 3 && submarinePlaced < 3) {
        document.getElementById(eid).style.backgroundImage = "url('/images/SubmarineVertical.png'), " + document.getElementById(eid).style.backgroundImage;
        submarinePlaced++;
      }
      else if(ship_length == 3 && submarinePlaced == 3)
        document.getElementById(eid).style.backgroundImage = "url('/images/DestroyerVertical.png'), " + document.getElementById(eid).style.backgroundImage;
      else if(ship_length == 2)
        document.getElementById(eid).style.backgroundImage = "url('/images/PatrolVertical.png'), " + document.getElementById(eid).style.backgroundImage;
      document.getElementById(eid).style.backgroundPosition = position;
    }
  }
  //console.log("place3");
}

//toggles vertical/horizontal ship placement
function rotateShips() {
  if(horizontal == true) {
    horizontal = false;
    document.getElementById("Rotate").innerHTML = "Rotate (Current: Vertical)"
  } else {
    horizontal = true;
    document.getElementById("Rotate").innerHTML = "Rotate (Current: Horizontal)"
  }

}

enemyBoardContainer.addEventListener("click", fireTorpedo, false);

// initial code via http://www.kirupa.com/html5/handling_events_for_many_elements.htm:
function fireTorpedo(e) {
  //this function only means something if it is the current players turn
  if(myTurn && !gameOver) {
    // if item clicked (e.target) is not the parent element on which the event listener was set (e.currentTarget)
    if (e.target !== e.currentTarget) {
      // extract row and column # from the HTML element's id
      var row = e.target.id.substring(1,2);
      var col = e.target.id.substring(2,3);
      //alert("Clicked on row " + row + ", col " + col);

      //send message to the server that the player selected a target
      var eid = "p" + row + col;

      io.socket.post('/game/transferTorpedo', {eid: eid});
      //socket.emit('transferTorpedo', eid);

      // if player clicks a square with no ship, change the color and change square's value
      if (enemyBoard[row][col] == 0) {
        e.target.style.background = '#bbb';
        // set this square's value to 3 to indicate that they fired and missed
        enemyBoard[row][col] = 3;
        myTurn = false;
        document.getElementById("turnTracker").innerHTML = "Opponent's Turn!";
        document.getElementById("informationBar").innerHTML = "You missed!"
        // if player clicks a square with a ship, change the color and change square's value
      } else if (enemyBoard[row][col] == 1) {
        e.target.style.backgroundImage = "url('/images/Explosion.png'), " + e.target.style.backgroundImage;
        // set this square's value to 2 to indicate the ship has been hit
        enemyBoard[row][col] = 2;
        myTurn = false;
        document.getElementById("turnTracker").innerHTML = "Opponent's Turn!";
        document.getElementById("informationBar").innerHTML = "You hit an enemy vessel!"

        // increment hitCount each time a ship is hit
        hitCount++;
        // this definitely shouldn't be hard-coded, but here it is anyway. lazy, simple solution:
        if (hitCount == 17) {
          document.getElementById("informationBar").innerHTML = "All enemy ships have been defeated! You win!"
          document.getElementById("turnTracker").innerHTML = "Game Over!"
          gameOver = true;
        }

        // if player clicks a square that's been previously hit, let them know
      } else if (enemyBoard[row][col] > 1) {
        document.getElementById("informationBar").innerHTML = "Stop wasting your torpedos! You already fired at this location!";
      }
    }
  } else if (!gameOver) {
    document.getElementById("informationBar").innerHTML = "Wait your turn!";
  }
  e.stopPropagation();
}


//runs when a the server sends a message that a torpedo has been fired at the player


//runs when the other player finishes setting up their board

// battleship.js


