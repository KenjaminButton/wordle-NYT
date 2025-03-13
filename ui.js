class WordleUI {
    constructor(game) {
        this.game = game;
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');
        this.targetWordDisplay = document.getElementById('target-word');
        
        this.setupBoard();
        this.setupKeyboard();
        this.setupEventListeners();
    }

    setupBoard() {
        this.board.innerHTML = '';
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

    setupKeyboard() {
        // iPhone-style keyboard layout
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
        ];

        this.keyboard.innerHTML = '';
        this.keyboard.className = 'iphone-keyboard';

        rows.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'keyboard-row';
            
            // Add left spacing for QWERTY rows to match iPhone layout
            if (rowIndex === 1) { // A-L row
                rowElement.style.paddingLeft = '5%';
            } else if (rowIndex === 2) { // Z-M row
                rowElement.style.paddingLeft = '0';
            }

            row.forEach(key => {
                const button = document.createElement('button');
                button.textContent = key === 'Backspace' ? '⌫' : key;
                button.setAttribute('data-key', key);
                button.className = 'keyboard-button';
                
                if (key === 'Enter' || key === 'Backspace') {
                    button.classList.add('keyboard-button-wide');
                }
                
                // Add iPhone-style button appearance
                button.classList.add('iphone-key');
                
                rowElement.appendChild(button);
            });
            this.keyboard.appendChild(rowElement);
        });

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
            this.handleInput(button.getAttribute('data-key'));
        });
    }

    setupEventListeners() {
        // Listen for win event
        window.addEventListener('wordleGameWon', (e) => {
            this.showWinNotification(e.detail);
        });

        // Listen for lose event
        window.addEventListener('wordleGameLost', (e) => {
            this.showLoseNotification(e.detail);
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
            const letter = button.getAttribute('data-key').toLowerCase();
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

    showWinNotification({ word, attempts, definition }) {
        this.removeExistingNotifications();

        const notification = document.createElement('div');
        notification.className = 'win-notification';
        notification.innerHTML = `
            <h2>🎉 CONGRATULATIONS! 🎉</h2>
            <p>You won in ${attempts} ${attempts === 1 ? 'try' : 'tries'}!</p>
            <p>The word was: ${word.toUpperCase()}</p>
            <p><em>${definition}</em></p>
            <button onclick="this.parentElement.remove()">Close</button>
        `;

        document.body.appendChild(notification);
    }

    showLoseNotification({ word, definition }) {
        this.removeExistingNotifications();

        const notification = document.createElement('div');
        notification.className = 'lose-notification';
        notification.innerHTML = `
            <h2>😔 GAME OVER!</h2>
            <p>Better luck next time!</p>
            <p>The word was: ${word.toUpperCase()}</p>
            <p><em>${definition}</em></p>
            <button onclick="this.parentElement.remove()">Close</button>
        `;

        document.body.appendChild(notification);
    }

    removeExistingNotifications() {
        const existingWin = document.querySelector('.win-notification');
        const existingLose = document.querySelector('.lose-notification');
        if (existingWin) existingWin.remove();
        if (existingLose) existingLose.remove();
    }
}

if (typeof window !== 'undefined') {
    window.WordleUI = WordleUI;
}
