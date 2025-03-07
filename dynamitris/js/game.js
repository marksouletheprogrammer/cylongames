/**
 * Dynamitris
 * A WebGL implementation of Tetris with explosive dynamite blocks
 */

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const DYNAMITE_CHANCE = 0.05; // 5% chance for dynamite pieces
const DYNAMITE_COLOR = 8; // Index for dynamite color
const COLORS = [
    [0.0, 0.0, 0.0, 0.0], // Empty cell (transparent)
    [1.0, 0.0, 0.0, 1.0], // Red - Z piece
    [0.0, 1.0, 0.0, 1.0], // Green - S piece
    [0.0, 0.0, 1.0, 1.0], // Blue - J piece
    [1.0, 1.0, 0.0, 1.0], // Yellow - O piece
    [1.0, 0.0, 1.0, 1.0], // Magenta - T piece
    [0.0, 1.0, 1.0, 1.0], // Cyan - I piece
    [1.0, 0.5, 0.0, 1.0], // Orange - L piece
    [1.0, 0.8, 0.0, 1.0]  // Gold - Dynamite
];

// Tetromino shapes
const SHAPES = [
    [], // Empty shape for index alignment with colors
    [[0, 0], [0, 1], [1, 0], [1, -1]], // Z shape
    [[0, 0], [0, 1], [-1, 0], [-1, -1]], // S shape
    [[0, 0], [-1, 0], [1, 0], [1, 1]], // J shape
    [[0, 0], [0, 1], [1, 0], [1, 1]], // O shape
    [[0, 0], [-1, 0], [1, 0], [0, -1]], // T shape
    [[0, 0], [-1, 0], [1, 0], [2, 0]], // I shape
    [[0, 0], [-1, 0], [1, 0], [-1, 1]]  // L shape
];

// Game state
const gameState = {
    board: [],
    currentPiece: null,
    nextPiece: null,
    nextPiece2: null, // Second next piece
    score: 0,
    level: 1,
    lines: 0,
    explosions: 0, // Count of dynamite explosions
    pendingExplosions: [], // Coordinates of dynamite blocks to explode
    explosionChain: [], // For tracking chain reactions
    isExploding: false, // Flag to indicate explosion in progress
    gameOver: false,
    paused: false,
    lastTime: 0,
    dropCounter: 0,
    dropInterval: 1000, // Initial drop speed in ms
    currentScreen: 'start' // 'start', 'play', 'paused', 'over'
};

// Shader sources
const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying lowp vec4 vColor;
    
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }
`;

const fragmentShaderSource = `
    varying lowp vec4 vColor;
    
    void main(void) {
        gl_FragColor = vColor;
    }
