var opt = {
    ipaddr: '192.168.x.xxx',
    webPort: 3010,
    webRootDir: __dirname + '/webclient',
    webHomeHTML: '/index.html'
}

// express provides a function handler in 'app' to manage a web application.
const express = require('express');
const app = express();
app.use(require('express').static(opt.webRootDir)); // Points the web client to include directories.
const webclient = app.listen(opt.webPort, () => { console.log('Application Started on Port: ' + opt.webPort) }); // Listen to webclient on the given port.
// const webclient = app.listen(opt.webPort, opt.ipaddr, () => { console.log('Application Started on Port: ' + opt.webPort) });

// Configure Root with html.
app.get('/', (req, res) => { res.sendFile(opt.webRootDir + opt.webHomeHTML); });

// Uses socket.io to manage communication between webclient and this server.
const { Server } = require("socket.io");
const io = new Server(webclient);

// Map users to socket ids and other info. Traditional Object
function User(id, name) {
    this.socketID = id;
    this.usrname = name;
}

let users = []
function knownUser(id) {
    let rtn = false;
    users.forEach(function (user) {
        if (user.socketID == id) {
            rtn = true;
        }
    });
    return rtn;
}
function indexOfUser(id) {
    return users.map(e => e.socketID).indexOf(id);
}

io.on('connection', (socket) => {
    if (knownUser(socket.id))
        return;
    // Note: If you are null username then you cannot interact but you can see what others type.
    // So there is a better fix...or just force refresh when usrname is null.
    users.push(new User(socket.id, null));
    console.log(socket.id + ' connected (' + users.length + ')');

    socket.once('disconnect', () => {
        if (knownUser(socket.id)) {
            let name = users[indexOfUser(socket.id)].usrname;
            let index = indexOfUser(socket.id);
            // Must do from testing. Weird!
            if (index == 0) {
                users.splice(index, index + 1);
            } else {
                users.splice(index, index);
            }
            if (name == null)
                return;
            socket.broadcast.emit('chat message', name + ' has left the chat!');
        }
        console.log(socket.id + ' disconnected (' + users.length + ')');
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        if (users[indexOfUser(socket.id)].usrname == null)
            return;
        io.emit('chat message', users[indexOfUser(socket.id)].usrname + ': ' + msg); // This will broadcast to everyone including itself.
    });

    socket.on('started typing', () => {
        if (users[indexOfUser(socket.id)].usrname == null)
            return;
        socket.broadcast.emit('status message', users[indexOfUser(socket.id)].usrname + ' is typing...'); // This will broad cast to all other sockets.
    });

    socket.on('stopped typing', () => {
        socket.broadcast.emit('status message', 'Chat Status'); // This will broad cast to all other sockets.
    });

    socket.on('update name', (msg) => {
        if (msg == null)
            return;
        users[indexOfUser(socket.id)].usrname = msg;
        console.log(socket.id + ' updated their name: ' + msg);
        socket.broadcast.emit('chat message', msg + ' has joined the chat!'); // This will broad cast to all other sockets.
    });
});

// io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' });