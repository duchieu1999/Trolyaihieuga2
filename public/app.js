// public/app.js
const socket = io();

class Game {
    constructor() {
        this.app = document.getElementById('app');
        this.currentUser = null;
        this.currentRoom = null;
        this.gameState = null;
        this.isMyTurn = false;

        this.init();
        this.setupSocketListeners();
    }

    init() {
        // Sửa phần lấy thông tin Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            const webAppUser = window.Telegram.WebApp.initDataUnsafe.user;
            if (webAppUser) {
                const telegramData = {
                    telegramId: webAppUser.id.toString(),
                    username: webAppUser.username || webAppUser.first_name
                };
                socket.emit('register', telegramData);
            } else {
                this.showError('No Telegram data found');
            }
        } else {
            this.showError('Please open this app from Telegram');
        }
    
    }

    setupSocketListeners() {
        socket.on('userInfo', (user) => {
            this.currentUser = user;
            this.showMainMenu();
        });

        socket.on('roomCreated', (roomId) => {
            this.currentRoom = roomId;
            this.showWaitingScreen();
        });

        socket.on('gameStart', (data) => {
            this.gameState = Array(400).fill(null);
            this.isMyTurn = data.currentTurn === this.currentUser.telegramId;
            this.showGameBoard(data);
        });

        socket.on('updateGame', (data) => {
            this.gameState = data.gameState;
            this.isMyTurn = data.currentTurn === this.currentUser.telegramId;
            this.updateGameBoard();
        });

        socket.on('gameOver', (data) => {
            const isWinner = data.winner === this.currentUser.telegramId;
            this.showGameOver(isWinner, data.newRanks);
        });

        socket.on('waiting', () => {
            this.showSearchingScreen();
        });
    }

    showMainMenu() {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <h1 class="text-4xl mb-8 font-bold text-purple-400">Caro Online</h1>
                    <div class="space-y-4">
                        <div class="mb-6">
                            <p class="text-xl mb-2">Welcome, ${this.currentUser.username}</p>
                            <p class="text-purple-400">Rank: ${this.currentUser.rank}</p>
                            <p class="text-green-400">Wins: ${this.currentUser.wins}</p>
                            <p class="text-red-400">Losses: ${this.currentUser.losses}</p>
                        </div>
                        <button onclick="game.createRoom(false)" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
                            Create Casual Room
                        </button>
                        <button onclick="game.createRoom(true)" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
                            Create Ranked Room
                        </button>
                        <button onclick="game.findMatch()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
                            Find Ranked Match
                        </button>
                        <div class="mt-4">
                            <input type="text" id="roomInput" placeholder="Enter Room ID" class="w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-2">
                            <button onclick="game.joinRoom()" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showWaitingScreen() {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <h2 class="text-2xl mb-4">Waiting for opponent</h2>
                    <p class="mb-4">Room ID: ${this.currentRoom}</p>
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
                    <button onclick="game.showMainMenu()" class="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    showSearchingScreen() {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <h2 class="text-2xl mb-4">Searching for opponent...</h2>
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
                    <button onclick="game.showMainMenu()" class="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    showGameBoard(data) {
        const boardSize = 20;
        let boardHtml = '<div class="grid grid-cols-20 gap-0 bg-gray-700 p-1 rounded-lg">';
        
        for (let i = 0; i < boardSize * boardSize; i++) {
            boardHtml += `
                <div onclick="game.makeMove(${i})" 
                     class="w-8 h-8 bg-gray-600 hover:bg-gray-500 border border-gray-700 rounded-sm cursor-pointer flex items-center justify-center"
                     id="cell-${i}">
                </div>
            `;
        }
        boardHtml += '</div>';

        this.app.innerHTML = `
            <div class="min-h-screen p-8">
                <div class="max-w-4xl mx-auto">
                    <div class="flex justify-between mb-6">
                        <div class="bg-gray-800 p-4 rounded-lg">
                            <p class="text-purple-400">Player 1: ${data.player1}</p>
                        </div>
                        <div class="bg-gray-800 p-4 rounded-lg">
                            <p class="text-purple-400">Player 2: ${data.player2}</p>
                        </div>
</div>
                    <div class="text-center mb-6">
                        <h2 class="text-2xl ${this.isMyTurn ? 'text-green-400' : 'text-red-400'}">
                            ${this.isMyTurn ? 'Your turn' : "Opponent's turn"}
                        </h2>
                    </div>
                    ${boardHtml}
                    <div class="mt-6 text-center">
                        <button onclick="game.forfeit()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            Forfeit Game
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.updateGameBoard();
    }

    updateGameBoard() {
        for (let i = 0; i < this.gameState.length; i++) {
            const cell = document.getElementById(`cell-${i}`);
            if (this.gameState[i]) {
                const isPlayer1 = this.gameState[i] === this.currentUser.telegramId;
                cell.innerHTML = `
                    <div class="w-6 h-6 rounded-full ${isPlayer1 ? 'bg-blue-500' : 'bg-red-500'}"></div>
                `;
            } else {
                cell.innerHTML = '';
            }
        }
    }

    showGameOver(isWinner, newRanks) {
        const myNewRank = newRanks[this.currentUser.telegramId];
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center';
        overlay.innerHTML = `
            <div class="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <h2 class="text-3xl mb-4 ${isWinner ? 'text-green-400' : 'text-red-400'}">
                    ${isWinner ? 'Victory!' : 'Defeat'}
                </h2>
                <p class="text-xl mb-4">New Rank: ${myNewRank}</p>
                <button onclick="game.showMainMenu()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                    Back to Menu
                </button>
            </div>
        `;
        this.app.appendChild(overlay);
    }

    showError(message) {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <h2 class="text-2xl text-red-400 mb-4">Error</h2>
                    <p class="mb-4">${message}</p>
                    <button onclick="location.reload()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    createRoom(isRanked) {
        socket.emit('createRoom', isRanked);
    }

    joinRoom() {
        const roomId = document.getElementById('roomInput').value;
        if (roomId) {
            socket.emit('joinRoom', roomId);
        }
    }

    findMatch() {
        socket.emit('findMatch');
    }

    makeMove(position) {
        if (this.isMyTurn && !this.gameState[position]) {
            socket.emit('move', {
                roomId: this.currentRoom,
                position: position
            });
        }
    }

    forfeit() {
        if (confirm('Are you sure you want to forfeit?')) {
            socket.emit('forfeit', this.currentRoom);
            this.showMainMenu();
        }
    }
}

// Initialize game when page loads
const game = new Game();

// Add Telegram launch configuration
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();

    // Thêm xử lý sự kiện khi WebApp đóng
    window.Telegram.WebApp.onEvent('viewportChanged', () => {
        // Xử lý khi kích thước viewport thay đổi
    });
}
