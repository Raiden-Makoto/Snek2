// Game Constants
const GameConstants = {
    BOARD_SIZE: 720,
    SCORE_AREA_HEIGHT: 80,
    SCREEN_WIDTH: 720,
    SCREEN_HEIGHT: 800,
    CELL_SIZE: 30,
    GRID_WIDTH: 22,
    GRID_HEIGHT: 22,
    BORDER_OFFSET: 1,
    BOARD_START_Y: 80,
    TOTAL_GRID_WIDTH: 24,
    TOTAL_GRID_HEIGHT: 24,
    
    // Colors
    GRAY_COLOR: '#121212',
    SNAKE_COLOR: '#329632',
    SNAKE_HEAD_COLOR: '#196419',
    POISON_COLOR: '#b57e6b',
    GOLD_COLOR: '#ffa500',
    ENCHANTED_GOLD_COLOR: '#ffff00',
    PURPLE_COLOR: '#ba55d3',
    
    // Game timing
    MOVE_INTERVAL_REGULAR: 0.25,
    MOVE_INTERVAL_ACCELERATED: 0.20,
    IMMUNITY_DURATION: 10.0,
    WALL_IMMUNITY_DURATION: 10.0,
    EASY_MODE_LIFE_IMMUNITY_DURATION: 5.0,
    CANNOT_EAT_DURATION: 10.0,
    PAUSE_DURATION: 0.5,
    RESUME_DELAY_DURATION: 2.0,
    
    // Apple settings
    MAX_APPLES: 12,
    MIN_APPLES: 2,
    DESPAWN_TIME_MIN: 13,
    DESPAWN_TIME_MAX: 18
};

// Food types
const FoodType = {
    REGULAR: 0,
    POISONOUS: 1,
    POMME_PLUS: 2,
    POMME_SUPREME: 3,
    TELEPORT: 4
};

// Game modes
const GameMode = {
    REGULAR: 0,
    ACCELERATED: 1,
    CLASSIC: 2
};

// Difficulty levels
const Difficulty = {
    EASY: 0,
    NORMAL: 1
};

// Game State
class GameState {
    constructor() {
        this.difficulty = Difficulty.NORMAL;
        this.gameMode = GameMode.REGULAR;
        this.showDifficultySelection = true;
        this.showModeSelection = false;
        this.showInstructions = false;
        this.gameOver = false;
        this.selectedDifficultyIndex = 0;
        this.selectedModeIndex = 0;
        this.lives = 2;
        
        this.score = 0;
        this.highScoreRegularEasy = 0;
        this.highScoreRegularNormal = 0;
        this.highScoreAcceleratedEasy = 0;
        this.highScoreAcceleratedNormal = 0;
        this.highScoreClassicEasy = 0;
        this.highScoreClassicNormal = 0;
        
        this.snake = [];
        this.dx = 0;
        this.dy = 0;
        this.directionQueue = [];
        this.moveTimer = 0.0;
        
        this.apples = [];
        this.gameTime = 0.0;
        
        this.canIntersectSelf = false;
        this.immunityTimer = 0.0;
        this.canPassWalls = false;
        this.wallImmunityTimer = 0.0;
        this.cannotEatApples = false;
        this.cannotEatTimer = 0.0;
        
        this.isPaused = false;
        this.pauseTimer = 0.0;
        this.isUserPaused = false;
        this.isResuming = false;
        this.resumeDelayTimer = 0.0;
        
        this.poisonSoundTimer = 0.0;
        this.pauseSoundTimer = 0.0;
        this.gameOverSoundPlayed = false;
        
        this.sounds = {};
    }
    
    getCurrentHighScore() {
        if (this.gameMode === GameMode.ACCELERATED) {
            return this.difficulty === Difficulty.EASY 
                ? this.highScoreAcceleratedEasy 
                : this.highScoreAcceleratedNormal;
        } else if (this.gameMode === GameMode.CLASSIC) {
            return this.difficulty === Difficulty.EASY 
                ? this.highScoreClassicEasy 
                : this.highScoreClassicNormal;
        } else {
            return this.difficulty === Difficulty.EASY 
                ? this.highScoreRegularEasy 
                : this.highScoreRegularNormal;
        }
    }
    
    updateHighScore() {
        if (this.gameMode === GameMode.ACCELERATED) {
            if (this.difficulty === Difficulty.EASY) {
                if (this.score > this.highScoreAcceleratedEasy) {
                    this.highScoreAcceleratedEasy = this.score;
                }
            } else {
                if (this.score > this.highScoreAcceleratedNormal) {
                    this.highScoreAcceleratedNormal = this.score;
                }
            }
        } else if (this.gameMode === GameMode.CLASSIC) {
            if (this.difficulty === Difficulty.EASY) {
                if (this.score > this.highScoreClassicEasy) {
                    this.highScoreClassicEasy = this.score;
                }
            } else {
                if (this.score > this.highScoreClassicNormal) {
                    this.highScoreClassicNormal = this.score;
                }
            }
        } else {
            if (this.difficulty === Difficulty.EASY) {
                if (this.score > this.highScoreRegularEasy) {
                    this.highScoreRegularEasy = this.score;
                }
            } else {
                if (this.score > this.highScoreRegularNormal) {
                    this.highScoreRegularNormal = this.score;
                }
            }
        }
    }
    
    isValidPosition(col, row) {
        for (const segment of this.snake) {
            if (segment && segment.col !== undefined && segment.row !== undefined &&
                col === segment.col && row === segment.row) {
                return false;
            }
        }
        for (const apple of this.apples) {
            if (apple && apple.col !== undefined && apple.row !== undefined &&
                col === apple.col && row === apple.row) {
                return false;
            }
        }
        return true;
    }
    
