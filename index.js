// Server code (server.js)
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb+srv://duchieufaryoung0:80E9gUahdOXmGKuy@cluster0.6nlv1cv.mongodb.net/telegram_bot_db?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Player Schema
const PlayerSchema = new mongoose.Schema({
    id: String,
    username: String,
    stats: {
        kills: Number,
        deaths: Number,
        wins: Number
    }
});

const Player = mongoose.model('Player', PlayerSchema);


// Thêm dòng này vào server.js
app.use(express.static('public'));


// Game state
const gameState = {
    players: new Map(),
    bullets: []
};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    socket.on('playerJoin', async (player) => {
        gameState.players.set(socket.id, player);
        
        // Create or update player in database
        await Player.findOneAndUpdate(
            { id: socket.id },
            { id: socket.id },
            { upsert: true }
        );
        
        io.emit('playerJoined', player);
        socket.emit('gameState', {
            players: Array.from(gameState.players.values())
        });
    });
    
    socket.on('playerUpdate', (player) => {
        gameState.players.set(socket.id, player);
        socket.broadcast.emit('gameState', {
            players: Array.from(gameState.players.values())
        });
    });
    
    socket.on('shoot', (data) => {
        socket.broadcast.emit('playerShoot', {
            playerId: socket.id,
            ...data
        });
    });
    
    socket.on('disconnect', () => {
        gameState.players.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Telegram WebApp Integration
app.get('/auth/telegram', (req, res) => {
    const telegramData = req.query;
    // Verify Telegram WebApp data
    if (validateTelegramWebAppData(telegramData)) {
        // Create session for user
        const session = {
            userId: telegramData.id,
            username: telegramData.username
        };
        // Return game URL with session token
        res.redirect(`/game?token=${generateToken(session)}`);
    } else {
        res.status(401).send('Invalid authentication');
    }
});

function validateTelegramWebAppData(data) {
    // Implementation of Telegram WebApp data validation
    return true; // Simplified for example
}

function generateToken(session) {
    // Implementation of session token generation
    return 'sample-token'; // Simplified for example
}

// Start game function
function startGame() {
    const game = new Game();
    game.start();
}
