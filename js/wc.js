// controller

var chat = new Chat();
var CHAT_HEIGHT = 200;

function listen() {
  $("input").on("click", function(event) {
    event.preventDefault();
    if (event.target.id === "login") {
      var user = new User();
      user.login();
    }
    else if (event.target.id === "submitchat") {
      chat.displayChat();
    }
  })
}


// views

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

//model

function User() {
  this.username = "";
}

User.prototype.login = function() {
  this.username = $("#username").val();
  hide("#logindiv");
  show("#chatdiv");
  $("#printname").text(this.username);
}
