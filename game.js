// Game Configuration
const CONFIG = {
    canvas: {
        width: 1000,
        height: 700
    },
    player: {
        width: 60,
        height: 60,
        speed: 5,
        health: 100,
        attackRange: 80,
        attackCooldown: 500
    },
    monster: {
        spawnRate: 2000,
        maxMonsters: 15
    },
    coins: {
        perKill: 10
    }
};

const DEFAULT_SWORDS = [
    { id: 1, name: 'Basic Sword', damage: 10, price: 0, owned: true, image: 'sword1.png' },
    { id: 2, name: 'Iron Sword', damage: 20, price: 50, owned: false, image: 'sword2.png' },
    { id: 3, name: 'Steel Sword', damage: 35, price: 150, owned: false, image: 'sword3.png' },
    { id: 4, name: 'Dragon Sword', damage: 55, price: 400, owned: false, image: 'sword4.png' },
    { id: 5, name: 'Legendary Sword', damage: 100, price: 1000, owned: false, image: 'sword5.png' }
];

const DEFAULT_MAPS = [
    { id: 1, name: 'Map 1: Slimers', enemies: ['slimer'], price: 0, owned: true, background: 'bg1.png' },
    { id: 2, name: 'Map 2: Slimers + Bats', enemies: ['slimer', 'bat'], price: 200, owned: false, background: 'bg2.png' },
    { id: 3, name: 'Map 3: Skeletons + Bats', enemies: ['skeleton', 'bat'], price: 500, owned: false, background: 'bg3.png' }
];

const DEFAULT_PETS = [
    { id: 1, name: 'Archer', description: 'A loyal archer companion', price: 100, owned: false, image: 'archer.png', damage: 8, attackRange: 300, attackCooldown: 1500, attackType: 'arrow' },
    { id: 2, name: 'Eye Golem', description: 'A mystical eye golem', price: 300, owned: false, image: 'eyeballgolem.png', damage: 12, attackRange: 250, attackCooldown: 2000, attackType: 'laser' },
    { id: 3, name: 'Stone Golem', description: 'A sturdy stone guardian', price: 600, owned: false, image: 'stonegolem.png', damage: 15, attackRange: 100, attackCooldown: 1800, attackType: 'punch' },
    { id: 4, name: 'Witch', description: 'A magical witch ally', price: 800, owned: false, image: 'witch.png', damage: 20, attackRange: 350, attackCooldown: 2500, attackType: 'spell' }
];

const cloneDefaults = (items) => items.map(item => ({ ...item }));

// Game State
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    coins: 0,
    currentMap: 1,
    player: null,
    monsters: [],
    particles: [],
    lastMonsterSpawn: 0,
    lastAttack: 0,
    keys: {},
    shop: {
        swords: cloneDefaults(DEFAULT_SWORDS),
        maps: cloneDefaults(DEFAULT_MAPS),
        pets: cloneDefaults(DEFAULT_PETS),
        currentSword: 1,
        currentPet: 1
    },
    pet: null,
    petProjectiles: []
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load Images
const images = {};
const imagePaths = {
    player: 'images/player.png',
    slimer: 'images/slimer.png',
    bat: 'images/bat.png',
    skeleton: 'images/skeleton.png',
    bg1: 'images/bg1.png',
    bg2: 'images/bg2.png',
    bg3: 'images/bg3.png',
    sword1: 'images/sword1.png',
    sword2: 'images/sword2.png',
    sword3: 'images/sword3.png',
    sword4: 'images/sword4.png',
    sword5: 'images/sword5.png',
    archer: 'images/archer.png',
    eyeballgolem: 'images/eyeballgolem.png',
    stonegolem: 'images/stonegolem.png',
    witch: 'images/witch.png'
};

// Load all images
let imagesLoaded = 0;
const totalImages = Object.keys(imagePaths).length;

Object.keys(imagePaths).forEach(key => {
    const img = new Image();
    img.src = imagePaths[key];
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            console.log('All images loaded');
        }
    };
    images[key] = img;
});

// Particle Class
class Particle {
    constructor(x, y, color, velocity, life = 30) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocity.x;
        this.vy = velocity.y;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// Player Class
class Player {
    constructor() {
        this.x = CONFIG.canvas.width / 2;
        this.y = CONFIG.canvas.height - 100;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.health = CONFIG.player.health;
        this.maxHealth = CONFIG.player.health;
        this.speed = CONFIG.player.speed;
        this.attackRange = CONFIG.player.attackRange;
        this.attacking = false;
        this.attackAngle = 0;
        this.attackAnimationProgress = 0;
        this.facingRight = true;
    }