    getRandomFoodType() {
        // In classic mode, always return regular apples
        if (this.gameMode === GameMode.CLASSIC) {
            return FoodType.REGULAR;
        }
        
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll <= 4) return FoodType.POMME_PLUS;
        if (roll <= 5) return FoodType.POMME_SUPREME;
        if (roll <= 15) return FoodType.POISONOUS;
        if (roll <= 18) return FoodType.TELEPORT;
        return FoodType.REGULAR;
    }
    
    spawnApple(currentTime) {
        if (this.apples.length >= GameConstants.MAX_APPLES) {
            return false;
        }
        
        let attempts = 0;
        let col, row;
        do {
            col = Math.floor(Math.random() * GameConstants.GRID_WIDTH);
            row = Math.floor(Math.random() * GameConstants.GRID_HEIGHT);
            attempts++;
        } while (!this.isValidPosition(col, row) && attempts < 100);
        
        if (attempts >= 100) {
            return false;
        }
        
        const newApple = {
            col: col,
            row: row,
            type: this.getRandomFoodType(),
            spawnTime: currentTime,
            despawnTime: GameConstants.DESPAWN_TIME_MIN + 
                        Math.random() * (GameConstants.DESPAWN_TIME_MAX - GameConstants.DESPAWN_TIME_MIN)
        };
        this.apples.push(newApple);
        return true;
    }
    
    updateStatusEffects(deltaTime) {
        if (this.canIntersectSelf) {
            this.immunityTimer -= deltaTime;
            if (this.immunityTimer <= 0.0) {
                // Only disable immunity if we're not currently moving into a self-intersecting position
                // Check if the next movement would cause self-intersection
                if (this.snake.length > 0 && (this.dx !== 0 || this.dy !== 0)) {
                    const head = this.snake[0];
                    const nextHead = {
                        col: head.col + this.dx,
                        row: head.row + this.dy
                    };
                    let wouldIntersect = false;
                    for (let i = 0; i < this.snake.length; i++) {
                        const segment = this.snake[i];
                        if (segment && 
                            segment.col === nextHead.col && segment.row === nextHead.row) {
                            wouldIntersect = true;
                            break;
                        }
                    }
                    if (wouldIntersect) {
                        // Keep immunity active until we're in a safe position
                        this.immunityTimer = 0.01; // Small value to check again soon
                    } else {
                        this.canIntersectSelf = false;
                        this.immunityTimer = 0.0;
                    }
                } else {
                    // No movement or no snake, safe to disable
                    this.canIntersectSelf = false;
                    this.immunityTimer = 0.0;
                }
            }
        }
        
        if (this.cannotEatApples) {
            this.cannotEatTimer -= deltaTime;
            
            if (!this.gameOver) {
                this.poisonSoundTimer -= deltaTime;
                if (this.poisonSoundTimer <= 0.0) {
                    this.playSound('poison');
                    this.poisonSoundTimer = 1.0;
                }
            }
            
            if (this.cannotEatTimer <= 0.0) {
                this.cannotEatApples = false;
                this.cannotEatTimer = 0.0;
                this.poisonSoundTimer = 0.0;
            }
        } else {
            this.poisonSoundTimer = 0.0;
        }
        
        if (this.canPassWalls) {
            this.wallImmunityTimer -= deltaTime;
            if (this.wallImmunityTimer <= 0.0) {
                // Only disable immunity if we're not about to wrap or self-intersect
                if (this.snake.length > 0 && (this.dx !== 0 || this.dy !== 0)) {
                    const head = this.snake[0];
                    const nextHead = {
                        col: head.col + this.dx,
                        row: head.row + this.dy
                    };
                    const wouldWrap = nextHead.col < 0 || nextHead.col >= GameConstants.GRID_WIDTH ||
                        nextHead.row < 0 || nextHead.row >= GameConstants.GRID_HEIGHT;
                    let wouldIntersectSelf = false;
                    for (let i = 0; i < this.snake.length; i++) {
                        const segment = this.snake[i];
                        if (segment && segment.col === nextHead.col && segment.row === nextHead.row) {
                            wouldIntersectSelf = true;
                            break;
                        }
                    }
                    if (wouldWrap || wouldIntersectSelf) {
                        // Keep immunity active until we're in a safe position
                        this.wallImmunityTimer = 0.01; // Small value to check again soon
                    } else {
                        this.canPassWalls = false;
                        this.wallImmunityTimer = 0.0;
                    }
                } else {
                    // No movement or no snake, safe to disable
                    this.canPassWalls = false;
                    this.wallImmunityTimer = 0.0;
                }
            }
        }
        
        if (this.isPaused) {
            this.pauseTimer -= deltaTime;
            if (this.pauseTimer <= 0.0) {
                this.isPaused = false;
                this.pauseTimer = 0.0;
            }
        }
        
        if (this.isResuming) {
            this.resumeDelayTimer -= deltaTime;
            
            this.pauseSoundTimer -= deltaTime;
            if (this.pauseSoundTimer <= 0.0) {
                this.playSound('pause');
                this.pauseSoundTimer = 1.0;
            }
            
            if (this.resumeDelayTimer <= 0.0) {
                this.isResuming = false;
                this.resumeDelayTimer = 0.0;
                this.pauseSoundTimer = 0.0;
            }
        } else {
            this.pauseSoundTimer = 0.0;
        }
    }
    
    updateAppleDespawn(deltaTime) {
        // Only despawn apples in ACCELERATED mode
        if (this.gameMode === GameMode.ACCELERATED) {
            this.apples = this.apples.filter(apple => {
                const elapsed = this.gameTime - apple.spawnTime;
                return elapsed < apple.despawnTime;
            });
        }
        
        // Always maintain minimum apples for all game modes
        while (this.apples.length < GameConstants.MIN_APPLES) {
            if (!this.spawnApple(this.gameTime)) {
                break;
            }
        }
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {});
        }
    }
    
    reset() {
        this.score = 0;
        this.gameOver = false;
        this.showModeSelection = false;
        this.showInstructions = false;
        this.gameTime = 0.0;
        this.lives = this.difficulty === Difficulty.EASY ? 2 : 1;
        
        this.snake = [{
            col: Math.floor(Math.random() * GameConstants.GRID_WIDTH),
            row: Math.floor(Math.random() * GameConstants.GRID_HEIGHT)
        }];
        
        this.apples = [];
        if (this.gameMode === GameMode.ACCELERATED) {
            for (let i = 0; i < 3; i++) {
                this.spawnApple(0.0);
            }
        } else {
            this.spawnApple(0.0);
        }
        
        this.dx = 0;
        this.dy = 0;
        this.directionQueue = [];
        this.moveTimer = 0.0;
        
        this.canIntersectSelf = false;
        this.immunityTimer = 0.0;
        this.canPassWalls = false;
        this.wallImmunityTimer = 0.0;
        this.cannotEatApples = false;
        this.cannotEatTimer = 0.0;
        this.isPaused = false;
        this.pauseTimer = 0.0;
        this.isUserPaused = false;
        this.isResuming = false;
        this.resumeDelayTimer = 0.0;
        this.poisonSoundTimer = 0.0;
        this.pauseSoundTimer = 0.0;
        this.gameOverSoundPlayed = false;
    }
}

