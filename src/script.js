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
            metal: 0, // Metal collected from asteroids
            shopVisited: false, // Track if shop has been visited
            turboMultiplier: 1 // Global speed multiplier for turbo effect
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
        
        // Screen shake system
        this.screenShake = {
            intensity: 0,
            duration: 0,
            maxIntensity: 100, // Increased from 10 to allow much bigger shakes
            decayRate: 0.9    // Slower decay for longer-lasting shakes
        };
        
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
            highscore: new HighScoreState(this),
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
            this.changeState('gameplay'); // Shop always goes back to gameplay
        } else if (this.currentState === this.states.pause) {
            this.changeState('gameplay'); // Pause goes back to gameplay
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
        
        // Update screen shake
        this.updateScreenShake(deltaTime);
    }
    
    triggerScreenShake(intensity = 100, duration = 400) {
        this.screenShake.intensity = Math.min(intensity, this.screenShake.maxIntensity);
        this.screenShake.duration = duration;
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            this.screenShake.intensity *= this.screenShake.decayRate;
            
            // Stop shake completely when intensity gets very low or duration expires
            if (this.screenShake.intensity < 0.5 || this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
                this.screenShake.duration = 0;
            }
        }
    }
    
    getScreenShakeOffset() {
        if (this.screenShake.intensity <= 0) return { x: 0, y: 0 };
        
        return {
            x: (Math.random() - 0.5) * 4 * this.screenShake.intensity, // Double the range for bigger shake
            y: (Math.random() - 0.5) * 4 * this.screenShake.intensity  // Double the range for bigger shake
        };
    }
    
    render() {
        // Apply screen shake offset
        const shakeOffset = this.getScreenShakeOffset();
        this.ctx.save();
        this.ctx.translate(shakeOffset.x, shakeOffset.y);
        
        if (this.currentState) {
            this.currentState.render(this.ctx);
        }
        
        this.ctx.restore();
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
    
    // Shared Milky Way drawing method
    drawMilkyWay(ctx) {
        // Animated Milky Way with noise and detail
        const time = Date.now() * 0.001; // Animation speed
        const centerY = this.height * 0.5; // Center the band better
        const bandHeight = this.height * 0.3; // 30% of screen height
        
        ctx.save();
        
        // Animate the background layers
        const offsetX = (time * 20) % this.width; // Move right to left
        
        // Draw orange stellar background
        const stellarGradient = ctx.createLinearGradient(0, centerY - bandHeight/2, 0, centerY + bandHeight/2);
        stellarGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        stellarGradient.addColorStop(0.2, 'rgba(80, 40, 20, 0.3)');
        stellarGradient.addColorStop(0.4, 'rgba(120, 60, 30, 0.5)');
        stellarGradient.addColorStop(0.6, 'rgba(160, 80, 40, 0.6)');
        stellarGradient.addColorStop(0.8, 'rgba(120, 60, 30, 0.5)');
        stellarGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = stellarGradient;
        ctx.fillRect(offsetX, centerY - bandHeight/2, this.width, bandHeight);
        ctx.fillRect(offsetX - this.width, centerY - bandHeight/2, this.width, bandHeight);
        
        // Add orange noise for stellar background
        this.addAnimatedNoise(ctx, offsetX, centerY, bandHeight, 'rgba(160, 80, 40, 0.2)', 0.4);
        
        // Draw blue galactic plane
        const planeGradient = ctx.createLinearGradient(0, centerY - bandHeight/2, 0, centerY + bandHeight/2);
        planeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        planeGradient.addColorStop(0.1, 'rgba(40, 60, 100, 0.15)');
        planeGradient.addColorStop(0.3, 'rgba(60, 90, 140, 0.3)');
        planeGradient.addColorStop(0.5, 'rgba(80, 120, 180, 0.4)');
        planeGradient.addColorStop(0.7, 'rgba(60, 90, 140, 0.3)');
        planeGradient.addColorStop(0.9, 'rgba(40, 60, 100, 0.15)');
        planeGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = planeGradient;
        ctx.fillRect(offsetX, centerY - bandHeight/2, this.width, bandHeight);
        ctx.fillRect(offsetX - this.width, centerY - bandHeight/2, this.width, bandHeight);
        
        // Add blue noise for galactic plane
        this.addAnimatedNoise(ctx, offsetX, centerY, bandHeight, 'rgba(60, 90, 140, 0.1)', 0.3);
        
        // Add animated dark dust lanes
        this.addAnimatedDustLanes(ctx, offsetX, centerY, bandHeight);
        
        ctx.restore();
    }
    
    // Helper methods for Milky Way
    addAnimatedNoise(ctx, offsetX, centerY, bandHeight, color, intensity) {
        // Add noise texture that moves with the background - restore 2D approach
        for (let x = 0; x < this.width * 2; x += 8) {
            for (let y = centerY - bandHeight/2; y < centerY + bandHeight/2; y += 8) {
                const noiseX = (x + offsetX) * 0.05;
                const noiseY = y * 0.03;
                
                if ((this.simpleNoise(noiseX + noiseY + 42) * 0.5 + 0.5) < 0.3) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x + offsetX, y, 8, 8);
                    ctx.fillRect(x + offsetX - this.width, y, 8, 8);
                }
            }
        }
    }
    
    addAnimatedDustLanes(ctx, offsetX, centerY, bandHeight) {
        // Create more organic, varied dust lanes with smaller, scattered elements
        const dustCount = 150; // 10x more dust particles for very dense look
        
        // Make dust move slower by using a fraction of offsetX
        const slowDustOffset = offsetX * 0.3; // Dust moves at 30% speed of background
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < dustCount; i++) {
            // Vary the dust particle positions and sizes more naturally
            const dustX = (slowDustOffset + this.simpleNoise(i * 50) * this.width * 2) % (this.width * 2);
            const dustY = centerY + (this.simpleNoise(i * 100) * 0.5 - 0.25) * bandHeight * 0.4;
            const dustSize = this.simpleNoise(i * 150) * 0.5 + 0.5; // 0.5 to 1.0
            
            // Only draw if within the Milky Way band
            if (dustY >= centerY - bandHeight/2 && dustY <= centerY + bandHeight/2) {
                // Draw smaller, more varied dust particles
                const particleSize = Math.max(2, dustSize * 8); // 2-10px particles
                ctx.fillRect(dustX, dustY, particleSize, particleSize);
                
                // Draw wrapped version for seamless scrolling
                if (dustX < this.width) {
                    ctx.fillRect(dustX + this.width, dustY, particleSize, particleSize);
                } else {
                    ctx.fillRect(dustX - this.width, dustY, particleSize, particleSize);
                }
            }
        }
    }
    
    simpleNoise(x) {
        // Simple pseudo-random noise function using trigonometric approach
        return Math.sin(x * 12.9898) * Math.cos(x * 78.233) * 43758.5453 % 1;
    }
}

