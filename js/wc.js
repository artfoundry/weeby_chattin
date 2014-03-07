var CHAT_HEIGHT = 200;
var user = new User();

// controller

function listen() {
  $("#login, #submitchat, #roomlist, #createroom, #logout").on("click", function(event) {
    event.preventDefault();
    if (event.target.id === "login") {
      user.login(updateUI);
      fbGetRoomList();
    }
    else if (event.target.id === "submitchat") {
      var message = $("#chatinput").val()
      addChat(user.username, message);
    }
    else if (event.target.parentElement.id === "roomlist") {
      if (($(event.target)).text() !== user.currentRoom) {
        var room = ($(event.target)).text();
        user.setRoom(room);
      };
    }
    else if (event.target.id === "createroom") {
      var room = $("#roomname").val();
      checkRoomName(room);
    }
    else if (event.target.id === "logout") {
      user.logout(updateUI);
    };
    setInterval(function(){ fbGetRoomList() }, 1000);
  });
}

// view

function updateUI() {
  $("#logindiv").toggle();
  $("#chatdisplay").empty();
  $("#chatdiv").toggle();
  $("#roomlist").empty();
  $("#userlist").empty();
  $("#printname").text(user.username);
}

function showChatEntry() {
  $("#inputform").toggle();
}

function updateChatDiv(chatData) {
  $("#chatdisplay").append("<b>" + chatData.uName + "</b> : " + chatData.text + "<br>");
  $("#chatdisplay").scrollTop(CHAT_HEIGHT);  
}

function updateRoomList(roomList) {
  $("#roomlist").empty();
  roomList.forEach(function(roomData) {
    var userLoc = "";
    if (roomData.name() === user.currentRoom)
      userLoc = "<i> *you are here*</i>";
    $("#roomlist").append("<li>" + roomData.name() + userLoc + "</li>");
  });
}

function updateUserList(userList) {
  $("#userlist").empty();
  userList.forEach(function(userData) {
    $("#userlist").append("<li>" + userData.val() + "</li>");
  });
}

// model

function addChat(source, message) {
  var fbChatListRef = new Firebase("https://weebychattin.firebaseio.com/rooms/" + user.currentRoom);
  fbChatListRef.push({uName: source, text: message});
}

function checkRoomName(room) {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com/");
  firebaseRef.once("value", function(fbSnapshot) {
    var roomList = {};
    if (fbSnapshot.hasChild("rooms"))
      roomList = fbSnapshot.child("rooms").val();
    if (checkName(room, roomList, "#roomname") !== "")
      user.setRoom(room);
  });
}

function fbGetChat() {
  var fbChatListRef = new Firebase("https://weebychattin.firebaseio.com/rooms/" + user.currentRoom);
  fbChatListRef.limit(1).on("child_added", function(allChat) {
    var msgData = allChat.val();
    updateChatDiv(msgData);
  });
}

function fbGetRoomList() {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com/");
  firebaseRef.once("value", function(fbSnapshot) {
    if (fbSnapshot.hasChild("rooms")) {
      var roomList = fbSnapshot.child("rooms");
      updateRoomList(roomList);
    };
  });
}

function fbGetUserList() {
  var fbUserListRef = new Firebase("https://weebychattin.firebaseio.com/rooms/" + user.currentRoom + "/--users/");
  fbUserListRef.on("value", function(userList) {
    updateUserList(userList);
  });
}

function User() { // User constructor
  this.username = "";
  this.currentRoom = "";
  this.currentRoomLoc = "";
}

User.prototype.updateConnectStatus = function() {
  var fbUserRef = new Firebase("https://weebychattin.firebaseio.com/.info/connected");
  fbUserRef.on("value", function(userData) {
    if (userData.val() === false) // if not connected
      // user.setRoom(""); -> not working
      fbUserRef.remove();
  });
};

User.prototype.logout = function(callback) {
  this.setRoom("");
  var fbUserRef = new Firebase("https://weebychattin.firebaseio.com/users/" + this.username);
  fbUserRef.remove(function(){
    this.username = "";
    this.currentRoom = "";
    this.currentRoomLoc = "";
  });
  callback();
}

User.prototype.removeFromRoom = function() {
  var fbUserRef = new Firebase(this.currentRoomLoc);
  var fbRoomRef = fbUserRef.parent().parent();
  fbUserRef.remove(function() {
    fbRoomRef.once("value", function(roomData) {
      if (roomData.hasChild("--users") === false)
        fbRoomRef.remove();
    });
    var message = "<i>" + user.username + " has left the room</i>";
    addChat("System", message);
  });
}

User.prototype.setRoom = function(room) {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com");
  firebaseRef.once("value", function(fbSnapshot) {
    if (fbSnapshot.hasChild("rooms")) {
      if (user.currentRoom !== "") // if currently in a room
        user.removeFromRoom();
    };
    if (room !== "") {
      var fbUserRoomRef = firebaseRef.child("rooms").child(room).child("--users").push(user.username);
      fbUserRoomRef.onDisconnect().remove();
      user.currentRoomLoc = fbUserRoomRef.toString();
      user.currentRoom = room;
      fbGetRoomList();
      fbGetUserList();
      var message = "<i>" + user.username + " has joined the room '" + room + "'</i>";
      addChat("System", message);
      fbGetChat();
      showChatEntry();
    };
  });
}

User.prototype.login = function(callback) {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com");
  firebaseRef.once("value", function(fbSnapshot) {
    var userList = [];
    if (fbSnapshot.hasChild("users"))
      userList = fbSnapshot.child("users").val();
    var name = $("#username").val();
    user.username = checkName(name, userList, "#username");
    if (user.username !== "") { // empty string if there was an error
      firebaseRef.child("users").child(user.username).child("connections").push(true, user.updateConnectStatus).onDisconnect().remove();
      callback();
    };
  });
}

function checkName(name, list, selector) {
  var searchStr = new RegExp(/[^a-z0-9 \-]/i);
  var newName = "";
  if (Object.keys(list).indexOf(name) > -1) {
    alert("That name is already taken. Please enter a different name.");
  }
  else if (name.search(searchStr) > -1) {
    alert("Only alphanumeric characters (a-z and 0-9), spaces, and dashes (-) are accepted. Please enter a different name.");
  }
  else {
    newName = name;
  };
  $(selector).val("");
  return newName;
};
