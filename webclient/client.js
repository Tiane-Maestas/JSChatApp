var socket = io();

var messages = document.getElementById('messages'); // unordered list element
var form = document.getElementById('form'); // from of input field
var input = document.getElementById('input'); // input field

function promptname() {
    let name = window.prompt("Please Enter Your Name:");
    socket.emit('update name', name);
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
        socket.emit('stopped typing');
    }
});

input.addEventListener('input', function(e) {
    if(input.value == '') {
        socket.emit('stopped typing');
    } else {
        socket.emit('started typing');
    }
});

socket.on('chat message', function(msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on('status message', function(msg) {
    document.getElementById('status-field').innerHTML = msg;
    // window.alert(msg).fadeIn(300).delay(500).fadeOut(400);
});
