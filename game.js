class WordleGame {
    constructor(wordData = {}) {
        this.WORD_LENGTH = 5;
        this.MAX_ATTEMPTS = 6;
        this.currentRow = 0;
        this.currentGuess = '';
        this.targetWord = '';
        this.targetDefinition = '';
        this.gameOver = false;
        this.wordData = wordData;
        this.guesses = [];
        this.gameWon = false;
        this.gameLost = false;
    }

    async initialize() {
        if (Object.keys(this.wordData).length === 0) {
            try {
                const response = await fetch('lib/test.json');
                if (!response.ok) throw new Error('Failed to load word list');
                this.wordData = await response.json();
            } catch (error) {
                throw new Error('Failed to load word list');
            }
        }
        this.selectNewWord();
    }

    selectNewWord() {
        const words = Object.keys(this.wordData);
        if (words.length === 0) {
            throw new Error('No words available');
        }
        this.targetWord = words[Math.floor(Math.random() * words.length)].toLowerCase();
        this.targetDefinition = this.wordData[this.targetWord];
        return {
            word: this.targetWord,
            definition: this.targetDefinition
        };
    }

    addLetter(letter) {
        if (this.gameOver) return false;
        if (this.currentGuess.length >= this.WORD_LENGTH) return false;
        if (!/^[a-zA-Z]$/.test(letter)) return false;
        
        this.currentGuess += letter.toLowerCase();
        return true;
    }

    removeLetter() {
        if (this.gameOver) return false;
        if (this.currentGuess.length === 0) return false;

        this.currentGuess = this.currentGuess.slice(0, -1);
        return true;
    }

    submitGuess() {
        if (this.gameOver) return null;
        if (this.currentGuess.length !== this.WORD_LENGTH) return null;

        const result = this.checkGuess(this.currentGuess);
        this.guesses.push(this.currentGuess);
        this.currentRow++;
        
        if (this.currentGuess === this.targetWord) {
            this.gameOver = true;
            this.gameWon = true;
            if (typeof window !== 'undefined') {
                const winEvent = new CustomEvent('wordleGameWon', {
                    detail: {
                        word: this.targetWord,
                        attempts: this.currentRow,
                        definition: this.targetDefinition
                    }
                });
                window.dispatchEvent(winEvent);
            }
        } else if (this.currentRow >= this.MAX_ATTEMPTS) {
            this.gameOver = true;
            this.gameLost = true;
            if (typeof window !== 'undefined') {
                const loseEvent = new CustomEvent('wordleGameLost', {
                    detail: {
                        word: this.targetWord,
                        definition: this.targetDefinition,
                        attempts: this.MAX_ATTEMPTS
                    }
                });
                window.dispatchEvent(loseEvent);
            }
        }

        this.currentGuess = '';
        return result;
    }

    checkGuess(guess) {
        const result = new Array(this.WORD_LENGTH).fill('absent');
        const targetLetters = [...this.targetWord];
        const guessLetters = [...guess];
        
        // First pass: Mark correct letters
        for (let i = 0; i < this.WORD_LENGTH; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null;
                guessLetters[i] = null;
            }
        }
        
        // Second pass: Mark present letters
        for (let i = 0; i < this.WORD_LENGTH; i++) {
            if (guessLetters[i] === null) continue;
            
            const targetIndex = targetLetters.findIndex(letter => letter === guessLetters[i]);
            if (targetIndex !== -1) {
                result[i] = 'present';
                targetLetters[targetIndex] = null;
            }
        }
        
        return result;
    }

    getGameState() {
        return {
            currentRow: this.currentRow,
            currentGuess: this.currentGuess,
            guesses: [...this.guesses],
            gameOver: this.gameOver,
            gameWon: this.gameWon,
            gameLost: this.gameLost,
            targetWord: this.targetWord,
            targetDefinition: this.targetDefinition
        };
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordleGame;
}
// Export for browser
if (typeof window !== 'undefined') {
    window.WordleGame = WordleGame;
}
