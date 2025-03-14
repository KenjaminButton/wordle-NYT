// This is our main game class that handles all the Wordle game rules and logic
class WordleGame {
    // Set up the game rules when we start
    constructor(wordData = {}) {
        // Game settings
        this.WORD_LENGTH = 5;       // Words must be 5 letters long
        this.MAX_ATTEMPTS = 6;      // Players get 6 tries to guess the word
        
        // Game state
        this.currentRow = 0;        // Which guess we're on (0-5)
        this.currentGuess = '';     // Letters typed so far
        this.targetWord = '';       // The word players need to guess
        this.targetDefinition = ''; // What the word means
        this.gameOver = false;      // True when game ends
        this.wordData = wordData;   // Dictionary of words and definitions
        this.guesses = [];          // All the guesses made
        this.gameWon = false;       // True when player wins
        this.gameLost = false;      // True when player loses

        // Debug logging
        console.log('WordleGame initialized');
        if (Object.keys(wordData).length > 0) {
            console.log('Initial word data provided:', Object.keys(wordData).length, 'words');
            this.selectNewWord();
        }
    }

    // Start a new game by loading words and picking one
    async initialize() {
        console.log('Starting game initialization...');
        if (Object.keys(this.wordData).length === 0) {
            try {
                console.log('Fetching word list from lib/clean.json...');
                const response = await fetch('lib/clean.json');
                if (!response.ok) {
                    throw new Error('Failed to load word list');
                }
                const data = await response.json();
                console.log('Word list loaded successfully:', Object.keys(data).length, 'words');
                
                // Check if the word list is empty
                if (Object.keys(data).length === 0) {
                    throw new Error('No words available');
                }
                
                this.wordData = data;
                this.selectNewWord();
            } catch (error) {
                console.error('Failed to load word list:', error);
                // Only propagate 'No words available' error, wrap others in standard error
                if (error.message === 'No words available') {
                    throw error;
                }
                throw new Error('Failed to load word list');
            }
        } else {
            console.log('Using existing word data');
            this.selectNewWord();
        }
    }

    // Pick a random word from our dictionary
    selectNewWord() {
        console.log('Selecting new word...');
        const words = Object.keys(this.wordData);
        if (words.length === 0) {
            throw new Error('No words available');
        }
        const word = words[Math.floor(Math.random() * words.length)];
        this.targetWord = word.toLowerCase();
        this.targetDefinition = this.wordData[word];
        
        // Debug logging
        console.log('Selected word:', this.targetWord);
        console.log('Definition:', this.targetDefinition);
        
        // Dispatch event with word and definition
        if (typeof window !== 'undefined') {
            console.log('Dispatching wordSelected event...');
            const event = new CustomEvent('wordSelected', {
                detail: {
                    word: this.targetWord,
                    definition: this.targetDefinition
                }
            });
            window.dispatchEvent(event);
            console.log('Event dispatched');
        }
        
        return {
            word: this.targetWord,
            definition: this.targetDefinition
        };
    }

    // Add a letter to the current guess
    addLetter(letter) {
        // Don't add letters if:
        // - Game is over
        // - Guess is already full
        if (this.gameOver || 
            this.currentGuess.length >= this.WORD_LENGTH) {
            return false;
        }
        
        letter = letter.toLowerCase();
        if (!/^[a-z]$/.test(letter)) {
            return false;
        }
        
        // Add the letter and return true
        this.currentGuess += letter;
        return true;
    }

    // Remove the last letter from the current guess
    removeLetter() {
        // Don't remove if:
        // - Game is over
        // - No letters to remove
        if (this.gameOver || this.currentGuess.length === 0) {
            return false;
        }
        
        // Remove last letter and return true
        this.currentGuess = this.currentGuess.slice(0, -1);
        return true;
    }

    // Try to submit the current guess
    submitGuess() {
        if (this.gameOver || this.currentGuess.length !== this.WORD_LENGTH) {
            return null;
        }

        const result = this.checkGuess();
        this.guesses.push(this.currentGuess);
        this.currentRow++;

        if (this.currentGuess === this.targetWord) {
            this.gameOver = true;
            this.gameWon = true;
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('wordleGameWon', {
                    detail: {
                        word: this.targetWord,
                        attempts: this.currentRow,
                        definition: this.targetDefinition
                    }
                });
                window.dispatchEvent(event);
            }
        } else if (this.currentRow >= this.MAX_ATTEMPTS) {
            this.gameOver = true;
            this.gameLost = true;
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('wordleGameLost', {
                    detail: {
                        word: this.targetWord,
                        attempts: this.MAX_ATTEMPTS,
                        definition: this.targetDefinition
                    }
                });
                window.dispatchEvent(event);
            }
        }

        this.currentGuess = '';
        return result;
    }

    // Check how well the guess matches the target word
    checkGuess() {
        const result = new Array(this.WORD_LENGTH).fill('absent');
        const targetLetters = [...this.targetWord];
        const guessLetters = [...this.currentGuess];
        const usedIndices = new Set();
        
        // First pass: mark correct letters
        for (let i = 0; i < this.WORD_LENGTH; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = 'correct';
                usedIndices.add(i);
            }
        }
        
        // Second pass: mark present letters
        for (let i = 0; i < this.WORD_LENGTH; i++) {
            if (result[i] === 'correct') continue;
            
            for (let j = 0; j < this.WORD_LENGTH; j++) {
                if (!usedIndices.has(j) && guessLetters[i] === targetLetters[j]) {
                    result[i] = 'present';
                    usedIndices.add(j);
                    break;
                }
            }
        }
        
        return result;
    }

    // Get the current state of the game
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordleGame;
} else if (typeof window !== 'undefined') {
    window.WordleGame = WordleGame;
}