    update() {
        // Movement
        if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            this.x -= this.speed;
            this.facingRight = false;
        }
        if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            this.x += this.speed;
            this.facingRight = true;
        }
        if (gameState.keys['ArrowUp'] || gameState.keys['w']) {
            this.y -= this.speed;
        }
        if (gameState.keys['ArrowDown'] || gameState.keys['s']) {
            this.y += this.speed;
        }

        // Keep player in bounds
        this.x = Math.max(this.width / 2, Math.min(CONFIG.canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(CONFIG.canvas.height - this.height / 2, this.y));

        // Update attack animation
        if (this.attacking) {
            this.attackAnimationProgress += 0.3;
            if (this.attackAnimationProgress > Math.PI * 2) {
                this.attacking = false;
                this.attackAnimationProgress = 0;
            }
        }
    }

    attack() {
        const currentTime = Date.now();
        if (currentTime - gameState.lastAttack < CONFIG.player.attackCooldown) {
            return false;
        }

        this.attacking = true;
        gameState.lastAttack = currentTime;

        // Find nearest monster to attack towards
        let nearestMonster = null;
        let nearestDist = Infinity;
        
        gameState.monsters.forEach(monster => {
            const dist = Math.sqrt(
                Math.pow(monster.x - this.x, 2) + Math.pow(monster.y - this.y, 2)
            );
            if (dist < nearestDist && dist <= this.attackRange * 1.5) {
                nearestDist = dist;
                nearestMonster = monster;
            }
        });

        // Calculate attack direction - towards nearest monster or in facing direction
        let angle;
        if (nearestMonster) {
            const dx = nearestMonster.x - this.x;
            const dy = nearestMonster.y - this.y;
            angle = Math.atan2(dy, dx);
            this.facingRight = dx > 0;
        } else {
            // Attack in facing direction if no nearby monster
            angle = this.facingRight ? 0 : Math.PI;
        }
        
        // Store attack angle for visual arc (base direction)
        this.attackAngle = angle;
        this.attackAnimationProgress = 0;

        // Get current sword damage
        const currentSword = gameState.shop.swords.find(s => s.id === gameState.shop.currentSword);
        const damage = currentSword ? currentSword.damage : 10;

        // Check for monster hits
        gameState.monsters.forEach(monster => {
            const dist = Math.sqrt(
                Math.pow(monster.x - this.x, 2) + Math.pow(monster.y - this.y, 2)
            );
            
            if (dist <= this.attackRange) {
                // Check if monster is in attack arc
                const monsterAngle = Math.atan2(monster.y - this.y, monster.x - this.x);
                const angleDiff = Math.abs(angle - monsterAngle);
                const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
                
                if (normalizedDiff < Math.PI / 3) { // 60 degree arc
                    monster.takeDamage(damage);
                    
                    // Create hit particles
                    for (let i = 0; i < 10; i++) {
                        gameState.particles.push(new Particle(
                            monster.x,
                            monster.y,
                            '#ff6b6b',
                            {
                                x: (Math.random() - 0.5) * 8,
                                y: (Math.random() - 0.5) * 8
                            },
                            20
                        ));
                    }
                }
            }
        });

        // Create attack effect particles
        for (let i = 0; i < 5; i++) {
            const angleOffset = (Math.random() - 0.5) * Math.PI / 3;
            const attackX = this.x + Math.cos(angle + angleOffset) * this.attackRange * 0.5;
            const attackY = this.y + Math.sin(angle + angleOffset) * this.attackRange * 0.5;
            gameState.particles.push(new Particle(
                attackX,
                attackY,
                '#ffd700',
                {
                    x: Math.cos(angle + angleOffset) * 3,
                    y: Math.sin(angle + angleOffset) * 3
                },
                15
            ));
        }

        return true;
    }

    draw() {
        ctx.save();

        // Draw player
        if (images.player.complete) {
            ctx.translate(this.x, this.y);
            if (!this.facingRight) {
                ctx.scale(-1, 1);
            }
            ctx.drawImage(images.player, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
        ctx.restore();

        this.drawSword();

        // Draw attack arc
        if (this.attacking) {
            ctx.save();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffd700';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange, this.attackAngle - Math.PI / 3 + this.attackAnimationProgress, this.attackAngle + Math.PI / 3 + this.attackAnimationProgress);
            ctx.stroke();
            ctx.restore();
        }

        // Draw health bar
        const barWidth = 60;
        const barHeight = 6;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 15, barWidth, barHeight);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 15, barWidth * (this.health / this.maxHealth), barHeight);
    }