// Menu State
class MenuState extends GameState {
    constructor(game) {
        super(game);
        this.selectedOption = 0;
        this.options = ['Play Game', 'Settings', 'High Score'];
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
            case 2: // High Score
                this.game.changeState('highscore');
                break;
        }
    }
    
    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw Milky Way background first (behind everything)
        this.game.drawMilkyWay(ctx);
        
        // Draw stars background
        this.drawStars(ctx);
        
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Project Panther', this.game.width / 2, 150);
        
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
        // If returning from pause or shop, resume without resetting
        if (this.game.previousStateName === 'pause' || this.game.previousStateName === 'shop') {
            return;
        }

        // Starting a new run: reset game state
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

        // Reset player shield and turbo when starting new game
        if (this.game.player) {
            this.game.player.shieldLevel = this.game.player.maxShieldLevel;
            this.game.player.shieldRechargeTimer = 0;
            this.game.player.turboLevel = 0;
            this.game.player.turboCharge = 0;
            this.game.player.turboActive = false;
            this.game.player.cloakLevel = 0;
            this.game.player.cloakTimer = 0;
            this.game.player.isCloaked = false;
            this.game.player.isHit = false;
            this.game.player.hitTimer = 0;
            this.game.player.blinkTimer = 0;
            this.game.player.isVisible = true;
        }

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
        
        // Reset enemy pool for new level
        this.enemyPool = null;
        
        console.log(`Level ${level}: ${this.currentLevelData.description}`);
    }
    
    getLevelData(level) {
                 const levels = {
                         1: {
                 description: "Survive 50 asteroids",
                 objectives: { asteroids: 50 },
                 spawnRules: { asteroids: true, mice: false, shops: false },
                 maxEnemies: 8
             },
            2: {
                 description: "Survive 50 asteroids and 15 mice",
                 objectives: { asteroids: 50, mice: 15 },
                 spawnRules: { asteroids: true, mice: true, shops: false },
                 maxEnemies: 10
             },
            3: {
                 description: "Survive 60 asteroids and 20 mice",
                 objectives: { asteroids: 60, mice: 20 },
                 spawnRules: { asteroids: true, mice: true, shops: false },
                 maxEnemies: 12
             },
            4: {
                 description: "Survive 70 asteroids and 25 mice",
                 objectives: { asteroids: 70, mice: 25 },
                 spawnRules: { asteroids: true, mice: true, shops: false },
                 maxEnemies: 15
             },
            5: {
                 description: "Collect the floating shop",
                 objectives: { shops: 1 },
                 spawnRules: { asteroids: false, mice: false, shops: true },
                 maxEnemies: 1
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
        this.game.player = new Player(100, this.game.height / 2, this.game);
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
        
        // Initialize enemy pool if not done yet
        if (!this.enemyPool) {
            this.createEnemyPool();
        }
        
        // Only spawn if we have enemies in the pool and haven't reached screen limit
        if (this.enemyPool.length > 0 && this.game.enemies.length < this.currentLevelData.maxEnemies) {
            this.game.enemySpawnTimer += deltaTime;
            
            // Spawn enemies gradually (every 800ms instead of 1000ms for more action)
            if (this.game.enemySpawnTimer > 800) {
                this.spawnRandomEnemy();
                this.game.enemySpawnTimer = 0;
            }
        }
    }
    
    createEnemyPool() {
        this.enemyPool = [];
        const rules = this.currentLevelData.spawnRules;
        const objectives = this.levelObjectives;
        
        // Create a mixed pool of enemies based on level rules
        if (rules.asteroids && objectives.asteroids) {
            for (let i = 0; i < objectives.asteroids; i++) {
                this.enemyPool.push({ type: 'asteroid', priority: Math.random() });
            }
        }
        
        if (rules.mice && objectives.mice) {
            for (let i = 0; i < objectives.mice; i++) {
                this.enemyPool.push({ type: 'mouse', priority: Math.random() });
            }
        }
        
        if (rules.shops && objectives.shops) {
            for (let i = 0; i < objectives.shops; i++) {
                this.enemyPool.push({ type: 'shop', priority: Math.random() });
            }
        }
        
        // Sort by priority to create varied spawning order
        this.enemyPool.sort((a, b) => a.priority - b.priority);
        
        console.log(`Created enemy pool: ${this.enemyPool.length} enemies for level ${this.game.gameData.level}`);
    }
    
    spawnRandomEnemy() {
        if (this.enemyPool.length === 0) return;
        
        // Take the next enemy from the pool
        const enemyData = this.enemyPool.shift();
        this.spawnEnemy(enemyData.type);
        
        // Add some randomness to spawn timing for more organic feel
        this.game.enemySpawnTimer += (Math.random() - 0.5) * 200;
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
            // Set proper dimensions and placement for shop
            if (type === 'shop') {
                const shopHeight = this.game.height / 4;
                const shopWidth = shopHeight * 1.5;
                enemy.width = shopWidth;
                enemy.height = shopHeight;
                enemy.speed = 60; // slow float
                // Center vertically so it looks intentional
                enemy.y = (this.game.height - enemy.height) / 2;
            }
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
        
        // Check if any metal drops are still on screen
        const metalOnScreen = this.game.metal.some(metal => metal.x > -20);

        if (allComplete && !enemiesOnScreen && !metalOnScreen) {
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
                    // Shop is not destroyable by bullets
                    if (enemy.enemyType === 2) {
                        return;
                    }
                    this.game.bullets.splice(bulletIndex, 1);
                    this.game.enemies.splice(enemyIndex, 1);
                    this.game.gameData.score += 100;
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    // Create metal drop (mice drop 3, others drop 1)
                    this.createMetalDrop(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.enemyType);
                }
            });
        });
        
                // Player vs Enemy
        this.game.enemies.forEach((enemy, index) => {
            if (this.checkCollision(this.game.player, enemy)) {
                // Colliding with the shop opens the shop instead of damaging the player
                if (enemy.enemyType === 2) {
                    // Only allow shop collision if not already visited
                    if (!this.game.gameData.shopVisited) {
                        this.game.enemies.splice(index, 1);
                        this.game.gameData.shopVisited = true; // Mark shop as visited
                        this.game.changeState('shop');
                        return;
                    } else {
                        // Shop already visited, just remove it without opening shop
                        this.game.enemies.splice(index, 1);
                        return;
                    }
                }
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
                
                // Trigger screen shake
                this.game.triggerScreenShake(8, 300);
                
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
    
    createMetalDrop(x, y, enemyType = 0) {
        // 70% chance to drop metal for asteroids, 100% for mice
        const dropChance = enemyType === 1 ? 1.0 : 0.7; // Mice always drop metal
        const dropCount = enemyType === 1 ? 3 : 1; // Mice drop 3 metal, others drop 1
        
        if (Math.random() < dropChance) {
            for (let i = 0; i < dropCount; i++) {
                // Spread metal drops slightly for mice so they don't all stack
                const offsetX = enemyType === 1 ? (Math.random() - 0.5) * 30 : 0;
                const offsetY = enemyType === 1 ? (Math.random() - 0.5) * 20 : 0;
                
                const metal = new Metal(x + offsetX, y + offsetY, this.game);
                this.game.metal.push(metal);
            }
        }
    }
    
    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw Milky Way background first (behind everything)
        this.game.drawMilkyWay(ctx);
        
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
        
        // Draw turbo bar
        this.renderTurboBar(ctx);
    }
    
    renderBar(ctx, options) {
        const {
            x, y, width, height, label, value, maxValue = 1,
            backgroundColor = '#333', foregroundColor = '#00ff00',
            borderColor = '#fff', textColor = '#fff',
            showSegments = false, segmentCount = 1,
            showBorder = true, showLabel = true
        } = options;
        
        // Draw background bar
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, y, width, height);
        
        // Draw foreground (progress/value)
        if (value > 0) {
            ctx.fillStyle = foregroundColor;
            if (showSegments) {
                // Draw segmented bar (like shield)
                const segmentWidth = width / segmentCount;
                const filledSegments = Math.floor((value / maxValue) * segmentCount);
                for (let i = 0; i < filledSegments; i++) {
                    ctx.fillRect(x + (i * segmentWidth), y, segmentWidth, height);
                }
                
                // Draw segment dividers
                if (segmentCount > 1) {
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    for (let i = 1; i < segmentCount; i++) {
                        const dividerX = x + (i * segmentWidth);
                        ctx.beginPath();
                        ctx.moveTo(dividerX, y);
                        ctx.lineTo(dividerX, y + height);
                        ctx.stroke();
                    }
                }
            } else {
                // Draw continuous bar (like cloak and turbo)
                const fillWidth = (value / maxValue) * width;
                ctx.fillRect(x, y, fillWidth, height);
            }
        }
        
        // Draw border
        if (showBorder) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }
        
        // Draw label
        if (showLabel) {
            ctx.fillStyle = textColor;
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + width / 2, y + 15);
        }
    }
    
    renderCloakingBar(ctx) {
        // Don't render cloaking bar on shop level (level 5)
        if (this.game.gameData.level === 5) {
            return;
        }
        
        const barWidth = this.game.width / 3;
        const barHeight = 20;
        const barX = (this.game.width - barWidth) / 2;
        const barY = 20;
        
        this.renderBar(ctx, {
            x: barX, y: barY, width: barWidth, height: barHeight,
            label: 'CLOAK',
            value: this.game.player && this.game.player.isCloaked ? this.game.player.cloakLevel : 0,
            maxValue: 1,
            foregroundColor: '#00ffff',
            showSegments: false
        });
    }
    
    renderShieldBar(ctx) {
        const barWidth = this.game.width / 3;
        const barHeight = 20;
        const barX = (this.game.width - barWidth) / 2;
        const barY = 50; // Below the cloaking bar
        
        this.renderBar(ctx, {
            x: barX, y: barY, width: barWidth, height: barHeight,
            label: 'SHIELD',
            value: this.game.player.shieldLevel,
            maxValue: this.game.player.maxShieldLevel,
            foregroundColor: '#00ff00',
            showSegments: true,
            segmentCount: this.game.player.maxShieldLevel
        });
    }
    
    renderTurboBar(ctx) {
        // Only show turbo bar if player has turbo system
        if (!this.game.player || this.game.player.turboLevel === 0) {
            return;
        }
        
        const barWidth = this.game.width / 3;
        const barHeight = 20;
        const barX = (this.game.width - barWidth) / 2;
        const barY = 80; // Below the shield bar
        
        this.renderBar(ctx, {
            x: barX, y: barY, width: barWidth, height: barHeight,
            label: 'TURBO',
            value: this.game.player.turboCharge,
            maxValue: this.game.player.maxTurboCharge,
            foregroundColor: this.game.player.turboActive ? '#ff6600' : '#00ff00', // Orange when active, green when charged
            showSegments: false
        });
    }
    
    handleInput(keys) {
        // Escape handled globally in Game.bindEvents (toggle pause)
        
        // Dev controls
        if (keys['Digit0'] || keys['Key0']) {
            this.game.gameData.metal += 100;
            console.log(`Added 100 metal! Total: ${this.game.gameData.metal}`);
        }
        
        if (keys['Digit9'] || keys['Key9']) {
            if (this.game.player) {
                this.game.player.turboLevel = 1;
                this.game.player.turboCharge = 5;
                console.log('Turbo Thrust granted via dev controls!');
            }
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
        
        // Reset enemy pool for new level
        this.enemyPool = null;
        
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
            this.game.changeState('menu'); // Go directly to main menu
        }
    }
}