`;

// Tetromino class
class Tetromino {
    constructor(shape, color, isDynamite = false) {
        this.shape = shape;
        this.color = color;
        this.isDynamite = isDynamite; // Flag to indicate if this is a dynamite piece
        this.x = Math.floor(COLS / 2) - 1;
        this.y = ROWS - 1;
        this.rotation = 0;
    }

    // Get the current rotated shape
    getRotatedShape() {
        const rotated = [];
        for (const [x, y] of this.shape) {
            if (this.rotation === 0) {
                rotated.push([x, y]);
            } else if (this.rotation === 1) {
                rotated.push([y, -x]);
            } else if (this.rotation === 2) {
                rotated.push([-x, -y]);
            } else if (this.rotation === 3) {
                rotated.push([-y, x]);
            }
        }
        return rotated;
    }

    // Get the absolute positions on the board
    getAbsolutePositions() {
        const positions = [];
        for (const [x, y] of this.getRotatedShape()) {
            positions.push([this.x + x, this.y + y]);
        }
        return positions;
    }

    // Rotate the piece
    rotate(direction = 1) {
        const originalRotation = this.rotation;
        this.rotation = (this.rotation + direction) % 4;
        if (this.rotation < 0) this.rotation += 4;

        // Check if rotation is valid
        if (!this.isValid()) {
            // Try wall kicks
            const kicks = [-1, 1, -2, 2];
            let valid = false;
            for (const kick of kicks) {
                this.x += kick;
                if (this.isValid()) {
                    valid = true;
                    break;
                }
                this.x -= kick;
            }

            // If no valid position found, revert rotation
            if (!valid) {
                this.rotation = originalRotation;
            }
        }
    }

    // Move the piece
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        
        // Check if move is valid
        if (!this.isValid()) {
            this.x -= dx;
            this.y -= dy;
            return false;
        }
        return true;
    }

    // Check if the piece is in a valid position
    isValid() {
        for (const [x, y] of this.getAbsolutePositions()) {
            // Check if out of bounds
            if (x < 0 || x >= COLS || y < 0) {
                return false;
            }
            
            // Check if overlapping with existing blocks
            if (y < ROWS && gameState.board[y][x] !== 0) {
                return false;
            }
        }
        return true;
    }

    // Lock the piece in place
    lock() {
        for (const [x, y] of this.getAbsolutePositions()) {
            if (y >= 0 && y < ROWS) {
                // If this is a dynamite piece, use the dynamite color
                gameState.board[y][x] = this.isDynamite ? DYNAMITE_COLOR : this.color;
            }
        }
    }
}

// Initialize the game
function initGame() {
    // Get DOM elements
    const canvas = document.getElementById('game-canvas');
    const nextPieceCanvas1 = document.getElementById('next-piece-canvas-1');
    const nextPieceCanvas2 = document.getElementById('next-piece-canvas-2');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const resumeButton = document.getElementById('resume-button');
    const restartButton = document.getElementById('restart-button');
    
    // Initialize WebGL for main canvas
    const gl = WebGLUtils.initWebGL(canvas);
    if (!gl) {
        console.error("WebGL not supported for main canvas");
        return;
    }
    
    // Initialize WebGL for next piece canvases
    const nextPieceGl1 = WebGLUtils.initWebGL(nextPieceCanvas1);
    if (!nextPieceGl1) {
        console.error("WebGL not supported for next piece canvas 1");
        return;
    }
    
    const nextPieceGl2 = WebGLUtils.initWebGL(nextPieceCanvas2);
    if (!nextPieceGl2) {
        console.error("WebGL not supported for next piece canvas 2");
        return;
    }
    
    // Compile shaders for main canvas
    const vertexShader = WebGLUtils.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = WebGLUtils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create shader program for main canvas
    const shaderProgram = WebGLUtils.createProgram(gl, vertexShader, fragmentShader);
    
    // Get shader program info for main canvas
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
        }
    };
    
    // Compile shaders for next piece canvas 1
    const nextVertexShader1 = WebGLUtils.createShader(nextPieceGl1, nextPieceGl1.VERTEX_SHADER, vertexShaderSource);
    const nextFragmentShader1 = WebGLUtils.createShader(nextPieceGl1, nextPieceGl1.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create shader program for next piece canvas 1
    const nextShaderProgram1 = WebGLUtils.createProgram(nextPieceGl1, nextVertexShader1, nextFragmentShader1);
    
    // Get shader program info for next piece canvas 1
    const nextProgramInfo1 = {
        program: nextShaderProgram1,
        attribLocations: {
            vertexPosition: nextPieceGl1.getAttribLocation(nextShaderProgram1, 'aVertexPosition'),
            vertexColor: nextPieceGl1.getAttribLocation(nextShaderProgram1, 'aVertexColor')
        },
        uniformLocations: {
            projectionMatrix: nextPieceGl1.getUniformLocation(nextShaderProgram1, 'uProjectionMatrix'),
            modelViewMatrix: nextPieceGl1.getUniformLocation(nextShaderProgram1, 'uModelViewMatrix')
        }
    };
    
    // Compile shaders for next piece canvas 2
    const nextVertexShader2 = WebGLUtils.createShader(nextPieceGl2, nextPieceGl2.VERTEX_SHADER, vertexShaderSource);
    const nextFragmentShader2 = WebGLUtils.createShader(nextPieceGl2, nextPieceGl2.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create shader program for next piece canvas 2
    const nextShaderProgram2 = WebGLUtils.createProgram(nextPieceGl2, nextVertexShader2, nextFragmentShader2);
    
    // Get shader program info for next piece canvas 2
    const nextProgramInfo2 = {
        program: nextShaderProgram2,
        attribLocations: {
            vertexPosition: nextPieceGl2.getAttribLocation(nextShaderProgram2, 'aVertexPosition'),
            vertexColor: nextPieceGl2.getAttribLocation(nextShaderProgram2, 'aVertexColor')
        },
        uniformLocations: {
            projectionMatrix: nextPieceGl2.getUniformLocation(nextShaderProgram2, 'uProjectionMatrix'),
            modelViewMatrix: nextPieceGl2.getUniformLocation(nextShaderProgram2, 'uModelViewMatrix')
        }
    };
    
    // Create buffers
    const buffers = initBuffers(gl);
    const nextPieceBuffers1 = initBuffers(nextPieceGl1);
    const nextPieceBuffers2 = initBuffers(nextPieceGl2);
    
    // Initialize game board
    resetGame();
    
    // Add event listeners for buttons
    startButton.addEventListener('click', () => {
        showScreen('play');
        gameState.paused = false;
        if (!gameState.currentPiece) {
            spawnPiece();
        }
    });
    
    pauseButton.addEventListener('click', () => {
        gameState.paused = true;
        showScreen('paused');
    });
    
    resumeButton.addEventListener('click', () => {
        gameState.paused = false;
        showScreen('play');
    });
    
    restartButton.addEventListener('click', () => {
        resetGame();
        showScreen('play');
    });
    
    // Add keyboard event listeners
    document.addEventListener('keydown', (e) => {
        if (gameState.currentScreen !== 'play' || gameState.paused || gameState.gameOver) {
            // Allow 'p' key to toggle pause even when paused
            if (e.key === 'p' && !gameState.gameOver && gameState.currentScreen !== 'start') {
                if (gameState.paused) {
                    gameState.paused = false;
                    showScreen('play');
                } else {
                    gameState.paused = true;
                    showScreen('paused');
                }
            }
            return;
        }
        
        switch (e.key) {
            case 'ArrowLeft':
                if (gameState.currentPiece) {
                    gameState.currentPiece.move(-1, 0);
                }
                break;
            case 'ArrowRight':
                if (gameState.currentPiece) {
                    gameState.currentPiece.move(1, 0);
                }
                break;
            case 'ArrowDown':
                if (gameState.currentPiece) {
                    gameState.currentPiece.move(0, -1);
                }
                break;
            // Removed ArrowUp case to disable up arrow key
            case 'x':
                if (gameState.currentPiece) {
                    gameState.currentPiece.rotate(1); // Clockwise
                }
                break;
            case 'z':
                if (gameState.currentPiece) {
                    gameState.currentPiece.rotate(-1); // Counter-clockwise
                }
                break;
            case 'p':
                gameState.paused = true;
                showScreen('paused');
                break;
        }
    });
    
    // Start the render loop
    requestAnimationFrame((timestamp) => {
        gameState.lastTime = timestamp;
        render(gl, programInfo, buffers, 
               nextPieceGl1, nextProgramInfo1, nextPieceBuffers1,
               nextPieceGl2, nextProgramInfo2, nextPieceBuffers2,
               timestamp);
    });
}

// Reset the game state
function resetGame() {
    // Initialize empty board
    gameState.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    gameState.currentPiece = null;
    gameState.nextPiece = null;
    gameState.nextPiece2 = null;
    gameState.score = 0;
    gameState.level = 1;
    gameState.lines = 0;
    gameState.explosions = 0;
    gameState.pendingExplosions = [];
    gameState.explosionChain = [];
    gameState.isExploding = false;
    gameState.gameOver = false;
    gameState.paused = false;
    gameState.dropCounter = 0;
    gameState.dropInterval = 1000; // Initial drop speed in ms
    
    // Update UI
    document.getElementById('score-display').textContent = '0';
    document.getElementById('level-display').textContent = '1';
    document.getElementById('lines-display').textContent = '0';
    document.getElementById('explosions-display').textContent = '0';
    document.getElementById('final-score-display').textContent = '0';
    document.getElementById('final-explosions-display').textContent = '0';
    
    // Generate first pieces
    spawnPiece();
}

// Show a specific screen
function showScreen(screen) {
    // Hide all screens
    document.getElementById('game-start').classList.add('hidden');
    document.getElementById('game-paused').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    
    // Show the requested screen
    if (screen !== 'play') {
        document.getElementById(`game-${screen}`).classList.remove('hidden');
    }
    
    // Update current screen
    gameState.currentScreen = screen;
}

// Spawn a new piece
function spawnPiece() {
    // If there's a next piece, make it the current piece
    if (gameState.nextPiece) {
        gameState.currentPiece = gameState.nextPiece;
        gameState.nextPiece = gameState.nextPiece2;
    } else {
        // Generate a random piece for the first time
        const shapeIndex = Math.floor(Math.random() * 7) + 1;
        const isDynamite = Math.random() < DYNAMITE_CHANCE;
        gameState.currentPiece = new Tetromino(SHAPES[shapeIndex], shapeIndex, isDynamite);
        
        // Generate the first next piece
        const nextShapeIndex = Math.floor(Math.random() * 7) + 1;
        const nextIsDynamite = Math.random() < DYNAMITE_CHANCE;
        gameState.nextPiece = new Tetromino(SHAPES[nextShapeIndex], nextShapeIndex, nextIsDynamite);
    }
    
    // Generate a new next piece (for the second preview)
    const nextShapeIndex2 = Math.floor(Math.random() * 7) + 1;
    const nextIsDynamite2 = Math.random() < DYNAMITE_CHANCE;
    gameState.nextPiece2 = new Tetromino(SHAPES[nextShapeIndex2], nextShapeIndex2, nextIsDynamite2);
    
    // Check if game is over (can't place new piece)
    if (!gameState.currentPiece.isValid()) {
        gameState.gameOver = true;
        document.getElementById('final-score-display').textContent = gameState.score;
        document.getElementById('final-explosions-display').textContent = gameState.explosions;
        showScreen('over');
    }
}

// Check for completed lines and clear them
function checkLines() {
    let linesCleared = 0;
    let dynamiteExploded = false;
    let explodedPositions = [];
    
    // First, check for completed lines
    for (let y = 0; y < ROWS; y++) {
        // Check if line is full
        if (gameState.board[y].every(cell => cell !== 0)) {
            // Check for dynamite in this line before removing it
            for (let x = 0; x < COLS; x++) {
                if (gameState.board[y][x] === DYNAMITE_COLOR) {
                    // Add to pending explosions
                    gameState.pendingExplosions.push([x, y]);
                    dynamiteExploded = true;
                }
            }
            
            // Remove the line
            gameState.board.splice(y, 1);
            // Add empty line at the top
            gameState.board.push(Array(COLS).fill(0));
            // Adjust y to check the same line again (since lines shifted down)
            y--;
            linesCleared++;
        }
    }
    
    // Update score and level if lines were cleared
    if (linesCleared > 0) {
        // Scoring: 100 * level for 1 line, 300 * level for 2 lines, 500 * level for 3 lines, 800 * level for 4 lines
        const points = [0, 100, 300, 500, 800][linesCleared] * gameState.level;
        gameState.score += points;
        gameState.lines += linesCleared;
        
        // Level up every 10 lines
        const newLevel = Math.floor(gameState.lines / 10) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            // Increase speed with level
            gameState.dropInterval = Math.max(100, 1000 - (gameState.level - 1) * 100);
        }
        
        // Update UI
        document.getElementById('score-display').textContent = gameState.score;
        document.getElementById('level-display').textContent = gameState.level;
        document.getElementById('lines-display').textContent = gameState.lines;
    }
    
    // Process explosions if any dynamite was in cleared lines
    if (dynamiteExploded) {
        processExplosions();
        return true;
    }
    
    return false;
}

// Process explosions of dynamite blocks
function processExplosions() {
    if (gameState.pendingExplosions.length === 0) {
        gameState.isExploding = false;
        return;
    }
    
    gameState.isExploding = true;
    const newExplosions = [];
    
    // Process each pending explosion
    while (gameState.pendingExplosions.length > 0) {
        const [x, y] = gameState.pendingExplosions.shift();
        
        // Skip if this position is already empty
        if (y < 0 || y >= ROWS || x < 0 || x >= COLS || gameState.board[y][x] === 0) {
            continue;
        }
        
        // Create visual explosion effect
        createExplosionEffect(x, y);
        
        // Increment explosion counter
        gameState.explosions++;
        document.getElementById('explosions-display').textContent = gameState.explosions;
        
        // Clear blocks in a 1-block radius (3x3 grid centered on the dynamite)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                
                // Check if position is valid
                if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
                    // Check if there's another dynamite in the radius
                    if (gameState.board[newY][newX] === DYNAMITE_COLOR) {
                        // Add to new explosions if not already exploded
                        if (!isPositionInList([newX, newY], gameState.explosionChain)) {
                            newExplosions.push([newX, newY]);
                        }
                    }
                    
                    // Clear the block
                    gameState.board[newY][newX] = 0;
                }
            }
        }
    }
    
    // Add new explosions to the chain
    gameState.explosionChain = gameState.explosionChain.concat(newExplosions);
    
    // If there are new explosions from chain reaction, process them after a delay
    if (newExplosions.length > 0) {
        gameState.pendingExplosions = newExplosions;
        setTimeout(processExplosions, 200); // Delay for visual effect
    } else {
        // No more explosions, reset chain
        gameState.explosionChain = [];
        gameState.isExploding = false;
        
        // Check for floating blocks after explosions
        handleFloatingBlocks();
    }
}

// Create visual explosion effect
function createExplosionEffect(x, y) {
    const gameContainer = document.getElementById('game-container');
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    
    // Position the explosion
    explosion.style.left = (x * BLOCK_SIZE) + 'px';
    explosion.style.top = ((ROWS - 1 - y) * BLOCK_SIZE) + 'px';
    
    // Add to container
    gameContainer.appendChild(explosion);
    
    // Remove after animation completes
    setTimeout(() => {
        explosion.remove();
    }, 500);
}

// Handle floating blocks after explosions
function handleFloatingBlocks() {
    let moved = false;
    
    // Start from the bottom row and move up
    for (let y = 0; y < ROWS - 1; y++) {
        for (let x = 0; x < COLS; x++) {
            // If there's a block and empty space below it
            if (gameState.board[y][x] !== 0 && y > 0 && gameState.board[y-1][x] === 0) {
                // Move the block down
                gameState.board[y-1][x] = gameState.board[y][x];
                gameState.board[y][x] = 0;
                moved = true;
            }
        }
    }
    
    // If blocks were moved, check again
    if (moved) {
        setTimeout(handleFloatingBlocks, 100);
    }
}

// Helper function to check if a position is in a list
function isPositionInList(position, list) {
    return list.some(item => item[0] === position[0] && item[1] === position[1]);
}

// Initialize buffers for WebGL
function initBuffers(gl) {
    // Create a buffer for positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Create a buffer for colors
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    
    return {
        position: positionBuffer,
        color: colorBuffer
    };
}

// Update game state
function update(deltaTime) {
    if (gameState.gameOver || gameState.paused || gameState.currentScreen !== 'play') {
        return;
    }
    
    // Don't update if explosions are in progress
    if (gameState.isExploding) {
        return;
    }
    
    // Update drop counter
    gameState.dropCounter += deltaTime;
    
    // Move piece down if enough time has passed
    if (gameState.dropCounter > gameState.dropInterval) {
        gameState.dropCounter = 0;
        
        // Try to move down
        if (gameState.currentPiece && !gameState.currentPiece.move(0, -1)) {
            // If can't move down, lock the piece
            gameState.currentPiece.lock();
            
            // Check for dynamite in the piece that was just locked
            if (gameState.currentPiece.isDynamite) {
                // Add all positions to pending explosions
                for (const [x, y] of gameState.currentPiece.getAbsolutePositions()) {
                    if (y >= 0 && y < ROWS) {
                        gameState.pendingExplosions.push([x, y]);
                    }
                }
                // Process explosions immediately
                processExplosions();
            } else {
                // Check for completed lines
                const hasExplosions = checkLines();
                
                // Only spawn a new piece if no explosions are happening
                if (!hasExplosions) {
                    spawnPiece();
                } else {
                    // Wait for explosions to finish before spawning new piece
                    const checkExploding = setInterval(() => {
                        if (!gameState.isExploding) {
                            clearInterval(checkExploding);
                            spawnPiece();
                        }
                    }, 100);
                }
            }
        }
    }
}

// Render the game board
function renderBoard(gl, programInfo, buffers) {
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use the shader program
    gl.useProgram(programInfo.program);
    
    // Set up projection matrix (orthographic projection)
    const projectionMatrix = [
        2 / COLS, 0, 0, 0,
        0, 2 / ROWS, 0, 0,
        0, 0, 1, 0,
        -1, -1, 0, 1
    ];
    
    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );
    
    // Render the board grid
    renderGrid(gl, programInfo, buffers);
    
    // Render the board
    renderBlocks(gl, programInfo, buffers, gameState.board);
    
    // Render the current piece
    if (gameState.currentPiece && !gameState.gameOver) {
        renderPiece(gl, programInfo, buffers, gameState.currentPiece);
    }
}

// Render the grid
function renderGrid(gl, programInfo, buffers) {
    // Grid is already drawn with CSS background, but we could add additional grid rendering here if needed
}

// Render a next piece preview
function renderNextPiece(gl, programInfo, buffers, piece) {
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (!piece) return;
    
    // Use the shader program
    gl.useProgram(programInfo.program);
    
    // Set up projection matrix (orthographic projection)
    const projectionMatrix = [
        0.5, 0, 0, 0,
        0, 0.5, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    
    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );
    
    // Create a centered piece
    const previewPiece = new Tetromino(piece.shape, piece.color, piece.isDynamite);
    previewPiece.x = 1;
    previewPiece.y = 2;
    
    // Render the next piece
    renderPiece(gl, programInfo, buffers, previewPiece);
}

// Render blocks on the board
function renderBlocks(gl, programInfo, buffers, board) {
    const positions = [];
    const colors = [];
    
    // Add each block to the buffers
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const color = board[y][x];
            if (color !== 0) {
                // Add block vertices
                const isDynamite = color === DYNAMITE_COLOR;
                addBlockVertices(positions, colors, x, y, COLORS[color], isDynamite);
            }
        }
    }
    
    // Update buffers and draw
    updateBuffers(gl, programInfo, buffers, positions, colors);
}

// Render a piece
function renderPiece(gl, programInfo, buffers, piece) {
    const positions = [];
    const colors = [];
    
    // Add each block of the piece to the buffers
    for (const [x, y] of piece.getAbsolutePositions()) {
        if (y >= 0 && y < ROWS) {
            // Use dynamite color if it's a dynamite piece
            const color = piece.isDynamite ? COLORS[DYNAMITE_COLOR] : COLORS[piece.color];
            addBlockVertices(positions, colors, x, y, color, piece.isDynamite);
        }
    }
    
    // Update buffers and draw
    updateBuffers(gl, programInfo, buffers, positions, colors);
}

// Add vertices for a block at (x, y) with the given color
function addBlockVertices(positions, colors, x, y, color, isDynamite = false) {
    // Adjust vertices for dynamite blocks to make them look special
    const margin = isDynamite ? 0.1 : 0.05; // Larger margin for dynamite blocks
    
    // Block vertices (2 triangles forming a square)
    const vertices = [
        // First triangle
        x + margin, y + margin,
        x + (1 - margin), y + margin,
        x + margin, y + (1 - margin),
        // Second triangle
        x + (1 - margin), y + margin,
        x + (1 - margin), y + (1 - margin),
        x + margin, y + (1 - margin)
    ];
    
    // Add vertices to positions array
    for (let i = 0; i < vertices.length; i++) {
        positions.push(vertices[i]);
    }
    
    // Add colors for each vertex
    for (let i = 0; i < 6; i++) {
        colors.push(...color);
    }
    
    // For dynamite blocks, add a special pattern
    if (isDynamite) {
        // Add a cross pattern inside the block
        const crossVertices = [
            // Horizontal line
            x + 0.2, y + 0.5,
            x + 0.8, y + 0.5,
            x + 0.2, y + 0.55,
            
            x + 0.8, y + 0.5,
            x + 0.8, y + 0.55,
            x + 0.2, y + 0.55,
            
            // Vertical line
            x + 0.5, y + 0.2,
            x + 0.55, y + 0.2,
            x + 0.5, y + 0.8,
            
            x + 0.55, y + 0.2,
            x + 0.55, y + 0.8,
            x + 0.5, y + 0.8
        ];
        
        // Add cross vertices to positions array
        for (let i = 0; i < crossVertices.length; i++) {
            positions.push(crossVertices[i]);
        }
        
        // Add colors for cross (red)
        const crossColor = [0.8, 0.0, 0.0, 1.0];
        for (let i = 0; i < 12; i++) {
            colors.push(...crossColor);
        }
    }
}

// Update buffers and draw
function updateBuffers(gl, programInfo, buffers, positions, colors) {
    if (positions.length === 0) return;
    
    // Update position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2, // numComponents
        gl.FLOAT, // type
        false, // normalize
        0, // stride
        0 // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    
    // Update color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4, // numComponents
        gl.FLOAT, // type
        false, // normalize
        0, // stride
        0 // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    
    // Set model view matrix (identity)
    const modelViewMatrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );
    
    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
}

// Main render function
function render(gl, programInfo, buffers, 
                nextPieceGl1, nextProgramInfo1, nextPieceBuffers1,
                nextPieceGl2, nextProgramInfo2, nextPieceBuffers2,
                timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    
    // Resize canvases if needed
    WebGLUtils.resizeCanvasToDisplaySize(gl.canvas);
    WebGLUtils.resizeCanvasToDisplaySize(nextPieceGl1.canvas);
    WebGLUtils.resizeCanvasToDisplaySize(nextPieceGl2.canvas);
    
    // Set viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    nextPieceGl1.viewport(0, 0, nextPieceGl1.canvas.width, nextPieceGl1.canvas.height);
    nextPieceGl2.viewport(0, 0, nextPieceGl2.canvas.width, nextPieceGl2.canvas.height);
    
    // Update game state
    update(deltaTime);
    
    // Render the game board
    renderBoard(gl, programInfo, buffers);
    
    // Render the next piece previews
    renderNextPiece(nextPieceGl1, nextProgramInfo1, nextPieceBuffers1, gameState.nextPiece);
    renderNextPiece(nextPieceGl2, nextProgramInfo2, nextPieceBuffers2, gameState.nextPiece2);
    
    // Request the next frame
    requestAnimationFrame((timestamp) => {
        render(gl, programInfo, buffers, 
               nextPieceGl1, nextProgramInfo1, nextPieceBuffers1,
               nextPieceGl2, nextProgramInfo2, nextPieceBuffers2,
               timestamp);
    });
}

// Initialize the game when the page loads
window.onload = initGame; 