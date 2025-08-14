// Black Cat in Space - js13k 2025 Entry
// A space shooter game featuring a black cat pilot

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.level = 1;
        
        this.player = new Player(this.width / 2, this.height - 100);
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
        // Create initial stars
        for (let i = 0; i < 50; i++) {
            this.stars.push(new Star(
                Math.random() * this.width,
                Math.random() * this.height,
                Math.random() * 2 + 1
            ));
        }
        
        this.bindEvents();
        this.gameLoop();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' && this.gameOver) {
                this.restart();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    restart() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.level = 1;
        this.player = new Player(this.width / 2, this.height - 100);
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.enemySpawnTimer = 0;
        
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('score').textContent = '0';
        document.getElementById('lives').textContent = '3';
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        // Update player
        this.player.update(deltaTime, this.keys, this.width);
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.y > -10;
        });
        
        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(deltaTime);
            return enemy.y < this.height + 50;
        });
        
        // Update stars
        this.stars.forEach(star => star.update(deltaTime));
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
        
        // Spawn enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer > 1000 / this.level) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // Spawn stars
        this.starSpawnTimer += deltaTime;
        if (this.starSpawnTimer > 100) {
            this.stars.push(new Star(Math.random() * this.width, -10, Math.random() * 2 + 1));
            this.starSpawnTimer = 0;
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }
    
    spawnEnemy() {
        const x = Math.random() * (this.width - 40);
        const enemy = new Enemy(x, -50, this.level);
        this.enemies.push(enemy);
    }
    
    checkCollisions() {
        // Bullet vs Enemy
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 100;
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    // Level up every 1000 points
                    if (this.score % 1000 === 0) {
                        this.level++;
                    }
                }
            });
        });
        
        // Player vs Enemy
        this.enemies.forEach((enemy, index) => {
            if (this.checkCollision(this.player, enemy)) {
                this.enemies.splice(index, 1);
                this.lives--;
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                    document.getElementById('finalScore').textContent = this.score;
                    document.getElementById('gameOver').style.display = 'block';
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
            this.particles.push(new Particle(x, y, Math.random() * 360));
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.stars.forEach(star => star.render(this.ctx));
        
        // Draw particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Draw bullets
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        
        // Draw player
        this.player.render(this.ctx);
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 300;
        this.shootCooldown = 0;
        this.shootDelay = 200;
    }
    
    update(deltaTime, keys, canvasWidth) {
        // Movement
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.x -= this.speed * deltaTime / 1000;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.x += this.speed * deltaTime / 1000;
        }
        
        // Keep player in bounds
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        
        // Shooting
        this.shootCooldown -= deltaTime;
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootDelay;
        }
    }
    
    shoot() {
        game.bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y));
    }
    
    render(ctx) {
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
        this.y += this.speed * deltaTime / 1000;
    }
    
    render(ctx) {
        // Draw enemy spaceship
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Enemy details
        ctx.fillStyle = '#800000';
        ctx.fillRect(this.x + 5, this.y + 5, 20, 20);
        
        // Enemy eyes
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 500;
    }
    
    update(deltaTime) {
        this.y -= this.speed * deltaTime / 1000;
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
        this.y += this.speed * deltaTime / 1000;
        if (this.y > 600) {
            this.y = -10;
            this.x = Math.random() * 800;
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