// Game Over State
class GameOverState extends GameState {
    constructor(game) {
        super(game);
    }
    
    enter() {
        // Save high score to local storage
        HighScoreState.saveHighScore(this.game.gameData.score, this.game.gameData.level);
        
        // Update high score if needed (for backward compatibility)
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

// High Score State
class HighScoreState extends GameState {
    constructor(game) {
        super(game);
        this.selectedOption = 0;
        this.options = ['Main Menu'];
        this.keyCooldown = 0;
        this.cooldownTime = 200;
        this.enterCooldown = 0;
    }

    enter() {
        this.enterCooldown = 200; // Prevent immediate selection
    }

    update(deltaTime) {
        if (this.keyCooldown > 0) {
            this.keyCooldown -= deltaTime;
        }
        if (this.enterCooldown > 0) {
            this.enterCooldown -= deltaTime;
        }
    }

    handleInput(keys) {
        if ((keys['Enter'] || keys['Space'] || keys['Escape']) && this.enterCooldown <= 0) {
            this.selectOption();
        }
    }

    selectOption() {
        switch (this.selectedOption) {
            case 0: // Main Menu
                this.game.changeState('menu');
                break;
        }
    }

    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Draw Milky Way background
        this.game.drawMilkyWay(ctx);
        
        // Draw stars background
        this.game.stars.forEach(star => star.render(ctx));
        
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('High Scores', this.game.width / 2, 150);

        // Get high scores from local storage
        const highScores = this.getHighScores();

        // Draw high scores
        ctx.font = '24px monospace';
        ctx.fillStyle = '#00ffff';
        for (let i = 0; i < Math.min(10, highScores.length); i++) {
            const score = highScores[i];
            const yPos = 220 + i * 35;
            ctx.fillText(`${i + 1}. ${score.score.toLocaleString()} - Level ${score.level}`, this.game.width / 2, yPos);
        }

        // If no scores yet
        if (highScores.length === 0) {
            ctx.fillStyle = '#888';
            ctx.font = '20px monospace';
            ctx.fillText('No high scores yet!', this.game.width / 2, 300);
            ctx.fillText('Play a game to set your first score.', this.game.width / 2, 330);
        }

        // Draw back option
        ctx.fillStyle = '#00ffff';
        ctx.font = '20px monospace';
        ctx.fillText('> Press ENTER or ESCAPE to return', this.game.width / 2, this.game.height - 100);
    }

    getHighScores() {
        try {
            const scores = localStorage.getItem('PantherProject.highScores');
            return scores ? JSON.parse(scores) : [];
        } catch (e) {
            console.warn('Failed to load high scores:', e);
            return [];
        }
    }

    static saveHighScore(score, level) {
        try {
            let highScores = [];
            const existing = localStorage.getItem('PantherProject.highScores');
            if (existing) {
                highScores = JSON.parse(existing);
            }

            // Add new score
            highScores.push({
                score: score,
                level: level,
                date: new Date().toISOString()
            });

            // Sort by score (highest first)
            highScores.sort((a, b) => b.score - a.score);

            // Keep only top 10
            highScores = highScores.slice(0, 10);

            // Save back to localStorage
            localStorage.setItem('PantherProject.highScores', JSON.stringify(highScores));
            
            return highScores;
        } catch (e) {
            console.warn('Failed to save high score:', e);
            return [];
        }
    }
}

