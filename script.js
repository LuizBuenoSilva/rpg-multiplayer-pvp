// Configurações do jogo
const GAME_CONFIG = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    TILE_SIZE: 40,
    MAP_WIDTH: 15,
    MAP_HEIGHT: 10
};

// Variáveis globais
let socket = null;
let gameMode = 'menu'; // menu, lobby, singleplayer, multiplayer
let currentRoom = null;
let playerName = '';
let isHost = false;
let gameState = null;
let myPlayerId = null;

// Classes do jogo (versão single player)
class Player {
    constructor() {
        this.x = 2;
        this.y = 2;
        this.hp = 100;
        this.maxHp = 100;
        this.mp = 50;
        this.maxMp = 50;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        this.attack = 15;
        this.defense = 5;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
    }

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (newX >= 0 && newX < GAME_CONFIG.MAP_WIDTH && 
            newY >= 0 && newY < GAME_CONFIG.MAP_HEIGHT) {
            
            const tile = game.map[newY][newX];
            if (tile !== 1) {
                this.x = newX;
                this.y = newY;
                
                if (tile === 0 && Math.random() < 0.1) {
                    game.startCombat();
                }
                
                if (tile === 3) {
                    this.findItem();
                    game.map[newY][newX] = 0;
                }
                
                return true;
            }
        }
        return false;
    }

    findItem() {
        const items = [
            { name: 'Poção de Vida', type: 'consumable', effect: 'heal', value: 30 },
            { name: 'Poção de Mana', type: 'consumable', effect: 'mana', value: 20 },
            { name: 'Espada de Ferro', type: 'weapon', attack: 20 },
            { name: 'Armadura de Couro', type: 'armor', defense: 10 }
        ];
        
        const item = items[Math.floor(Math.random() * items.length)];
        this.inventory.push(item);
        game.addMessage(`Você encontrou: ${item.name}!`);
        game.updateInventory();
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.levelUp();
        }
        game.updatePlayerStats();
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNext;
        this.xpToNext = Math.floor(this.xpToNext * 1.5);
        
        const hpIncrease = 20;
        const mpIncrease = 10;
        
        this.maxHp += hpIncrease;
        this.maxMp += mpIncrease;
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.attack += 3;
        this.defense += 2;
        
        game.addMessage(`Parabéns! Você subiu para o nível ${this.level}!`);
        game.addMessage(`HP +${hpIncrease}, MP +${mpIncrease}, ATK +3, DEF +2`);
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    restoreMana(amount) {
        this.mp = Math.min(this.maxMp, this.mp + amount);
    }
}

class Enemy {
    constructor(type) {
        const enemyTypes = {
            goblin: { name: 'Goblin', hp: 30, attack: 8, defense: 2, xp: 15 },
            orc: { name: 'Orc', hp: 50, attack: 12, defense: 4, xp: 25 },
            skeleton: { name: 'Esqueleto', hp: 40, attack: 10, defense: 3, xp: 20 },
            dragon: { name: 'Dragão', hp: 100, attack: 20, defense: 8, xp: 50 }
        };
        
        const enemy = enemyTypes[type] || enemyTypes.goblin;
        this.name = enemy.name;
        this.hp = enemy.hp;
        this.maxHp = enemy.hp;
        this.attack = enemy.attack;
        this.defense = enemy.defense;
        this.xpReward = enemy.xp;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    isAlive() {
        return this.hp > 0;
    }
}

// Classe principal do jogo
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player();
        this.currentEnemy = null;
        this.inCombat = false;
        this.map = this.generateMap();
        
