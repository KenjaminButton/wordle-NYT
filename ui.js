/**
 * WordleUI Class
 * Handles the user interface for the Wordle game, including:
 * - Game board setup and updates
 * - Keyboard layout with specific key widths:
 *   - Return key: 110px
 *   - Space key: 220px
 *   - Functional backspace (⌫)
 *   - Disabled special keys (▲, 123, ☺)
 * - Input handling (keyboard and mouse)
 * - Visual feedback (colors and animations)
 */
class WordleUI {
    /**
     * Initialize the UI with game logic
     * @param {WordleGame} game - Instance of WordleGame for game logic
     */
    constructor(game) {
        this.game = game;
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');
        this.definitionContainer = document.getElementById('definition-container');

        // Verify required DOM elements
        const elements = {
            board: !!this.board,
            keyboard: !!this.keyboard,
            definitionContainer: !!this.definitionContainer
        };
        this.log('UI Elements:', elements);

        if (this.board && this.keyboard && this.definitionContainer) {
            // Set up game board and keyboard
            this.setupBoard();
            this.setupKeyboard();
            
            // Initialize definition display
            const gameState = this.game.getGameState();
            if (gameState && gameState.targetDefinition) {
                this.log('Initial definition available:', gameState.targetDefinition);
                this.updateDefinition(gameState.targetDefinition);
            }

            // Set up event listeners
            this.setupEventListeners();
        } else {
            console.warn('Required DOM elements not found');
        }
    }

    /**
     * Create the game board with rows and tiles
     */
    setupBoard() {
        if (!this.board) return;

        this.board.innerHTML = '';

        for (let i = 0; i < this.game.MAX_ATTEMPTS; i++) {
            const row = document.createElement('div');
            row.className = 'board-row';
            
            for (let j = 0; j < this.game.WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                row.appendChild(tile);
            }
            
            this.board.appendChild(row);
        }
    }

    /**
     * Create the keyboard layout with specific key specifications
     * - Top row: Q-P
     * - Middle row: A-L
     * - Bottom row: ▲ Z-M ⌫
     * - Special row: 123 ☺ space return
     */
    setupKeyboard() {
        if (!this.keyboard) return;

        this.keyboard.innerHTML = '';
        
        // Add keyboard styles
        const style = document.createElement('style');
        style.textContent = `
            .return-key { width: 110px !important; }
            .space-key { width: 220px !important; }
            .arrow-key { width: auto; }
            button[disabled] { opacity: 0.5; cursor: not-allowed; }
        `;
        document.head.appendChild(style);

        const rows = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['▲', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
            ['123', '☺', 'space', 'return']
        ];

        rows.forEach((row, rowIndex) => {
            const keyboardRow = document.createElement('div');
            keyboardRow.className = 'keyboard-row';

            row.forEach(key => {
                const button = document.createElement('button');
                button.textContent = key;
                button.setAttribute('data-key', key);
                button.setAttribute('aria-label', key);

                // Apply specific key styles and states
                if (key === 'return') {
                    button.className = 'return-key';  // 110px width
                } else if (key === 'space') {
                    button.className = 'space-key';   // 220px width
                } else if (key === '⌫' || key === '▲') {
                    button.className = 'arrow-key';   // Arrow key styling
                }

                // Disable special keys
                if (['▲', '123', '☺'].includes(key)) {
                    button.disabled = true;
                }

                keyboardRow.appendChild(button);
            });

            this.keyboard.appendChild(keyboardRow);
        });
    }

    /**
     * Set up event listeners for keyboard input and game events
     */
    setupEventListeners() {
        if (!this.keyboard || !this.board) return;

        // Physical keyboard input
        document.addEventListener('keydown', (e) => {
            if (this.isGameOver()) return;

            const key = e.key.toLowerCase();
            if (key === 'enter') {
                this.handleInput('return');
            } else if (key === 'backspace') {
                this.handleInput('⌫');
            } else if (key === ' ') {
                e.preventDefault(); // Prevent page scroll
                return; // Space key is disabled
            } else if (key.length === 1 && key >= 'a' && key <= 'z') {
                this.handleInput(key);
            }
        });

        // Mouse clicks
        this.keyboard.addEventListener('click', (e) => {
            if (this.isGameOver()) return;

            const button = e.target.closest('button');
            if (!button || button.disabled) return; // Don't handle disabled keys

            const key = button.getAttribute('data-key');
            if (key === 'space') return; // Space key is disabled
            if (key) this.handleInput(key);
        });

        // Touch events
        let touchMoved = false;
        
        this.keyboard.addEventListener('touchstart', () => {
            touchMoved = false;
        }, { passive: true });

        this.keyboard.addEventListener('touchmove', () => {
            touchMoved = true;
        }, { passive: true });

        this.keyboard.addEventListener('touchend', (e) => {
            if (this.isGameOver() || touchMoved) return;

            const button = e.target.closest('button');
            if (!button || button.disabled) return; // Don't handle disabled keys

            const key = button.getAttribute('data-key');
            if (key === 'space') return; // Space key is disabled
            if (key) {
                e.preventDefault();
                this.handleInput(key);
            }
        }, { passive: false });

        // Word selection event
        window.addEventListener('wordSelected', (e) => {
            this.log('Word selection event received:', e.detail);
            if (e.detail && e.detail.definition) {
                this.updateDefinition(e.detail.definition);
            } else {
                this.hideDefinition();
            }
        });

        // Game end events
        window.addEventListener('wordleGameWon', (e) => {
            if (e.detail) {
                window.alert(`Congratulations! You won in ${e.detail.attempts} attempts!\nWord: ${e.detail.word}\nDefinition: ${e.detail.definition}`);
            }
        });

        window.addEventListener('wordleGameLost', (e) => {
            if (e.detail) {
                window.alert(`Game Over! The word was: ${e.detail.word}\nDefinition: ${e.detail.definition}`);
            }
        });

        // Handle screen rotation
        window.addEventListener('resize', () => {
            this.handleScreenRotation();
        });
        this.handleScreenRotation();
    }