        // Shop State
        class ShopState extends GameState {
            constructor(game) {
                super(game);
                this.selectedOption = 0;
                this.options = ['Shield Upgrade (50 Metal)', 'Agility Boost (30 Metal)', 'Turbo Thrust (100 Metal)', 'Return to Game'];
                this.keyCooldown = 0;
                this.cooldownTime = 200; // 0.2 seconds in milliseconds
                this.enterCooldown = 0; // Will be set in enter() method
                this.selectionCooldown = 0; // Cooldown for shop selections
                this.selectionCooldownTime = 500; // 0.5 seconds between selections
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
        // Update selection cooldown
        if (this.selectionCooldown > 0) {
            this.selectionCooldown -= deltaTime;
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
        // Check selection cooldown
        if (this.selectionCooldown > 0) {
            return;
        }
        
        switch (this.selectedOption) {
            case 0: // Shield Upgrade
                if (this.game.gameData.metal >= 50) {
                    this.game.gameData.metal -= 50;
                    this.game.player.maxShieldLevel++;
                    this.game.player.shieldLevel = this.game.player.maxShieldLevel; // Refill shield
                    console.log('Shield upgraded!');
                    this.selectionCooldown = this.selectionCooldownTime;
                } else {
                    console.log('Not enough metal!');
                }
                break;
            case 1: // Agility Boost
                if (this.game.gameData.metal >= 30) {
                    this.game.gameData.metal -= 30;
                    this.game.player.speed += 50;
                    console.log('Agility boosted!');
                    this.selectionCooldown = this.selectionCooldownTime;
                } else {
                    console.log('Not enough metal!');
                }
                break;
            case 2: // Turbo Thrust
                if (this.game.gameData.metal >= 100) {
                    this.game.gameData.metal -= 100;
                    this.game.player.turboLevel = 1; // Enable turbo
                    this.game.player.turboCharge = 5; // 5 seconds of turbo
                    console.log('Turbo thrust acquired!');
                    this.selectionCooldown = this.selectionCooldownTime;
                } else {
                    console.log('Not enough metal!');
                }
                break;
            case 3: // Return to Game
                this.game.goBack();
                break;
        }
    }
}

// Game Classes (Player, Enemy, Bullet, Star, Particle)
class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 300;
        this.shootCooldown = 0;
        this.shootDelay = 200;
        this.game = game;
        
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
        
