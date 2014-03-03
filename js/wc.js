var CHAT_HEIGHT = 200;
var user = new User();

// controller

function listen() {
  $("#login, #submitchat, #roomlist, #createroom").on("click", function(event) {
    event.preventDefault();
    if (event.target.id === "login") {
      user.login(updateUI);
      fbGetRoomList();
      $("#login").off("click");
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
      if (fbRoomExists(room) === false) {
        user.setRoom(room);
      }
      else {
        alert ("That room already exists. Use another name.");
      };
    };
    setInterval(function(){ fbGetRoomList() }, 1000);
    if (user.currentRoom !== "")
      fbGetUserList();
  });
}

// view

function updateUI() {
  $("#logindiv").addClass("hidden");
  $("#chatdiv").removeClass("hidden");
  $("#printname").text(user.username);
}

function updateChatDiv(chatData) {
  $("#chatdisplay").append("<b>" + chatData.uName + "</b> : " + chatData.text + "<br>");
  $("#chatdisplay").scrollTop(CHAT_HEIGHT);  
}

function updateRoomList(roomList) {
  $("#roomlist").empty();
  roomList.forEach(function(roomData) {
    $("#roomlist").append("<li>" + roomData.name() + "</li>");
  });
}

function updateUserList(userList) {
  $("#userlist").empty();
  userList.forEach(function(userData) {
    $("#userlist").html("<li>" + userData.val() + "</li>");
  });
}

// model

function addChat(source, message) {
  var fbChatListRef = new Firebase("https://weebychattin.firebaseio.com/rooms/" + user.currentRoom);
  fbChatListRef.push({uName: source, text: message});
}

function fbGetChat() {
  var fbChatListRef = new Firebase("https://weebychattin.firebaseio.com/rooms/" + user.currentRoom);
  fbChatListRef.limit(1).on("child_added", function(allChat) {
    var msgData = allChat.val();
    updateChatDiv(msgData);
  });
}

function fbRoomExists(room) {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com/");
  var isFound = false;
  firebaseRef.once("value", function(fbSnapshot) {
    if (fbSnapshot.hasChild("rooms")) {
      var roomList = fbSnapshot.child("rooms");
      if (roomList.hasChild(room))
        isFound = true;
    };
  });
  return isFound;
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
  this.listIndex = 0;
}

User.prototype.removeFromRoom = function(userList) {
  var userIndex = userList.indexOf(user.username);
  var fbUserRef = new Firebase("https://weebychattin.firebaseio.com/rooms/" + user.currentRoom + "/--users/" + userIndex);
  var fbRoomRef = fbUserRef.parent().parent();
  fbUserRef.remove();
  fbRoomRef.once("value", function(roomData) {
    if (roomData.hasChild("--users") === false)
      fbRoomRef.remove();
  });
  var message = "<i>" + user.username + " has left the room</i>";
  addChat("System", message);
}

User.prototype.setRoom = function(room) {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com");
  firebaseRef.once("value", function(fbSnapshot) {
    var userList = [];
    if (fbSnapshot.hasChild("rooms")) {
      if (user.currentRoom !== "") {
        userList = fbSnapshot.child("rooms").child(user.currentRoom).child("--users").val();        
        user.removeFromRoom(userList);
        userList.length = 0; // wipe the list clean in case the room moving to is new
      };
      if (fbSnapshot.child("rooms").hasChild(room))
        userList = fbSnapshot.child("rooms").child(room).child("--users").val();
    };
    userList.push(user.username);
    firebaseRef.child("rooms").child(room).child("--users").set(userList);
    user.currentRoom = room;
    fbGetRoomList();
    var message = "<i>" + user.username + " has joined the room '" + room + "'</i>";
    addChat("System", message);
    fbGetChat();
  });
}

User.prototype.login = function(callback) {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com");
  firebaseRef.once("value", function(fbSnapshot) {
    var userList = [];
    if (fbSnapshot.hasChild("users"))
      userList = fbSnapshot.child("users").val();
    var name = $("#username").val();
    user.username = user.checkName(name, userList);
    if (user.username !== "") { // empty string if there was an error
      firebaseRef.child("users").child(user.username).set(Firebase.ServerValue.TIMESTAMP);
      callback(user);
    };
  });
}

User.prototype.checkName = function(name, list) {
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
  return newName;
};