var chat = new Chat();
var CHAT_HEIGHT = 200;

// controller

function listen() {
  $("input").on("click", function(event) {
    event.preventDefault();
    if (event.target.id === "login") {
      var user = new User();
      user.login(user, updateUI);
    }
    else if (event.target.id === "submitchat") {
      chat.displayChat();
    }
    else if (event.target.id === "roomlist") {
      chat.chooseRoom();
    }
  })
}

// views

function updateUI(user) {
  hide("#logindiv");
  show("#chatdiv");
  $("#printname").text(user.username);
}

function hide(element) {
  $(element).addClass("hidden");
}

function show(element) {
  $(element).removeClass("hidden");
}

function Chat() {
  this.text = {};
}

Chat.prototype.displayChat = function() {
  $("#chatdisplay").append("test1<br>");
  $("#chatdisplay").scrollTop(CHAT_HEIGHT);  
}

Chat.prototype.chooseRoom = function() {

}

// model

function User() {
  this.username = "";
}

User.prototype.login = function(user, callback) {
  var firebaseRef = new Firebase("https://weebychattin.firebaseio.com");
  firebaseRef.once('value', function(usersSnapshot) {
    var userList = [];
    if (usersSnapshot.hasChild('users')) {
      var userList = usersSnapshot.child("users").val();
    };
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