        // Turbo system
        this.turboLevel = 0; // 0 = no turbo, 1 = has turbo
        this.turboCharge = 0; // Current turbo charge (0-5 seconds)
        this.maxTurboCharge = 5; // Maximum turbo charge
        this.turboRechargeRate = 0.1; // Charge per second when not using
        this.turboActive = false; // Whether turbo is currently active
    }
    
    update(deltaTime, keys, canvasWidth) {
        // Movement - now vertical for side-scroller
        let currentSpeed = this.speed;
        if (this.turboActive && this.turboCharge > 0) {
            currentSpeed *= 2; // Double speed with turbo
        }
        
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.y -= currentSpeed * deltaTime / 1000;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.y += currentSpeed * deltaTime / 1000;
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
        
        // Turbo activation
        if (keys['ShiftLeft'] || keys['ShiftRight']) {
            if (this.turboLevel > 0 && this.turboCharge > 0) {
                this.turboActive = true;
            }
        } else {
            this.turboActive = false;
        }
        
        // Update cloaking
        this.updateCloaking(deltaTime);
        
        // Update shield
        this.updateShield(deltaTime);
        
        // Update hit effects
        this.updateHitEffects(deltaTime);
        
        // Update turbo
        this.updateTurbo(deltaTime);
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
    
    updateTurbo(deltaTime) {
        if (this.turboLevel === 0) return; // No turbo system
        
        // Check if turbo is being used
        if (this.turboActive && this.turboCharge > 0) {
            this.turboCharge -= deltaTime / 1000; // Drain turbo
            if (this.turboCharge <= 0) {
                this.turboCharge = 0;
                this.turboActive = false;
            }
        } else if (!this.turboActive && this.turboCharge < this.maxTurboCharge) {
            // Recharge turbo when not in use
            this.turboCharge += this.turboRechargeRate * deltaTime / 1000;
            if (this.turboCharge > this.maxTurboCharge) {
                this.turboCharge = this.maxTurboCharge;
            }
        }
        
        // Update global turbo multiplier
        if (this.turboActive && this.turboCharge > 0) {
            this.game.gameData.turboMultiplier = 2; // Double speed for everything
        } else {
            this.game.gameData.turboMultiplier = 1; // Normal speed
        }
    }
    
    updateCloaking(deltaTime) {
        // Don't update cloaking on shop level (level 5)
        if (this.game && this.game.gameData && this.game.gameData.level === 5) {
            this.cloakLevel = 0;
            this.isCloaked = false;
            return;
        }
        
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
            this.game.particles.push(new HitSpark(x, y, angle, speed));
        }
    }
    