    drawSword() {
        const currentSword = gameState.shop.swords.find(s => s.id === gameState.shop.currentSword);
        if (!currentSword) {
            return;
        }

        const swordKey = currentSword.image.replace('.png', '');
        const swordImage = images[swordKey];
        if (!swordImage || !swordImage.complete) {
            return;
        }

        let swordAngle;
        if (this.attacking) {
            const swingArc = Math.PI * 0.8;
            const swingProgress = Math.min(this.attackAnimationProgress / Math.PI, 1);
            const easedProgress = 1 - Math.pow(1 - swingProgress, 2);
            swordAngle = this.attackAngle - swingArc / 2 + swingArc * easedProgress;
        } else {
            const facingAngle = this.facingRight ? 0 : Math.PI;
            const tilt = this.facingRight ? Math.PI / 6 : -Math.PI / 6;
            const idleSway = Math.sin(Date.now() / 200) * 0.05;
            swordAngle = facingAngle + tilt + idleSway;
        }

        const swordDistance = this.width * 0.7;
        const swordX = this.x + Math.cos(swordAngle) * swordDistance;
        const swordY = this.y + Math.sin(swordAngle) * swordDistance;

        const swordWidth = this.width * 0.6;
        const swordHeight = this.height * 1.4;

        ctx.save();
        ctx.translate(swordX, swordY);
        ctx.rotate(swordAngle + Math.PI / 2);
        ctx.drawImage(swordImage, -swordWidth / 2, -swordHeight / 2, swordWidth, swordHeight);
        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            gameOver();
        }
    }
}

// Monster Base Class
class Monster {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.health = this.getMaxHealth();
        this.maxHealth = this.getMaxHealth();
        this.speed = this.getSpeed();
        this.targetX = this.x;
        this.targetY = this.y;
        this.angle = Math.random() * Math.PI * 2;
        this.animationFrame = 0;
        this.facingRight = true;
    }

    getMaxHealth() {
        switch (this.type) {
            case 'slimer': return 30;
            case 'bat': return 20;
            case 'skeleton': return 60;
            default: return 30;
        }
    }

    getSpeed() {
        switch (this.type) {
            case 'slimer': return 1.5;
            case 'bat': return 2.5;
            case 'skeleton': return 1;
            default: return 1.5;
        }
    }

    getColor() {
        switch (this.type) {
            case 'slimer': return '#4ecdc4';
            case 'bat': return '#2d3436';
            case 'skeleton': return '#ddd';
            default: return '#999';
        }
    }

    update() {
        // Move towards player
        if (gameState.player) {
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                // Flying/sliming enemies rotate toward player
                if (this.type !== 'skeleton') {
                    this.angle = Math.atan2(dy, dx);
                }
                // Skeletons keep their facing direction (no turning)
            }

            // Attack player if close enough
            if (dist < 40) {
                gameState.player.takeDamage(0.5);
            }
        }

        this.animationFrame += 0.1;
    }

    draw() {
        ctx.save();
        
        // Draw monster
        const imageKey = this.type;
        if (images[imageKey] && images[imageKey].complete) {
            ctx.translate(this.x, this.y);

            if (this.type === 'skeleton') {
                // Skeletons walk: no spinning, just flip left/right
                if (!this.facingRight) {
                    ctx.scale(-1, 1);
                }
            } else {
                // Other monsters can rotate toward their movement
                ctx.rotate(this.angle + Math.PI / 2);
            }

            ctx.drawImage(images[imageKey], -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            // Fallback
            ctx.fillStyle = this.getColor();
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }

        // Draw health bar
        const barWidth = 40;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth, barHeight);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth * (this.health / this.maxHealth), barHeight);
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Create damage particles
        for (let i = 0; i < 5; i++) {
            gameState.particles.push(new Particle(
                this.x,
                this.y,
                '#ff6b6b',
                {
                    x: (Math.random() - 0.5) * 6,
                    y: (Math.random() - 0.5) * 6
                },
                15
            ));
        }

        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        // Create death particles
        for (let i = 0; i < 20; i++) {
            gameState.particles.push(new Particle(
                this.x,
                this.y,
                this.getColor(),
                {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10
                },
                30
            ));
        }

        // Award coins and score
        gameState.coins += CONFIG.coins.perKill;
        gameState.score += 100;
    }

    isDead() {
        return this.health <= 0;
    }
}

