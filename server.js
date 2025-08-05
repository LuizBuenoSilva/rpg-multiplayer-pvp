const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Configurar MIME types e cache para arquivos estáticos
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Estruturas de dados do jogo
const gameRooms = new Map();
const playerSockets = new Map();

class GameRoom {
    constructor(roomCode, hostId) {
        this.roomCode = roomCode;
        this.hostId = hostId;
        this.players = new Map();
        this.gameState = 'waiting'; // waiting, playing, finished
        this.maxPlayers = 4;
        this.map = this.generateMap();
        this.combatQueue = [];
        this.currentTurn = null;
    }
    
    restartGame() {
        // Resetar posições e stats dos jogadores
        const playerArray = Array.from(this.players.values());
        this.players.clear();
        
        // Recriar jogadores com stats iniciais
        playerArray.forEach((player, index) => {
            const startPositions = [
                { x: 1, y: 1 },
                { x: 13, y: 8 },
                { x: 1, y: 8 },
                { x: 13, y: 1 }
            ];
            
            const pos = startPositions[index] || { x: 1, y: 1 };
            
            this.players.set(player.id, {
                id: player.id,
                name: player.name,
                x: pos.x,
                y: pos.y,
                hp: 100,
                maxHp: 100,
                mp: 50,
                maxMp: 50,
                level: 1,
                xp: 0,
                maxXp: 100,
                attack: 20,
                defense: 10,
                alive: true,
                color: this.getPlayerColor(index)
            });
        });
        
        // Regenerar mapa
        this.map = this.generateMap();
        this.combatQueue = [];
        this.currentTurn = null;
        this.gameState = 'waiting';
    }

    generateMap() {
        const MAP_WIDTH = 15;
        const MAP_HEIGHT = 10;
        const map = [];
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || 
                    y === 0 || y === MAP_HEIGHT - 1) {
                    row.push(1); // Parede
                } else if (Math.random() < 0.1) {
                    row.push(1); // Parede aleatória
                } else if (Math.random() < 0.05) {
                    row.push(3); // Item
                } else {
                    row.push(0); // Chão
                }
            }
            map.push(row);
        }
        
        return map;
    }

    addPlayer(playerId, playerData) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }

        // Posições iniciais para cada jogador
        const spawnPositions = [
            { x: 2, y: 2 },
            { x: 12, y: 2 },
            { x: 2, y: 7 },
            { x: 12, y: 7 }
        ];

        const spawnPos = spawnPositions[this.players.size];
        
        const player = {
            id: playerId,
            name: playerData.name,
            x: spawnPos.x,
            y: spawnPos.y,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            level: 1,
            xp: 0,
            attack: 15,
            defense: 5,
            alive: true,
            color: this.getPlayerColor(this.players.size)
        };

        this.players.set(playerId, player);
        return true;
    }

    getPlayerColor(index) {
        const colors = ['#27ae60', '#e74c3c', '#3498db', '#f39c12'];
        return colors[index] || '#9b59b6';
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        if (this.players.size === 0) {
            return true; // Sala vazia, pode ser removida
        }
        return false;
    }

    movePlayer(playerId, dx, dy) {
        const player = this.players.get(playerId);
        if (!player || !player.alive) return false;

        const newX = player.x + dx;
        const newY = player.y + dy;
        
        if (newX >= 0 && newX < 15 && newY >= 0 && newY < 10) {
            const tile = this.map[newY][newX];
            if (tile !== 1) { // Não é parede
                // Verificar se não há outro jogador na posição
                const occupied = Array.from(this.players.values()).some(p => 
                    p.id !== playerId && p.x === newX && p.y === newY && p.alive
                );
                
                if (!occupied) {
                    player.x = newX;
                    player.y = newY;
                    
                    let itemResult = null;
                    // Verificar se encontrou item
                    if (tile === 3) {
                        this.map[newY][newX] = 0; // Remove o item
                        itemResult = this.giveRandomItem(playerId);
                    }
                    
                    return { success: true, itemResult: itemResult };
                }
            }
        }
        return false;
    }

    giveRandomItem(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        const healAmount = 20 + Math.floor(Math.random() * 20);
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        
        return {
            type: 'item_found',
            message: `${player.name} encontrou uma poção e recuperou ${healAmount} HP!`
        };
    }

    startPvPCombat(attackerId, targetId) {
        const attacker = this.players.get(attackerId);
        const target = this.players.get(targetId);
        
        if (!attacker || !target || !attacker.alive || !target.alive) {
            return null;
        }

        // Verificar se estão próximos (distância máxima de 1)
        const distance = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
        if (distance > 1) {
            return {
                type: 'combat_error',
                message: 'Muito longe para atacar!'
            };
        }

        // Calcular dano
        const baseDamage = attacker.attack + Math.floor(Math.random() * 10);
        const actualDamage = Math.max(1, baseDamage - target.defense);
        target.hp = Math.max(0, target.hp - actualDamage);

        const result = {
            type: 'pvp_attack',
            attacker: attacker.name,
            target: target.name,
            damage: actualDamage,
            targetHp: target.hp,
            targetMaxHp: target.maxHp
        };

        // Verificar se o alvo morreu
        if (target.hp <= 0) {
            target.alive = false;
            result.killed = true;
            
            // Dar XP ao atacante
            attacker.xp += 50;
            if (attacker.xp >= 100) {
                this.levelUpPlayer(attackerId);
                result.levelUp = true;
            }
        }

        return result;
    }

    levelUpPlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        player.level++;
        player.xp -= 100;
        player.maxHp += 20;
        player.maxMp += 10;
        player.hp = player.maxHp; // Cura completa
        player.mp = player.maxMp;
        player.attack += 3;
        player.defense += 2;
    }

    getGameState() {
        return {
            roomCode: this.roomCode,
            hostId: this.hostId,
            players: Array.from(this.players.values()),
            map: this.map,
            gameState: this.gameState
        };
    }

    getAlivePlayers() {
        return Array.from(this.players.values()).filter(p => p.alive);
    }
}

