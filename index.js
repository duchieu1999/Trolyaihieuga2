// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// MongoDB connection
mongoose.connect('mongodb+srv://duchieufaryoung0:80E9gUahdOXmGKuy@cluster0.6nlv1cv.mongodb.net/telegram_bot_db?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Game models
const UserSchema = new mongoose.Schema({
  telegramId: String,
  username: String,
  rank: { type: Number, default: 1000 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

const RoomSchema = new mongoose.Schema({
  roomId: String,
  player1: String,
  player2: String,
  gameState: Array,
  currentTurn: String,
  isRanked: Boolean,
  status: String
});

const Room = mongoose.model('Room', RoomSchema);

// Thêm dòng này vào server.js
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

// Hoặc cấu hình chi tiết hơn
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Cấu hình Socket.IO với CORS
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(session({
  secret: 'carogamesecret',
  resave: false,
  saveUninitialized: true
}));

// Game state management
const rooms = new Map();
const queue = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', async (data) => {
    let user = await User.findOne({ telegramId: data.telegramId });
    if (!user) {
      user = new User({
        telegramId: data.telegramId,
        username: data.username
      });
      await user.save();
    }
    socket.userId = user.telegramId;
    socket.emit('userInfo', user);
  });

  socket.on('createRoom', async (isRanked) => {
    const roomId = Math.random().toString(36).substring(7);
    const room = new Room({
      roomId,
      player1: socket.userId,
      gameState: Array(400).fill(null),
      currentTurn: socket.userId,
      isRanked,
      status: 'waiting'
    });
    await room.save();
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
  });

  socket.on('joinRoom', async (roomId) => {
    const room = await Room.findOne({ roomId });
    if (room && !room.player2) {
      room.player2 = socket.userId;
      room.status = 'playing';
      await room.save();
      socket.join(roomId);
      io.to(roomId).emit('gameStart', {
        player1: room.player1,
        player2: room.player2,
        currentTurn: room.currentTurn
      });
    }
  });

  socket.on('findMatch', async () => {
    if (queue.length > 0) {
      const opponent = queue.shift();
      const roomId = Math.random().toString(36).substring(7);
      const room = new Room({
        roomId,
        player1: opponent,
        player2: socket.userId,
        gameState: Array(400).fill(null),
        currentTurn: opponent,
        isRanked: true,
        status: 'playing'
      });
      await room.save();
      socket.join(roomId);
      io.to(roomId).emit('gameStart', {
        player1: room.player1,
        player2: room.player2,
        currentTurn: room.currentTurn
      });
    } else {
      queue.push(socket.userId);
      socket.emit('waiting');
    }
  });

  socket.on('move', async (data) => {
    const room = await Room.findOne({ roomId: data.roomId });
    if (room && room.currentTurn === socket.userId) {
      room.gameState[data.position] = socket.userId;
      room.currentTurn = room.currentTurn === room.player1 ? room.player2 : room.player1;
      await room.save();
      io.to(data.roomId).emit('updateGame', {
        gameState: room.gameState,
        currentTurn: room.currentTurn
      });
      
      // Check win condition
      if (checkWin(room.gameState, data.position)) {
        const winner = await User.findOne({ telegramId: socket.userId });
        const loser = await User.findOne({ 
          telegramId: room.player1 === socket.userId ? room.player2 : room.player1 
        });
        
        if (room.isRanked) {
          winner.wins += 1;
          winner.rank += 25;
          loser.losses += 1;
          loser.rank = Math.max(0, loser.rank - 25);
          await winner.save();
          await loser.save();
        }
        
        room.status = 'finished';
        await room.save();
        io.to(data.roomId).emit('gameOver', {
          winner: socket.userId,
          newRanks: {
            [winner.telegramId]: winner.rank,
            [loser.telegramId]: loser.rank
          }
        });
      }
    }
  });

  socket.on('disconnect', () => {
    const queueIndex = queue.indexOf(socket.userId);
    if (queueIndex > -1) {
      queue.splice(queueIndex, 1);
    }
  });
});

function checkWin(gameState, lastMove) {
  // Check horizontal, vertical, and diagonal lines
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];
  
  const boardSize = 20; // 20x20 board
  const row = Math.floor(lastMove / boardSize);
  const col = lastMove % boardSize;
  const player = gameState[lastMove];

  for (const [dx, dy] of directions) {
    let count = 1;
    
    // Check forward
    for (let i = 1; i < 5; i++) {
      const newRow = row + (dx * i);
      const newCol = col + (dy * i);
      if (
        newRow < 0 || newRow >= boardSize ||
        newCol < 0 || newCol >= boardSize ||
        gameState[newRow * boardSize + newCol] !== player
      ) break;
      count++;
    }
    
    // Check backward
    for (let i = 1; i < 5; i++) {
      const newRow = row - (dx * i);
      const newCol = col - (dy * i);
      if (
        newRow < 0 || newRow >= boardSize ||
        newCol < 0 || newCol >= boardSize ||
        gameState[newRow * boardSize + newCol] !== player
      ) break;
      count++;
    }

    if (count >= 5) return true;
  }
  return false;
}

http.listen(3000, () => {
  console.log('Server running on port 3000');
});
