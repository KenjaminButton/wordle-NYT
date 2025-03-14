class WordleUI {
    constructor(game) {
        this.game = game;
        this.currentRow = 0;
        this.currentTile = 0;
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');
        this.definitionContainer = document.getElementById('definition-container');
        
        console.log('UI Elements:', {
            board: !!this.board,
            keyboard: !!this.keyboard,
            definitionContainer: !!this.definitionContainer
        });
        
        // Initialize the UI
        if (this.board && this.keyboard && this.definitionContainer) {
            this.setupBoard();
            this.setupKeyboard();
            this.setupEventListeners();
            
            // Show initial definition
            const gameState = this.game.getGameState();
            if (gameState && gameState.targetDefinition) {
                console.log('Initial definition available:', gameState.targetDefinition);
                this.updateDefinition(gameState.targetDefinition);
            }
        } else {
            console.warn('Required DOM elements not found');
        }

        // Listen for word selection events
        window.addEventListener('wordSelected', (event) => {
            console.log('Word selection event received:', event.detail);
            if (event.detail) {
                this.updateDefinition(event.detail.definition);
            }
        });

        // Listen for game end events
        window.addEventListener('wordleGameWon', (event) => {
            if (event.detail) {
                window.alert(`Congratulations! You won in ${event.detail.attempts} attempts!\nWord: ${event.detail.word}\nDefinition: ${event.detail.definition}`);
            }
        });

        window.addEventListener('wordleGameLost', (event) => {
            if (event.detail) {
                window.alert(`Game Over! The word was: ${event.detail.word}\nDefinition: ${event.detail.definition}`);
            }
        });
    }

    setupBoard() {
        if (!this.board) return;
        
        this.board.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const boardRow = document.createElement('div');
            boardRow.className = 'board-row';
            
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                boardRow.appendChild(tile);
            }
            this.board.appendChild(boardRow);
        }
    }

    setupKeyboard() {
        if (!this.keyboard) return;
        
        this.keyboard.innerHTML = '';

        const rows = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'del'],
            ['space']
        ];

        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            row.forEach(key => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = key;
                button.setAttribute('data-key', key);
                button.setAttribute('aria-label', key === 'del' ? 'delete' : key);

                if (key === 'enter' || key === 'del') {
                    button.className = 'return-key';
                }

                rowDiv.appendChild(button);
            });

            this.keyboard.appendChild(rowDiv);
        });
    }

    setupEventListeners() {
        if (!this.keyboard || !this.board) return;

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.isGameOver()) return;
            
            let key = e.key.toLowerCase();
            if (key === 'enter') {
                key = 'enter';
            } else if (key === 'backspace' || key === 'delete') {
                key = 'del';
            } else if (key === ' ') {
                key = 'space';
                e.preventDefault(); // Prevent page scroll
            }
            
            this.handleInput(key);
        });

        // Mouse clicks
        this.keyboard.addEventListener('click', (e) => {
            if (this.isGameOver()) return;
            
            const button = e.target.closest('button');
            if (!button) return;
            
            const key = button.getAttribute('data-key');
            this.handleInput(key);
        });

        // Touch events
        this.keyboard.addEventListener('touchend', (e) => {
            if (this.isGameOver()) return;
            
            const button = e.target.closest('button');
            if (!button) return;
            
            e.preventDefault(); // Prevent double-firing with click event
            const key = button.getAttribute('data-key');
            if (key && this.game && typeof this.game.addLetter === 'function') {
                this.game.addLetter(key);
            }
        }, { passive: false }); // Allow preventDefault

        // Handle screen rotation
        window.addEventListener('resize', () => {
            this.handleScreenRotation();
        });
        this.handleScreenRotation(); // Initial setup
    }

    handleScreenRotation() {
        if (this.keyboard) {
            const isLandscape = window.innerWidth > window.innerHeight;
            this.keyboard.style.maxWidth = isLandscape ? '800px' : '100%'; // Match test expectations
        }
    }

    isGameOver() {
        const state = this.game.getGameState();
        return state && state.gameOver;
    }

    handleInput(key) {
        if (!this.game || !this.board || this.isGameOver()) return;

        if (key === 'enter') {
            const result = this.game.submitGuess();
            if (result) {
                this.updateBoard(result);
                this.updateKeyboardColors(this.game.getGameState().guesses.slice(-1)[0], result);
            }
        } else if (key === 'del') {
            if (this.game.removeLetter()) {
                this.updateCurrentRow();
            }
        } else if (key === 'space') {
            return;
        } else if (/^[a-z]$/.test(key)) {
            if (this.game.addLetter(key)) {
                this.updateCurrentRow();
            }
        }
    }

    updateCurrentRow() {
        if (!this.game || !this.board) return;

        try {
            const state = this.game.getGameState();
            if (!state) return;

            const row = this.board.children[state.currentRow];
            if (!row) return;

            const tiles = row.children;
            const guess = state.currentGuess.padEnd(5);
            
            for (let i = 0; i < 5; i++) {
                if (tiles[i]) {
                    tiles[i].textContent = guess[i].toUpperCase();
                }
            }
        } catch (error) {
            console.error('Error updating current row:', error);
        }
    }

    updateBoard(result) {
        if (!this.game || !this.board || !result) return;

        try {
            const state = this.game.getGameState();
            if (!state) return;

            const row = this.board.children[state.currentRow - 1];
            if (!row) return;

            const guess = state.guesses[state.guesses.length - 1];
            if (!guess) return;

            Array.from(row.children).forEach((tile, i) => {
                tile.textContent = guess[i].toUpperCase();
                tile.classList.remove('correct', 'present', 'absent');
                tile.classList.add(result[i]);
            });
        } catch (error) {
            console.error('Error updating board:', error);
        }
    }

    updateKeyboardColors(guess, result) {
        if (!this.keyboard || !guess || !result) return;

        try {
            guess.split('').forEach((letter, i) => {
                const button = this.keyboard.querySelector(`button[data-key="${letter}"]`);
                if (button) {
                    if (result[i] === 'correct') {
                        button.classList.add('correct');
                    } else if (result[i] === 'present' && !button.classList.contains('correct')) {
                        button.classList.add('present');
                    } else if (!button.classList.contains('correct') && !button.classList.contains('present')) {
                        button.classList.add('absent');
                    }
                }
            });
        } catch (error) {
            console.error('Error updating keyboard colors:', error);
        }
    }

    updateDefinition(definition) {
        console.log('Updating definition:', definition);
        if (this.definitionContainer) {
            if (definition) {
                this.definitionContainer.textContent = `Hint: ${definition}`;
                this.definitionContainer.style.display = 'block';
                console.log('Definition updated successfully');
            } else {
                this.definitionContainer.textContent = '';
                this.definitionContainer.style.display = 'none';
                console.log('Definition hidden - no definition available');
            }
        } else {
            console.warn('Could not update definition: container not found');
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordleUI;
} else if (typeof window !== 'undefined') {
    window.WordleUI = WordleUI;
}
