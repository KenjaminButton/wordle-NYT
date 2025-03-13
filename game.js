class WordleGame {
    constructor() {
        this.WORD_LENGTH = 5;
        this.MAX_ATTEMPTS = 6;
        this.currentAttempt = 0;
        this.currentGuess = '';
        this.targetWord = '';
        
        // Get DOM elements
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');
        
        // Create board
        this.createBoard();
        
        // Add keyboard listeners
        this.keyboard.addEventListener('click', (e) => {
            const key = e.target.closest('.key');
            if (!key) return;
            
            const letter = key.dataset.key;
            console.log('Key clicked:', letter); // Debug log
            
            if (letter === 'Enter') {
                this.submitGuess();
            } else if (letter === 'Backspace') {
                this.removeLetter();
            } else {
                this.addLetter(letter);
            }
        });

        // Load word list
        fetch('lib/test.json')
            .then(response => response.json())
            .then(wordList => {
                this.targetWord = wordList[Math.floor(Math.random() * wordList.length)].toLowerCase();
                console.log('Target word:', this.targetWord);
            })
            .catch(error => console.error('Error loading word list:', error));
    }

    createBoard() {
        for (let i = 0; i < this.MAX_ATTEMPTS; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < this.WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                row.appendChild(tile);
            }
            this.board.appendChild(row);
        }
    }

    addLetter(letter) {
        if (this.currentGuess.length >= this.WORD_LENGTH) return;
        
        console.log('Adding letter:', letter); // Debug log
        
        this.currentGuess += letter;
        const tiles = this.board.children[this.currentAttempt].children;
        tiles[this.currentGuess.length - 1].textContent = letter.toUpperCase();
    }

    removeLetter() {
        if (this.currentGuess.length === 0) return;
        
        const tiles = this.board.children[this.currentAttempt].children;
        tiles[this.currentGuess.length - 1].textContent = '';
        this.currentGuess = this.currentGuess.slice(0, -1);
    }

    submitGuess() {
        if (this.currentGuess.length !== this.WORD_LENGTH) return;
        
        const tiles = Array.from(this.board.children[this.currentAttempt].children);
        
        // Check each letter
        for (let i = 0; i < this.WORD_LENGTH; i++) {
            const letter = this.currentGuess[i];
            const tile = tiles[i];
            
            if (letter === this.targetWord[i]) {
                tile.classList.add('correct');
            } else if (this.targetWord.includes(letter)) {
                tile.classList.add('present');
            } else {
                tile.classList.add('absent');
            }
        }
        
        if (this.currentGuess === this.targetWord) {
            alert('You won!');
        } else if (this.currentAttempt === this.MAX_ATTEMPTS - 1) {
            alert(`Game Over! The word was ${this.targetWord}`);
        }
        
        this.currentAttempt++;
        this.currentGuess = '';
    }
}

// Start game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordleGame();
});
