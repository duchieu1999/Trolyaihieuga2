// game.js
const GAME_CONFIG = {
    width: window.innerWidth,
    height: window.innerHeight,
    playerSpeed: 5,
    bulletSpeed: 10,
    playerSize: 50,
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GAME_CONFIG.width;
        this.canvas.height = GAME_CONFIG.height;
        
        this.players = new Map();
        this.bullets = [];
        this.localPlayer = null;
        
        // Socket.io connection
        this.socket = io('http://localhost:3000');
        this.setupSocketListeners();
        
        // Game state
        this.gameStarted = false;
        this.gameLoop = this.gameLoop.bind(this);
        
        // Input handling
        this.keys = new Set();
        this.setupInputHandlers();
        
        // Load assets
        this.assets = {
            player: new Image(),
            bullet: new Image(),
            background: new Image()
        };
        this.loadAssets();
    }
    
    loadAssets() {
        this.assets.player.src = '/assets/player.png';
        this.assets.bullet.src = '/assets/bullet.png';
        this.assets.background.src = '/assets/background.png';
        
        Promise.all([
            new Promise(resolve => this.assets.player.onload = resolve),
            new Promise(resolve => this.assets.bullet.onload = resolve),
            new Promise(resolve => this.assets.background.onload = resolve)
        ]).then(() => {
            this.assetsLoaded = true;
        });
    }
    
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('gameState', (state) => {
            this.updateGameState(state);
        });
        
        this.socket.on('playerJoined', (player) => {
            this.addPlayer(player);
        });
        
        this.socket.on('playerLeft', (playerId) => {
            this.removePlayer(playerId);
        });
    }
    
    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameStarted && this.localPlayer) {
                this.shoot(e.clientX, e.clientY);
            }
        });
    }
    
    start() {
        this.gameStarted = true;
        document.getElementById('menu').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
        
        // Create local player
        this.localPlayer = {
            id: this.socket.id,
            x: Math.random() * (GAME_CONFIG.width - GAME_CONFIG.playerSize),
            y: Math.random() * (GAME_CONFIG.height - GAME_CONFIG.playerSize),
            health: 100,
            ammo: 30
        };
        
        this.players.set(this.localPlayer.id, this.localPlayer);
        this.socket.emit('playerJoin', this.localPlayer);
        
        requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop() {
        this.update();
        this.render();
        
        if (this.gameStarted) {
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    update() {
        if (!this.localPlayer) return;
        
        // Handle movement
        if (this.keys.has('KeyW')) this.localPlayer.y -= GAME_CONFIG.playerSpeed;
        if (this.keys.has('KeyS')) this.localPlayer.y += GAME_CONFIG.playerSpeed;
        if (this.keys.has('KeyA')) this.localPlayer.x -= GAME_CONFIG.playerSpeed;
        if (this.keys.has('KeyD')) this.localPlayer.x += GAME_CONFIG.playerSpeed;
        
        // Update bullets
        this.bullets.forEach((bullet, index) => {
            bullet.x += Math.cos(bullet.angle) * GAME_CONFIG.bulletSpeed;
            bullet.y += Math.sin(bullet.angle) * GAME_CONFIG.bulletSpeed;
            
            // Remove bullets that are off screen
            if (bullet.x < 0 || bullet.x > GAME_CONFIG.width ||
                bullet.y < 0 || bullet.y > GAME_CONFIG.height) {
                this.bullets.splice(index, 1);
            }
        });
        
        // Send player state to server
        this.socket.emit('playerUpdate', this.localPlayer);
        
        // Update UI
        document.getElementById('health').textContent = this.localPlayer.health;
        document.getElementById('ammo').textContent = this.localPlayer.ammo;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        if (this.assetsLoaded) {
            this.ctx.drawImage(this.assets.background, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw players
        this.players.forEach(player => {
            if (this.assetsLoaded) {
                this.ctx.drawImage(
                    this.assets.player,
                    player.x,
                    player.y,
                    GAME_CONFIG.playerSize,
                    GAME_CONFIG.playerSize
                );
            } else {
                this.ctx.fillStyle = player.id === this.localPlayer.id ? 'blue' : 'red';
                this.ctx.fillRect(
                    player.x,
                    player.y,
                    GAME_CONFIG.playerSize,
                    GAME_CONFIG.playerSize
                );
            }
        });
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            if (this.assetsLoaded) {
                this.ctx.drawImage(
                    this.assets.bullet,
                    bullet.x,
                    bullet.y,
                    10,
                    10
                );
            } else {
                this.ctx.fillStyle = 'yellow';
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    shoot(targetX, targetY) {
        if (this.localPlayer.ammo <= 0) return;
        
        const angle = Math.atan2(
            targetY - this.localPlayer.y,
            targetX - this.localPlayer.x
        );
        
        this.bullets.push({
            x: this.localPlayer.x + GAME_CONFIG.playerSize / 2,
            y: this.localPlayer.y + GAME_CONFIG.playerSize / 2,
            angle: angle
        });
        
        this.localPlayer.ammo--;
        this.socket.emit('shoot', { x: targetX, y: targetY });
    }
    
    updateGameState(state) {
        state.players.forEach(player => {
            if (player.id !== this.localPlayer.id) {
                this.players.set(player.id, player);
            }
        });
    }
    
    addPlayer(player) {
        if (player.id !== this.localPlayer.id) {
            this.players.set(player.id, player);
        }
    }
    
    removePlayer(playerId) {
        this.players.delete(playerId);
    }
}