// Game Logic
class GameLogic {
    static processMovement(state, deltaTime) {
        if (state.gameOver || state.isUserPaused || state.isResuming) {
            return;
        }
        
        if (!state.isPaused && !state.isUserPaused && !state.isResuming) {
            state.moveTimer += deltaTime;
        }
        
        const moveInterval = state.gameMode === GameMode.ACCELERATED
            ? GameConstants.MOVE_INTERVAL_ACCELERATED
            : GameConstants.MOVE_INTERVAL_REGULAR;
        
        if (!state.isPaused && !state.isUserPaused && !state.isResuming &&
            state.moveTimer >= moveInterval) {
            state.moveTimer = 0.0;
            
            GameLogic.processDirectionQueue(state);
            
            if ((state.dx !== 0 || state.dy !== 0) && state.snake.length > 0) {
                let newHead = {
                    col: state.snake[0].col + state.dx,
                    row: state.snake[0].row + state.dy
                };
                
                if (state.canPassWalls) {
                    if (newHead.col < 0) {
                        newHead.col = GameConstants.GRID_WIDTH - 1;
                    } else if (newHead.col >= GameConstants.GRID_WIDTH) {
                        newHead.col = 0;
                    }
                    if (newHead.row < 0) {
                        newHead.row = GameConstants.GRID_HEIGHT - 1;
                    } else if (newHead.row >= GameConstants.GRID_HEIGHT) {
                        newHead.row = 0;
                    }
                } else {
                    if (newHead.col < 0 || newHead.col >= GameConstants.GRID_WIDTH ||
                        newHead.row < 0 || newHead.row >= GameConstants.GRID_HEIGHT) {
                        if (state.difficulty === Difficulty.EASY && state.lives > 0) {
                            // Use a life and apply wall wrapping
                            state.lives--;
                            state.canPassWalls = true;
                            state.wallImmunityTimer = GameConstants.EASY_MODE_LIFE_IMMUNITY_DURATION;
                            // Wrap the snake to the other side
                            if (newHead.col < 0) {
                                newHead.col = GameConstants.GRID_WIDTH - 1;
                            } else if (newHead.col >= GameConstants.GRID_WIDTH) {
                                newHead.col = 0;
                            }
                            if (newHead.row < 0) {
                                newHead.row = GameConstants.GRID_HEIGHT - 1;
                            } else if (newHead.row >= GameConstants.GRID_HEIGHT) {
                                newHead.row = 0;
                            }
                            state.snake.unshift(newHead);
                            state.snake.pop();
                            return;
                        } else {
                            state.updateHighScore();
                            state.gameOver = true;
                            if (!state.gameOverSoundPlayed) {
                                state.playSound('gameover');
                                state.gameOverSoundPlayed = true;
                            }
                            return;
                        }
                    }
                }
                
                if (!state.gameOver) {
                    GameLogic.checkCollisions(state, newHead);
                }
            }
        }
    }
    
    static processDirectionQueue(state) {
        if (state.directionQueue.length > 0) {
            const nextDir = state.directionQueue[0];
            if ((state.dx === 0 && state.dy === 0) ||
                (nextDir.dx !== -state.dx || nextDir.dy !== -state.dy)) {
                state.dx = nextDir.dx;
                state.dy = nextDir.dy;
            }
            state.directionQueue.shift();
        }
    }
    