    shoot() {
        this.game.bullets.push(new Bullet(this.x + this.width, this.y + this.height / 2 - 2, this.game));
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

        // Draw turbo flames when active
        if (this.turboActive && this.turboLevel > 0) {
            this.drawTurboFlames(ctx);
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
        
                 // Draw rippling cloaking effect when cloaked
         if (this.isCloaked) {
             ctx.globalAlpha = this.cloakLevel; // Effect becomes more visible as ship fades
             
             // Create rippling circle effect
             const centerX = this.x + this.width / 2;
             const centerY = this.y + this.height / 2;
             const baseRadius = Math.max(this.width, this.height) * 0.8;
             
             // Animate the ripple effect
             const time = Date.now() * 0.005; // Animation speed
             const rippleCount = 3; // Number of ripple rings
             
             for (let i = 0; i < rippleCount; i++) {
                 const rippleRadius = baseRadius + (i * 15) + Math.sin(time + i * 2) * 8;
                 const rippleAlpha = (this.cloakLevel * 0.6) / (i + 1); // Fade outer rings
                 
                 ctx.globalAlpha = rippleAlpha;
                 ctx.strokeStyle = '#00ffff'; // Cyan color for cloaking effect
                 ctx.lineWidth = 2;
                 ctx.setLineDash([5, 5]); // Dashed line effect
                 ctx.lineDashOffset = time * 2; // Animate dash movement
                 
                 ctx.beginPath();
                 ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
                 ctx.stroke();
             }
             
             // Reset line dash
             ctx.setLineDash([]);
         }
         
         
         
                  // Reset global alpha
         ctx.globalAlpha = 1;
     }
     
                       drawTurboFlames(ctx) {
           // Draw animated flames behind the ship when turbo is active
           const time = Date.now() * 0.01; // Animation speed
           const flameBaseX = this.x - 15; // Closer to ship to avoid clipping
           const flameCenterY = this.y + this.height / 2;
           
           // Create flame layers
           const flameLayers = [
               { color: '#ff4400', size: 25, speed: 3, offset: 0 },      // Orange core
               { color: '#ff6600', size: 20, speed: 2, offset: -4 },      // Bright orange
               { color: '#ff8800', size: 15, speed: 1.5, offset: -8 },    // Medium orange
               { color: '#ffaa00', size: 10, speed: 1, offset: -12 }      // Light orange
           ];
           
           // Draw flame shapes using ellipses (simpler than complex paths)
           for (let i = 0; i < flameLayers.length; i++) {
               const layer = flameLayers[i];
               
               // Animate flame flicker and movement
               const flicker = Math.sin(time * layer.speed + i) * 0.3 + 0.7;
               const flameX = flameBaseX - layer.offset;
               const flameY = flameCenterY + Math.sin(time * 2 + i) * 3;
               
               // Draw flame as an elongated ellipse pointing away from ship
               ctx.save();
               ctx.translate(flameX, flameY);
               ctx.scale(flicker, 1); // Horizontal flicker effect
               
               ctx.fillStyle = layer.color;
               ctx.globalAlpha = 0.8 + flicker * 0.2; // Opacity flicker
               
               ctx.beginPath();
               ctx.ellipse(0, 0, layer.size, layer.size * 0.4, 0, 0, Math.PI * 2);
               ctx.fill();
               
               // Add glow effect
               ctx.shadowColor = layer.color;
               ctx.shadowBlur = 6;
               ctx.fill();
               ctx.shadowBlur = 0;
               
               ctx.restore();
           }
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

        // Rotation properties - initialize for all enemy types
        this.rotation = Math.random() * 360; // Random starting orientation
        this.rotationSpeed = 0; // Default no rotation
        
        if (enemyType === 0) {
            // Set rotation speed only for asteroids
            this.rotationSpeed = Math.random() * 60 + 30; // Random rotation speed (30 to 90 degrees per second)
            // Randomize asteroid design
            this.asteroidType = Math.floor(Math.random() * 4); // 0-3 different types
            this.sizeVariation = Math.random() * 0.4 + 0.8; // 0.8x to 1.2x size
            this.colorVariation = Math.random() * 0.3 + 0.85; // 0.85x to 1.15x brightness
            this.detailLevel = Math.floor(Math.random() * 3) + 2; // 2-4 detail layers
            
            // Generate fixed detail positions for consistent rendering
            this.details = [];
            for (let i = 0; i < this.detailLevel; i++) {
                this.details.push({
                    x: (Math.random() - 0.5), // -0.5 to 0.5
                    y: (Math.random() - 0.5)  // -0.5 to 0.5
                });
            }
        }
    }
    
    update(deltaTime) {
        // Apply turbo multiplier to all enemy movement
        const turboMultiplier = this.game.gameData.turboMultiplier || 1;
        
        if (this.enemyType === 0) {
            // Move horizontally for side-scroller
            this.x -= this.speed * turboMultiplier * deltaTime / 1000;
            
            // Update rotation - frame-rate independent
            this.rotation += this.rotationSpeed * deltaTime / 1000;
            if (this.rotation > 360) this.rotation -= 360;
            if (this.rotation < 0) this.rotation += 360;
        }
        // mouse
        if (this.enemyType === 1) {
            // Move horizontally for side-scroller
            this.x -= this.speed * turboMultiplier * deltaTime / 1000;

            // Only home in on player if they're not cloaked
            if (!this.game.player.isCloaked) {
                // Calculate angle to face player
                const dx = this.game.player.x - this.x;
                const dy = this.game.player.y - this.y;
                this.targetRotation = Math.atan2(dy, dx) * 180 / Math.PI;
                
                // Smoothly rotate to face player
                const rotationDiff = this.targetRotation - this.rotation;
                this.rotation += rotationDiff * deltaTime / 1000 * 2; // Smooth rotation
                
                // Then home in on player
                this.x = lerp(this.x, this.game.player.x, deltaTime / 1000);
                this.y = lerp(this.y, this.game.player.y, deltaTime / 1000);
            } else {
                // When cloaked, rotate slowly as if disabled
                this.rotation += 15 * deltaTime / 1000; // Slow disabled rotation
            }
        }
        // shop station
        if (this.enemyType === 2) {
            // Faster float from right to left with slight bobbing (doubled speed)
            this.x -= this.speed * 0.6 * turboMultiplier * deltaTime / 1000;
            this._bobTimer = (this._bobTimer || 0) + deltaTime / 1000;
            this.y += Math.sin(this._bobTimer * 2) * 0.2;
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
            
            // Draw different asteroid types using generic method
            switch (this.asteroidType) {
                case 0: // Square asteroid (4 sides)
                    this.drawGenericAsteroid(ctx, scaledWidth, scaledHeight, 4);
                    break;
                case 1: // Diamond asteroid (4 sides)
                    this.drawGenericAsteroid(ctx, scaledWidth, scaledHeight, 4);
                    break;
                case 2: // Octagon asteroid (8 sides)
                    this.drawGenericAsteroid(ctx, scaledWidth, scaledHeight, 8);
                    break;
                case 3: // Irregular asteroid (6 sides)
                    this.drawGenericAsteroid(ctx, scaledWidth, scaledHeight, 6);
                    break;
            }
        } else if (this.enemyType === 1) {
            // Draw mouse enemy
            this.drawMouseEnemy(ctx);
        } else if (this.enemyType === 2) {
            // Draw shop enemy
            this.drawShop(ctx);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    drawMouseEnemy(ctx) {
        // Save context for rotation
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation * Math.PI / 180);
        
        // Draw mouse body (circle with ears)
        ctx.fillStyle = '#808080'; // Grey
        
        // Main body
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#A0A0A0';
        ctx.beginPath();
        ctx.arc(-8, -12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -12, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Status light (blinking green when disabled, red when active)
        const time = Date.now() * 0.005;
        if (this.game.player.isCloaked) {
            // Blinking green light when disabled
            ctx.fillStyle = Math.sin(time * 3) > 0 ? '#00ff00' : '#003300';
        } else {
            // Solid red light when active
            ctx.fillStyle = '#ff0000';
        }
        
        // Draw status light on top of mouse
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect to status light
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
    
    drawShop(ctx) {
        // Use enemy dimensions as shop size (1/4 screen height set at spawn)
        const shopWidth = this.width;
        const shopHeight = this.height;
        const shopX = this.x;
        const shopY = this.y;
        
        // Main space station body
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(shopX, shopY, shopWidth, shopHeight);
        
        // Layer for rounded-corner effect
        ctx.fillStyle = '#34495e';
        ctx.fillRect(shopX + 5, shopY, shopWidth - 10, shopHeight);
        ctx.fillRect(shopX, shopY + 5, shopWidth, shopHeight - 10);
        
        // Central structure details
        ctx.fillStyle = '#1a252f';
        ctx.fillRect(shopX + shopWidth * 0.2, shopY + shopHeight * 0.1, shopWidth * 0.6, shopHeight * 0.8);
        
        // Windows
        ctx.fillStyle = '#3498db';
        for (let i = 0; i < 3; i++) {
            const windowX = shopX + shopWidth * 0.25 + (i * shopWidth * 0.2);
            const windowY = shopY + shopHeight * 0.2;
            const windowSize = shopHeight * 0.15;
            ctx.fillRect(windowX, windowY, windowSize, windowSize);
        }
        
        // SHOP billboard
        ctx.fillStyle = '#e74c3c';
        const billboardWidth = shopWidth * 0.8;
        const billboardHeight = shopHeight * 0.2;
        const billboardX = shopX + (shopWidth - billboardWidth) / 2;
        const billboardY = shopY + shopHeight * 0.7;
        ctx.fillRect(billboardX, billboardY, billboardWidth, billboardHeight);
        
        // SHOP text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${shopHeight * 0.15}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('SHOP', shopX + shopWidth / 2, billboardY + billboardHeight * 0.7);
        
        // Antenna/dish on top
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(shopX + shopWidth * 0.4, shopY - shopHeight * 0.1, shopWidth * 0.2, shopHeight * 0.1);
        
        // Docking ports on sides
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(shopX - shopHeight * 0.05, shopY + shopHeight * 0.3, shopHeight * 0.1, shopHeight * 0.4);
        ctx.fillRect(shopX + shopWidth, shopY + shopHeight * 0.3, shopHeight * 0.1, shopHeight * 0.4);
    }

    drawGenericAsteroid(ctx, width, height, sides = 6) {
        // Base color with variation
        const baseColor = this.adjustColor('#808080', this.colorVariation);
        ctx.fillStyle = baseColor;

        // Create a polygon with the given sides
        ctx.beginPath();
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
        
        // Add detail layers using stored positions
        if (this.details && this.details.length > 0) {
            for (let i = 0; i < this.detailLevel && i < this.details.length; i++) {
                const detail = this.details[i];
                const detailSize = (width * 0.25) - (i * width * 0.08);
                const detailX = detail.x * width * 0.3;
                const detailY = detail.y * height * 0.3;

                ctx.fillStyle = this.adjustColor('#404040', this.colorVariation);
                ctx.fillRect(-detailSize / 2 + detailX, -detailSize / 2 + detailY, detailSize, detailSize);
            }
        }
        
        // Add highlights using stored positions for consistency
        ctx.fillStyle = this.adjustColor('#c0c0c0', this.colorVariation);
        if (this.details && this.details.length > 0) {
            // Use first two detail positions for highlights, scaled appropriately
            ctx.fillRect(-2 + this.details[0].x * width * 0.1, -height / 2 + 2 + this.details[0].y * height * 0.1, 4, 4);
            if (this.details.length > 1) {
                ctx.fillRect(width / 2 - 6 + this.details[1].x * width * 0.1, -2 + this.details[1].y * height * 0.1, 4, 4);
            }
        }
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
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 4;
        this.speed = 500;
        this.game = game;
    }
    
    update(deltaTime) {
        // Move horizontally for side-scroller
        const turboMultiplier = this.game.gameData.turboMultiplier || 1;
        this.x += this.speed * turboMultiplier * deltaTime / 1000;
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
        const turboMultiplier = this.game.gameData.turboMultiplier || 1;
        this.x -= this.speed * turboMultiplier * deltaTime / 1000;
        
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
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.collected = false;
        this.collectRadius = 40; // Distance player needs to be to collect (doubled from 20)
        this.floatOffset = 0;
        this.floatSpeed = 2; // Speed of floating animation
        this.driftSpeed = 50; // Speed at which metal drifts left
        this.game = game;
    }
    
    update(deltaTime) {
        // Floating animation
        this.floatOffset += this.floatSpeed * deltaTime / 1000;
        if (this.floatOffset > Math.PI * 2) {
            this.floatOffset -= Math.PI * 2;
        }
        
        // Drift toward left side of screen
        const turboMultiplier = this.game.gameData.turboMultiplier || 1;
        this.x -= this.driftSpeed * turboMultiplier * deltaTime / 1000;
        
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



// Start the game when the page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});

