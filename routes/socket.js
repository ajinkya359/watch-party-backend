const server=require('../index')
const io = require("socket.io")(server, {
  //To allow CORS for socket.io
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  //listening for an event
  console.log("made socket connection", socket.id);

  socket.on("send-message", function (data) {
    //When a message is sent form a client to the server. When the message with the name 'chat' comes from a client then the server will take the message
    console.log("message recieved", data.msg);
    io.sockets.emit(
      "recieve-message",
      data,
      console.log("emmiting msg from the server")
    ); //and will emit that message to all the sockets(i.e all the clients) connected to the server.
  });
});