    static checkCollisions(state, newHead) {
        let hitSelf = false;
        if (!state.canIntersectSelf && !state.canPassWalls) {
            for (const segment of state.snake) {
                if (segment && segment.col !== undefined && segment.row !== undefined &&
                    newHead.col === segment.col && newHead.row === segment.row) {
                    hitSelf = true;
                    break;
                }
            }
        }
        
        if (hitSelf) {
            if (state.difficulty === Difficulty.EASY && state.lives > 0) {
                // Use a life and apply wall wrapping
                state.lives--;
                state.canPassWalls = true;
                state.wallImmunityTimer = GameConstants.EASY_MODE_LIFE_IMMUNITY_DURATION;
                // Continue movement (snake will be updated below)
            } else {
                state.snake.unshift(newHead);
                state.updateHighScore();
                state.gameOver = true;
                if (!state.gameOverSoundPlayed) {
                    state.playSound('gameover');
                    state.gameOverSoundPlayed = true;
                }
                return;
            }
        }
        
        let eatenAppleIndex = -1;
        let eatenFoodType = FoodType.REGULAR;
        for (let i = 0; i < state.apples.length; i++) {
            const apple = state.apples[i];
            if (apple && apple.col !== undefined && apple.row !== undefined &&
                newHead.col === apple.col && newHead.row === apple.row) {
                eatenAppleIndex = i;
                eatenFoodType = apple.type;
                break;
            }
        }
        
        state.snake.unshift(newHead);
        
        if (eatenAppleIndex >= 0) {
            GameLogic.handleAppleConsumption(state, eatenAppleIndex);
        } else {
            state.snake.pop();
        }
    }
    
    static handleAppleConsumption(state, eatenAppleIndex) {
        const eatenFoodType = state.apples[eatenAppleIndex].type;
        state.apples.splice(eatenAppleIndex, 1);
        
        if (eatenFoodType === FoodType.POISONOUS) {
            // Poisoned apples do nothing if resistance is active
            if (state.canIntersectSelf || state.canPassWalls) {
                // Just eat the apple without any effect - treat it like a regular apple
                state.snake.push({...state.snake[state.snake.length - 1]});
                state.score++;
                state.updateHighScore();
                state.playSound('apple');
                return;
            } else {
                state.isPaused = true;
                state.pauseTimer = GameConstants.PAUSE_DURATION;
                state.directionQueue = [];
                
                state.snake.reverse();
                state.snake.pop();
                
                state.dx = -state.dx;
                state.dy = -state.dy;
                
                state.cannotEatApples = true;
                // Stack poison duration: add 10 seconds if already poisoned, otherwise set to 10 seconds
                if (state.cannotEatTimer > 0.0) {
                    state.cannotEatTimer += GameConstants.CANNOT_EAT_DURATION;
                } else {
                    state.cannotEatTimer = GameConstants.CANNOT_EAT_DURATION;
                }
                state.poisonSoundTimer = 1.0;
            }
        } else if (eatenFoodType === FoodType.TELEPORT) {
            if (!state.cannotEatApples) {
                state.snake.shift();
                const snakeLength = state.snake.length;
                
                let newHeadCol, newHeadRow;
                let validTeleportPos = false;
                do {
                    newHeadCol = Math.floor(Math.random() * GameConstants.GRID_WIDTH);
                    newHeadRow = Math.floor(Math.random() * GameConstants.GRID_HEIGHT);
                    validTeleportPos = state.isValidPosition(newHeadCol, newHeadRow);
                } while (!validTeleportPos);
                
                const dirRoll = Math.floor(Math.random() * 4);
                switch (dirRoll) {
                    case 0: state.dx = 0; state.dy = -1; break;
                    case 1: state.dx = 0; state.dy = 1; break;
                    case 2: state.dx = -1; state.dy = 0; break;
                    case 3: state.dx = 1; state.dy = 0; break;
                }
                
                state.snake = [{col: newHeadCol, row: newHeadRow}];
                
                for (let i = 1; i < snakeLength; i++) {
                    let segCol = newHeadCol - state.dx * i;
                    let segRow = newHeadRow - state.dy * i;
                    
                    if (segCol < 0) segCol = 0;
                    if (segCol >= GameConstants.GRID_WIDTH) segCol = GameConstants.GRID_WIDTH - 1;
                    if (segRow < 0) segRow = 0;
                    if (segRow >= GameConstants.GRID_HEIGHT) segRow = GameConstants.GRID_HEIGHT - 1;
                    
                    state.snake.push({col: segCol, row: segRow});
                }
                
                state.directionQueue = [];
                state.dx = 0;
                state.dy = 0;
                state.moveTimer = 0.0;
                
                state.playSound('purple');
            } else {
                state.snake.pop();
            }
        } else if (eatenFoodType === FoodType.POMME_PLUS || eatenFoodType === FoodType.POMME_SUPREME) {
            state.score += 2;
            state.updateHighScore();
            
            state.snake.push({...state.snake[state.snake.length - 1]});
            
            // Cure poison when eating any pomme
            if (state.cannotEatApples) {
                state.cannotEatApples = false;
                state.cannotEatTimer = 0.0;
                state.poisonSoundTimer = 0.0;
            }
            
            if (eatenFoodType === FoodType.POMME_SUPREME) {
                // Cancel Resistance I if active before applying Resistance II
                if (state.canIntersectSelf) {
                    state.canIntersectSelf = false;
                    state.immunityTimer = 0.0;
                }
                state.canPassWalls = true;
                // Stack Resistance II duration: add 10 seconds if already active, otherwise set to 10 seconds
                if (state.wallImmunityTimer > 0.0) {
                    state.wallImmunityTimer += GameConstants.WALL_IMMUNITY_DURATION;
                } else {
                    state.wallImmunityTimer = GameConstants.WALL_IMMUNITY_DURATION;
                }
            } else {
                // Pomme Plus: Apply Resistance I
                state.canIntersectSelf = true;
                // Stack Resistance I duration: add 10 seconds if already active, otherwise set to 10 seconds
                if (state.immunityTimer > 0.0) {
                    state.immunityTimer += GameConstants.IMMUNITY_DURATION;
                } else {
                    state.immunityTimer = GameConstants.IMMUNITY_DURATION;
                }
            }
            
            state.playSound('golden');
        } else {
            if (!state.cannotEatApples) {
                state.score++;
                state.updateHighScore();
                state.snake.push({...state.snake[state.snake.length - 1]});
                state.playSound('apple');
            } else {
                state.snake.pop();
            }
        }
        
        if (state.gameMode === GameMode.ACCELERATED) {
            for (let i = 0; i < 3 && state.apples.length < GameConstants.MAX_APPLES; i++) {
                state.spawnApple(state.gameTime);
            }
        } else {
            state.spawnApple(state.gameTime);
        }
    }
}

