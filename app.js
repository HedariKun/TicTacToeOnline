const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/client/index.html");
});

let rooms = [];


io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
      console.log('user disconnected');
      for(let i = rooms.length-1; i >=0; i--){
            if(rooms[i].client == socket || rooms[i].host == socket){
                if(rooms[i].client != null) rooms[i].client.emit("deleted");
                rooms[i].host.emit("deleted");
                rooms.splice(i);
            }
      }
    });

    socket.on("played", m => {
        let room;
        for(let r of rooms){
            if(r.id == m.id)
                room = r;
        }
        if(room.grid[m.pos] == ""){
            if(m.turn == 0)
                room.grid[m.pos] = "x";
            else
                room.grid[m.pos] = "o";
        }
         room.turn = m.turn != 1? 1 : 0;

        for(let r of rooms){
            if(r.id == m.id)
                r = room;
        }

        room.host.emit("updatedInfo", {id:room.id, inGame:true, turn:room.turn, grid:room.grid, type:0});
        room.client.emit("updatedInfo", {id:room.id, inGame:true, turn:room.turn, grid:room.grid, type:1});

        let c = checkWinning(room);
        if(c != "n"){
            room.host.emit("finished", {c:c, grid:room.grid});
            room.client.emit("finished", {c:c, grid:room.grid});
        }

    });

    socket.on("JoinRoom", () =>{
        let room = null;
        for(let r of rooms){
            if(r.client == null){
                r.client = socket;
                room = r;
                break;
            }
        }
        if(room == null){
            room = {
                id:Math.floor(Math.random() * 1000),
                host:socket,
                client:null,
                turn:0,
                grid:[  "", "", "",
                        "", "", "",
                        "", "", ""]
            };
            rooms.push(room);
        }
        let inGame = room.client != null ? true:false;
        if(inGame){
            room.host.emit("updatedInfo", {id:room.id, inGame:inGame, turn:room.turn, grid:room.grid, type:0});
        }
        socket.emit("room-info", {id:room.id, inGame:inGame, turn:room.turn, grid:room.grid, type:1});
    });
  });

http.listen(3000, () => {
    console.log("listenning to 3000");
});

function checkWinning(room){
    let g = room.grid;
    if(g[0] == "x" && g[1] == "x" && g[2] == "x") return "x";
    if(g[3] == "x" && g[4] == "x" && g[5] == "x") return "x";
    if(g[6] == "x" && g[7] == "x" && g[8] == "x") return "x";
    if(g[0] == "x" && g[3] == "x" && g[6] == "x") return "x";
    if(g[1] == "x" && g[4] == "x" && g[7] == "x") return "x";
    if(g[2] == "x" && g[5] == "x" && g[8] == "x") return "x";
    if(g[0] == "x" && g[4] == "x" && g[8] == "x") return "x";
    if(g[2] == "x" && g[4] == "x" && g[6] == "x") return "x";
    if(g[0] == "o" && g[1] == "o" && g[2] == "o") return "o";
    if(g[3] == "o" && g[4] == "o" && g[5] == "o") return "o";
    if(g[6] == "o" && g[7] == "o" && g[8] == "o") return "o";
    if(g[0] == "o" && g[3] == "o" && g[6] == "o") return "o";
    if(g[1] == "o" && g[4] == "o" && g[7] == "o") return "o";
    if(g[2] == "o" && g[5] == "o" && g[8] == "o") return "o";
    if(g[0] == "o" && g[4] == "o" && g[8] == "o") return "o";
    if(g[2] == "o" && g[4] == "o" && g[6] == "o") return "o";
    if(g[0] != "" && g[1] != "" &&g[2] != "" &&g[3] != "" &&g[4] != "" &&g[5] != "" &&g[6] != "" &&g[7] != "" &&g[8] != "" ) return "draw";
    return "n";
}