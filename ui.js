class WordleUI {
    constructor(game) {
        this.game = game;
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');
        this.targetWordDisplay = document.getElementById('target-word');
        
        this.createBoard();
        this.setupKeyboardListeners();
    }

    createBoard() {
        for (let i = 0; i < this.game.MAX_ATTEMPTS; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < this.game.WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                row.appendChild(tile);
            }
            this.board.appendChild(row);
        }
    }

    setupKeyboardListeners() {
        // Physical keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleInput('Enter');
            } else if (e.key === 'Backspace') {
                this.handleInput('Backspace');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                this.handleInput(e.key);
            }
        });

        // On-screen keyboard
        this.keyboard.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            this.handleInput(button.textContent);
        });
    }

    handleInput(key) {
        if (key === 'Enter') {
            const result = this.game.submitGuess();
            if (result) {
                this.updateBoard(result);
                this.checkGameEnd();
            }
        } else if (key === 'Backspace' || key === '⌫') {
            if (this.game.removeLetter()) {
                this.updateCurrentRow();
            }
        } else if (this.game.addLetter(key)) {
            this.updateCurrentRow();
        }
    }

    updateCurrentRow() {
        const state = this.game.getGameState();
        const tiles = this.board.children[state.currentRow].children;
        const guess = state.currentGuess.padEnd(this.game.WORD_LENGTH);
        
        for (let i = 0; i < this.game.WORD_LENGTH; i++) {
            tiles[i].textContent = guess[i].toUpperCase();
        }
    }

    updateBoard(result) {
        const state = this.game.getGameState();
        const row = this.board.children[state.currentRow - 1];
        const tiles = Array.from(row.children);
        const guess = state.guesses[state.guesses.length - 1];

        tiles.forEach((tile, i) => {
            tile.textContent = guess[i].toUpperCase();
            tile.classList.add(result[i]);
        });

        // Update keyboard
        const buttons = this.keyboard.getElementsByTagName('button');
        Array.from(buttons).forEach(button => {
            const letter = button.textContent.toLowerCase();
            if (letter === guess[i]) {
                if (result[i] === 'correct') {
                    button.classList.add('correct');
                } else if (result[i] === 'present' && !button.classList.contains('correct')) {
                    button.classList.add('present');
                } else if (!button.classList.contains('correct') && !button.classList.contains('present')) {
                    button.classList.add('absent');
                }
            }
        });
    }

    checkGameEnd() {
        const state = this.game.getGameState();
        if (state.gameOver) {
            const won = state.guesses[state.guesses.length - 1] === state.targetWord;
            setTimeout(() => {
                alert(won ? 'Congratulations! You won!' : `Game Over! The word was ${state.targetWord.toUpperCase()}`);
            }, 500);
        }
    }

    updateTargetWord() {
        const state = this.game.getGameState();
        this.targetWordDisplay.innerHTML = 
            `<strong>${state.targetWord.toUpperCase()}</strong>: ${state.targetDefinition}`;
    }
}

if (typeof window !== 'undefined') {
    window.WordleUI = WordleUI;
}
