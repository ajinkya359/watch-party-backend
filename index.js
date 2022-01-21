const express = require("express")
const app = express();
const mongoose = require("mongoose")
const dotenv = require("dotenv");
const authRoute = require("./routes/auth")
const sessions=require("./routes/sessions")
var cookieParser = require("cookie-parser");
// const socket = require('socket.io')
var cors = require('cors');
const { socket } = require("./routes/socket");
const { urlencoded } = require("express");

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
.then(()=> console.log("DB Connection Successfull!"))
.catch((err)=>{
    console.log(err);
});

// app.use(express.static('./client/public'));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
  
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
  });
  

app.use(express.json())
app.use(cookieParser());
// app.use(cors())
const server = app.listen(process.env.PORT||5000, ()=>{
    console.log("App listening on port 5000");
})

const io =  require('socket.io')(server , {               //To allow CORS for socket.io
  cors: {
    origin:"*"
  },
}
)

io.on('connection', (socket)=>{      //listening for an event
  socket.on('disconnect',()=>{
    console.log("Disconnected");
  })
  socket.on("play_the_video_from_client",(room_id,time)=>{
    socket.to(room_id).emit("play_the_video_from_server",time)
    // cb(true)

  })
  socket.on("pause_the_video_from_client",(room_id,time)=>{
    socket.to(room_id).emit("pause_the_video_from_server",time)
    // cb(false)
  })
  socket.on("send-video-url-to-server",(url,room_id)=>{
    console.log(url)
    socket.to(room_id).emit("get-video-url-from-server",url)
    // cb(url)
  })
  socket.on('this_is_the_url',(url,socket_id,time)=>{
    socket.to(socket_id).emit("resume_watching_the_show",url,time)
  })
  socket.on('join-room',(room_id,username,cb)=>{
    console.log(`${username} joined room ${room_id}`)
    socket.join(room_id)
    const m={
      username:"Server",
      msg:`${username} joined room`
    }
    socket.to(room_id).emit('recieve-message-from-server', m, console.log("emmiting msg from the server"));  //and will emit that message to all the sockets(i.e all the clients) connected to the server.
    socket.to(room_id).emit("get_him_the_url_if_there",socket.id)
    cb(m)
  })
  socket.on('send-message-to-server', (data,cb)=>{   //When a message is sent form a client to the server. When the message with the name 'chat' comes from a client then the server will take the message
     console.log("message recieved", data)
      socket.to(data.room_id).emit('recieve-message-from-server', data, console.log("emmiting msg from the server"));  //and will emit that message to all the sockets(i.e all the clients) connected to the server.
      cb(data.username,data.msg)
    });
})               

app.use("/api/auth", authRoute);
app.use("/api/sessions",sessions)

module.exports=server