        this.initializeInventory();
        this.setupEventListeners();
        this.updatePlayerStats();
    }

    generateMap() {
        const map = [];
        for (let y = 0; y < GAME_CONFIG.MAP_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < GAME_CONFIG.MAP_WIDTH; x++) {
                if (x === 0 || x === GAME_CONFIG.MAP_WIDTH - 1 || 
                    y === 0 || y === GAME_CONFIG.MAP_HEIGHT - 1) {
                    row.push(1);
                } else if (Math.random() < 0.1) {
                    row.push(1);
                } else if (Math.random() < 0.05) {
                    row.push(3);
                } else {
                    row.push(0);
                }
            }
            map.push(row);
        }
        
        map[2][2] = 0;
        return map;
    }

    initializeInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        inventoryGrid.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;
            inventoryGrid.appendChild(slot);
        }
    }

    setupEventListeners() {
        // Controles de movimento
        document.getElementById('move-up').addEventListener('click', () => this.movePlayer(0, -1));
        document.getElementById('move-down').addEventListener('click', () => this.movePlayer(0, 1));
        document.getElementById('move-left').addEventListener('click', () => this.movePlayer(-1, 0));
        document.getElementById('move-right').addEventListener('click', () => this.movePlayer(1, 0));

        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            if (this.inCombat || gameMode !== 'singleplayer') return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.movePlayer(1, 0);
                    break;
            }
        });

        // Controles de combate
        document.getElementById('combat-attack').addEventListener('click', () => this.combatAction('attack'));
        document.getElementById('combat-defend').addEventListener('click', () => this.combatAction('defend'));
        document.getElementById('combat-magic').addEventListener('click', () => this.combatAction('magic'));
        document.getElementById('combat-run').addEventListener('click', () => this.combatAction('run'));
    }

    movePlayer(dx, dy) {
        if (gameMode === 'singleplayer') {
            if (this.inCombat) return;
            
            if (this.player.move(dx, dy)) {
                this.render();
            }
        } else if (gameMode === 'multiplayer' && socket) {
            socket.emit('player_move', {
                roomCode: currentRoom,
                dx: dx,
                dy: dy
            });
        }
    }

    startCombat() {
        const enemyTypes = ['goblin', 'orc', 'skeleton'];
        if (this.player.level >= 5) {
            enemyTypes.push('dragon');
        }
        
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.currentEnemy = new Enemy(randomType);
        this.inCombat = true;
        
        this.showCombatModal();
        this.addMessage(`Um ${this.currentEnemy.name} apareceu!`);
    }

    showCombatModal() {
        const modal = document.getElementById('combat-modal');
        modal.classList.remove('hidden');
        
        document.getElementById('enemy-name').textContent = this.currentEnemy.name;
        this.updateCombatStats();
    }

    hideCombatModal() {
        const modal = document.getElementById('combat-modal');
        modal.classList.add('hidden');
        this.inCombat = false;
    }

    updateCombatStats() {
        const playerHpBar = document.getElementById('player-combat-hp');
        const playerHpText = document.getElementById('player-combat-hp-text');
        const playerHpPercent = (this.player.hp / this.player.maxHp) * 100;
        playerHpBar.style.width = playerHpPercent + '%';
        playerHpText.textContent = `${this.player.hp}/${this.player.maxHp}`;
        
        const enemyHpBar = document.getElementById('enemy-combat-hp');
        const enemyHpText = document.getElementById('enemy-combat-hp-text');
        const enemyHpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        enemyHpBar.style.width = enemyHpPercent + '%';
        enemyHpText.textContent = `${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
    }

    combatAction(action) {
        if (!this.inCombat || !this.currentEnemy) return;
        
        let playerDamage = 0;
        let message = '';
        
        switch(action) {
            case 'attack':
                playerDamage = Math.floor(this.player.attack + Math.random() * 10);
                const actualDamage = this.currentEnemy.takeDamage(playerDamage);
                message = `Você atacou o ${this.currentEnemy.name} causando ${actualDamage} de dano!`;
                break;
                
            case 'defend':
                message = 'Você se defendeu, reduzindo o dano do próximo ataque!';
                break;
                
            case 'magic':
                if (this.player.mp >= 10) {
                    playerDamage = Math.floor(this.player.attack * 1.5 + Math.random() * 15);
                    const magicDamage = this.currentEnemy.takeDamage(playerDamage);
                    this.player.mp -= 10;
                    message = `Você usou magia causando ${magicDamage} de dano!`;
                } else {
                    message = 'Você não tem MP suficiente!';
                    return;
                }
                break;
                
            case 'run':
                if (Math.random() < 0.7) {
                    message = 'Você fugiu do combate!';
                    this.addCombatMessage(message);
                    this.hideCombatModal();
                    return;
                } else {
                    message = 'Você não conseguiu fugir!';
                }
                break;
        }
        
        this.addCombatMessage(message);
        
        if (!this.currentEnemy.isAlive()) {
            this.addCombatMessage(`Você derrotou o ${this.currentEnemy.name}!`);
            this.player.gainXp(this.currentEnemy.xpReward);
            this.addCombatMessage(`Você ganhou ${this.currentEnemy.xpReward} XP!`);
            
            setTimeout(() => {
                this.hideCombatModal();
            }, 2000);
            return;
        }
        
        setTimeout(() => {
            this.enemyTurn();
        }, 1000);
        
        this.updateCombatStats();
        this.updatePlayerStats();
    }

    enemyTurn() {
        if (!this.currentEnemy.isAlive()) return;
        
        const enemyDamage = Math.floor(this.currentEnemy.attack + Math.random() * 5);
        const actualDamage = this.player.takeDamage(enemyDamage);
        
        this.addCombatMessage(`${this.currentEnemy.name} atacou você causando ${actualDamage} de dano!`);
        
        if (this.player.hp <= 0) {
            this.addCombatMessage('Você foi derrotado! Game Over!');
            setTimeout(() => {
                this.resetGame();
            }, 2000);
        }
        
        this.updateCombatStats();
        this.updatePlayerStats();
    }

    addCombatMessage(message) {
        const combatLog = document.getElementById('combat-log');
        const p = document.createElement('p');
        p.textContent = message;
        combatLog.appendChild(p);
        combatLog.scrollTop = combatLog.scrollHeight;
    }

    resetGame() {
        this.player = new Player();
        this.map = this.generateMap();
        this.hideCombatModal();
        this.updatePlayerStats();
        this.render();
        this.addMessage('Jogo reiniciado!');
    }

    updatePlayerStats() {
        let currentPlayer = this.player;
        
        if (gameMode === 'multiplayer' && gameState && myPlayerId) {
            currentPlayer = gameState.players.find(p => p.id === myPlayerId) || this.player;
        }
        
        const hpBar = document.getElementById('hp-bar');
        const hpText = document.getElementById('hp-text');
        const hpPercent = (currentPlayer.hp / currentPlayer.maxHp) * 100;
        hpBar.style.width = hpPercent + '%';
        hpText.textContent = `${currentPlayer.hp}/${currentPlayer.maxHp}`;
        
        const mpBar = document.getElementById('mp-bar');
        const mpText = document.getElementById('mp-text');
        const mpPercent = (currentPlayer.mp / currentPlayer.maxMp) * 100;
        mpBar.style.width = mpPercent + '%';
        mpText.textContent = `${currentPlayer.mp}/${currentPlayer.maxMp}`;
        
        const xpBar = document.getElementById('xp-bar');
        const xpText = document.getElementById('xp-text');
        const xpToNext = 100; // Simplificado para multiplayer
        const xpPercent = (currentPlayer.xp / xpToNext) * 100;
        xpBar.style.width = xpPercent + '%';
        xpText.textContent = `${currentPlayer.xp}/${xpToNext}`;
        
        const levelText = document.getElementById('level-text');
        levelText.textContent = currentPlayer.level;
    }

    updateInventory() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            slot.innerHTML = '';
            slot.classList.remove('occupied');
            
            if (this.player.inventory[index]) {
                const item = this.player.inventory[index];
                slot.textContent = item.name.charAt(0);
                slot.classList.add('occupied');
                slot.title = item.name;
            }
        });
    }

    addMessage(message) {
        const messages = document.getElementById('messages');
        const p = document.createElement('p');
        p.textContent = message;
        messages.appendChild(p);
        messages.scrollTop = messages.scrollHeight;
        
        if (messages.children.length > 10) {
            messages.removeChild(messages.firstChild);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        let mapToRender = this.map;
        let playersToRender = [];
        
        if (gameMode === 'multiplayer' && gameState) {
            mapToRender = gameState.map;
            playersToRender = gameState.players;
        }
        
        // Desenhar mapa
        for (let y = 0; y < GAME_CONFIG.MAP_HEIGHT; y++) {
            for (let x = 0; x < GAME_CONFIG.MAP_WIDTH; x++) {
                const tile = mapToRender[y][x];
                const drawX = x * GAME_CONFIG.TILE_SIZE;
                const drawY = y * GAME_CONFIG.TILE_SIZE;
                
                switch(tile) {
                    case 0:
                        this.ctx.fillStyle = '#34495e';
                        break;
                    case 1:
                        this.ctx.fillStyle = '#2c3e50';
                        break;
                    case 3:
                        this.ctx.fillStyle = '#f39c12';
                        break;
                }
                
                this.ctx.fillRect(drawX, drawY, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
                
                this.ctx.strokeStyle = '#1a252f';
                this.ctx.strokeRect(drawX, drawY, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
            }
        }
        
        // Desenhar jogadores
        if (gameMode === 'multiplayer' && playersToRender.length > 0) {
            playersToRender.forEach(player => {
                const playerX = player.x * GAME_CONFIG.TILE_SIZE;
                const playerY = player.y * GAME_CONFIG.TILE_SIZE;
                
                this.ctx.fillStyle = player.alive ? player.color : '#666';
                this.ctx.fillRect(playerX + 5, playerY + 5, GAME_CONFIG.TILE_SIZE - 10, GAME_CONFIG.TILE_SIZE - 10);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                const symbol = player.id === myPlayerId ? '♦' : '♠';
                this.ctx.fillText(symbol, playerX + GAME_CONFIG.TILE_SIZE / 2, playerY + GAME_CONFIG.TILE_SIZE / 2 + 6);
                
                // Nome do jogador
                this.ctx.font = '10px Arial';
                this.ctx.fillText(player.name, playerX + GAME_CONFIG.TILE_SIZE / 2, playerY - 5);
            });
        } else if (gameMode === 'singleplayer') {
            const playerX = this.player.x * GAME_CONFIG.TILE_SIZE;
            const playerY = this.player.y * GAME_CONFIG.TILE_SIZE;
            
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillRect(playerX + 5, playerY + 5, GAME_CONFIG.TILE_SIZE - 10, GAME_CONFIG.TILE_SIZE - 10);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('♦', playerX + GAME_CONFIG.TILE_SIZE / 2, playerY + GAME_CONFIG.TILE_SIZE / 2 + 7);
        }
    }
}

// Funções de interface
function showScreen(screenId) {
    document.querySelectorAll('.menu-screen, #game-container').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function updateLobbyPlayers(players) {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        
        const colorDiv = document.createElement('div');
        colorDiv.className = 'player-color';
        colorDiv.style.backgroundColor = player.color;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = player.name;
        
        playerDiv.appendChild(colorDiv);
        playerDiv.appendChild(nameSpan);
        playersList.appendChild(playerDiv);
    });
}

function updateGameInfo() {
    if (gameState) {
        document.getElementById('current-room-code').textContent = currentRoom;
        const aliveCount = gameState.players.filter(p => p.alive).length;
        document.getElementById('alive-count').textContent = aliveCount;
    }
}

function showPvPTargets(nearbyPlayers) {
    const targetList = document.getElementById('target-list');
    targetList.innerHTML = '';
    
    if (nearbyPlayers.length === 0) {
        targetList.innerHTML = '<p>Nenhum jogador próximo para atacar!</p>';
        return;
    }
    
    nearbyPlayers.forEach(player => {
        const targetDiv = document.createElement('div');
        targetDiv.className = 'target-player';
        targetDiv.onclick = () => attackPlayer(player.id);
        
        const colorDiv = document.createElement('div');
        colorDiv.className = 'target-player-color';
        colorDiv.style.backgroundColor = player.color;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'target-player-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'target-player-name';
        nameDiv.textContent = player.name;
        
        const statsDiv = document.createElement('div');
        statsDiv.className = 'target-player-stats';
        statsDiv.textContent = `HP: ${player.hp}/${player.maxHp} | Nível: ${player.level}`;
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(statsDiv);
        
        targetDiv.appendChild(colorDiv);
        targetDiv.appendChild(infoDiv);
        
        targetList.appendChild(targetDiv);
    });
}

function attackPlayer(targetId) {
    socket.emit('pvp_attack', {
        roomCode: currentRoom,
        targetId: targetId
    });
    
    document.getElementById('pvp-target-modal').classList.add('hidden');
}

// Configuração do Socket.io
function initializeSocket() {
    socket = io();
    myPlayerId = socket.id;
    
    socket.on('room_created', (data) => {
        currentRoom = data.roomCode;
        gameState = data.gameState;
        isHost = true;
        
        document.getElementById('lobby-room-code').textContent = currentRoom;
        document.getElementById('start-game-btn').classList.remove('hidden');
        
        updateLobbyPlayers(gameState.players);
        showScreen('room-lobby');
        gameMode = 'lobby';
    });
    
    socket.on('player_joined', (data) => {
        gameState = data.gameState;
        updateLobbyPlayers(gameState.players);
        game.addMessage(`${data.playerName} entrou na sala!`);
    });
    
    socket.on('join_error', (message) => {
        alert(message);
    });
    
    socket.on('game_started', (data) => {
        gameState = data.gameState;
        gameMode = 'multiplayer';
        showScreen('game-container');
        updateGameInfo();
        game.render();
    });
    
    socket.on('game_update', (data) => {
        gameState = data.gameState;
        game.updatePlayerStats();
        game.render();
        updateGameInfo();
        
        if (data.itemResult) {
            game.addMessage(data.itemResult.message);
        }
    });
    
    socket.on('combat_result', (data) => {
        gameState = data.gameState;
        game.updatePlayerStats();
        game.render();
        updateGameInfo();
        
        let message = `${data.attacker} atacou ${data.target} causando ${data.damage} de dano!`;
        if (data.killed) {
            message += ` ${data.target} foi eliminado!`;
        }
        if (data.levelUp) {
            message += ` ${data.attacker} subiu de nível!`;
        }
        
        game.addMessage(message);
    });
    
    socket.on('game_over', (data) => {
        gameState = data.gameState;
        game.render();
        
        setTimeout(() => {
            alert(`Jogo terminado! Vencedor: ${data.winner}`);
        }, 1000);
    });
    
    socket.on('nearby_players', (players) => {
        showPvPTargets(players);
        document.getElementById('pvp-target-modal').classList.remove('hidden');
    });
    
    socket.on('player_left', (data) => {
        gameState = data.gameState;
        if (gameMode === 'lobby') {
            updateLobbyPlayers(gameState.players);
        } else {
            game.render();
            updateGameInfo();
        }
    });
    
    socket.on('new_host', (data) => {
        if (data.newHostId === myPlayerId) {
            isHost = true;
            if (gameMode === 'lobby') {
                document.getElementById('start-game-btn').classList.remove('hidden');
            }
        }
    });
}

// Event listeners
function setupMenuEventListeners() {
    document.getElementById('create-room-btn').addEventListener('click', () => {
        const name = document.getElementById('player-name').value.trim();
        if (!name) {
            alert('Digite seu nome!');
            return;
        }
        
        playerName = name;
        initializeSocket();
        
        socket.emit('create_room', { name: playerName });
    });
    
    document.getElementById('join-room-btn').addEventListener('click', () => {
        const name = document.getElementById('player-name').value.trim();
        const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
        
        if (!name || !roomCode) {
            alert('Digite seu nome e o código da sala!');
            return;
        }
        
        playerName = name;
        initializeSocket();
        
        socket.emit('join_room', {
            roomCode: roomCode,
            playerData: { name: playerName }
        });
    });
    
    document.getElementById('single-player-btn').addEventListener('click', () => {
        gameMode = 'singleplayer';
        showScreen('game-container');
        game.render();
    });
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
        if (isHost && socket) {
            socket.emit('start_game', currentRoom);
        }
    });
    
    document.getElementById('leave-room-btn').addEventListener('click', () => {
        if (socket) {
            socket.disconnect();
        }
        showScreen('main-menu');
        gameMode = 'menu';
        currentRoom = null;
        isHost = false;
    });
    
    document.getElementById('pvp-attack-btn').addEventListener('click', () => {
        if (gameMode === 'multiplayer' && socket) {
            socket.emit('get_nearby_players', currentRoom);
        }
    });
    
    document.getElementById('cancel-pvp').addEventListener('click', () => {
        document.getElementById('pvp-target-modal').classList.add('hidden');
    });
    
    // Controles de teclado para multiplayer
    document.addEventListener('keydown', (e) => {
        if (gameMode !== 'multiplayer') return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                game.movePlayer(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                game.movePlayer(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                game.movePlayer(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                game.movePlayer(1, 0);
                break;
        }
    });
}

// Inicialização
let game;
window.addEventListener('load', () => {
    game = new Game();
    setupMenuEventListeners();
    
    // Começar no menu principal
    showScreen('main-menu');
    gameMode = 'menu';
});