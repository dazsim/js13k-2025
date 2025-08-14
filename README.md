# Black Cat in Space - js13k 2025 Entry

A space shooter game featuring a black cat pilot, built for the js13k 2025 game jam.

## 🎮 Game Description

**Black Cat in Space** is a retro-style space shooter where you control a black cat piloting a spaceship through an endless stream of enemies. The game features:

- **Black Cat Protagonist**: A cute black cat spaceship with ears, whiskers, and a pink nose
- **Progressive Difficulty**: Enemies spawn faster and move quicker as you level up
- **Particle Effects**: Explosions and star field background
- **Score System**: Points for each enemy destroyed
- **Lives System**: 3 lives with game over screen
- **Responsive Controls**: WASD/Arrow keys for movement, Space/Up for shooting

## 🎯 How to Play

- **Move**: Use `A/D` or `Left/Right Arrow` keys
- **Shoot**: Press `Space` or `W` or `Up Arrow`
- **Restart**: Press `Space` when game over

## 🚀 Development

### Prerequisites

- **Node.js** (version 14.0.0 or higher)
- **npm** (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd js13k-2025
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Build Commands

- **Development build**: `npm run build`
- **Release build**: `npm run build:release`
- **Watch mode**: `npm run dev`
- **Live build**: `npm run start`

### File Structure

```
js13k-2025/
├── src/
│   ├── index.html      # Game HTML with canvas and UI
│   └── script.js       # Main game logic
├── build.js            # Build system
├── package.json        # Dependencies and scripts
└── target/             # Built game files
```

## 🎨 Game Features

### Visual Elements
- **Black Cat Spaceship**: Detailed cat design with ears, eyes, nose, and whiskers
- **Star Field**: Animated background with moving stars
- **Particle System**: Explosion effects when enemies are destroyed
- **Enemy Design**: Red enemy ships with glowing yellow eyes

### Gameplay Mechanics
- **Collision Detection**: Precise hitbox system
- **Scoring**: 100 points per enemy destroyed
- **Level Progression**: Difficulty increases every 1000 points
- **Smooth Movement**: 60 FPS gameplay with delta time

### Technical Features
- **Canvas Rendering**: Hardware-accelerated 2D graphics
- **Object-Oriented Design**: Clean class-based architecture
- **Event Handling**: Responsive keyboard input
- **Memory Management**: Automatic cleanup of off-screen objects

## 📊 Size Optimization

The game is built with js13k constraints in mind:
- **Current size**: ~2.5KB (well under the 13KB limit)
- **Minified code**: ESBuild optimization
- **Efficient rendering**: Minimal draw calls
- **Compact assets**: Procedurally generated graphics

## 🎯 Future Enhancements

Potential additions for future versions:
- Power-ups and special weapons
- Different enemy types
- Boss battles
- Sound effects and music
- High score system
- Multiple difficulty modes

## 🏆 js13k 2025 Theme

This entry perfectly fits the "Black Cat" theme by featuring:
- A black cat as the main character
- Space setting for adventure
- Cat-like characteristics (ears, whiskers, curiosity)
- Dark aesthetic with the black cat against space

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

This is a js13k entry, but suggestions and feedback are welcome!

---

**Good luck in the js13k 2025 competition!** 🐱‍🚀✨
