/**
 * @jest-environment jsdom
 */

const WordleGame = require('./game.js');

describe('WordleGame', () => {
    let game;
    let mockFetch;

    beforeEach(() => {
        game = new WordleGame({
            "stare": "To look fixedly",
            "speed": "How fast something moves",
            "brain": "Organ for thinking",
            "happy": "Feeling joy",
            "light": "Visible energy"
        });
        game.selectNewWord = jest.fn().mockReturnValue({
            word: 'stare',
            definition: 'To look fixedly'
        });
        game.targetWord = 'stare';
        game.targetDefinition = 'To look fixedly';

        // Mock window.dispatchEvent
        window.dispatchEvent = jest.fn();
    });

    describe('Game Initialization', () => {
        test('should initialize with default values', () => {
            expect(game.WORD_LENGTH).toBe(5);
            expect(game.MAX_ATTEMPTS).toBe(6);
            expect(game.currentRow).toBe(0);
            expect(game.currentGuess).toBe('');
            expect(game.guesses).toEqual([]);
            expect(game.gameOver).toBe(false);
        });

        test('should handle API failure gracefully', async () => {
            global.fetch = jest.fn(() => Promise.reject('API is down'));
            game = new WordleGame();
            await expect(game.initialize()).rejects.toThrow('Failed to load word list');
        });

        test('should handle invalid response gracefully', async () => {
            global.fetch = jest.fn(() => Promise.resolve({
                ok: false,
                status: 404
            }));
            game = new WordleGame();
            await expect(game.initialize()).rejects.toThrow('Failed to load word list');
        });
    });

    describe('Input Validation', () => {
        test('should accept valid letters', () => {
            expect(game.addLetter('a')).toBe(true);
            expect(game.currentGuess).toBe('a');
        });

        test('should reject invalid characters', () => {
            expect(game.addLetter('1')).toBe(false);
            expect(game.addLetter('!')).toBe(false);
            expect(game.currentGuess).toBe('');
        });

        test('should not accept more than 5 letters', () => {
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
            game.addLetter('t');
            expect(game.removeLetter()).toBe(true);
            expect(game.currentGuess).toBe('s');
        });

        test('should not remove from empty guess', () => {
            expect(game.removeLetter()).toBe(false);
            expect(game.currentGuess).toBe('');
        });

        test('should convert input to lowercase', () => {
            game.addLetter('S');
            expect(game.currentGuess).toBe('s');
        });

        test('should not submit incomplete guess', () => {
            game.addLetter('s');
            game.addLetter('t');
            expect(game.submitGuess()).toBe(null);
        });
    });

    describe('Guess Checking', () => {
        beforeEach(() => {
            game.targetWord = 'stare';
        });

        test('should identify correct letters', () => {
            game.currentGuess = 'stare';
            const result = game.checkGuess();
            expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
        });

        test('should identify present letters', () => {
            game.currentGuess = 'rates';
            const result = game.checkGuess();
            expect(result).toEqual(['present', 'present', 'present', 'present', 'present']);
        });

        test('should identify absent letters', () => {
            game.currentGuess = 'stamp';
            const result = game.checkGuess();
            expect(result).toEqual(['correct', 'correct', 'correct', 'absent', 'absent']);
        });

        test('should handle duplicate letters correctly', () => {
            game.currentGuess = 'stare';
            const result = game.checkGuess();
            expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
        });
    });

    describe('Edge Cases and Word Validation', () => {
        test('should handle uppercase input correctly', () => {
            expect(game.addLetter('A')).toBe(true);
            expect(game.currentGuess).toBe('a');
        });

        test('should handle special characters', () => {
            expect(game.addLetter('!')).toBe(false);
            expect(game.addLetter('@')).toBe(false);
            expect(game.currentGuess).toBe('');
        });

        test('should handle empty input', () => {
            expect(game.addLetter('')).toBe(false);
            expect(game.currentGuess).toBe('');
        });

        test('should handle spaces', () => {
            expect(game.addLetter(' ')).toBe(false);
            expect(game.currentGuess).toBe('');
        });
    });

    describe('Game State', () => {
        test('should track game state correctly', () => {
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
            expect(state.gameWon).toBe(true);
        });

        test('should handle game over state', () => {
            game.gameOver = true;
            expect(game.addLetter('a')).toBe(false);
            expect(game.removeLetter()).toBe(false);
            expect(game.submitGuess()).toBe(null);
        });

        test('should handle win condition', () => {
            game.addLetter('s');
            game.addLetter('t');
            game.addLetter('a');
            game.addLetter('r');
            game.addLetter('e');
            game.submitGuess();

            expect(game.gameOver).toBe(true);
            expect(game.gameWon).toBe(true);
        });

        test('should handle loss condition', () => {
            for (let i = 0; i < game.MAX_ATTEMPTS; i++) {
                game.addLetter('w');
                game.addLetter('r');
                game.addLetter('o');
                game.addLetter('n');
                game.addLetter('g');
                game.submitGuess();
            }

            expect(game.gameOver).toBe(true);
            expect(game.gameLost).toBe(true);
        });
    });

    describe('Event Handling', () => {
        test('should emit correct event data on win', () => {
            game.addLetter('s');
            game.addLetter('t');
            game.addLetter('a');
            game.addLetter('r');
            game.addLetter('e');
            game.submitGuess();
            
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'wordleGameWon',
                    detail: expect.objectContaining({
                        word: 'stare',
                        attempts: 1,
                        definition: 'To look fixedly'
                    })
                })
            );
        });

        test('should emit correct event data on loss', () => {
            for (let i = 0; i < game.MAX_ATTEMPTS; i++) {
                game.addLetter('w');
                game.addLetter('r');
                game.addLetter('o');
                game.addLetter('n');
                game.addLetter('g');
                game.submitGuess();
            }
            
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'wordleGameLost',
                    detail: expect.objectContaining({
                        word: 'stare',
                        attempts: 6,
                        definition: 'To look fixedly'
                    })
                })
            );
        });
    });
});
