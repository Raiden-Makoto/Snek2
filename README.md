# Snake Game

A feature-rich Snake game built with HTML5 Canvas and JavaScript.

## Features

- **Two Game Modes:**
  - **Regular**: Classic snake gameplay
  - **Accelerated**: Start with 3 apples, eating spawns 3 more, faster movement (0.20s vs 0.25s)

- **Special Apple Types:**
  - **Regular Apple (Red)**: 82% spawn chance - Score +1, Grow +2 units
  - **Poisonous Apple (Brown)**: 10% spawn chance - Reverses direction, 10s "cannot eat apples" debuff
  - **Pomme Plus (Orange)**: 4% spawn chance - Score +2, 10s self-intersection immunity
  - **Pomme Supreme (Yellow)**: 1% spawn chance - Score +2, 10s self-intersection + wall-wrapping immunity
  - **Purple Apple (Purple)**: 3% spawn chance - Teleports snake to random location (no growth)

- **Game Mechanics:**
  - Continuous movement after first key press
  - Direction queue for rapid key presses
  - Collision detection (walls and self)
  - Status effect timers with visual countdowns
  - Pause/resume with 2-second countdown
  - High score tracking (separate for each mode)

## Controls

- **Arrow Keys / WASD**: Move snake
- **P**: Pause/Unpause game
- **Q**: Show game over screen (or quit)
- **ESC**: Exit game
- **R / Space**: Restart (on game over)
- **M**: Return to menu (on game over)

## Running the Game

### Simple Method (Local File)
Just open `index.html` in your web browser. Note: Sound files may not load due to browser security restrictions with `file://` URLs.

### Recommended Method (Local Server)
Run a local HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (with http-server installed)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
Snek/
├── index.html      # Main HTML file
├── snake.js        # Game logic and rendering
├── sounds/         # Sound effects directory
│   ├── apple.mp3
│   ├── poison.mp3
│   ├── golden.mp3
│   ├── purple.mp3
│   ├── gameover.mp3
│   └── pause.mp3
└── README.md       # This file
```

## Building the C++ Version

The C++ version using raylib is still available. To build it:

```bash
mkdir build
cd build
cmake ..
make
./snake
```

## License

See LICENSE file for details.
