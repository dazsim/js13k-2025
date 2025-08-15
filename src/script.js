// Black Cat in Space - js13k 2025 Entry
// A space shooter game featuring a black cat pilot with state management

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
            highScore: 0
        };
        
        // Game objects (for gameplay state)
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.stars = [];
        this.particles = [];
        
        this.keys = {};
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.starSpawnTimer = 0;
        
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
    }
    
    enter() {
        // Initialize gameplay if first time
        if (!this.game.player) {
            this.initGameplay();
        }
        
        // Reset game state
        this.gameOver = false;
        this.game.gameData.lives = 3;
        this.game.gameData.score = 0;
        this.game.gameData.level = 1;
        
        // Clear arrays
        this.game.bullets = [];
        this.game.enemies = [];
        this.game.particles = [];
        
        // Reset timers
        this.game.enemySpawnTimer = 0;
        this.game.starSpawnTimer = 0;
    }
    
    initGameplay() {
        // Create initial stars
        for (let i = 0; i < 50; i++) {
            this.game.stars.push(new Star(
                Math.random() * this.game.width,
                Math.random() * this.game.height,
                Math.random() * 2 + 1
            ));
        }
        
        // Create player - positioned on left side for side-scroller
        this.game.player = new Player(100, this.game.height / 2);
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
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
        
        // Spawn enemies
        this.game.enemySpawnTimer += deltaTime;
        if (this.game.enemySpawnTimer > 1000 / this.game.gameData.level) {
            this.spawnEnemy();
            this.game.enemySpawnTimer = 0;
        }
        
        // Spawn stars
        this.game.starSpawnTimer += deltaTime;
        if (this.game.starSpawnTimer > 100) {
            this.game.stars.push(new Star(this.game.width + 10, Math.random() * this.game.height, Math.random() * 2 + 1));
            this.game.starSpawnTimer = 0;
        }
        
        // Check collisions
        this.checkCollisions();
        
        // UI is now rendered on canvas
    }
    
    spawnEnemy() {
        // Spawn from right side for side-scroller
        const y = Math.random() * (this.game.height - 40);
        const enemy = new Enemy(this.game.width + 50, y, this.game.gameData.level);
        this.game.enemies.push(enemy);
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
                this.game.gameData.lives--;
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
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
        for (let i = 0; i < 8; i++) {
            this.game.particles.push(new Particle(x, y, Math.random() * 360));
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
        
        // Draw cloaking bar
        this.renderCloakingBar(ctx);
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
        this.options = ['Test Shop Item', 'Main Menu'];
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
            case 0: // Test Shop Item
                // Could add shop functionality here
                console.log('Test shop item selected');
                break;
            case 1: // Main Menu
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
    
    shoot() {
        game.bullets.push(new Bullet(this.x + this.width, this.y + this.height / 2 - 2));
    }
    
    render(ctx) {
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
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 100 + level * 20;
        this.health = 1;
    }
    
    update(deltaTime) {
        // Move horizontally for side-scroller
        this.x -= this.speed * deltaTime / 1000;
    }
    
    render(ctx) {
        // Draw grey asteroid
        ctx.fillStyle = '#808080';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Asteroid details - darker grey
        ctx.fillStyle = '#404040';
        ctx.fillRect(this.x + 5, this.y + 5, 20, 20);
        
        // Asteroid highlights - lighter grey
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
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
        if (this.x < -10) {
            this.x = 810;
            this.y = Math.random() * 600;
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

// Start the game when the page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});
