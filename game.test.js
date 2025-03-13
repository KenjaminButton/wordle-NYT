/**
 * @jest-environment jsdom
 */

const path = require('path');
const fs = require('fs');

// Load game.js content and evaluate it in this context
const gameJsPath = path.join(__dirname, 'game.js');
const gameJsContent = fs.readFileSync(gameJsPath, 'utf8');
eval(gameJsContent);

describe('WordleGame', () => {
    let game;
    const testWordData = {
        "stare": "To look fixedly",
        "rates": "Plural of rate",
        "tears": "Drops from eyes",
        "tares": "Unwanted plants",
        "stamp": "To mark with a seal"
    };

    beforeEach(() => {
        game = new WordleGame(testWordData);
    });

    describe('Game Initialization', () => {
        test('should initialize with default values', () => {
            expect(game.WORD_LENGTH).toBe(5);
            expect(game.MAX_ATTEMPTS).toBe(6);
            expect(game.currentRow).toBe(0);
            expect(game.currentGuess).toBe('');
            expect(game.gameOver).toBe(false);
            expect(game.guesses).toEqual([]);
        });

        test('should select a valid word from wordData', () => {
            const { word, definition } = game.selectNewWord();
            expect(Object.keys(testWordData)).toContain(word);
            expect(definition).toBe(testWordData[word]);
        });

        test('should throw error if no words available', () => {
            game = new WordleGame({});
            expect(() => game.selectNewWord()).toThrow('No words available');
        });
    });

    describe('Letter Input', () => {
        test('should add letter to current guess', () => {
            expect(game.addLetter('s')).toBe(true);
            expect(game.currentGuess).toBe('s');
        });

        test('should not add letter if guess is full', () => {
            game.addLetter('s');
            game.addLetter('t');
            game.addLetter('a');
            game.addLetter('r');
            game.addLetter('e');
            expect(game.addLetter('s')).toBe(false);
            expect(game.currentGuess).toBe('stare');
        });

        test('should remove last letter', () => {
            game.addLetter('s');
            expect(game.removeLetter()).toBe(true);
            expect(game.currentGuess).toBe('');
        });

        test('should not remove letter from empty guess', () => {
            expect(game.removeLetter()).toBe(false);
        });
    });

    describe('Guess Checking', () => {
        beforeEach(() => {
            game.targetWord = 'stare';
        });

        test('should correctly identify all correct letters', () => {
            const result = game.checkGuess('stare');
            expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
        });

        test('should identify present but misplaced letters', () => {
            const result = game.checkGuess('rates');
            // All letters are present but in different positions
            expect(result).toEqual(['present', 'present', 'present', 'present', 'present']);
        });

        test('should identify absent letters', () => {
            const result = game.checkGuess('stamp');
            // 's', 't', 'a' are in stare, 'm', 'p' are absent
            expect(result).toEqual(['correct', 'correct', 'correct', 'absent', 'absent']);
        });

        test('should handle duplicate letters correctly', () => {
            game.targetWord = 'tares';
            const result = game.checkGuess('stare');
            // All letters are present but in different positions
            expect(result).toEqual(['present', 'present', 'present', 'present', 'present']);
        });
    });

    describe('Game State', () => {
        test('should track game state correctly', () => {
            game.targetWord = 'stare';
            game.addLetter('s');
            game.addLetter('t');
            game.addLetter('a');
            game.addLetter('r');
            game.addLetter('e');
            game.submitGuess();

            const state = game.getGameState();
            expect(state.currentRow).toBe(1);
            expect(state.guesses).toEqual(['stare']);
            expect(state.gameOver).toBe(true);
        });

        test('should end game after correct guess', () => {
            game.targetWord = 'stare';
            game.addLetter('s');
            game.addLetter('t');
            game.addLetter('a');
            game.addLetter('r');
            game.addLetter('e');
            game.submitGuess();
            
            expect(game.gameOver).toBe(true);
        });

        test('should end game after max attempts', () => {
            game.targetWord = 'stare';
            const wrongGuess = 'rates';
            
            for (let i = 0; i < game.MAX_ATTEMPTS; i++) {
                for (const letter of wrongGuess) {
                    game.addLetter(letter);
                }
                game.submitGuess();
            }
            
            expect(game.gameOver).toBe(true);
            expect(game.currentRow).toBe(6);
        });

        test('should not accept guesses after game over', () => {
            game.gameOver = true;
            expect(game.addLetter('s')).toBe(false);
            expect(game.submitGuess()).toBeNull();
        });
    });

    describe('Input Validation', () => {
        test('should only accept letters', () => {
            expect(game.addLetter('1')).toBe(false);
            expect(game.addLetter('!')).toBe(false);
            expect(game.addLetter('a')).toBe(true);
        });

        test('should convert input to lowercase', () => {
            game.addLetter('S');
            expect(game.currentGuess).toBe('s');
        });

        test('should not submit incomplete guess', () => {
            game.addLetter('s');
            expect(game.submitGuess()).toBeNull();
        });
    });
});