// Renderer
class Renderer {
    static drawDifficultySelectionScreen(ctx, state) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);
        
        ctx.fillStyle = '#fff';
        ctx.font = '60px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE GAME', GameConstants.SCREEN_WIDTH / 2, 230);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '32px monospace';
        ctx.fillText('Select Difficulty', GameConstants.SCREEN_WIDTH / 2, 310);
        
        ctx.font = '36px monospace';
        const diffStartY = 410;
        const diffSpacing = 80;
        
        ctx.fillStyle = state.selectedDifficultyIndex === 0 ? '#00ff00' : '#d3d3d3';
        ctx.fillText('Easy (2 lives)', GameConstants.SCREEN_WIDTH / 2, diffStartY);
        
        ctx.fillStyle = state.selectedDifficultyIndex === 1 ? '#00ff00' : '#d3d3d3';
        ctx.fillText('Normal', GameConstants.SCREEN_WIDTH / 2, diffStartY + diffSpacing);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '20px monospace';
        ctx.fillText('>', GameConstants.SCREEN_WIDTH / 2 - 150, 
                    diffStartY + (state.selectedDifficultyIndex * diffSpacing) - 10);
        
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '20px monospace';
        ctx.fillText('Use UP/DOWN or W/S to select, SPACE or ENTER to confirm',
                    GameConstants.SCREEN_WIDTH / 2, diffStartY + diffSpacing * 2 + 40);
    }
    
    static drawModeSelectionScreen(ctx, state) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);
        
        ctx.fillStyle = '#fff';
        ctx.font = '60px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE GAME', GameConstants.SCREEN_WIDTH / 2, 230);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '32px monospace';
        ctx.fillText('Select Game Mode', GameConstants.SCREEN_WIDTH / 2, 310);
        
        ctx.font = '36px monospace';
        const modeStartY = 380;
        const modeSpacing = 70;
        
        ctx.fillStyle = state.selectedModeIndex === 0 ? '#00ff00' : '#d3d3d3';
        ctx.fillText('Regular', GameConstants.SCREEN_WIDTH / 2, modeStartY);
        
        ctx.fillStyle = state.selectedModeIndex === 1 ? '#00ff00' : '#d3d3d3';
        ctx.fillText('Accelerated', GameConstants.SCREEN_WIDTH / 2, modeStartY + modeSpacing);
        
        ctx.fillStyle = state.selectedModeIndex === 2 ? '#00ff00' : '#d3d3d3';
        ctx.fillText('Classic', GameConstants.SCREEN_WIDTH / 2, modeStartY + modeSpacing * 2);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '20px monospace';
        ctx.fillText('>', GameConstants.SCREEN_WIDTH / 2 - 150, 
                    modeStartY + (state.selectedModeIndex * modeSpacing) - 10);
        
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '20px monospace';
        ctx.fillText('Use UP/DOWN or W/S to select, SPACE or ENTER to confirm',
                    GameConstants.SCREEN_WIDTH / 2, modeStartY + modeSpacing * 2 + 40);
    }
    
    static drawInstructionsScreen(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);
        
        ctx.fillStyle = '#fff';
        ctx.font = '50px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE GAME', GameConstants.SCREEN_WIDTH / 2, 110);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '32px monospace';
        ctx.fillText('APPLE TYPES', GameConstants.SCREEN_WIDTH / 2, 180);
        
        ctx.textAlign = 'left';
        ctx.font = '20px monospace';
        let currentY = 230;
        const lineHeight = 28;
        const leftMargin = 40;
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Note: Classic mode has 100% regular apples only', GameConstants.SCREEN_WIDTH / 2, currentY);
        currentY += lineHeight + 10;
        
        ctx.textAlign = 'left';
        ctx.font = '20px monospace';
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(leftMargin - 35, currentY - 2, 25, 25);
        ctx.fillStyle = '#fff';
        ctx.fillText('Regular Apple (Red) - 82%: Score +1, Grow +2 units', leftMargin, currentY);
        currentY += lineHeight;
        
        ctx.fillStyle = GameConstants.POISON_COLOR;
        ctx.fillRect(leftMargin - 35, currentY - 2, 25, 25);
        ctx.fillStyle = '#fff';
        ctx.fillText('Poisonous Apple (Brown) - 10%: Reverses direction, 10s debuff', leftMargin, currentY);
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '18px monospace';
        ctx.fillText('  Cannot eat regular/purple apples during debuff', leftMargin + 10, currentY + lineHeight - 5);
        ctx.font = '20px monospace';
        currentY += lineHeight * 2;
        
        ctx.fillStyle = GameConstants.GOLD_COLOR;
        ctx.fillRect(leftMargin - 35, currentY - 2, 25, 25);
        ctx.fillStyle = '#fff';
        ctx.fillText('Pomme Plus (Orange) - 4%: Score +2, Resistance 10s', leftMargin, currentY);
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '18px monospace';
        ctx.fillText('  Can pass through own body, works when poisoned', leftMargin + 10, currentY + lineHeight - 5);
        ctx.font = '20px monospace';
        currentY += lineHeight * 2;
        
        ctx.fillStyle = GameConstants.ENCHANTED_GOLD_COLOR;
        ctx.fillRect(leftMargin - 35, currentY - 2, 25, 25);
        ctx.fillStyle = '#fff';
        ctx.fillText('Pomme Supreme (Yellow) - 1%: Score +2, Resistance II 10s', leftMargin, currentY);
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '18px monospace';
        ctx.fillText('  Pass through body + walls, works when poisoned', leftMargin + 10, currentY + lineHeight - 5);
        ctx.font = '20px monospace';
        currentY += lineHeight * 2;
        
        ctx.fillStyle = GameConstants.PURPLE_COLOR;
        ctx.fillRect(leftMargin - 35, currentY - 2, 25, 25);
        ctx.fillStyle = '#fff';
        ctx.fillText('Purple Apple (Purple) - 3%: Teleport to random location', leftMargin, currentY);
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '18px monospace';
        ctx.fillText('  No growth, cannot be eaten when poisoned', leftMargin + 10, currentY + lineHeight - 5);
        ctx.font = '20px monospace';
        currentY += lineHeight * 2 + 20;
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONTROLS', GameConstants.SCREEN_WIDTH / 2, currentY);
        currentY += lineHeight + 10;
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('Arrow Keys / WASD - Move', leftMargin, currentY);
        currentY += lineHeight;
        ctx.fillText('P - Pause/Unpause', leftMargin, currentY);
        currentY += lineHeight;
        ctx.fillText('ESC - Exit game', leftMargin, currentY);
        currentY += lineHeight;
        ctx.fillText('R / Space - Restart (on game over)', leftMargin, currentY);
        currentY += lineHeight * 2;
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px monospace';
        ctx.fillText('Press SPACE or ENTER to start', GameConstants.SCREEN_WIDTH / 2, currentY);
    }
    
    static drawGame(ctx, state) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);
        
        const cellSize = GameConstants.CELL_SIZE;
        const boardStartY = GameConstants.BOARD_START_Y;
        
        // Draw white border
        ctx.fillStyle = '#fff';
        for (let col = 0; col < GameConstants.TOTAL_GRID_WIDTH; col++) {
            ctx.fillRect(col * cellSize, boardStartY, cellSize, cellSize);
        }
        for (let col = 0; col < GameConstants.TOTAL_GRID_WIDTH; col++) {
            ctx.fillRect(col * cellSize, boardStartY + (GameConstants.TOTAL_GRID_HEIGHT - 1) * cellSize, cellSize, cellSize);
        }
        for (let row = 1; row < GameConstants.TOTAL_GRID_HEIGHT - 1; row++) {
            ctx.fillRect(0, boardStartY + row * cellSize, cellSize, cellSize);
        }
        for (let row = 1; row < GameConstants.TOTAL_GRID_HEIGHT - 1; row++) {
            ctx.fillRect((GameConstants.TOTAL_GRID_WIDTH - 1) * cellSize, boardStartY + row * cellSize, cellSize, cellSize);
        }
        
        // Draw checkerboard
        for (let row = 0; row < GameConstants.GRID_HEIGHT; row++) {
            for (let col = 0; col < GameConstants.GRID_WIDTH; col++) {
                const screenCol = (col + GameConstants.BORDER_OFFSET) * cellSize;
                const screenRow = boardStartY + (row + GameConstants.BORDER_OFFSET) * cellSize;
                if ((row + col) % 2 === 0) {
                    ctx.fillStyle = '#000';
                } else {
                    ctx.fillStyle = GameConstants.GRAY_COLOR;
                }
                ctx.fillRect(screenCol, screenRow, cellSize, cellSize);
            }
        }
        
        // Draw apples
        for (const apple of state.apples) {
            if (!apple || apple.col === undefined || apple.row === undefined) continue;
            let foodColor;
            if (apple.type === FoodType.POMME_SUPREME) {
                foodColor = GameConstants.ENCHANTED_GOLD_COLOR;
            } else if (apple.type === FoodType.POMME_PLUS) {
                foodColor = GameConstants.GOLD_COLOR;
            } else if (apple.type === FoodType.POISONOUS) {
                foodColor = GameConstants.POISON_COLOR;
            } else if (apple.type === FoodType.TELEPORT) {
                foodColor = GameConstants.PURPLE_COLOR;
            } else {
                foodColor = '#ff0000';
            }
            ctx.fillStyle = foodColor;
            ctx.fillRect((apple.col + GameConstants.BORDER_OFFSET) * cellSize,
                        boardStartY + (apple.row + GameConstants.BORDER_OFFSET) * cellSize,
                        cellSize, cellSize);
        }
        
        // Draw snake
        for (let i = 1; i < state.snake.length; i++) {
            const segment = state.snake[i];
            if (!segment || segment.col === undefined || segment.row === undefined) continue;
            ctx.fillStyle = GameConstants.SNAKE_COLOR;
            ctx.fillRect((segment.col + GameConstants.BORDER_OFFSET) * cellSize,
                        boardStartY + (segment.row + GameConstants.BORDER_OFFSET) * cellSize,
                        cellSize, cellSize);
        }
        
        if (state.snake.length > 0) {
            const head = state.snake[0];
            if (head && head.col !== undefined && head.row !== undefined) {
                ctx.fillStyle = GameConstants.SNAKE_HEAD_COLOR;
                ctx.fillRect((head.col + GameConstants.BORDER_OFFSET) * cellSize,
                            boardStartY + (head.row + GameConstants.BORDER_OFFSET) * cellSize,
                            cellSize, cellSize);
            }
        }
        
        // Update score display
        document.getElementById('score').textContent = state.score;
        document.getElementById('high-score').textContent = state.getCurrentHighScore();
        
        // Update status effects
        const statusDiv = document.getElementById('status-effects');
        statusDiv.innerHTML = '';
        
        // Show lives in easy mode
        if (state.difficulty === Difficulty.EASY) {
            statusDiv.innerHTML += `<div style="color: #fff">Lives: ${state.lives}</div>`;
        }
        
        if (state.cannotEatApples && state.cannotEatTimer > 0.0) {
            const countdown = Math.ceil(state.cannotEatTimer);
            statusDiv.innerHTML += `<div style="color: ${GameConstants.POISON_COLOR}">Poisoned: ${countdown}</div>`;
        }
        
        if (state.canIntersectSelf && state.immunityTimer > 0.0) {
            const countdown = Math.ceil(state.immunityTimer);
            statusDiv.innerHTML += `<div style="color: ${GameConstants.GOLD_COLOR}">Resistance: ${countdown}</div>`;
        }
        
        if (state.canPassWalls && state.wallImmunityTimer > 0.0) {
            const countdown = Math.ceil(state.wallImmunityTimer);
            statusDiv.innerHTML += `<div style="color: ${GameConstants.ENCHANTED_GOLD_COLOR}">Resistance II: ${countdown}</div>`;
        }
    }
    
    static drawGameOverScreen(ctx, state) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);
        
        ctx.fillStyle = '#fff';
        ctx.font = '60px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GameConstants.SCREEN_WIDTH / 2, 300);
        
        ctx.font = '40px monospace';
        ctx.fillText(`Final Score: ${state.score}`, GameConstants.SCREEN_WIDTH / 2, 380);
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`High Score: ${state.getCurrentHighScore()}`, GameConstants.SCREEN_WIDTH / 2, 440);
        
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '24px monospace';
        ctx.fillText('Press R or SPACE to restart', GameConstants.SCREEN_WIDTH / 2, 520);
        ctx.fillText('Press M to return to menu', GameConstants.SCREEN_WIDTH / 2, 555);
        ctx.fillText('Press ESC to exit', GameConstants.SCREEN_WIDTH / 2, 590);
    }
    
    static drawPauseScreen(ctx, state) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);
        
        ctx.fillStyle = '#fff';
        ctx.font = '60px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GameConstants.SCREEN_WIDTH / 2, 370);
        
        ctx.fillStyle = '#d3d3d3';
        ctx.font = '24px monospace';
        ctx.fillText('Press P to resume', GameConstants.SCREEN_WIDTH / 2, 450);
    }
    
    static drawResumeCountdown(ctx, state) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);
        
        const countdown = Math.ceil(state.resumeDelayTimer);
        ctx.fillStyle = '#fff';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Resuming in ${countdown}...`, GameConstants.SCREEN_WIDTH / 2, 400);
    }
}

// Main Game
class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        this.keys = {};
        this.lastFrameTime = performance.now();
        
        this.loadSounds();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    loadSounds() {
        const soundFiles = ['apple', 'poison', 'golden', 'purple', 'gameover', 'pause'];
        soundFiles.forEach(soundName => {
            const audio = new Audio(`sound/${soundName}.mp3`);
            audio.preload = 'auto';
            this.state.sounds[soundName] = audio;
        });
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code.toLowerCase()] = true;
            
            // Handle difficulty selection
            if (this.state.showDifficultySelection) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    this.state.selectedDifficultyIndex = 0;
                }
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    this.state.selectedDifficultyIndex = 1;
                }
                if (e.key === ' ' || e.key === 'Enter') {
                    this.state.difficulty = this.state.selectedDifficultyIndex === 0 ? Difficulty.EASY : Difficulty.NORMAL;
                    this.state.lives = this.state.difficulty === Difficulty.EASY ? 2 : 1;
                    this.state.showDifficultySelection = false;
                    this.state.showModeSelection = true;
                }
                return;
            }
            
            // Handle mode selection
            if (this.state.showModeSelection) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    this.state.selectedModeIndex = Math.max(0, this.state.selectedModeIndex - 1);
                }
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    this.state.selectedModeIndex = Math.min(2, this.state.selectedModeIndex + 1);
                }
                if (e.key === ' ' || e.key === 'Enter') {
                    if (this.state.selectedModeIndex === 0) {
                        this.state.gameMode = GameMode.REGULAR;
                    } else if (this.state.selectedModeIndex === 1) {
                        this.state.gameMode = GameMode.ACCELERATED;
                    } else {
                        this.state.gameMode = GameMode.CLASSIC;
                    }
                    this.state.showModeSelection = false;
                    this.state.showInstructions = true;
                    
                    // Initialize snake
                    this.state.snake = [{
                        col: Math.floor(Math.random() * GameConstants.GRID_WIDTH),
                        row: Math.floor(Math.random() * GameConstants.GRID_HEIGHT)
                    }];
                    
                    this.state.apples = [];
                    if (this.state.gameMode === GameMode.ACCELERATED) {
                        for (let i = 0; i < 3; i++) {
                            this.state.spawnApple(0.0);
                        }
                    } else {
                        this.state.spawnApple(0.0);
                    }
                    
                    // Reset game state
                    this.state.lives = this.state.difficulty === Difficulty.EASY ? 2 : 1;
                    this.state.dx = 0;
                    this.state.dy = 0;
                    this.state.directionQueue = [];
                    this.state.moveTimer = 0.0;
                    this.state.gameTime = 0.0;
                    this.state.score = 0;
                    this.state.gameOver = false;
                    this.state.canIntersectSelf = false;
                    this.state.immunityTimer = 0.0;
                    this.state.canPassWalls = false;
                    this.state.wallImmunityTimer = 0.0;
                    this.state.cannotEatApples = false;
                    this.state.cannotEatTimer = 0.0;
                    this.state.isPaused = false;
                    this.state.pauseTimer = 0.0;
                    this.state.isUserPaused = false;
                    this.state.isResuming = false;
                    this.state.resumeDelayTimer = 0.0;
                    this.state.poisonSoundTimer = 0.0;
                    this.state.pauseSoundTimer = 0.0;
                    this.state.gameOverSoundPlayed = false;
                }
                return;
            }
            
            // Handle instructions screen
            if (this.state.showInstructions) {
                if (e.key === ' ' || e.key === 'Enter') {
                    this.state.showInstructions = false;
                    this.state.gameTime = 0.0;
                }
                return;
            }
            
            // Handle ESC (always exits)
            if (e.key === 'Escape') {
                // Exit handling can be added here
                return;
            }
            
            // Handle Q
            if (e.key === 'q' || e.key === 'Q') {
                if (!this.state.gameOver) {
                    this.state.gameOver = true;
                    if (!this.state.gameOverSoundPlayed) {
                        this.state.playSound('gameover');
                        this.state.gameOverSoundPlayed = true;
                    }
                }
                return;
            }
            
            // Handle pause
            if (!this.state.gameOver && (e.key === 'p' || e.key === 'P')) {
                if (this.state.isUserPaused) {
                    this.state.isResuming = true;
                    this.state.resumeDelayTimer = GameConstants.RESUME_DELAY_DURATION;
                    this.state.pauseSoundTimer = 1.0;
                    this.state.isUserPaused = false;
                } else if (!this.state.isResuming) {
                    this.state.isUserPaused = true;
                }
                return;
            }
            
            // Handle game over
            if (this.state.gameOver) {
                if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
                    this.state.reset();
                }
                if (e.key === 'm' || e.key === 'M') {
                    this.state.gameOver = false;
                    this.state.showDifficultySelection = true;
                    this.state.showModeSelection = false;
                    this.state.showInstructions = false;
                    this.state.score = 0;
                    this.state.snake = [];
                    this.state.apples = [];
                    this.state.dx = 0;
                    this.state.dy = 0;
                    this.state.directionQueue = [];
                    this.state.moveTimer = 0.0;
                    this.state.gameTime = 0.0;
                    this.state.canIntersectSelf = false;
                    this.state.immunityTimer = 0.0;
                    this.state.canPassWalls = false;
                    this.state.wallImmunityTimer = 0.0;
                    this.state.cannotEatApples = false;
                    this.state.cannotEatTimer = 0.0;
                    this.state.isPaused = false;
                    this.state.pauseTimer = 0.0;
                    this.state.isUserPaused = false;
                    this.state.isResuming = false;
                    this.state.resumeDelayTimer = 0.0;
                    this.state.poisonSoundTimer = 0.0;
                    this.state.pauseSoundTimer = 0.0;
                    this.state.gameOverSoundPlayed = false;
                }
                return;
            }
            
            // Handle movement input
            if (!this.state.gameOver && !this.state.isUserPaused && !this.state.isResuming) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    const newDir = {dx: 0, dy: -1};
                    if (((this.state.dx === 0 && this.state.dy === 0) || this.state.dy !== 1) &&
                        (this.state.directionQueue.length === 0 ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dx !== newDir.dx ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dy !== newDir.dy)) {
                        this.state.directionQueue.push(newDir);
                    }
                }
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    const newDir = {dx: 0, dy: 1};
                    if (((this.state.dx === 0 && this.state.dy === 0) || this.state.dy !== -1) &&
                        (this.state.directionQueue.length === 0 ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dx !== newDir.dx ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dy !== newDir.dy)) {
                        this.state.directionQueue.push(newDir);
                    }
                }
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    const newDir = {dx: -1, dy: 0};
                    if (((this.state.dx === 0 && this.state.dy === 0) || this.state.dx !== 1) &&
                        (this.state.directionQueue.length === 0 ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dx !== newDir.dx ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dy !== newDir.dy)) {
                        this.state.directionQueue.push(newDir);
                    }
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    const newDir = {dx: 1, dy: 0};
                    if (((this.state.dx === 0 && this.state.dy === 0) || this.state.dx !== -1) &&
                        (this.state.directionQueue.length === 0 ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dx !== newDir.dx ||
                         this.state.directionQueue[this.state.directionQueue.length - 1].dy !== newDir.dy)) {
                        this.state.directionQueue.push(newDir);
                    }
                }
            }
        });
    }
    
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000.0;
        this.lastFrameTime = currentTime;
        
        // Update game time
        if (!this.state.isUserPaused && !this.state.isResuming) {
            this.state.gameTime += deltaTime;
        }
        
        // Update status effects and apple despawn
        if (!this.state.isUserPaused && !this.state.isResuming) {
            this.state.updateStatusEffects(deltaTime);
        }
        this.state.updateAppleDespawn(deltaTime);
        
        // Process game logic
        GameLogic.processMovement(this.state, deltaTime);
        
        // Render
        if (this.state.showDifficultySelection) {
            Renderer.drawDifficultySelectionScreen(this.ctx, this.state);
        } else if (this.state.showModeSelection) {
            Renderer.drawModeSelectionScreen(this.ctx, this.state);
        } else if (this.state.showInstructions) {
            Renderer.drawInstructionsScreen(this.ctx);
        } else {
            Renderer.drawGame(this.ctx, this.state);
            
            if (this.state.isUserPaused && !this.state.gameOver) {
                Renderer.drawPauseScreen(this.ctx, this.state);
            }
            
            if (this.state.isResuming && !this.state.gameOver) {
                Renderer.drawResumeCountdown(this.ctx, this.state);
            }
            
            if (this.state.gameOver) {
                Renderer.drawGameOverScreen(this.ctx, this.state);
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});