// Pet Projectile Class
class PetProjectile {
    constructor(x, y, targetX, targetY, damage, type, petId) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.type = type; // 'arrow', 'laser', 'spell', 'punch'
        this.petId = petId;
        this.speed = this.getSpeed();
        this.life = 60;
        this.maxLife = 60;
        
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        this.angle = Math.atan2(dy, dx);
        
        this.size = this.getSize();
        this.color = this.getColor();
    }

    getSpeed() {
        switch (this.type) {
            case 'arrow': return 8;
            case 'laser': return 10;
            case 'spell': return 6;
            case 'punch': return 12;
            default: return 8;
        }
    }

    getSize() {
        switch (this.type) {
            case 'arrow': return 8;
            case 'laser': return 6;
            case 'spell': return 12;
            case 'punch': return 15;
            default: return 8;
        }
    }

    getColor() {
        switch (this.type) {
            case 'arrow': return '#8B4513';
            case 'laser': return '#FF1493';
            case 'spell': return '#9370DB';
            case 'punch': return '#696969';
            default: return '#fff';
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        // Check collision with monsters
        gameState.monsters.forEach(monster => {
            const dx = monster.x - this.x;
            const dy = monster.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < monster.width / 2 + this.size) {
                monster.takeDamage(this.damage);
                
                // Create hit effect
                this.createHitEffect(monster.x, monster.y);
                
                // Remove projectile
                this.life = 0;
            }
        });

        // Remove if out of bounds or expired
        if (this.life <= 0 || 
            this.x < -50 || this.x > CONFIG.canvas.width + 50 ||
            this.y < -50 || this.y > CONFIG.canvas.height + 50) {
            return true;
        }
        return false;
    }

    createHitEffect(x, y) {
        const colors = {
            'arrow': ['#8B4513', '#FFD700'],
            'laser': ['#FF1493', '#FF69B4'],
            'spell': ['#9370DB', '#BA55D3'],
            'punch': ['#696969', '#A9A9A9']
        };
        
        const effectColors = colors[this.type] || ['#fff', '#ccc'];
        
        for (let i = 0; i < 15; i++) {
            gameState.particles.push(new Particle(
                x,
                y,
                effectColors[Math.floor(Math.random() * effectColors.length)],
                {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10
                },
                20
            ));
        }
    }

    draw() {
        ctx.save();
        
        switch (this.type) {
            case 'arrow':
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-this.size * 2, -this.size / 2);
                ctx.lineTo(-this.size * 2, this.size / 2);
                ctx.closePath();
                ctx.fill();
                // Arrow shaft
                ctx.fillStyle = '#654321';
                ctx.fillRect(-this.size * 2, -this.size / 4, this.size * 2, this.size / 2);
                break;
                
            case 'laser':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
                // Laser core
                ctx.fillStyle = '#FF69B4';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'spell':
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                // Spell glow
                ctx.fillStyle = '#BA55D3';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'punch':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                // Impact effect
                ctx.strokeStyle = '#A9A9A9';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// Pet Class
class Pet {
    constructor(petData) {
        this.petData = petData;
        this.x = 0;
        this.y = 0;
        this.width = 200;
        this.height = 100;
        this.offsetX = 0;
        this.offsetY = -60; // Position behind player
        this.followSpeed = 3;
        this.animationFrame = 0;
        this.bobOffset = 0;
        this.lastAttack = 0;
        this.attackRange = petData.attackRange || 250;
        this.attackCooldown = petData.attackCooldown || 2000;
        this.damage = petData.damage || 10;
        this.attackType = petData.attackType || 'arrow';
        this.attacking = false;
        this.attackTarget = null;
    }

    update() {
        if (!gameState.player) return;

        // Calculate target position (offset from player)
        const targetX = gameState.player.x + this.offsetX;
        const targetY = gameState.player.y + this.offsetY;

        // Smoothly move towards target position
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * Math.min(this.followSpeed, dist);
            this.y += (dy / dist) * Math.min(this.followSpeed, dist);
        }

        // Bobbing animation
        this.animationFrame += 0.1;
        this.bobOffset = Math.sin(this.animationFrame) * 3;

        // Attack logic
        this.attack();
    }

    attack() {
        const currentTime = Date.now();
        if (currentTime - this.lastAttack < this.attackCooldown) {
            return;
        }

        // Find nearest monster in range
        let nearestMonster = null;
        let nearestDist = Infinity;

        gameState.monsters.forEach(monster => {
            const dx = monster.x - this.x;
            const dy = monster.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.attackRange && dist < nearestDist) {
                nearestDist = dist;
                nearestMonster = monster;
            }
        });

        if (nearestMonster) {
            this.lastAttack = currentTime;
            this.attacking = true;
            this.attackTarget = nearestMonster;

            // Create projectile
            gameState.petProjectiles.push(new PetProjectile(
                this.x,
                this.y + this.bobOffset,
                nearestMonster.x,
                nearestMonster.y,
                this.damage,
                this.attackType,
                this.petData.id
            ));

            // Create attack effect at pet position
            this.createAttackEffect();
        } else {
            this.attacking = false;
            this.attackTarget = null;
        }
    }

    createAttackEffect() {
        const colors = {
            'arrow': '#8B4513',
            'laser': '#FF1493',
            'spell': '#9370DB',
            'punch': '#696969'
        };

        const effectColor = colors[this.attackType] || '#fff';

        for (let i = 0; i < 8; i++) {
            gameState.particles.push(new Particle(
                this.x,
                this.y + this.bobOffset,
                effectColor,
                {
                    x: (Math.random() - 0.5) * 6,
                    y: (Math.random() - 0.5) * 6
                },
                15
            ));
        }
    }

    draw() {
        const imageKey = this.petData.image.replace('.png', '');
        const petImage = images[imageKey];
        
        if (!petImage || !petImage.complete) {
            // Fallback
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 + this.bobOffset, this.width, this.height);
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y + this.bobOffset);
        
        // Draw attack indicator when attacking
        if (this.attacking && this.attackTarget) {
            ctx.strokeStyle = this.getAttackColor();
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.getAttackColor();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const dx = this.attackTarget.x - this.x;
            const dy = this.attackTarget.y - (this.y + this.bobOffset);
            ctx.lineTo(dx, dy);
            ctx.stroke();
        }
        
        ctx.drawImage(petImage, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }

    getAttackColor() {
        switch (this.attackType) {
            case 'arrow': return '#8B4513';
            case 'laser': return '#FF1493';
            case 'spell': return '#9370DB';
            case 'punch': return '#696969';
            default: return '#fff';
        }
    }
}

