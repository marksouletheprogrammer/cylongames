# Dynamitris

The purpose of this project is to create a tetris-like game with HTML5 and WebGL using AI tools. I am not a front end developer or a game developer nor do I have interest in learning to be either so I have little ability to validate what the AI is doing.

I am using Cursor IDE with Claude 3.7 agent. All code was written by the agent. No code was touched by a human. The following are the prompts and observations I made while doing this.

### Prompt 1

```
Implement a game as an HTML5 game with WebGL, CSS3, and javascript. The game should be lauchable with a local browser. On launch the game should be a simple, but elegant webpage with the game in the middle. For now the gameplay can be a button that increases a counter. The project is empty so add whatever project setup is required for the project to work.
```

#### Human observations

- It took about 5 minutes for cursor to write the code.
- The game was visually more impressive than I expected. It even had confetti when I click the button.
- The copyright year reads 2023, instead of 2025.

---
### Prompt 2

```
Implement a game similar to tetris in this project, which replaces the counter game and uses the same project setup.
Goal: Be able to play a game similar to tetris in the browser.
Acceptance Criteria:
- The game follows the standard tetris ruleset.
- The player can play with arrow keys, z key, and x key.
- The player does not need to be able to save pieces.
- The player should be able to pause the game at any time.
- The player should be able to restart the game when they lose.
Scenarios:
Scenario 1: Starting game
When the user opens the webpage, they should be greeted with a button to start the game.
When the user starts the game, they should see the game board with the current score in the corner.
Scenario 2: Playing game
As the user plays, the current score should be updated per standard tetris scoring rules.
If the blocks reach the top of the play board, the game ends.
Given the user wants to pause the game, they game board should freeze.
Given the user wants to unpause the game, the game should resume exactly where it was.
Scenario 3: Game over
When the game ends, the user should see their final score.
When the game ends, the user should have an option to restard the game.
Scenario 4: Restarting game
Given the user decides to restart a game, the board should reset like it is a new game and score should reset to 0.
```

#### Human observations

- It took cursor about 5 minutes to write this.
- On initial load it looks as I expected. It even had a control legend, which is nice.
- The tetris pieces were regutangular, which is disorienting.
- The score overlapped the play board, which is not desired. However, I did not specify where it should appear.
- It showed the next piece, which I did not ask for. However, the next piece feature is buggy and rarely showed the correct piece.
- Otherwise the game plays exactly as you would expect. The game ends as expected. And I can restart the game as expected. Pause and resume work as expected.

---
### Prompt 3

```
Iterate on the tetris game. We will make improvements to the game's look and feel. 
Goal: The tetris game should look and feel really great.
Acceptance Criteria:
- Every tetris piece is made up of 4 perfect squares.
- The player can distinguish individual squares that make up every tetris piece.
- There should be a UI column to the right of the main play area showing everything that is not the main game board.
- The up arrow key will not rotate pieces, or do anything at all.
- The player can see the next 2 tetris pieces that will fall.
Scenarios:
Scenario 1: Visualizing score, pause button, and next pieces.
The main play area should be clear of any UI elements except for the tetris pieces themselves.
When the player wants to see the score, they will have to look just to the right of the main play area.
When the player wants to see the next tetris piece, or the piece after it, they will have to look just to the right of the main play area.
Scenario 2: Visualizing the main play area.
The player should be able to distinguish individual squares of the tetris pieces.
The player should be able to distinguish the individual squares of empty board spaces.
The player should be able to clear distinguish the edges of the main play area.
Scenario 3: Visualizing the next 2 pieces.
When they player wants to see the next 2 pieces that will fall, they should look to the right of the main play area.
The next tetris piece that will fall, and the one that will fall after that, should be shown in order.
The next tetris pieces should appear exactly as they will when the fall into the main play area.
```

#### Human observations

