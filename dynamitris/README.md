# Tetris Game

A WebGL implementation of the classic Tetris game using HTML5, CSS3, and JavaScript.

## Description

This project implements a Tetris-like game using modern web technologies:
- HTML5 for structure
- CSS3 for styling and animations
- JavaScript for game logic
- WebGL for rendering graphics

The game follows the standard Tetris ruleset where players arrange falling blocks to create complete lines.

## Features

- Classic Tetris gameplay with standard rules
- WebGL rendering for smooth graphics
- Responsive design that works on different screen sizes
- Score tracking and level progression
- Next piece preview
- Pause/resume functionality
- Game over detection with restart option

## Controls

- **Left/Right Arrow Keys**: Move piece horizontally
- **Down Arrow Key**: Soft drop
- **Up Arrow Key or X**: Rotate piece clockwise
- **Z Key**: Rotate piece counter-clockwise
- **P Key**: Pause/Resume game

## How to Run

1. Clone this repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)

No build process or server is required - the game runs directly in the browser.

## Game Rules

- Pieces fall from the top of the board
- Complete a horizontal line to clear it and earn points
- The game speeds up as you level up (every 10 lines cleared)
- Game ends when pieces stack up to the top of the board
- Scoring system:
  - 1 line: 100 × level
  - 2 lines: 300 × level
  - 3 lines: 500 × level
  - 4 lines: 800 × level

## Project Structure

```
/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # CSS styles
├── js/
│   ├── game.js         # Main game logic
│   └── webgl-utils.js  # WebGL utility functions
└── README.md           # This file
```

## Browser Compatibility

This game uses modern web technologies and requires a browser that supports:
- HTML5
- CSS3
- WebGL
- ES6 JavaScript

Most modern browsers (Chrome, Firefox, Safari, Edge) should work fine.

## License

MIT 