// Game Functions
function startGame() {
    // Reset game state
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.monsters = [];
    gameState.particles = [];
    gameState.petProjectiles = [];
    gameState.lastMonsterSpawn = Date.now();
    gameState.lastAttack = 0;
    
    // Create player
    gameState.player = new Player();
    gameState.player.health = CONFIG.player.health;

    // Create pet
    const currentPet = gameState.shop.pets.find(p => p.id === gameState.shop.currentPet);
    if (currentPet && currentPet.owned) {
        gameState.pet = new Pet(currentPet);
        gameState.pet.x = gameState.player.x;
        gameState.pet.y = gameState.player.y;
    } else {
        gameState.pet = null;
    }

    // Hide menus, show HUD
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('shopScreen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('shopButton').classList.remove('hidden');

    // Start game loop
    gameLoop();
}

function gameOver() {
    gameState.isPlaying = false;
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalCoins').textContent = gameState.coins;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('shopButton').classList.add('hidden');
    
    // Save coins to localStorage
    saveGameData();
}

function openShop() {
    if (gameState.isPlaying) {
        gameState.isPaused = true;
    }
    document.getElementById('shopScreen').classList.remove('hidden');
    updateShopDisplay();
}

function closeShop() {
    document.getElementById('shopScreen').classList.add('hidden');
    if (gameState.isPlaying) {
        gameState.isPaused = false;
    }
    saveGameData();
}

function updateShopDisplay() {
    // Update swords list
    const swordsList = document.getElementById('swordsList');
    swordsList.innerHTML = '';
    
    gameState.shop.swords.forEach(sword => {
        const item = document.createElement('div');
        item.className = `shop-item ${sword.owned ? 'owned' : ''}`;
        
        const isCurrent = sword.id === gameState.shop.currentSword;
        const canBuy = !sword.owned && gameState.coins >= sword.price;
        
        item.innerHTML = `
            <div class="item-info">
                <div class="item-name">${sword.name} ${isCurrent ? '(EQUIPPED)' : ''}</div>
                <div class="item-desc">Damage: ${sword.damage}</div>
            </div>
            <div class="item-price">${sword.price}💰</div>
            <button class="btn btn-buy" ${sword.owned ? 'disabled' : ''} ${!canBuy ? 'disabled' : ''} 
                    onclick="buySword(${sword.id})">
                ${sword.owned ? 'OWNED' : 'BUY'}
            </button>
        `;
        
        swordsList.appendChild(item);
    });

    // Update maps list
    const mapsList = document.getElementById('mapsList');
    mapsList.innerHTML = '';
    
    gameState.shop.maps.forEach(map => {
        const item = document.createElement('div');
        item.className = `shop-item ${map.owned ? 'owned' : 'locked'}`;
        
        const isCurrent = map.id === gameState.currentMap;
        const canBuy = !map.owned && gameState.coins >= map.price;

        // Button state:
        // - Locked & not enough coins  -> disabled BUY
        // - Locked & enough coins      -> enabled BUY
        // - Owned                      -> enabled (SELECT / ACTIVE)
        const disabledAttr = !map.owned && !canBuy ? 'disabled' : '';
        const label = !map.owned ? 'BUY' : (isCurrent ? 'ACTIVE' : 'SELECT');
        
        item.innerHTML = `
            <div class="item-info">
                <div class="item-name">${map.name} ${isCurrent ? '(ACTIVE)' : ''}</div>
                <div class="item-desc">Enemies: ${map.enemies.join(', ')}</div>
            </div>
            <div class="item-price">${map.price}💰</div>
            <button class="btn btn-buy" ${disabledAttr} onclick="buyMap(${map.id})">
                ${label}
            </button>
        `;
        
        mapsList.appendChild(item);
    });

    // Update pets list
    const petsList = document.getElementById('petsList');
    if (petsList) {
        petsList.innerHTML = '';
        
        gameState.shop.pets.forEach(pet => {
            const item = document.createElement('div');
            item.className = `shop-item ${pet.owned ? 'owned' : ''}`;
            
            const isCurrent = pet.id === gameState.shop.currentPet;
            const canBuy = !pet.owned && gameState.coins >= pet.price;
            
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${pet.name} ${isCurrent ? '(EQUIPPED)' : ''}</div>
                    <div class="item-desc">${pet.description} | Damage: ${pet.damage || 10} | Range: ${pet.attackRange || 250}px</div>
                </div>
                <div class="item-price">${pet.price}💰</div>
                <button class="btn btn-buy" ${pet.owned ? '' : (canBuy ? '' : 'disabled')} 
                        onclick="buyPet(${pet.id})">
                    ${pet.owned ? (isCurrent ? 'EQUIPPED' : 'EQUIP') : 'BUY'}
                </button>
            `;
            
            petsList.appendChild(item);
        });
    }
}

function buySword(swordId) {
    const sword = gameState.shop.swords.find(s => s.id === swordId);
    if (!sword || sword.owned) return;
    
    if (gameState.coins >= sword.price) {
        gameState.coins -= sword.price;
        sword.owned = true;
        gameState.shop.currentSword = swordId;
        updateShopDisplay();
        updateHUD();
        saveGameData();
    }
}

function buyMap(mapId) {
    const map = gameState.shop.maps.find(m => m.id === mapId);
    if (!map) return;
    
    if (!map.owned) {
        if (gameState.coins >= map.price) {
            gameState.coins -= map.price;
            map.owned = true;
            updateShopDisplay();
            updateHUD();
            saveGameData();
        }
    } else {
        // Select map
        gameState.currentMap = mapId;
        // Clear current monsters when switching maps
        if (gameState.isPlaying) {
            gameState.monsters = [];
            gameState.lastMonsterSpawn = Date.now();
        }
        updateShopDisplay();
        updateHUD();
        saveGameData();
    }
}

function buyPet(petId) {
    const pet = gameState.shop.pets.find(p => p.id === petId);
    if (!pet) return;
    
    if (!pet.owned) {
        if (gameState.coins >= pet.price) {
            gameState.coins -= pet.price;
            pet.owned = true;
            gameState.shop.currentPet = petId;
            // Update pet in game if playing
            if (gameState.isPlaying && gameState.player) {
                gameState.pet = new Pet(pet);
                gameState.pet.x = gameState.player.x;
                gameState.pet.y = gameState.player.y;
            }
            updateShopDisplay();
            updateHUD();
            saveGameData();
        }
    } else {
        // Equip pet
        gameState.shop.currentPet = petId;
        // Update pet in game if playing
        if (gameState.isPlaying && gameState.player) {
            gameState.pet = new Pet(pet);
            gameState.pet.x = gameState.player.x;
            gameState.pet.y = gameState.player.y;
        }
        updateShopDisplay();
        saveGameData();
    }
}

function updateHUD() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('coinsDisplay').textContent = gameState.coins;
    document.getElementById('mapDisplay').textContent = gameState.currentMap;
}

function spawnMonster() {
    if (gameState.monsters.length >= CONFIG.monster.maxMonsters) return;
    
    const currentMap = gameState.shop.maps.find(m => m.id === gameState.currentMap);
    if (!currentMap) return;
    
    // Select random enemy type from current map
    const enemyTypes = currentMap.enemies;
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // Spawn at random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
        case 0: // top
            x = Math.random() * CONFIG.canvas.width;
            y = -50;
            break;
        case 1: // right
            x = CONFIG.canvas.width + 50;
            y = Math.random() * CONFIG.canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * CONFIG.canvas.width;
            y = CONFIG.canvas.height + 50;
            break;
        case 3: // left
            x = -50;
            y = Math.random() * CONFIG.canvas.height;
            break;
    }
    
    gameState.monsters.push(new Monster(enemyType, x, y));
}

function updateGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // Update player
    if (gameState.player) {
        gameState.player.update();
        
        // Check for spacebar attack
        if (gameState.keys[' '] || gameState.keys['Space']) {
            gameState.player.attack();
        }
    }
    
    // Update pet
    if (gameState.pet) {
        gameState.pet.update();
    }
    
    // Update pet projectiles
    gameState.petProjectiles = gameState.petProjectiles.filter(proj => {
        const isDead = proj.update();
        return !isDead;
    });
    
    // Spawn monsters
    const currentTime = Date.now();
    if (currentTime - gameState.lastMonsterSpawn > CONFIG.monster.spawnRate) {
        spawnMonster();
        gameState.lastMonsterSpawn = currentTime;
    }
    
    // Update monsters
    gameState.monsters = gameState.monsters.filter(monster => !monster.isDead());
    gameState.monsters.forEach(monster => monster.update());
    
    // Update particles
    gameState.particles = gameState.particles.filter(p => !p.isDead());
    gameState.particles.forEach(p => p.update());
    
    // Update HUD
    updateHUD();
}

function drawGame() {
    // Draw background
    const currentMap = gameState.shop.maps.find(m => m.id === gameState.currentMap);
    const bgKey = currentMap ? currentMap.background.replace('images/', '').replace('.png', '') : 'bg1';
    
    if (images[bgKey] && images[bgKey].complete) {
        ctx.drawImage(images[bgKey], 0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    } else {
        // Fallback background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    }
    
    // Draw particles
    gameState.particles.forEach(p => p.draw());
    
    // Draw monsters
    gameState.monsters.forEach(monster => monster.draw());
    
    // Draw player
    if (gameState.player) {
        gameState.player.draw();
    }
    
    // Draw pet projectiles
    gameState.petProjectiles.forEach(proj => proj.draw());
    
    // Draw pet (behind player but above monsters)
    if (gameState.pet) {
        gameState.pet.draw();
    }
}

function gameLoop() {
    if (!gameState.isPlaying) return;
    
    updateGame();
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

// Input Handling
document.addEventListener('keydown', (e) => {
    // Prevent spacebar from scrolling
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
    }
    gameState.keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Mouse click removed - using spacebar for attacks now

// Save/Load Game Data
function saveGameData() {
    localStorage.setItem('monsterSmash_coins', gameState.coins.toString());
    localStorage.setItem('monsterSmash_swords', JSON.stringify(gameState.shop.swords));
    localStorage.setItem('monsterSmash_maps', JSON.stringify(gameState.shop.maps));
    localStorage.setItem('monsterSmash_pets', JSON.stringify(gameState.shop.pets));
    localStorage.setItem('monsterSmash_currentSword', gameState.shop.currentSword.toString());
    localStorage.setItem('monsterSmash_currentMap', gameState.currentMap.toString());
    localStorage.setItem('monsterSmash_currentPet', gameState.shop.currentPet.toString());
}

function loadGameData() {
    const savedCoins = localStorage.getItem('monsterSmash_coins');
    if (savedCoins) {
        gameState.coins = parseInt(savedCoins);
    }
    
    const savedSwords = localStorage.getItem('monsterSmash_swords');
    if (savedSwords) {
        try {
            const parsedSwords = JSON.parse(savedSwords);
            if (Array.isArray(parsedSwords)) {
                const defaultSwords = cloneDefaults(DEFAULT_SWORDS);
                gameState.shop.swords = defaultSwords.map(defaultSword => {
                    const savedSword = parsedSwords.find(sword => sword.id === defaultSword.id) || {};
                    return {
                        ...defaultSword,
                        owned: savedSword.owned ?? defaultSword.owned,
                        damage: savedSword.damage ?? defaultSword.damage,
                        price: savedSword.price ?? defaultSword.price,
                        image: savedSword.image || defaultSword.image
                    };
                });
            }
        } catch (error) {
            console.warn('Failed to parse saved swords data', error);
        }
    } else {
        gameState.shop.swords = cloneDefaults(DEFAULT_SWORDS);
    }
    
    const savedMaps = localStorage.getItem('monsterSmash_maps');
    if (savedMaps) {
        try {
            const parsedMaps = JSON.parse(savedMaps);
            if (Array.isArray(parsedMaps)) {
                const defaultMaps = cloneDefaults(DEFAULT_MAPS);
                gameState.shop.maps = defaultMaps.map(defaultMap => {
                    const savedMap = parsedMaps.find(map => map.id === defaultMap.id) || {};
                    return {
                        ...defaultMap,
                        owned: savedMap.owned ?? defaultMap.owned,
                        price: savedMap.price ?? defaultMap.price,
                        enemies: savedMap.enemies || defaultMap.enemies,
                        background: savedMap.background || defaultMap.background
                    };
                });
            }
        } catch (error) {
            console.warn('Failed to parse saved maps data', error);
        }
    } else {
        gameState.shop.maps = cloneDefaults(DEFAULT_MAPS);
    }
    
    const savedPets = localStorage.getItem('monsterSmash_pets');
    if (savedPets) {
        try {
            const parsedPets = JSON.parse(savedPets);
            if (Array.isArray(parsedPets)) {
                const defaultPets = cloneDefaults(DEFAULT_PETS);
                gameState.shop.pets = defaultPets.map(defaultPet => {
                    const savedPet = parsedPets.find(pet => pet.id === defaultPet.id) || {};
                    return {
                        ...defaultPet,
                        owned: savedPet.owned ?? defaultPet.owned,
                        price: savedPet.price ?? defaultPet.price,
                        description: savedPet.description || defaultPet.description,
                        image: savedPet.image || defaultPet.image,
                        damage: defaultPet.damage,
                        attackRange: defaultPet.attackRange,
                        attackCooldown: defaultPet.attackCooldown,
                        attackType: defaultPet.attackType
                    };
                });
            }
        } catch (error) {
            console.warn('Failed to parse saved pets data', error);
        }
    } else {
        gameState.shop.pets = cloneDefaults(DEFAULT_PETS);
    }
    
    const savedSword = localStorage.getItem('monsterSmash_currentSword');
    if (savedSword) {
        gameState.shop.currentSword = parseInt(savedSword);
    }
    if (!gameState.shop.swords.some(sword => sword.id === gameState.shop.currentSword && sword.owned)) {
        const fallbackSword = gameState.shop.swords.find(sword => sword.owned) || gameState.shop.swords[0];
        if (fallbackSword) {
            gameState.shop.currentSword = fallbackSword.id;
        }
    }
    
    const savedMap = localStorage.getItem('monsterSmash_currentMap');
    if (savedMap) {
        gameState.currentMap = parseInt(savedMap);
    }
    if (!gameState.shop.maps.some(map => map.id === gameState.currentMap && map.owned)) {
        const fallbackMap = gameState.shop.maps.find(map => map.owned) || gameState.shop.maps[0];
        if (fallbackMap) {
            gameState.currentMap = fallbackMap.id;
        }
    }
    
    const savedPet = localStorage.getItem('monsterSmash_currentPet');
    if (savedPet) {
        gameState.shop.currentPet = parseInt(savedPet);
    }
    if (!gameState.shop.pets.some(pet => pet.id === gameState.shop.currentPet && pet.owned)) {
        const fallbackPet = gameState.shop.pets.find(pet => pet.owned) || gameState.shop.pets[0];
        if (fallbackPet) {
            gameState.shop.currentPet = fallbackPet.id;
        }
    }
}

// Load game data on page load
window.addEventListener('load', () => {
    loadGameData();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
});

