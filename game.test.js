/**
 * @jest-environment jsdom
 */

const WordleGame = require('./game.js');

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
        // Reset the fetch mock
        global.fetch.mockClear();
        // Setup window event listener spy
        window.dispatchEvent = jest.fn();
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

        test('should initialize by fetching words if none provided', async () => {
            game = new WordleGame();
            await game.initialize();
            expect(fetch).toHaveBeenCalledWith('lib/test.json');
            expect(game.wordData).toEqual({
                "stare": "To look fixedly or vacantly",
                "light": "The natural agent that stimulates sight",
                "brain": "The organ inside the head"
            });
        });

        test('should handle fetch failure gracefully', async () => {
            global.fetch.mockImplementationOnce(() => Promise.reject('API is down'));
            game = new WordleGame();
            await expect(game.initialize()).rejects.toThrow('Failed to load word list');
        });

        test('should handle invalid response gracefully', async () => {
            global.fetch.mockImplementationOnce(() => Promise.resolve({
                ok: false,
                status: 404
            }));
            game = new WordleGame();
            await expect(game.initialize()).rejects.toThrow('Failed to load word list');
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

    describe('Game End Conditions', () => {
        test('should emit win event when word is guessed correctly', () => {
            game.targetWord = 'stare';
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
                        definition: expect.any(String)
                    })
                })
            );
            expect(game.gameWon).toBe(true);
            expect(game.gameLost).toBe(false);
        });

        test('should emit lose event after max attempts', () => {
            game.targetWord = 'stare';
            const wrongGuess = 'rates';
            
            // Make MAX_ATTEMPTS wrong guesses
            for (let i = 0; i < game.MAX_ATTEMPTS; i++) {
                for (const letter of wrongGuess) {
                    game.addLetter(letter);
                }
                game.submitGuess();
            }
            
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'wordleGameLost',
                    detail: expect.objectContaining({
                        word: 'stare',
                        attempts: game.MAX_ATTEMPTS,
                        definition: expect.any(String)
                    })
                })
            );
            expect(game.gameWon).toBe(false);
            expect(game.gameLost).toBe(true);
        });

        test('should not emit lose event before max attempts', () => {
            game.targetWord = 'stare';
            const wrongGuess = 'rates';
            
            // Make MAX_ATTEMPTS - 1 wrong guesses
            for (let i = 0; i < game.MAX_ATTEMPTS - 1; i++) {
                for (const letter of wrongGuess) {
                    game.addLetter(letter);
                }
                game.submitGuess();
            }
            
            expect(window.dispatchEvent).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'wordleGameLost'
                })
            );
            expect(game.gameWon).toBe(false);
            expect(game.gameLost).toBe(false);
            expect(game.gameOver).toBe(false);
        });

        test('should track game state correctly after loss', () => {
            game.targetWord = 'stare';
            const wrongGuess = 'rates';
            
            // Make MAX_ATTEMPTS wrong guesses
            for (let i = 0; i < game.MAX_ATTEMPTS; i++) {
                for (const letter of wrongGuess) {
                    game.addLetter(letter);
                }
                game.submitGuess();
            }
            
            const state = game.getGameState();
            expect(state.gameOver).toBe(true);
            expect(state.gameLost).toBe(true);
            expect(state.gameWon).toBe(false);
            expect(state.currentRow).toBe(game.MAX_ATTEMPTS);
        });
    });

    describe('Game Win Condition', () => {
        test('should emit win event when word is guessed correctly', () => {
            game.targetWord = 'stare';
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
                        definition: expect.any(String)
                    })
                })
            );
            expect(game.gameWon).toBe(true);
        });

        test('should not emit win event for incorrect guess', () => {
            game.targetWord = 'stare';
            game.addLetter('t');
            game.addLetter('e');
            game.addLetter('a');
            game.addLetter('r');
            game.addLetter('s');
            game.submitGuess();

            expect(window.dispatchEvent).not.toHaveBeenCalled();
            expect(game.gameWon).toBe(false);
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