- Cursor aborted in making the changes to games.js twice. Each time I asked it to try again and it got it on the 3rd try. Cursor nor the agent explained why it aborted. That is a bit of a troubleshooting issue, though I might just be ignorant of how to troubleshoot the agent.
- It probably took about 10 minutes with abort time.
- The final result was a big visual improvement. All visual changes I requested were present.
- The next piece feature still does not work. It is broken in exactly the same was it was in the last iteration, it just looks better now. I wonder if it because I never really specified the next piece feature in detail, the way that I did with other features in the game. I sort of talked around it.

---
### Prompt 4

```
Implement a new feature in the tetris game that does not exist in any other version of tetris. We will rename the game "Dynamitris" in respect for the feature that we will add.
Goal: Add the ability for squares to explode when a special dynamite sqaure is cleared.
Acceptance criteria:
- About 5% of tetris pieces should be composed of 4 dynamite squares, instead of normal squares.
- The dynamite squares explode when they are cleared. Destroying all sqaures in a 1 block radius.
- The dynamite squares should look explosive to the player.
- Dynamite explosions should appear to happen in a chain reaction.
Scenarios:
Scenario 1: Randomly appearing dynamite pieces.
Dynamite tetris pieces should appear about 5% of the time.
Each dynamite tetris piece is composed to 4 squares, each square looks like a dynamite.
The player should easily be able to tell that those squares are explosive, from visuals alone.
Senario 2: Dynamite is cleared
Whenever a dynamite is cleared by the player, it explodes.
An exploding dynamite square clears all squares adjacent to it, in a 1 square radius.
Scenario 3: Dynamite is cleared by another dynamite.
When a dynamite explodes, it may destroy another dynamite square, which should result in the affected dynamite exploding.
When an affected dynamite explodes, it too will destroy all squares around it in a 1 square radius.
Scenario 4: Clearing exploded squares.
When a line is cleared by the player, all affected squared should be cleared from the board. 
If a dynamite is exploded by a line or tetris clear, it clears the exploded squares AFTER the line has cleared from the board.
Any dynamite that is exploded by other dynamite, should clear the affected squares AFTER the last explosion clears squares from the board.
```

#### Human observations

- Again the agent aborted while making changes to game.js. I asked why it aborted and it said: " apologize for the aborted function call. It seems there might be an issue with the edit_file function for the game.js file, possibly due to its size. Let's try a different approach by breaking down the changes into smaller parts.".
- I just realized that I have the option to review each changes like in a standard code review tool.
- The agent eventually figured it out. It took about 10 minutes all together.
- The agent added instructions about exploding pieces, which I did not ask for but is nice! And the instructions are accurate.
- The new instructions caused the screen to scrool when you press down arrow, whoops.
- The exploding blocks however, do not work. Rather than explode when cleared, they explode as soon as they make contact with other squares. So you can just clear the whole board with 1 tetris piece. 
- They dynamite pieces look nice though.
- When the dynamite piece reaches the bottom, the next piece does not fall and the game just stops.

---
# Overall Thoughts

- I am impressed with how well and how fast the agent pumped out a working tetris game.
- I have no clue if it wrote good code. I have no clue if there are any subtle bugs. My only experience with the output is through play testing.
- However, many implementations of tetris exist and the AI likely has this in its training data.
- Prompt 2 and 3 were interesting because the agent added a broken next piece feature, and then left it broken as I asked it to make improvements. I think it is because I talked around the next piece feature. 
- I am not impressed with the result of adding the dynamite mechanic, which is unique to this implementation. 
- The fault is at least partially mine. I asked it to do 2 things at once: 1. Add a new type of tetris piece, 2. add an explosion mechanic, and 3. add a chain reaction mechanic.
- Out of these requests in Prompt 4, it only did #1 correctly. 
- It's also possible that I need to be super specific. I could have included an example of how explosions should work. For example: if a square at (3,3) is cleared, also clear all squares (2,2), (2,3), (3.2), ...
- Next time I will be more careful about only adding 1 novel feature at a time.


---
# The following part of the README was AI generated (for posterity).
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