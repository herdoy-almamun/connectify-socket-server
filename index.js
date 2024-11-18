import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://connectify-me.netlify.app",
    methods: ["GET", "POST"],
  },
});

const users = [];
const activeChats = [];

io.on("connection", (socket) => {
  socket.on("user", (user) => {
    if (!users.some((u) => u.id === user.id)) {
      const { id, name, image, email } = user;
      users.push({ id, name, email, image });
    }
    io.emit("users", users);
  });

  // Handle a new chat joining
  socket.on("chat", (chat) => {
    if (!activeChats.some((c) => c.id === chat.id)) {
      activeChats.push({ id: chat.id });
    }
    socket.join(chat.id); // Join the user to a specific chat room by chat ID
  });

  // Handle incoming messages for specific chat rooms
  socket.on("message", (message) => {
    const { chatId, text, image, createdAt, sender } = message;
    if (chatId) {
      io.to(chatId).emit("messages", {
        chatId,
        text,
        image,
        sender,
        createdAt,
      });
    } else {
      io.emit("messages", { chatId, text, image, sender, createdAt }); // Fallback to broadcast to all users
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    const index = users.findIndex((u) => u.id === socket.id);
    if (index !== -1) {
      users.splice(index, 1); // Remove the user from the list
    }
    io.emit("users", users); // Emit updated user list
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
