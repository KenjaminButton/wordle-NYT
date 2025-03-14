/**
 * @jest-environment jsdom
 */

const WordleUI = require('./ui');

describe('WordleUI', () => {
    let ui;
    let game;
    let board;
    let keyboard;
    let definitionContainer;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="board"></div>
            <div id="keyboard"></div>
            <div id="definition-container"></div>
        `;

        board = document.getElementById('board');
        keyboard = document.getElementById('keyboard');
        definitionContainer = document.getElementById('definition-container');

        game = {
            WORD_LENGTH: 5,
            MAX_ATTEMPTS: 6,
            addLetter: jest.fn().mockReturnValue(true),
            removeLetter: jest.fn().mockReturnValue(true),
            submitGuess: jest.fn().mockReturnValue(['correct', 'present', 'absent', 'correct', 'present']),
            getGameState: jest.fn().mockReturnValue({
                currentRow: 0,
                currentGuess: '',
                guesses: [],
                gameOver: false,
                gameWon: false,
                gameLost: false,
                targetWord: 'stare',
                targetDefinition: 'To look fixedly'
            })
        };

        ui = new WordleUI(game);
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

    describe('Keyboard Setup', () => {
        test('should create keyboard with correct layout', () => {
            const rows = keyboard.getElementsByClassName('keyboard-row');
            expect(rows.length).toBe(4);

            // Check first row (Q-P)
            const firstRow = rows[0].getElementsByTagName('button');
            expect(firstRow.length).toBe(10);
            expect(firstRow[0].textContent).toBe('q');
            expect(firstRow[9].textContent).toBe('p');

            // Check second row (A-L)
            const secondRow = rows[1].getElementsByTagName('button');
            expect(secondRow.length).toBe(9);
            expect(secondRow[0].textContent).toBe('a');
            expect(secondRow[8].textContent).toBe('l');

            // Check third row (▲, Z-M, ⌫)
            const thirdRow = rows[2].getElementsByTagName('button');
            expect(thirdRow.length).toBe(9);
            expect(thirdRow[0].textContent).toBe('▲');
            expect(thirdRow[1].textContent).toBe('z');
            expect(thirdRow[8].textContent).toBe('⌫');

            // Check fourth row (123, ☺, space, return)
            const fourthRow = rows[3].getElementsByTagName('button');
            expect(fourthRow.length).toBe(4);
            expect(fourthRow[0].textContent).toBe('123');
            expect(fourthRow[1].textContent).toBe('☺');
            expect(fourthRow[2].textContent).toBe('space');
            expect(fourthRow[3].textContent).toBe('return');
        });

        test('should have correct key states', () => {
            // Check disabled keys
            const arrowKey = keyboard.querySelector('button[data-key="▲"]');
            const numKey = keyboard.querySelector('button[data-key="123"]');
            const emojiKey = keyboard.querySelector('button[data-key="☺"]');
            expect(arrowKey.disabled).toBe(true);
            expect(numKey.disabled).toBe(true);
            expect(emojiKey.disabled).toBe(true);

            // Check functional keys
            const backspaceKey = keyboard.querySelector('button[data-key="⌫"]');
            const spaceKey = keyboard.querySelector('button[data-key="space"]');
            const returnKey = keyboard.querySelector('button[data-key="return"]');
            expect(backspaceKey.disabled).toBe(false);
            expect(spaceKey.disabled).toBe(false);
            expect(returnKey.disabled).toBe(false);
        });

        test('should handle keyboard input', () => {
            // Test letter input
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(game.addLetter).toHaveBeenCalledWith('a');

            // Test return key
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(game.submitGuess).toHaveBeenCalled();

            // Test backspace key
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
            expect(game.removeLetter).toHaveBeenCalled();
        });

        test('should handle on-screen keyboard clicks', () => {
            // Click letter button
            const letterButton = keyboard.querySelector('button[data-key="a"]');
            letterButton.click();
            expect(game.addLetter).toHaveBeenCalledWith('a');

            // Click return button
            const returnButton = keyboard.querySelector('button[data-key="return"]');
            returnButton.click();
            expect(game.submitGuess).toHaveBeenCalled();

            // Click backspace button
            const backspaceButton = keyboard.querySelector('button[data-key="⌫"]');
            backspaceButton.click();
            expect(game.removeLetter).toHaveBeenCalled();
        });

        test('should have correct key styles', () => {
            const backspaceKey = keyboard.querySelector('button[data-key="⌫"]');
            const spaceKey = keyboard.querySelector('button[data-key="space"]');
            const returnKey = keyboard.querySelector('button[data-key="return"]');
            
            expect(backspaceKey.className).toBe('arrow-key');
            expect(spaceKey.className).toBe('space-key');
            expect(returnKey.className).toBe('return-key');
        });
    });

    describe('Definition Display', () => {
        test('should show initial definition', () => {
            expect(definitionContainer.textContent).toBe('Hint: To look fixedly');
        });

        test('should update definition on word selection', () => {
            window.dispatchEvent(new CustomEvent('wordSelected', {
                detail: {
                    word: 'light',
                    definition: 'Visible energy'
                }
            }));
            expect(definitionContainer.textContent).toBe('Hint: Visible energy');
        });

        test('should handle missing definition', () => {
            window.dispatchEvent(new CustomEvent('wordSelected', {
                detail: {
                    word: 'test'
                }
            }));
            expect(definitionContainer.style.display).toBe('none');
        });
    });

    describe('Color Updates', () => {
        test('should update tile colors after guess', () => {
            // Mock game state with a guess
            game.getGameState.mockReturnValue({
                currentRow: 1,
                guesses: ['stare'],
                currentGuess: ''
            });

            // Submit a guess
            const tiles = board.children[0].children;
            ui.handleInput('s');
            ui.handleInput('t');
            ui.handleInput('a');
            ui.handleInput('r');
            ui.handleInput('e');
            ui.handleInput('enter');

            // Check tile colors
            expect(tiles[0].classList.contains('correct')).toBe(true);
            expect(tiles[1].classList.contains('present')).toBe(true);
            expect(tiles[2].classList.contains('absent')).toBe(true);
            expect(tiles[3].classList.contains('correct')).toBe(true);
            expect(tiles[4].classList.contains('present')).toBe(true);
        });

        test('should update keyboard colors after guess', () => {
            // Mock game state with a guess
            game.getGameState.mockReturnValue({
                currentRow: 1,
                guesses: ['stare'],
                currentGuess: ''
            });

            // Submit a guess
            ui.handleInput('s');
            ui.handleInput('t');
            ui.handleInput('a');
            ui.handleInput('r');
            ui.handleInput('e');
            ui.handleInput('enter');

            // Check keyboard button colors
            const sButton = keyboard.querySelector('button[data-key="s"]');
            const tButton = keyboard.querySelector('button[data-key="t"]');
            const aButton = keyboard.querySelector('button[data-key="a"]');

            expect(sButton.classList.contains('correct')).toBe(true);
            expect(tButton.classList.contains('present')).toBe(true);
            expect(aButton.classList.contains('absent')).toBe(true);
        });
    });

    describe('Game Over State', () => {
        test('should disable keyboard after win', () => {
            game.getGameState.mockReturnValue({
                gameOver: true,
                gameWon: true,
                gameLost: false
            });

            const button = keyboard.querySelector('button[data-key="a"]');
            button.click();
            expect(game.addLetter).not.toHaveBeenCalled();
        });

        test('should disable keyboard after loss', () => {
            game.getGameState.mockReturnValue({
                gameOver: true,
                gameWon: false,
                gameLost: true
            });

            const button = keyboard.querySelector('button[data-key="a"]');
            button.click();
            expect(game.addLetter).not.toHaveBeenCalled();
        });

        test('should show game end messages', () => {
            jest.spyOn(window, 'alert').mockImplementation(() => {});
            
            // Test win message
            window.dispatchEvent(new CustomEvent('wordleGameWon', {
                detail: {
                    word: 'stare',
                    attempts: 3,
                    definition: 'To look fixedly'
                }
            }));
            
            expect(window.alert).toHaveBeenCalledWith(
                expect.stringContaining('Congratulations')
            );

            // Test lose message
            window.dispatchEvent(new CustomEvent('wordleGameLost', {
                detail: {
                    word: 'stare',
                    attempts: 6,
                    definition: 'To look fixedly'
                }
            }));

            expect(window.alert).toHaveBeenCalledWith(
                expect.stringContaining('Game Over')
            );
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid game state gracefully', () => {
            game.getGameState.mockReturnValue(null);
            expect(() => ui.updateBoard(['correct', 'present', 'absent', 'correct', 'present']))
                .not.toThrow();
        });

        test('should handle missing DOM elements gracefully', () => {
            document.body.innerHTML = '';
            expect(() => new WordleUI(game)).not.toThrow();
        });

        test('should handle invalid guess results gracefully', () => {
            game.submitGuess.mockReturnValue(null);
            expect(() => ui.handleInput('enter')).not.toThrow();
        });
    });

    describe('Mobile and Accessibility', () => {
        test('should handle touch events', () => {
            const button = keyboard.querySelector('button[data-key="a"]');
            const touchEvent = new TouchEvent('touchend', {
                bubbles: true,
                cancelable: true,
                target: button
            });
            button.dispatchEvent(touchEvent);
            expect(game.addLetter).toHaveBeenCalledWith('a');
        });

        test('should have proper ARIA labels', () => {
            const buttons = keyboard.getElementsByTagName('button');
            Array.from(buttons).forEach(button => {
                expect(button.hasAttribute('aria-label')).toBe(true);
            });
        });

        test('should handle screen rotation', () => {
            // Simulate portrait mode
            window.innerWidth = 375;
            window.innerHeight = 667;
            window.dispatchEvent(new Event('resize'));
            expect(keyboard.style.maxWidth).toBe('100%');
            
            // Simulate landscape mode
            window.innerWidth = 667;
            window.innerHeight = 375;
            window.dispatchEvent(new Event('resize'));
            expect(keyboard.style.maxWidth).toBe('800px');
        });
    });
});
