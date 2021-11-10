const { Server } = require("socket.io");
const fs = require("fs");

var token = randomString();

const io = new Server(62233, {
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
});

console.log("PoopHook listening on localhost:62233 with auth-token " + token);
console.log("Quick-Start code:");
console.log(`--> def connected;
    //> do what ever you want!;
--> end;

psh->hook localhost 62233 ${token} connected;`);

io.on("connection", (socket) => {
    console.log("New socket with ip " + socket.conn.remoteAddress + "; awaiting authentication!");

    var authenticated = false;
    var addr = socket.conn.remoteAddress;

    socket.on("auth", (msg) => {
        if(token == msg) {
            authenticated = true;
            socket.emit("auth_ret", "ok");
        }else {
            console.log("Disconnecting " + addr + ": Invalid auth token");
            socket.disconnect(true);
        }
    });

    socket.on("log", (msg) => {
        if(authenticated) {
            console.log(msg);
        }else {
            console.log("Disconnecting " + addr + ": Not authenticated");
            socket.disconnect(true);
        }
    });

    socket.on("fsRead", (msg) => {
        if(authenticated) {
            try {
                if(!fs.existsSync(msg)) {
                    socket.emit("fsReadRet", {"status": "error", "data": "fsRead failed: File not found"});
                    return;
                }
    
                socket.emit("fsReadRet", {"status": "success", "data": fs.readFileSync(msg)});
            } catch(ex) {
                socket.emit("fsReadRet", {"status": "error", "data": "fsRead failed: " + ex});
            }
        }else {
            console.log("Disconnecting " + addr + ": Not authenticated");
            socket.disconnect(true);
        }
    });

    socket.on("disconnect", () => {
        console.log("(Got) disconnected " + addr);
    });
});

function randomString(len = 64) {
    var alp = "abcdefghijklmnopqrstuvwxyzABCDEFHIJKLMNOPQRSTUVWXYZ0123456789".split(""),
        r = "";

    for(var i = 0; i < len; i++) {
        r += alp[Math.floor(Math.random()*alp.length)];
    }

    return r;
}