// Funções auxiliares
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function findNearbyPlayers(room, playerId) {
    const player = room.players.get(playerId);
    if (!player) return [];

    return Array.from(room.players.values()).filter(p => {
        if (p.id === playerId || !p.alive) return false;
        const distance = Math.abs(p.x - player.x) + Math.abs(p.y - player.y);
        return distance <= 1;
    });
}

// Socket.io eventos
io.on('connection', (socket) => {
    console.log(`Jogador conectado: ${socket.id}`);
    playerSockets.set(socket.id, socket);

    // Criar sala
    socket.on('create_room', (playerData) => {
        const roomCode = generateRoomCode();
        const room = new GameRoom(roomCode, socket.id);
        
        if (room.addPlayer(socket.id, playerData)) {
            gameRooms.set(roomCode, room);
            socket.join(roomCode);
            
            socket.emit('room_created', {
                roomCode: roomCode,
                gameState: room.getGameState()
            });
            
            console.log(`Sala criada: ${roomCode} por ${playerData.name}`);
        }
    });

    // Entrar em sala
    socket.on('join_room', (data) => {
        const { roomCode, playerData } = data;
        const room = gameRooms.get(roomCode);
        
        if (!room) {
            socket.emit('join_error', 'Sala não encontrada!');
            return;
        }
        
        if (room.addPlayer(socket.id, playerData)) {
            socket.join(roomCode);
            
            // Enviar confirmação para o jogador que entrou
            socket.emit('player_joined', {
                roomCode: roomCode,
                playerName: playerData.name,
                gameState: room.getGameState()
            });
            
            // Notificar outros jogadores na sala
            socket.to(roomCode).emit('player_joined', {
                roomCode: roomCode,
                playerName: playerData.name,
                gameState: room.getGameState()
            });
            
            console.log(`${playerData.name} entrou na sala ${roomCode}`);
        } else {
            socket.emit('join_error', 'Sala lotada!');
        }
    });

    // Movimento do jogador
    socket.on('player_move', (data) => {
        const { roomCode, dx, dy } = data;
        const room = gameRooms.get(roomCode);
        
        if (room) {
            const moveResult = room.movePlayer(socket.id, dx, dy);
            if (moveResult && moveResult.success) {
                io.to(roomCode).emit('game_update', {
                    gameState: room.getGameState(),
                    itemResult: moveResult.itemResult
                });
            }
        }
    });

    // Ataque PvP
    socket.on('pvp_attack', (data) => {
        const { roomCode, targetId } = data;
        const room = gameRooms.get(roomCode);
        
        if (room) {
            const result = room.startPvPCombat(socket.id, targetId);
            
            if (result) {
                io.to(roomCode).emit('combat_result', {
                    ...result,
                    gameState: room.getGameState()
                });
                
                // Verificar condição de vitória
                const alivePlayers = room.getAlivePlayers();
                if (alivePlayers.length <= 1) {
                    const winner = alivePlayers[0];
                    io.to(roomCode).emit('game_over', {
                        winner: winner ? winner.name : 'Empate',
                        gameState: room.getGameState()
                    });
                }
            }
        }
    });

    // Obter jogadores próximos para ataque
    socket.on('get_nearby_players', (roomCode) => {
        const room = gameRooms.get(roomCode);
        if (room) {
            const nearbyPlayers = findNearbyPlayers(room, socket.id);
            socket.emit('nearby_players', nearbyPlayers);
        }
    });

    // Iniciar jogo
    socket.on('start_game', (roomCode) => {
        const room = gameRooms.get(roomCode);
        if (room && room.hostId === socket.id) {
            room.gameStarted = true;
            io.to(roomCode).emit('game_started', room.getGameState());
            console.log(`Jogo iniciado na sala ${roomCode}`);
        }
    });
    
    // Reiniciar jogo
    socket.on('restart_game', (roomCode) => {
        const room = gameRooms.get(roomCode);
        if (room && room.hostId === socket.id) {
            room.restartGame();
            room.gameStarted = true;
            io.to(roomCode).emit('game_restarted', room.getGameState());
            console.log(`Jogo reiniciado na sala ${roomCode}`);
        }
    });
    
    // Placeholder para manter compatibilidade
    socket.on('old_start_game', (roomCode) => {
        const room = gameRooms.get(roomCode);
        if (room && room.hostId === socket.id) {
            room.gameStarted = true;
            io.to(roomCode).emit('game_started', {
                gameState: room.getGameState()
            });
        }
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        playerSockets.delete(socket.id);
        
        // Remover jogador de todas as salas
        for (const [roomCode, room] of gameRooms.entries()) {
            if (room.players.has(socket.id)) {
                const shouldRemoveRoom = room.removePlayer(socket.id);
                
                if (shouldRemoveRoom) {
                    gameRooms.delete(roomCode);
                    console.log(`Sala ${roomCode} removida (vazia)`);
                } else {
                    // Notificar outros jogadores
                    io.to(roomCode).emit('player_left', {
                        gameState: room.getGameState()
                    });
                    
                    // Se o host saiu, transferir para outro jogador
                    if (room.hostId === socket.id && room.players.size > 0) {
                        room.hostId = Array.from(room.players.keys())[0];
                        io.to(roomCode).emit('new_host', {
                            newHostId: room.hostId
                        });
                    }
                }
                break;
            }
        }
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});