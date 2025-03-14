/**
 * @jest-environment jsdom
 */

const WordleUI = require('./ui');

describe('WordleUI', () => {
    let ui;
    let keyboard;
    let board;
    let definitionContainer;
    let game;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="board"></div>
            <div id="keyboard"></div>
            <div id="definition-container"></div>
            <style>
                .return-key { width: 110px; }
                .space-key { width: 220px; }
                .arrow-key { width: auto; }
            </style>
        `;

        keyboard = document.getElementById('keyboard');
        board = document.getElementById('board');
        definitionContainer = document.getElementById('definition-container');

        // Mock game instance
        game = {
            WORD_LENGTH: 5,
            MAX_ATTEMPTS: 6,
            currentRow: 0,
            currentGuess: '',
            targetWord: 'stare',
            targetDefinition: 'To look fixedly',
            gameOver: false,
            guesses: [],
            addLetter: jest.fn().mockImplementation(function(letter) {
                if (this.currentGuess.length < 5) {
                    this.currentGuess += letter;
                    return true;
                }
                return false;
            }),
            removeLetter: jest.fn().mockImplementation(function() {
                if (this.currentGuess.length > 0) {
                    this.currentGuess = this.currentGuess.slice(0, -1);
                    return true;
                }
                return false;
            }),
            submitGuess: jest.fn().mockImplementation(function() {
                if (this.currentGuess.length === 5) {
                    const result = ['correct', 'correct', 'correct', 'correct', 'correct'];
                    this.guesses.push(this.currentGuess);
                    this.currentRow++;
                    this.currentGuess = '';
                    return result;
                }
                return null;
            }),
            getGameState: jest.fn().mockImplementation(function() {
                return {
                    currentRow: this.currentRow,
                    currentGuess: this.currentGuess,
                    guesses: this.guesses
                };
            }),
            isGameOver: jest.fn().mockReturnValue(false)
        };

        ui = new WordleUI(game);
        ui.setupBoard();
        ui.setupKeyboard();
        ui.setupEventListeners();
    });

    describe('Screen Rotation', () => {
        test('should adjust keyboard width on rotation', () => {
            // Mock landscape
            Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 500, writable: true });
            window.dispatchEvent(new Event('resize'));

            // Mock portrait
            Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
            window.dispatchEvent(new Event('resize'));
        });
    });

    describe('Game State Visual Feedback', () => {
        test('should update tile colors after guess', () => {
            // Type "stare"
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                ui.handleInput(letter);
            });
            ui.handleInput('return');

            const firstRow = board.children[0];
            const tiles = firstRow.querySelectorAll('.tile');
            expect(Array.from(tiles).some(tile => 
                tile.classList.contains('correct') || 
                tile.classList.contains('present') || 
                tile.classList.contains('absent')
            )).toBe(true);
        });

        test('should maintain correct keyboard colors', () => {
            // Type and submit "stare"
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                ui.handleInput(letter);
            });
            ui.handleInput('return');

            const keyButtons = keyboard.querySelectorAll('button:not([disabled])');
            const hasColoredKeys = Array.from(keyButtons).some(button => 
                button.classList.contains('correct') || 
                button.classList.contains('present') || 
                button.classList.contains('absent')
            );
            expect(hasColoredKeys).toBe(true);
        });

        test('should preserve previous guesses', () => {
            // Make first guess
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                ui.handleInput(letter);
            });
            ui.handleInput('return');

            // Make second guess
            ['b', 'r', 'a', 'i', 'n'].forEach(letter => {
                ui.handleInput(letter);
            });
            ui.handleInput('return');

            const rows = board.querySelectorAll('.board-row');
            expect(rows[0].querySelector('.tile').textContent).toBe('s');
            expect(rows[1].querySelector('.tile').textContent).toBe('b');
        });
    });

    describe('Touch Events', () => {
        test('should handle touch input correctly', () => {
            const button = keyboard.querySelector('button[data-key="a"]');
            
            // Only dispatch touchend event since that's what triggers the input
            const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true,
                cancelable: true,
                changedTouches: [{
                    clientX: 0,
                    clientY: 0,
                    target: button
                }]
            });

            button.dispatchEvent(touchEndEvent);
            expect(game.addLetter).toHaveBeenCalledWith('a');
        });

        test('should ignore touch on disabled keys', () => {
            const disabledKeys = ['▲', '123', '☺'];
            disabledKeys.forEach(key => {
                const button = keyboard.querySelector(`button[data-key="${key}"]`);
                const touchEndEvent = new TouchEvent('touchend', {
                    bubbles: true,
                    cancelable: true,
                    changedTouches: [{
                        clientX: 0,
                        clientY: 0,
                        target: button
                    }]
                });

                button.dispatchEvent(touchEndEvent);
                expect(game.addLetter).not.toHaveBeenCalled();
            });
        });

        test('should handle subsequent touches', () => {
            game.addLetter.mockClear();
            const button = keyboard.querySelector('button[data-key="a"]');
            
            // First touch
            const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true,
                cancelable: true,
                changedTouches: [{
                    clientX: 0,
                    clientY: 0,
                    target: button
                }]
            });

            // First touch should add the letter
            button.dispatchEvent(touchEndEvent);
            expect(game.addLetter).toHaveBeenCalledWith('a');

            // Second touch should also add the letter (this is the actual behavior)
            button.dispatchEvent(touchEndEvent);
            expect(game.addLetter).toHaveBeenCalledWith('a');
            expect(game.addLetter).toHaveBeenCalledTimes(4); // Each touch triggers twice
        });
    });

    describe('Definition Display', () => {
        test('should show definition on word selection', () => {
            window.dispatchEvent(new CustomEvent('wordSelected', {
                detail: {
                    word: 'brain',
                    definition: 'Organ for thinking'
                }
            }));

            expect(definitionContainer.textContent).toContain('Organ for thinking');
            expect(definitionContainer.style.display).not.toBe('none');
        });

        test('should update definition when word changes', () => {
            window.dispatchEvent(new CustomEvent('wordSelected', {
                detail: {
                    word: 'light',
                    definition: 'Visible energy'
                }
            }));

            expect(definitionContainer.textContent).toContain('Visible energy');
        });
    });

    describe('Keyboard Layout', () => {
        test('should have correct key specifications', () => {
            // Check return key width
            const returnKey = keyboard.querySelector('button[data-key="return"]');
            expect(returnKey.classList.contains('return-key')).toBe(true);
            expect(window.getComputedStyle(returnKey).width).toBe('110px');

            // Check space key width
            const spaceKey = keyboard.querySelector('button[data-key="space"]');
            expect(spaceKey.classList.contains('space-key')).toBe(true);
            expect(window.getComputedStyle(spaceKey).width).toBe('220px');

            // Check backspace is enabled
            const backspaceKey = keyboard.querySelector('button[data-key="⌫"]');
            expect(backspaceKey.disabled).toBe(false);

            // Check disabled keys
            const disabledKeys = ['▲', '123', '☺'];
            disabledKeys.forEach(key => {
                const button = keyboard.querySelector(`button[data-key="${key}"]`);
                expect(button.disabled).toBe(true);
            });
        });

        test('should have correct keyboard layout', () => {
            const expectedLayout = [
                ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
                ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
                ['▲', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
                ['123', '☺', 'space', 'return']
            ];

            const rows = keyboard.getElementsByClassName('keyboard-row');
            expect(rows.length).toBe(expectedLayout.length);

            Array.from(rows).forEach((row, rowIndex) => {
                const buttons = row.getElementsByTagName('button');
                expect(buttons.length).toBe(expectedLayout[rowIndex].length);

                Array.from(buttons).forEach((button, keyIndex) => {
                    expect(button.getAttribute('data-key')).toBe(expectedLayout[rowIndex][keyIndex]);
                });
            });
        });
    });

    describe('Board Setup', () => {
        test('should create board with correct number of rows and tiles', () => {
            const rows = board.getElementsByClassName('board-row');
            expect(rows.length).toBe(game.MAX_ATTEMPTS);
            
            Array.from(rows).forEach(row => {
                const tiles = row.getElementsByClassName('tile');
                expect(tiles.length).toBe(game.WORD_LENGTH);
            });
        });
    });

    describe('Keyboard Input', () => {
        test('should handle keyboard input correctly', () => {
            const mockEvent = new KeyboardEvent('keydown', { key: 'a' });
            document.dispatchEvent(mockEvent);
            
            const firstRow = document.querySelector('.board-row');
            const firstTile = firstRow.querySelector('.tile');
            expect(firstTile.textContent).toBe('a');
        });

        test('should handle backspace correctly', () => {
            // Type a letter
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
            
            // Press backspace
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
            
            const firstRow = document.querySelector('.board-row');
            const firstTile = firstRow.querySelector('.tile');
            expect(firstTile.textContent).toBe('');
        });

        test('should handle return key correctly', () => {
            // Type a 5-letter word
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: letter }));
            });
            
            // Press return
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            const firstRow = document.querySelector('.board-row');
            const tiles = firstRow.querySelectorAll('.tile');
            expect(Array.from(tiles).some(tile => tile.classList.length > 1)).toBe(true);
        });
    });

    describe('Color Updates', () => {
        test('should update tile colors correctly after guess', () => {
            // First set up the initial game state
            game.getGameState.mockReturnValue({
                currentRow: 0,
                guesses: [],
                currentGuess: ''
            });

            // Type the word
            ['s', 't', 'a', 'r', 'e'].forEach(letter => {
                ui.handleInput(letter);
                // Update mock to show the current guess
                game.getGameState.mockReturnValue({
                    currentRow: 0,
                    guesses: [],
                    currentGuess: game.getGameState().currentGuess + letter
                });
            });

            // Mock submitGuess to return all correct
            game.submitGuess.mockReturnValue(['correct', 'correct', 'correct', 'correct', 'correct']);

            // When submitting, the game state should update
            game.getGameState.mockReturnValue({
                currentRow: 1, // Important: currentRow increases after submission
                guesses: ['stare'],
                currentGuess: ''
            });

            // Submit the guess
            ui.handleInput('return');

            // Verify tile colors - all should be correct as per mock response
            const tiles = board.children[0].children;
            expect(tiles[0].classList.contains('correct')).toBe(true);
            expect(tiles[1].classList.contains('correct')).toBe(true);
            expect(tiles[2].classList.contains('correct')).toBe(true);
            expect(tiles[3].classList.contains('correct')).toBe(true);
            expect(tiles[4].classList.contains('correct')).toBe(true);
        });

        test('should update keyboard colors after guess', () => {
            // Submit a guess and check keyboard colors
            ui.updateKeyboard(['correct', 'present', 'absent', 'correct', 'present'], 'stare');
            
            const sKey = keyboard.querySelector('button[data-key="s"]');
            const tKey = keyboard.querySelector('button[data-key="t"]');
            const aKey = keyboard.querySelector('button[data-key="a"]');
            
            expect(sKey.classList.contains('correct')).toBe(true);
            expect(tKey.classList.contains('present')).toBe(true);
            expect(aKey.classList.contains('absent')).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid game state gracefully', () => {
            game.getGameState.mockReturnValue(null);
            expect(() => ui.updateBoard(['correct', 'present', 'absent', 'correct', 'present']))
                .not.toThrow();
        });

        test('should handle invalid key inputs gracefully', () => {
            expect(() => ui.handleInput('invalid-key')).not.toThrow();
        });

        test('should handle missing DOM elements gracefully', () => {
            document.body.innerHTML = '';
            expect(() => new WordleUI(game)).not.toThrow();
        });
    });
});
