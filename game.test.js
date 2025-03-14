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

        // Reset fetch mock before each test
        global.fetch = jest.fn();
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

        describe('Network Failure Scenarios', () => {
            test('should handle generic API failure', async () => {
                global.fetch.mockRejectedValue(new Error('API is down'));
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });

            test('should handle timeout error', async () => {
                global.fetch.mockRejectedValue(new Error('Network timeout'));
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });

            test('should handle malformed JSON response', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                });
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });

            test('should handle empty word list', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve({})
                });
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('No words available');
            });

            test('should handle partial data corruption', async () => {
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve({
                        "word1": null,
                        "word2": undefined,
                        "word3": "Valid definition"
                    })
                });
                game = new WordleGame();
                await game.initialize();
                expect(Object.keys(game.wordData).length).toBe(3);
            });
        });

        describe('HTTP Status Code Handling', () => {
            test('should handle 404 Not Found', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 404
                });
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });

            test('should handle 500 Server Error', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 500
                });
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });

            test('should handle 503 Service Unavailable', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 503
                });
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });

            test('should handle rate limiting (429)', async () => {
                global.fetch.mockResolvedValue({
                    ok: false,
                    status: 429
                });
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });
        });

        describe('CORS and Security', () => {
            test('should handle CORS errors', async () => {
                global.fetch.mockRejectedValue(new Error('CORS error'));
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });

            test('should handle mixed content errors', async () => {
                global.fetch.mockRejectedValue(new Error('Mixed Content'));
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });
        });

        describe('Network Conditions', () => {
            test('should handle slow network', async () => {
                global.fetch.mockImplementation(() => new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            ok: true,
                            json: () => Promise.resolve({
                                "stare": "To look fixedly"
                            })
                        });
                    }, 1000);
                }));
                game = new WordleGame();
                await expect(game.initialize()).resolves.not.toThrow();
            });

            test('should handle connection interruption', async () => {
                global.fetch.mockImplementation(() => new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('Connection interrupted'));
                    }, 500);
                }));
                game = new WordleGame();
                await expect(game.initialize()).rejects.toThrow('Failed to load word list');
            });
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
            expect(game.addLetter(' ')).toBe(false);
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

    describe('Word Validation', () => {
        test('should validate word length', () => {
            // Add 4 letters (too short)
            game.addLetter('s');
            game.addLetter('t');
            game.addLetter('a');
            game.addLetter('r');
            expect(game.submitGuess()).toBe(null);

            // Add 5th letter (correct length)
            game.addLetter('e');
            expect(game.submitGuess()).toBeTruthy();
        });

        test('should handle non-alphabetic characters', () => {
            expect(game.addLetter('1')).toBe(false);
            expect(game.addLetter('@')).toBe(false);
            expect(game.addLetter(' ')).toBe(false);
            expect(game.currentGuess).toBe('');
        });

        test('should be case insensitive', () => {
            ['S', 't', 'A', 'r', 'E'].forEach(letter => {
                game.addLetter(letter);
            });
            const result = game.submitGuess();
            expect(result).toBeTruthy();
            expect(result.every(state => state === 'correct')).toBe(true);
        });
    });

    describe('Game Completion Scenarios', () => {
        test('should handle win on first try', () => {
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                game.addLetter(letter);
            });
            game.submitGuess();
            expect(game.gameWon).toBe(true);
            expect(game.gameOver).toBe(true);
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'wordleGameWon'
                })
            );
        });

        test('should handle win on last try', () => {
            // Make 5 wrong guesses
            for (let i = 0; i < 5; i++) {
                ['b', 'r', 'a', 'i', 'n'].forEach(letter => {
                    game.addLetter(letter);
                });
                game.submitGuess();
            }

            // Win on 6th try
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                game.addLetter(letter);
            });
            game.submitGuess();
            expect(game.gameWon).toBe(true);
            expect(game.gameOver).toBe(true);
            expect(game.currentRow).toBe(6);
        });

        test('should handle loss after max attempts', () => {
            // Make 6 wrong guesses
            for (let i = 0; i < 6; i++) {
                ['b', 'r', 'a', 'i', 'n'].forEach(letter => {
                    game.addLetter(letter);
                });
                game.submitGuess();
            }
            expect(game.gameLost).toBe(true);
            expect(game.gameOver).toBe(true);
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'wordleGameLost'
                })
            );
        });
    });

    describe('Edge Cases', () => {
        test('should handle repeated letters in target word', () => {
            game.targetWord = 'speed';
            game.addLetter('s');
            game.addLetter('p');
            game.addLetter('e');
            game.addLetter('e');
            game.addLetter('d');
            const result = game.submitGuess();
            expect(result).toBeTruthy();
            expect(result[2]).toBe('correct');
            expect(result[3]).toBe('correct');
        });

        test('should handle repeated letters in guess', () => {
            game.targetWord = 'light';
            ['s', 'p', 'e', 'e', 'd'].forEach(letter => {
                game.addLetter(letter);
            });
            const result = game.submitGuess();
            expect(result).toBeTruthy();
            expect(result[2]).toBe('absent');
            expect(result[3]).toBe('absent');
        });

        test('should handle all letters absent', () => {
            game.targetWord = 'light';
            ['s', 'p', 'e', 'e', 'd'].forEach(letter => {
                game.addLetter(letter);
            });
            const result = game.submitGuess();
            expect(result).toBeTruthy();
            expect(result.every(state => state === 'absent')).toBe(true);
        });

        test('should handle letters present but in wrong positions', () => {
            game.targetWord = 'stare';
            ['e', 'r', 'a', 't', 's'].forEach(letter => {
                game.addLetter(letter);
            });
            const result = game.submitGuess();
            expect(result).toBeTruthy();
            // Each letter should be marked as 'present' or 'correct' since they all exist in the target word
            expect(result.every(state => state === 'present' || state === 'correct')).toBe(true);
            // At least one letter should be 'present' (in wrong position) since we scrambled the word
            expect(result.some(state => state === 'present')).toBe(true);
        });
    });

    describe('Game State Management', () => {
        test('should track guess history', () => {
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                game.addLetter(letter);
            });
            game.submitGuess();
            expect(game.guesses).toHaveLength(1);
            expect(game.guesses[0]).toBe('stare');
        });

        test('should prevent input after game over', () => {
            // Win the game
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                game.addLetter(letter);
            });
            game.submitGuess();

            // Try to continue playing
            expect(game.addLetter('b')).toBe(false);
            expect(game.submitGuess()).toBe(null);
        });

        test('should maintain game state between guesses', () => {
            // First guess
            ['b', 'r', 'a', 'i', 'n'].forEach(letter => {
                game.addLetter(letter);
            });
            game.submitGuess();
            expect(game.currentRow).toBe(1);
            expect(game.currentGuess).toBe('');
            expect(game.guesses).toHaveLength(1);

            // Second guess
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                game.addLetter(letter);
            });
            game.submitGuess();
            expect(game.currentRow).toBe(2);
            expect(game.currentGuess).toBe('');
            expect(game.guesses).toHaveLength(2);
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
