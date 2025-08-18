// Black Cat in Space - js13k 2025 Entry
// A space shooter game featuring a black cat pilot with state management

function lerp(start, end, t) {
    return start + (end - start) * t;
}
// Base State class for all game states
class GameState {
    constructor(game) {
        this.game = game;
    }
    
    enter() {
        // Called when entering this state
    }
    
    exit() {
        // Called when exiting this state
    }
    
    update(deltaTime) {
        // Override in subclasses
    }
    
    render(ctx) {
        // Override in subclasses
    }
    
    handleInput(keys) {
        // Override in subclasses
    }
}

// Main Game class with state management
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // State management
        this.states = {};
        this.currentState = null;
        this.previousStateName = null; // Simple tracking of where we came from
        
        // Game data (shared across states)
        this.gameData = {
            score: 0,
            lives: 3,
            level: 1,
            highScore: 0,
            metal: 0 // Metal collected from asteroids
        };
        
        // Game objects (for gameplay state)
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.stars = [];
        this.particles = [];
        this.metal = [];
        
        this.keys = {};
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.starSpawnTimer = 0;
        
        // Frame rate tracking
        this.frameCount = 0;
        this.fps = 0;
        this.fpsTimer = 0;
        
        this.init();
    }
    
    init() {
        this.setupStates();
        this.bindEvents();
        this.changeState('menu');
        this.gameLoop();
    }
    
    setupStates() {
        // Create all game states
        this.states = {
            menu: new MenuState(this),
            gameplay: new GameplayState(this),
            pause: new PauseState(this),
            gameOver: new GameOverState(this),
            settings: new SettingsState(this),
            shop: new ShopState(this)
        };
    }
    
    changeState(stateName) {
        if (this.currentState) {
            this.currentState.exit();
            // Store the current state name as previous
            for (let [name, state] of Object.entries(this.states)) {
                if (state === this.currentState) {
                    this.previousStateName = name;
                    break;
                }
            }
        }
        
        this.currentState = this.states[stateName];
        if (this.currentState) {
            this.currentState.enter();
        }
    }
    
    goBack() {
        // Hard-coded navigation based on current state
        if (this.currentState === this.states.settings) {
            this.changeState('menu'); // Settings always goes back to main menu
        } else if (this.currentState === this.states.shop) {
            this.changeState('menu'); // Shop always goes back to main menu
        } else if (this.currentState === this.states.pause) {
            this.changeState('gameplay'); // Pause always goes back to gameplay
        } else if (this.currentState === this.states.gameOver) {
            this.changeState('menu'); // Game over always goes back to main menu
        }
        // If we're in gameplay or menu, goBack does nothing
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Global key handling
            if (e.code === 'Escape') {
                if (this.currentState === this.states.gameplay) {
                    this.changeState('pause');
                } else if (this.currentState === this.states.pause) {
                    this.changeState('gameplay');
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update(deltaTime) {
        if (this.currentState) {
            this.currentState.update(deltaTime);
            this.currentState.handleInput(this.keys);
        }
    }
    
    render() {
        if (this.currentState) {
            this.currentState.render(this.ctx);
        }
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Calculate FPS
        this.frameCount++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= 1000) { // Update FPS every second
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Menu State
class MenuState extends GameState {
    constructor(game) {
        super(game);
        this.selectedOption = 0;
        this.options = ['Play Game', 'Settings', 'Shop', 'High Score'];
        this.keyCooldown = 0;
        this.cooldownTime = 200; // 0.1 seconds in milliseconds
        this.enterCooldown = 0; // Will be set in enter() method
    }
    
    enter() {
        // Reset menu selection
        this.selectedOption = 0;
        this.keyCooldown = 0;
        // Add a brief cooldown when entering to prevent immediate key press
        this.enterCooldown = 300; // 0.3 seconds to prevent accidental selection
    }
    
    update(deltaTime) {
        // Update key cooldown
        if (this.keyCooldown > 0) {
            this.keyCooldown -= deltaTime;
        }
        // Update enter cooldown
        if (this.enterCooldown > 0) {
            this.enterCooldown -= deltaTime;
        }
    }
    
    handleInput(keys) {
        if (keys['ArrowUp'] && this.keyCooldown <= 0) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
            this.keyCooldown = this.cooldownTime;
        }
        if (keys['ArrowDown'] && this.keyCooldown <= 0) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
            this.keyCooldown = this.cooldownTime;
        }
        if ((keys['Enter'] || keys['Space']) && this.enterCooldown <= 0) {
            this.selectOption();
        }
    }
    
    selectOption() {
        switch (this.selectedOption) {
            case 0: // Play Game
                this.game.changeState('gameplay');
                break;
            case 1: // Settings
                this.game.changeState('settings');
                break;
            case 2: // Shop
                this.game.changeState('shop');
                break;
            case 3: // High Score
                // Could show high score modal or go to dedicated screen
                break;
        }
    }
    
    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw stars background
        this.drawStars(ctx);
        
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Black Cat in Space', this.game.width / 2, 150);
        
        // Draw subtitle
        ctx.font = '24px monospace';
        ctx.fillText('js13k 2025 Entry', this.game.width / 2, 200);
        
        // Draw menu options
        ctx.font = '20px monospace';
        for (let i = 0; i < this.options.length; i++) {
            if (i === this.selectedOption) {
                ctx.fillStyle = '#00ffff';
                ctx.fillText('> ' + this.options[i], this.game.width / 2, 300 + i * 40);
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillText(this.options[i], this.game.width / 2, 300 + i * 40);
            }
        }
        
        // Draw instructions
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('Use Arrow Keys to navigate, Enter to select', this.game.width / 2, 500);
    }
    
    drawStars(ctx) {
        // Simple star field for menu
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.game.width;
            const y = (i * 73) % this.game.height;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// Gameplay State (contains the original game logic)
class GameplayState extends GameState {
    constructor(game) {
        super(game);
        this.gameOver = false;
        this.levelComplete = false;
        this.levelObjectives = {};
        this.currentLevelData = null;
    }
    
    enter() {
        // Initialize gameplay if first time
        if (!this.game.player) {
            this.initGameplay();
        }
        
        // Reset game state
        this.gameOver = false;
        this.levelComplete = false;
        this.game.gameData.lives = 3;
        this.game.gameData.score = 0;
        this.game.gameData.level = 1;

        // Clear arrays
        this.game.bullets = [];
        this.game.enemies = [];
        this.game.particles = [];
        this.game.metal = [];
        
        // Reset timers
        this.game.enemySpawnTimer = 0;
        this.game.starSpawnTimer = 0;

        this.setupLevel(this.game.gameData.level);
    }

    setupLevel(level) {
        this.currentLevelData = this.getLevelData(level);
        this.levelObjectives = { ...this.currentLevelData.objectives };
        
        // Reset spawn counters
        this.spawnCounts = {
            asteroids: 0,
            mice: 0,
            shops: 0
        };
        
        console.log(`Level ${level}: ${this.currentLevelData.description}`);
    }
    
    getLevelData(level) {
        const levels = {
            1: {
                description: "Destroy 50 asteroids",
                objectives: { asteroids: 10 },
                spawnRules: { asteroids: true, mice: false, shops: false },
                maxEnemies: 5
            },
            2: {
                description: "Destroy 50 asteroids and 15 mice",
                objectives: { asteroids: 50, mice: 15 },
                spawnRules: { asteroids: true, mice: true, shops: false },
                maxEnemies: 6
            },
            3: {
                description: "Destroy 60 asteroids and 20 mice",
                objectives: { asteroids: 60, mice: 20 },
                spawnRules: { asteroids: true, mice: true, shops: false },
                maxEnemies: 7
            },
            4: {
                description: "Destroy 70 asteroids and 25 mice",
                objectives: { asteroids: 70, mice: 25 },
                spawnRules: { asteroids: true, mice: true, shops: false },
                maxEnemies: 8
            },
            5: {
                description: "Collect the floating shop",
                objectives: { shops: 1 },
                spawnRules: { asteroids: false, mice: false, shops: true },
                maxEnemies: 0
            }
        };
        
        return levels[level] || levels[1];
    }
    
    initGameplay() {
        // Create initial stars
        for (let i = 0; i < 50; i++) {
            const star = new Star(
                Math.random() * this.game.width,
                Math.random() * this.game.height,
                Math.random() * 3 + 1
            );
            star.game = this.game; // Set the game reference
            this.game.stars.push(star);
        }
        
        // Create player - positioned on left side for side-scroller
        this.game.player = new Player(100, this.game.height / 2);
    }
    
    update(deltaTime) {
    if (this.gameOver || this.levelComplete) return;
        
        // Update player
        this.game.player.update(deltaTime, this.game.keys, this.game.width);
        
        // Update bullets
        this.game.bullets = this.game.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.x < this.game.width + 10; // Remove bullets that go off right side
        });
        
        // Update enemies
        this.game.enemies = this.game.enemies.filter(enemy => {
            enemy.update(deltaTime);
            return enemy.x > -50; // Remove enemies that go off left side
        });
        
        // Update stars
        this.game.stars.forEach(star => star.update(deltaTime));
        
        // Update particles
        this.game.particles = this.game.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
        
        // Update metal drops
        this.game.metal = this.game.metal.filter(metal => {
            metal.update(deltaTime);
            return !metal.collected;
        });
        
        // Spawn enemies based on level rules
        this.spawnEnemies(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // UI is now rendered on canvas
        // Check level completion
        this.checkLevelCompletion();
    }

    spawnEnemies(deltaTime) {
        if (!this.currentLevelData) return;
        
        const rules = this.currentLevelData.spawnRules;
        const maxEnemies = this.currentLevelData.maxEnemies;
        
        // Only spawn if we haven't reached the enemy limit
        if (this.game.enemies.length < maxEnemies) {
            this.game.enemySpawnTimer += deltaTime;
            
            if (this.game.enemySpawnTimer > 1000) {
                if (rules.asteroids && this.spawnCounts.asteroids < this.levelObjectives.asteroids) {
                    this.spawnEnemy('asteroid');
                } else if (rules.mice && this.spawnCounts.mice < this.levelObjectives.mice) {
                    this.spawnEnemy('mouse');
                } else if (rules.shops && this.spawnCounts.shops < this.levelObjectives.shops) {
                    this.spawnEnemy('shop');
                }
                
                this.game.enemySpawnTimer = 0;
            }
        }
    }
    
    spawnEnemy(type) {
        const y = Math.random() * (this.game.height - 40);
        let enemy;
        
        switch (type) {
            case 'asteroid':
                enemy = new Enemy(this.game.width + 50, y, this.game.gameData.level, 0);
                this.spawnCounts.asteroids++;
                break;
            case 'mouse':
                enemy = new Enemy(this.game.width + 50, y, this.game.gameData.level, 1);
                this.spawnCounts.mice++;
                break;
            case 'shop':
                enemy = new Enemy(this.game.width + 50, y, this.game.gameData.level, 2);
                this.spawnCounts.shops++;
                break;
        }
        
        if (enemy) {
            enemy.game = this.game;
            this.game.enemies.push(enemy);
        }
    }
    
    checkLevelCompletion() {
        if (!this.currentLevelData) return;
        
        let allComplete = true;
        for (const [type, required] of Object.entries(this.levelObjectives)) {
            if (this.spawnCounts[type] < required) {
                allComplete = false;
                break;
            }
        }
        // Check if any enemies are still on screen
        const enemiesOnScreen = this.game.enemies.some(enemy => enemy.x > -50);

        if (allComplete && !enemiesOnScreen) {
            this.levelComplete = true;
            this.completeLevel();
        }
    }
    
    completeLevel() {
        console.log(`Level ${this.game.gameData.level} Complete!`);
        this.game.gameData.score += 1000; // Bonus for completing level
        
        // Wait a moment then advance to next level
        setTimeout(() => {
            this.game.gameData.level++;
            this.setupLevel(this.game.gameData.level);
            this.levelComplete = false;
            
            // Clear existing enemies and reset spawn counts
            this.game.enemies = [];
            this.game.particles = [];
            this.game.metal = [];
            this.spawnCounts = { asteroids: 0, mice: 0, shops: 0 };
        }, 2000);
    }
    
    checkCollisions() {
        // Bullet vs Enemy
        this.game.bullets.forEach((bullet, bulletIndex) => {
            this.game.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    this.game.bullets.splice(bulletIndex, 1);
                    this.game.enemies.splice(enemyIndex, 1);
                    this.game.gameData.score += 100;
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    // Create metal drop
                    this.createMetalDrop(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    // Level up every 1000 points
                    if (this.game.gameData.score % 1000 === 0) {
                        this.game.gameData.level++;
                    }
                }
            });
        });
        
        // Player vs Enemy
        this.game.enemies.forEach((enemy, index) => {
            if (this.checkCollision(this.game.player, enemy)) {
                this.game.enemies.splice(index, 1);
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
                // Use shield first, then lives
                if (this.game.player.shieldLevel > 0) {
                    this.game.player.shieldLevel--;
                    // Reset recharge timer when shield is hit
                    this.game.player.shieldRechargeTimer = 0;
                } else {
                    this.game.gameData.lives--;
                }
                
                // Trigger hit effects on player
                this.game.player.hit();
                // Decloak immediately when hit
                this.game.player.decloak();
                
                if (this.game.gameData.lives <= 0) {
                    this.gameOver = true;
                    this.game.changeState('gameOver');
                }
            }
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 12; i++) { // More particles
            this.game.particles.push(new AsteroidExplosion(x, y, Math.random() * 360));
        }
    }
    
    createMetalDrop(x, y) {
        // 70% chance to drop metal
        if (Math.random() < 0.7) {
            const metal = new Metal(x, y);
            metal.game = this.game; // Reference to game for collection
            this.game.metal.push(metal);
        }
    }
    
    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw stars
        this.game.stars.forEach(star => star.render(ctx));
        
        // Draw particles
        this.game.particles.forEach(particle => particle.render(ctx));
        
        // Draw metal drops
        this.game.metal.forEach(metal => metal.render(ctx));
        
        // Draw enemies
        this.game.enemies.forEach(enemy => enemy.render(ctx));
        
        // Draw bullets
        this.game.bullets.forEach(bullet => bullet.render(ctx));
        
        // Draw player
        if (this.game.player) {
            this.game.player.render(ctx);
        }
        
        // Draw on-canvas UI
        this.renderUI(ctx);
    }
    
    renderUI(ctx) {
        // Draw score
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.game.gameData.score}`, 20, 30);
        
        // Draw lives
        ctx.fillText(`Lives: ${this.game.gameData.lives}`, 20, 60);
        
        // Draw level
        ctx.fillText(`Level: ${this.game.gameData.level}`, 20, 90);
        
        // Draw metal count
        ctx.fillText(`Metal: ${this.game.gameData.metal}`, 20, 120);
        
        // Draw FPS below metal count
        ctx.fillText(`FPS: ${this.game.fps}`, 20, 150);
        
        // Draw cloaking bar
        this.renderCloakingBar(ctx);
        
        // Draw shield bar
        this.renderShieldBar(ctx);
    }
    
    renderCloakingBar(ctx) {
        const barWidth = this.game.width / 3;
        const barHeight = 20;
        const barX = (this.game.width - barWidth) / 2;
        const barY = 20;
        
        // Draw background bar
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Draw cloaking progress
        if (this.game.player && this.game.player.isCloaked) {
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(barX, barY, barWidth * this.game.player.cloakLevel, barHeight);
        }
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLOAK', this.game.width / 2, barY + 15);
    }
    
    renderShieldBar(ctx) {
        const barWidth = this.game.width / 3;
        const barHeight = 20;
        const barX = (this.game.width - barWidth) / 2;
        const barY = 50; // Below the cloaking bar
        
        // Draw background bar
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Get shield info dynamically
        const maxShield = this.game.player.maxShieldLevel;
        const currentShield = this.game.player.shieldLevel;
        const segmentWidth = barWidth / maxShield;
        
        // Draw shield segments (dynamic number of segments)
        for (let i = 0; i < currentShield; i++) {
            ctx.fillStyle = '#00ff00'; // Green for shield
            ctx.fillRect(barX + (i * segmentWidth), barY, segmentWidth, barHeight);
        }
        
        // Draw segment dividers (dynamic number of dividers)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        for (let i = 1; i < maxShield; i++) {
            const x = barX + (i * segmentWidth);
            ctx.beginPath();
            ctx.moveTo(x, barY);
            ctx.lineTo(x, barY + barHeight);
            ctx.stroke();
        }
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SHIELD', this.game.width / 2, barY + 15);
    }
    
    handleInput(keys) {
        if (keys['Escape']) {
            this.game.changeState('pause');
        }
        
        // Level jump keys for testing
        if (keys['Digit1'] || keys['Key1']) {
            this.game.gameData.level = 1;
            this.setupLevel(1);
            this.resetLevelState();
        } else if (keys['Digit2'] || keys['Key2']) {
            this.game.gameData.level = 2;
            this.setupLevel(2);
            this.resetLevelState();
        } else if (keys['Digit3'] || keys['Key3']) {
            this.game.gameData.level = 3;
            this.setupLevel(3);
            this.resetLevelState();
        } else if (keys['Digit4'] || keys['Key4']) {
            this.game.gameData.level = 4;
            this.setupLevel(4);
            this.resetLevelState();
        } else if (keys['Digit5'] || keys['Key5']) {
            this.game.gameData.level = 5;
            this.setupLevel(5);
            this.resetLevelState();
        }
    }
    
    resetLevelState() {
        // Reset level completion state
        this.levelComplete = false;
        
        // Clear existing enemies and reset spawn counts
        this.game.enemies = [];
        this.game.particles = [];
        this.game.metal = [];
        this.spawnCounts = { asteroids: 0, mice: 0, shops: 0 };
        
        // Reset timers
        this.game.enemySpawnTimer = 0;
        
        console.log(`Jumped to Level ${this.game.gameData.level}`);
    }
}

// Pause State
class PauseState extends GameState {
    constructor(game) {
        super(game);
    }
    
    render(ctx) {
        // Render the gameplay state first (frozen)
        this.game.states.gameplay.render(ctx);
        
        // Overlay pause screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.game.width / 2, this.game.height / 2 - 50);
        
        ctx.font = '20px monospace';
        ctx.fillText('Press ESC to resume', this.game.width / 2, this.game.height / 2);
        ctx.fillText('Press M for menu', this.game.width / 2, this.game.height / 2 + 40);
    }
    
    handleInput(keys) {
        if (keys['KeyM']) {
            this.game.goBack(); // This will go back to gameplay
        }
    }
}

// Game Over State
class GameOverState extends GameState {
    constructor(game) {
        super(game);
    }
    
    enter() {
        // Update high score if needed
        if (this.game.gameData.score > this.game.gameData.highScore) {
            this.game.gameData.highScore = this.game.gameData.score;
        }
    }
    
    render(ctx) {
        // Render the gameplay state first (frozen)
        this.game.states.gameplay.render(ctx);
        
        // Overlay game over screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.fillStyle = '#ff0000';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.game.width / 2, this.game.height / 2 - 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        ctx.fillText(`Final Score: ${this.game.gameData.score}`, this.game.width / 2, this.game.height / 2 - 20);
        ctx.fillText(`High Score: ${this.game.gameData.highScore}`, this.game.width / 2, this.game.height / 2 + 20);
        
        ctx.font = '20px monospace';
        ctx.fillText('Press SPACE to restart', this.game.width / 2, this.game.height / 2 + 80);
        ctx.fillText('Press M for menu', this.game.width / 2, this.game.height / 2 + 120);
    }
    
    handleInput(keys) {
        if (keys['Space']) {
            this.game.changeState('gameplay');
        }
        if (keys['KeyM']) {
            this.game.goBack(); // This will go back to main menu
        }
    }
}

// Settings State
class SettingsState extends GameState {
    constructor(game) {
        super(game);
        this.selectedOption = 0;
        this.options = ['Test Menu Item', 'Main Menu'];
        this.keyCooldown = 0;
        this.cooldownTime = 200; // 0.2 seconds in milliseconds
        this.enterCooldown = 0; // Will be set in enter() method
    }
    
    enter() {
        this.keyCooldown = 0;
        // Add a brief cooldown when entering to prevent immediate key press
        this.enterCooldown = 300; // 0.3 seconds to prevent accidental selection
    }
    
    update(deltaTime) {
        // Update key cooldown
        if (this.keyCooldown > 0) {
            this.keyCooldown -= deltaTime;
        }
        // Update enter cooldown
        if (this.enterCooldown > 0) {
            this.enterCooldown -= deltaTime;
        }
    }
    
    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw stars background
        this.drawStars(ctx);
        
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Settings', this.game.width / 2, 150);
        
        // Draw subtitle
        ctx.font = '24px monospace';
        ctx.fillText('Game Configuration', this.game.width / 2, 200);
        
        // Draw options
        ctx.font = '20px monospace';
        for (let i = 0; i < this.options.length; i++) {
            if (i === this.selectedOption) {
                ctx.fillStyle = '#00ffff';
                ctx.fillText('> ' + this.options[i], this.game.width / 2, 300 + i * 40);
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillText(this.options[i], this.game.width / 2, 300 + i * 40);
            }
        }
        
        // Draw instructions
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('Use Arrow Keys to navigate, Enter to select', this.game.width / 2, 500);
    }
    
    drawStars(ctx) {
        // Simple star field for menu
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.game.width;
            const y = (i * 73) % this.game.height;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    handleInput(keys) {
        if (keys['ArrowUp'] && this.keyCooldown <= 0) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
            this.keyCooldown = this.cooldownTime;
        }
        if (keys['ArrowDown'] && this.keyCooldown <= 0) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
            this.keyCooldown = this.cooldownTime;
        }
        if ((keys['Enter'] || keys['Space']) && this.enterCooldown <= 0) {
            this.selectOption();
        }
    }
    
    selectOption() {
        switch (this.selectedOption) {
            case 0: // Test Menu Item
                // Could add test functionality here
                console.log('Test menu item selected');
                break;
            case 1: // Main Menu
                this.game.goBack();
                break;
        }
    }
}

// Shop State
class ShopState extends GameState {
    constructor(game) {
        super(game);
        this.selectedOption = 0;
        this.options = ['Shield Upgrade (50 Metal)', 'Speed Boost (30 Metal)', 'Main Menu'];
        this.keyCooldown = 0;
        this.cooldownTime = 200; // 0.2 seconds in milliseconds
        this.enterCooldown = 0; // Will be set in enter() method
    }
    
    enter() {
        this.keyCooldown = 0;
        // Add a brief cooldown when entering to prevent immediate key press
        this.enterCooldown = 300; // 0.3 seconds to prevent accidental selection
    }
    
    update(deltaTime) {
        // Update key cooldown
        if (this.keyCooldown > 0) {
            this.keyCooldown -= deltaTime;
        }
        // Update enter cooldown
        if (this.enterCooldown > 0) {
            this.enterCooldown -= deltaTime;
        }
    }
    
    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw stars background
        this.drawStars(ctx);
        
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Shop', this.game.width / 2, 150);
        
        // Draw subtitle
        ctx.font = '24px monospace';
        ctx.fillText('Purchase Upgrades', this.game.width / 2, 200);
        
        // Draw metal count
        ctx.fillStyle = '#00ff00';
        ctx.font = '20px monospace';
        ctx.fillText(`Metal: ${this.game.gameData.metal}`, this.game.width / 2, 250);
        
        // Draw options
        ctx.font = '20px monospace';
        for (let i = 0; i < this.options.length; i++) {
            if (i === this.selectedOption) {
                ctx.fillStyle = '#00ffff';
                ctx.fillText('> ' + this.options[i], this.game.width / 2, 300 + i * 40);
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillText(this.options[i], this.game.width / 2, 300 + i * 40);
            }
        }
        
        // Draw instructions
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('Use Arrow Keys to navigate, Enter to select', this.game.width / 2, 500);
    }
    
    drawStars(ctx) {
        // Simple star field for menu
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.game.width;
            const y = (i * 73) % this.game.height;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    handleInput(keys) {
        if (keys['ArrowUp'] && this.keyCooldown <= 0) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
            this.keyCooldown = this.cooldownTime;
        }
        if (keys['ArrowDown'] && this.keyCooldown <= 0) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
            this.keyCooldown = this.cooldownTime;
        }
        if ((keys['Enter'] || keys['Space']) && this.enterCooldown <= 0) {
            this.selectOption();
        }
    }
    
    selectOption() {
        switch (this.selectedOption) {
            case 0: // Shield Upgrade
                if (this.game.gameData.metal >= 50) {
                    this.game.gameData.metal -= 50;
                    this.game.player.maxShieldLevel++;
                    this.game.player.shieldLevel = this.game.player.maxShieldLevel; // Refill shield
                    console.log('Shield upgraded!');
                } else {
                    console.log('Not enough metal!');
                }
                break;
            case 1: // Speed Boost
                if (this.game.gameData.metal >= 30) {
                    this.game.gameData.metal -= 30;
                    this.game.player.speed += 50;
                    console.log('Speed boosted!');
                } else {
                    console.log('Not enough metal!');
                }
                break;
            case 2: // Main Menu
                this.game.goBack();
                break;
        }
    }
}

// Game Classes (Player, Enemy, Bullet, Star, Particle)
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 300;
        this.shootCooldown = 0;
        this.shootDelay = 200;
        
        // Cloaking system
        this.cloakLevel = 0; // 0 = visible, 1 = fully cloaked
        this.cloakTimer = 0; // Time since last shot
        this.cloakDelay = 5000; // 5 seconds to start cloaking
        this.cloakDuration = 5000; // 5 seconds to fully cloak
        this.isCloaked = false;
        
        // Shield system
        this.shieldLevel = 4; // 4 hit points
        this.maxShieldLevel = 4;
        this.shieldRechargeTimer = 0;
        this.shieldRechargeDelay = 10000; // 10 seconds per shield point
        
        // Hit effects
        this.isHit = false;
        this.hitTimer = 0;
        this.hitDuration = 4000; // 4 seconds of hit effects
        this.blinkInterval = 500; // 0.5 seconds between blinks
        this.blinkTimer = 0;
        this.isVisible = true; // For blinking effect
    }
    
    update(deltaTime, keys, canvasWidth) {
        // Movement - now vertical for side-scroller
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.y -= this.speed * deltaTime / 1000;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.y += this.speed * deltaTime / 1000;
        }
        
        // Keep player in bounds (vertical bounds now)
        this.y = Math.max(0, Math.min(canvasWidth - this.height, this.y));
        
        // Shooting - now horizontal for side-scroller
        this.shootCooldown -= deltaTime;
        if ((keys['Space'] || keys['ArrowRight'] || keys['KeyD']) && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootDelay;
            // Decloak immediately when shooting
            this.decloak();
        }
        
        // Update cloaking
        this.updateCloaking(deltaTime);
        
        // Update shield
        this.updateShield(deltaTime);
        
        // Update hit effects
        this.updateHitEffects(deltaTime);
    }
    
    updateHitEffects(deltaTime) {
        if (this.isHit) {
            this.hitTimer += deltaTime;
            this.blinkTimer += deltaTime;
            
            // Handle blinking
            if (this.blinkTimer >= this.blinkInterval) {
                this.isVisible = !this.isVisible;
                this.blinkTimer = 0;
            }
            
            // End hit effects after duration
            if (this.hitTimer >= this.hitDuration) {
                this.isHit = false;
                this.isVisible = true;
            }
        }
    }
    
    updateCloaking(deltaTime) {
        // Increment cloak timer
        this.cloakTimer += deltaTime;
        
        // Start cloaking after delay
        if (this.cloakTimer >= this.cloakDelay) {
            const cloakProgress = (this.cloakTimer - this.cloakDelay) / this.cloakDuration;
            this.cloakLevel = Math.min(1, cloakProgress);
            this.isCloaked = this.cloakLevel > 0;
        }
    }
    
    decloak() {
        this.cloakLevel = 0;
        this.cloakTimer = 0;
        this.isCloaked = false;
    }
    
    updateShield(deltaTime) {
        // Recharge shield over time
        if (this.shieldLevel < this.maxShieldLevel) {
            this.shieldRechargeTimer += deltaTime;
            if (this.shieldRechargeTimer >= this.shieldRechargeDelay) {
                this.shieldLevel++;
                this.shieldRechargeTimer = 0;
            }
        }
    }
    
    hit() {
        this.isHit = true;
        this.hitTimer = 0;
        this.blinkTimer = 0;
        this.isVisible = true;
        
        // Create hit sparks
        this.createHitSparks();
    }
    
    createHitSparks() {
        // Create multiple sparks from the ship
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * 360;
            const speed = Math.random() * 3 + 2;
            const x = this.x + this.width / 2;
            const y = this.y + this.height / 2;
            game.particles.push(new HitSpark(x, y, angle, speed));
        }
    }
    
    shoot() {
        game.bullets.push(new Bullet(this.x + this.width, this.y + this.height / 2 - 2));
    }
    
    render(ctx) {
        // Don't render if hit and blinking
        if (this.isHit && !this.isVisible) {
            return;
        }
        
        // Apply cloaking effect
        if (this.isCloaked) {
            ctx.globalAlpha = 1 - this.cloakLevel;
        }
        
        // Draw black cat spaceship
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Cat ears
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y - 10, 8, 10);
        ctx.fillRect(this.x + 27, this.y - 10, 8, 10);
        
        // Cat face
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 8, this.y + 5, 8, 8);
        ctx.fillRect(this.x + 24, this.y + 5, 8, 8);
        
        // Cat nose
        ctx.fillStyle = '#ff69b4';
        ctx.fillRect(this.x + 18, this.y + 15, 4, 4);
        
        // Cat whiskers
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 20);
        ctx.lineTo(this.x + 5, this.y + 20);
        ctx.moveTo(this.x - 5, this.y + 25);
        ctx.lineTo(this.x + 5, this.y + 25);
        ctx.moveTo(this.x + this.width + 5, this.y + 20);
        ctx.lineTo(this.x + this.width - 5, this.y + 20);
        ctx.moveTo(this.x + this.width + 5, this.y + 25);
        ctx.lineTo(this.x + this.width - 5, this.y + 25);
        ctx.stroke();
        
        // Draw white outline when cloaked - fades in opposite to ship fade
        if (this.isCloaked) {
            ctx.globalAlpha = this.cloakLevel; // Border becomes more visible as ship fades
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        
        // Reset global alpha
        ctx.globalAlpha = 1;
    }
}

class Enemy {
    constructor(x, y, level, enemyType = 0) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 100 + level * 20;
        this.health = 1;
        this.enemyType = enemyType;

        // Rotation properties - much slower, frame-rate independent
        this.rotation = Math.random() * 360; // Random starting orientation
        this.rotationSpeed = (Math.random() - 0.5) * 0.5; // Random rotation speed (-0.25 to +0.25 degrees per second)
        if (enemyType === 0) {
            // Randomize asteroid design
            this.asteroidType = Math.floor(Math.random() * 4); // 0-3 different types
            this.sizeVariation = Math.random() * 0.4 + 0.8; // 0.8x to 1.2x size
            this.colorVariation = Math.random() * 0.3 + 0.85; // 0.85x to 1.15x brightness
            this.detailLevel = Math.floor(Math.random() * 3) + 2; // 2-4 detail layers
        }
    }
    
    update(deltaTime) {
        if (this.enemyType === 0) {
            // Move horizontally for side-scroller
            this.x -= this.speed * deltaTime / 1000;
            
            // Update rotation - frame-rate independent
            this.rotation += this.rotationSpeed * deltaTime / 1000;
            if (this.rotation > 360) this.rotation -= 360;
            if (this.rotation < 0) this.rotation += 360;
        }
        // mouse
        if (this.enemyType === 1) {
            // Move horizontally for side-scroller
            this.x -= this.speed * deltaTime / 1000;

            // lerp to player
            this.x = lerp(this.x, this.game.player.x, deltaTime / 1000);
            this.y = lerp(this.y, this.game.player.y, deltaTime / 1000);
        }
    }
    
    render(ctx) {
        // Save current context state
        ctx.save();
        if (this.enemyType === 0) {
            // Move to asteroid center and rotate
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            
            // Apply size variation
            const scaledWidth = this.width * this.sizeVariation;
            const scaledHeight = this.height * this.sizeVariation;
            
            // Draw different asteroid types
            switch (this.asteroidType) {
                case 0: // Square asteroid
                    this.drawSquareAsteroid(ctx, scaledWidth, scaledHeight);
                    break;
                case 1: // Diamond asteroid
                    this.drawDiamondAsteroid(ctx, scaledWidth, scaledHeight);
                    break;
                case 2: // Octagon asteroid
                    this.drawOctagonAsteroid(ctx, scaledWidth, scaledHeight);
                    break;
                case 3: // Irregular asteroid
                    this.drawIrregularAsteroid(ctx, scaledWidth, scaledHeight);
                    break;
            }
        } else if (this.enemyType === 1) {
            // Draw mouse enemy
            this.drawMouseEnemy(ctx);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    drawMouseEnemy(ctx) {
        // Draw mouse body (circle with ears)
        ctx.fillStyle = '#808080'; // Grey
        
        // Main body
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#A0A0A0';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 8, this.y + this.height / 2 - 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 + 8, this.y + this.height / 2 - 12, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 4, this.y + this.height / 2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 + 4, this.y + this.height / 2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSquareAsteroid(ctx, width, height) {
        // Base color with variation
        const baseColor = this.adjustColor('#808080', this.colorVariation);
        ctx.fillStyle = baseColor;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        
        // Add random detail layers
        for (let i = 0; i < this.detailLevel; i++) {
            const detailSize = (width * 0.3) - (i * width * 0.1);
            const detailX = (Math.random() - 0.5) * width * 0.4;
            const detailY = (Math.random() - 0.5) * height * 0.4;
            
            ctx.fillStyle = this.adjustColor('#404040', this.colorVariation);
            ctx.fillRect(-detailSize / 2 + detailX, -detailSize / 2 + detailY, detailSize, detailSize);
        }
        
        // Add highlights
        ctx.fillStyle = this.adjustColor('#c0c0c0', this.colorVariation);
        ctx.fillRect(-width / 2 + 2, -height / 2 + 2, 4, 4);
        ctx.fillRect(width / 2 - 6, -height / 2 + 2, 4, 4);
    }
    
    drawDiamondAsteroid(ctx, width, height) {
        // Base diamond shape
        const baseColor = this.adjustColor('#808080', this.colorVariation);
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(0, -height / 2);
        ctx.lineTo(width / 2, 0);
        ctx.lineTo(0, height / 2);
        ctx.lineTo(-width / 2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Add detail layers
        for (let i = 0; i < this.detailLevel; i++) {
            const detailSize = (width * 0.25) - (i * width * 0.08);
            const detailX = (Math.random() - 0.5) * width * 0.3;
            const detailY = (Math.random() - 0.5) * height * 0.3;
            
            ctx.fillStyle = this.adjustColor('#404040', this.colorVariation);
            ctx.beginPath();
            ctx.moveTo(detailX, detailY - detailSize / 2);
            ctx.lineTo(detailX + detailSize / 2, detailY);
            ctx.lineTo(detailX, detailY + detailSize / 2);
            ctx.lineTo(detailX - detailSize / 2, detailY);
            ctx.closePath();
            ctx.fill();
        }
        
        // Add highlights
        ctx.fillStyle = this.adjustColor('#c0c0c0', this.colorVariation);
        ctx.fillRect(-2, -height / 2 + 2, 4, 4);
        ctx.fillRect(width / 2 - 6, -2, 4, 4);
    }
    
    drawOctagonAsteroid(ctx, width, height) {
        // Base octagon shape
        const baseColor = this.adjustColor('#808080', this.colorVariation);
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            const angle = (i * Math.PI * 2) / sides;
            const x = Math.cos(angle) * width / 2;
            const y = Math.sin(angle) * height / 2;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Add detail layers
        for (let i = 0; i < this.detailLevel; i++) {
            const detailSize = (width * 0.2) - (i * width * 0.06);
            const detailX = (Math.random() - 0.5) * width * 0.25;
            const detailY = (Math.random() - 0.5) * height * 0.25;
            
            ctx.fillStyle = this.adjustColor('#404040', this.colorVariation);
            ctx.beginPath();
            for (let j = 0; j < sides; j++) {
                const angle = (j * Math.PI * 2) / sides;
                const x = Math.cos(angle) * detailSize / 2 + detailX;
                const y = Math.sin(angle) * detailSize / 2 + detailY;
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Add highlights
        ctx.fillStyle = this.adjustColor('#c0c0c0', this.colorVariation);
        ctx.fillRect(-2, -height / 2 + 2, 4, 4);
        ctx.fillRect(width / 2 - 6, -2, 4, 4);
    }
    
    drawIrregularAsteroid(ctx, width, height) {
        // Base irregular shape
        const baseColor = this.adjustColor('#808080', this.colorVariation);
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        
        // Create irregular polygon with random points
        const points = [];
        const numPoints = 6 + Math.floor(Math.random() * 4); // 6-9 points
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * Math.PI * 2) / numPoints;
            const radius = (width / 2) * (0.7 + Math.random() * 0.6); // Vary radius
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push({ x, y });
        }
        
        // Draw the irregular shape
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add random detail craters
        for (let i = 0; i < this.detailLevel; i++) {
            const craterSize = Math.random() * width * 0.15 + width * 0.05;
            const craterX = (Math.random() - 0.5) * width * 0.6;
            const craterY = (Math.random() - 0.5) * height * 0.6;
            
            ctx.fillStyle = this.adjustColor('#404040', this.colorVariation);
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add highlights
        ctx.fillStyle = this.adjustColor('#c0c0c0', this.colorVariation);
        ctx.fillRect(-2, -height / 2 + 2, 4, 4);
        ctx.fillRect(width / 2 - 6, -2, 4, 4);
    }
    
    adjustColor(baseColor, variation) {
        // Simple color adjustment - could be made more sophisticated
        if (baseColor === '#808080') {
            const gray = Math.floor(128 * variation);
            return `rgb(${gray}, ${gray}, ${gray})`;
        } else if (baseColor === '#404040') {
            const gray = Math.floor(64 * variation);
            return `rgb(${gray}, ${gray}, ${gray})`;
        } else if (baseColor === '#c0c0c0') {
            const gray = Math.floor(192 * variation);
            return `rgb(${gray}, ${gray}, ${gray})`;
        }
        return baseColor;
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 4;
        this.speed = 500;
    }
    
    update(deltaTime) {
        // Move horizontally for side-scroller
        this.x += this.speed * deltaTime / 1000;
    }
    
    render(ctx) {
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Star {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
    }
    
    update(deltaTime) {
        // Move horizontally for side-scroller effect
        this.x -= this.speed * deltaTime / 1000;
        
        // Wrap stars to the right side when they go off the left
        if (this.x < -10) {
            this.x += this.game.width + 20; // Wrap to right side with some buffer
            this.y = Math.random() * this.game.height; // Randomize Y position for variety
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, 1, 1);
    }
}

class Particle {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle * Math.PI / 180) * 2;
        this.vy = Math.sin(angle * Math.PI / 180) * 2;
        this.life = 1;
        this.decay = 0.02;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    render(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1;
    }
}

class HitSpark {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle * Math.PI / 180) * speed;
        this.vy = Math.sin(angle * Math.PI / 180) * speed;
        this.life = 1;
        this.decay = 0.03;
        this.size = Math.random() * 3 + 2; // Bigger than regular particles
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    render(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = '#ffff00'; // Yellow sparks
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class AsteroidExplosion {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle * Math.PI / 180) * 3; // Faster than regular particles
        this.vy = Math.sin(angle * Math.PI / 180) * 3;
        this.life = 1;
        this.decay = 0.015; // Slower decay for longer-lasting effect
        this.size = Math.random() * 4 + 3; // Bigger than regular particles
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    render(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = '#ffff00'; // Yellow explosion particles
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class Metal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.collected = false;
        this.collectRadius = 40; // Distance player needs to be to collect (doubled from 20)
        this.floatOffset = 0;
        this.floatSpeed = 2; // Speed of floating animation
        this.driftSpeed = 50; // Speed at which metal drifts left
    }
    
    update(deltaTime) {
        // Floating animation
        this.floatOffset += this.floatSpeed * deltaTime / 1000;
        if (this.floatOffset > Math.PI * 2) {
            this.floatOffset -= Math.PI * 2;
        }
        
        // Drift toward left side of screen
        this.x -= this.driftSpeed * deltaTime / 1000;
        
        // Check if player is close enough to collect
        if (!this.collected && this.game && this.game.player) {
            const dx = this.x - this.game.player.x;
            const dy = this.y - this.game.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.collectRadius) {
                this.collect();
            }
        }
    }
    
    collect() {
        if (!this.collected) {
            this.collected = true;
            this.game.gameData.metal++;
            // Could add collection sound or effect here
        }
    }
    
    render(ctx) {
        if (this.collected) return;
        
        // Floating animation
        const floatY = this.y + Math.sin(this.floatOffset) * 3;
        
        // Draw metal as a small grey/silver square with shine
        ctx.fillStyle = '#c0c0c0'; // Silver base
        ctx.fillRect(this.x, floatY, this.width, this.height);
        
        // Add shine effect
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 1, floatY + 1, 3, 3);
        
        // Add border
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, floatY, this.width, this.height);
    }
}

class MouseEnemy extends Enemy {
    constructor(x, y, level, enemyType) {
        super(x, y, level, enemyType);
        this.wormSegments = []; // Array of trail positions
        this.maxSegments = 8;   // Number of worm segments
        this.wiggleSpeed = 2;   // How fast it wiggles
        this.wiggleAmplitude = 30; // How far it wiggles
        this.baseY = y;         // Original Y position for wave calculation
    }
    
    update(deltaTime) {
        // Update position with wiggly movement
        this.x -= this.speed * deltaTime / 1000;
        this.y = this.baseY + Math.sin(this.x * 0.02) * this.wiggleAmplitude;
        
        // Update worm trail
        this.updateWormTrail();
    }
    
    updateWormTrail() {
        // Add current position to trail
        this.wormSegments.unshift({ x: this.x, y: this.y });
        
        // Keep only max segments
        if (this.wormSegments.length > this.maxSegments) {
            this.wormSegments.pop();
        }
    }
    
    render(ctx) {
        // Draw worm segments first (so they appear behind mouse)
        this.renderWormTrail(ctx);
        
        // Draw mouse body
        this.renderMouseBody(ctx);
    }
    
    renderWormTrail(ctx) {
        ctx.save();
        ctx.strokeStyle = '#8B4513'; // Brown color
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Draw connected segments
        for (let i = 0; i < this.wormSegments.length - 1; i++) {
            const current = this.wormSegments[i];
            const next = this.wormSegments[i + 1];
            
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    renderMouseBody(ctx) {
        // Draw mouse body (circle with ears)
        ctx.save();
        ctx.fillStyle = '#808080'; // Grey
        
        // Main body
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#A0A0A0';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Start the game when the page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});
