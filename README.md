# Monster Smash 🎮⚔️

A thrilling action game where you defeat monsters across different maps, upgrade your sword, and unlock new challenges!

## Features

- **Combat System**: Click to attack monsters with your sword
- **Multiple Maps**: Unlock 3 different maps with unique enemy combinations
  - Map 1: Slimers
  - Map 2: Slimers + Bats
  - Map 3: Skeletons + Bats
- **Shop System**: Buy better swords and unlock new maps
- **5 Sword Upgrades**: From Basic to Legendary
- **Particle Effects**: Cool visual effects for combat and monster deaths
- **Progressive Difficulty**: More challenging enemies as you progress

## How to Play

1. **Movement**: Use Arrow Keys or WASD to move your character
2. **Attack**: Click on monsters to attack them
3. **Earn Coins**: Defeat monsters to earn coins
4. **Shop**: Click the Shop button to buy upgrades and unlock maps
5. **Survive**: Don't let the monsters get too close!

## Running the Game

### Option 1: Simple HTTP Server (Recommended)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server
```

Then open `http://localhost:8000` in your browser.

### Option 2: Direct File

You can also open `index.html` directly in your browser, though some features may not work due to CORS restrictions.

## Game Controls

- **Arrow Keys / WASD**: Move player
- **Mouse Click**: Attack monsters
- **Shop Button**: Access shop to buy upgrades

## Shop Items

### Swords
- **Basic Sword**: Starting weapon (10 damage)
- **Iron Sword**: 20 damage - 50 coins
- **Steel Sword**: 35 damage - 150 coins
- **Dragon Sword**: 55 damage - 400 coins
- **Legendary Sword**: 100 damage - 1000 coins

### Maps
- **Map 1**: Slimers (Free)
- **Map 2**: Slimers + Bats - 200 coins
- **Map 3**: Skeletons + Bats - 500 coins

## Tips

- Start with Map 1 to earn coins
- Upgrade your sword early for easier monster kills
- Different monsters have different health and speed
- Save up coins to unlock Map 3 for the ultimate challenge!

## Game Data

Your progress (coins, purchased items) is automatically saved to your browser's localStorage.

Enjoy smashing monsters! 💀⚔️