    /**
     * Handle user input from both keyboard and mouse
     * @param {string} key - The key that was pressed
     */
    handleInput(key) {
        if (!this.game || !this.board || this.isGameOver()) return;

        if (key === 'return') {
            const currentGuess = this.game.currentGuess; // Store current guess before submitting
            const result = this.game.submitGuess();
            if (result) {
                this.updateBoard(result, currentGuess); // Pass the stored guess
                this.updateKeyboard(result, currentGuess);
            }
        } else if (key === '⌫') {
            if (this.game.removeLetter()) {
                this.updateCurrentRow();
            }
        } else if (key === 'space') {
            return; // Space key is disabled
        } else if (key.length === 1 && key >= 'a' && key <= 'z') {
            if (this.game.addLetter(key)) {
                this.updateCurrentRow();
            }
        }
    }

    /**
     * Update the current row with the latest guess
     */
    updateCurrentRow() {
        if (!this.game || !this.board) return;

        const state = this.game.getGameState();
        if (!state) return;

        const row = this.board.children[state.currentRow];
        if (!row) return;

        const tiles = row.children;
        const guess = state.currentGuess;

        for (let i = 0; i < this.game.WORD_LENGTH; i++) {
            if (tiles[i]) {
                tiles[i].textContent = guess[i] || '';
            }
        }
    }

    /**
     * Update the board with color feedback after a guess
     * @param {Array} result - Array of tile states (correct/present/absent)
     * @param {string} guess - The guessed word
     */
    updateBoard(result, guess) {
        if (!this.game || !this.board || !result || !guess) return;

        const state = this.game.getGameState();
        if (!state) return;

        const row = this.board.children[state.currentRow - 1];
        if (!row) return;

        const tiles = row.children;

        for (let i = 0; i < this.game.WORD_LENGTH; i++) {
            if (tiles[i]) {
                tiles[i].textContent = guess[i];
                tiles[i].classList.remove('correct', 'present', 'absent');
                tiles[i].classList.add(result[i]);
            }
        }
    }

    /**
     * Update keyboard colors based on guess feedback
     * @param {Array} result - Array of tile states
     * @param {string} guess - The guessed word
     */
    updateKeyboard(result, guess) {
        if (!this.keyboard || !guess || !result) return;

        for (let i = 0; i < result.length; i++) {
            const key = guess[i];
            const button = this.keyboard.querySelector(`button[data-key="${key}"]`);
            if (button && !button.disabled) { // Don't update disabled keys
                if (result[i] === 'correct' || 
                    (result[i] === 'present' && !button.classList.contains('correct')) ||
                    (result[i] === 'absent' && !button.classList.contains('correct') && !button.classList.contains('present'))) {
                    button.classList.remove('correct', 'present', 'absent');
                    button.classList.add(result[i]);
                }
            }
        }
    }

    /**
     * Update the definition display
     * @param {string} definition - Word definition to display
     */
    updateDefinition(definition) {
        this.log('Updating definition:', definition);
        if (this.definitionContainer) {
            this.definitionContainer.textContent = `Hint: ${definition}`;
            this.definitionContainer.style.display = 'block';
            this.log('Definition updated successfully');
        }
    }

    /**
     * Hide the definition container
     */
    hideDefinition() {
        if (this.definitionContainer) {
            this.definitionContainer.style.display = 'none';
        }
    }

    /**
     * Check if the game is over
     * @returns {boolean} True if the game is over
     */
    isGameOver() {
        const state = this.game.getGameState();
        return state && state.gameOver;
    }

    /**
     * Handle screen rotation
     */
    handleScreenRotation() {
        if (this.keyboard) {
            const isLandscape = window.innerWidth > window.innerHeight;
            this.keyboard.style.maxWidth = isLandscape ? '800px' : '100%';
        }
    }

    /**
     * Utility function for logging
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    log(message, data) {
        if (data !== undefined) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordleUI;
} else if (typeof window !== 'undefined') {
    window.WordleUI = WordleUI;
}
