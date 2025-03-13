const WordleUI = require('./ui');

describe('WordleUI', () => {
    let ui;
    let game;
    let board;
    let keyboard;
    let targetWordDisplay;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="board"></div>
            <div id="keyboard"></div>
            <div id="target-word"></div>
        `;

        board = document.getElementById('board');
        keyboard = document.getElementById('keyboard');
        targetWordDisplay = document.getElementById('target-word');

        game = {
            MAX_ATTEMPTS: 6,
            WORD_LENGTH: 5,
            addLetter: jest.fn(),
            removeLetter: jest.fn(),
            submitGuess: jest.fn(),
            getGameState: jest.fn().mockReturnValue({
                currentRow: 0,
                currentGuess: '',
                guesses: [],
                gameOver: false,
                targetWord: 'stare',
                targetDefinition: 'to look fixedly or vacantly'
            })
        };

        ui = new WordleUI(game);
    });

    describe('Board Setup', () => {
        test('should create board with correct number of rows and tiles', () => {
            const rows = board.getElementsByClassName('row');
            expect(rows.length).toBe(game.MAX_ATTEMPTS);

            Array.from(rows).forEach(row => {
                const tiles = row.getElementsByClassName('tile');
                expect(tiles.length).toBe(game.WORD_LENGTH);
            });
        });
    });

    describe('Keyboard Setup', () => {
        test('should create iPhone-style keyboard layout', () => {
            const rows = keyboard.getElementsByClassName('keyboard-row');
            expect(rows.length).toBe(3);

            // Check first row (Q-P)
            const firstRow = rows[0].getElementsByTagName('button');
            expect(firstRow.length).toBe(10);
            expect(firstRow[0].textContent).toBe('Q');
            expect(firstRow[9].textContent).toBe('P');

            // Check second row (A-L)
            const secondRow = rows[1].getElementsByTagName('button');
            expect(secondRow.length).toBe(9);
            expect(secondRow[0].textContent).toBe('A');
            expect(secondRow[8].textContent).toBe('L');

            // Check third row (Enter, Z-M, Backspace)
            const thirdRow = rows[2].getElementsByTagName('button');
            expect(thirdRow.length).toBe(9);
            expect(thirdRow[0].textContent).toBe('Enter');
            expect(thirdRow[8].textContent).toBe('⌫');
        });
    });

    describe('Game Interaction', () => {
        test('should handle keyboard input', () => {
            // Test letter input
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            expect(game.addLetter).toHaveBeenCalledWith('a');

            // Test Enter key
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(game.submitGuess).toHaveBeenCalled();

            // Test Backspace
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
            expect(game.removeLetter).toHaveBeenCalled();
        });

        test('should handle on-screen keyboard clicks', () => {
            const buttons = keyboard.getElementsByTagName('button');
            
            // Click letter button
            const letterButton = Array.from(buttons).find(b => b.getAttribute('data-key') === 'A');
            letterButton.click();
            expect(game.addLetter).toHaveBeenCalledWith('A');

            // Click Enter button
            const enterButton = Array.from(buttons).find(b => b.getAttribute('data-key') === 'Enter');
            enterButton.click();
            expect(game.submitGuess).toHaveBeenCalled();

            // Click Backspace button
            const backspaceButton = Array.from(buttons).find(b => b.getAttribute('data-key') === 'Backspace');
            backspaceButton.click();
            expect(game.removeLetter).toHaveBeenCalled();
        });

        test('should update current row when adding letters', () => {
            game.getGameState.mockReturnValue({
                currentRow: 0,
                currentGuess: 'sta',
                guesses: [],
                gameOver: false
            });

            game.addLetter.mockReturnValue(true);
            ui.handleInput('a');

            const firstRowTiles = board.children[0].children;
            expect(firstRowTiles[0].textContent).toBe('S');
            expect(firstRowTiles[1].textContent).toBe('T');
            expect(firstRowTiles[2].textContent).toBe('A');
        });
    });

    describe('Game End', () => {
        test('should show win notification', () => {
            const detail = {
                word: 'stare',
                attempts: 3,
                definition: 'to look fixedly'
            };

            window.dispatchEvent(new CustomEvent('wordleGameWon', { detail }));

            const notification = document.querySelector('.win-notification');
            expect(notification).toBeTruthy();
            expect(notification.innerHTML).toContain('CONGRATULATIONS');
            expect(notification.innerHTML).toContain('3 tries');
            expect(notification.innerHTML).toContain('STARE');
        });

        test('should show lose notification', () => {
            const detail = {
                word: 'stare',
                definition: 'to look fixedly'
            };

            window.dispatchEvent(new CustomEvent('wordleGameLost', { detail }));

            const notification = document.querySelector('.lose-notification');
            expect(notification).toBeTruthy();
            expect(notification.innerHTML).toContain('GAME OVER');
            expect(notification.innerHTML).toContain('STARE');
        });

        test('should remove existing notifications before showing new ones', () => {
            // Show win notification
            window.dispatchEvent(new CustomEvent('wordleGameWon', {
                detail: { word: 'stare', attempts: 3, definition: 'to look fixedly' }
            }));

            // Show lose notification
            window.dispatchEvent(new CustomEvent('wordleGameLost', {
                detail: { word: 'stare', definition: 'to look fixedly' }
            }));

            // Check that only lose notification exists
            expect(document.querySelectorAll('.win-notification').length).toBe(0);
            expect(document.querySelectorAll('.lose-notification').length).toBe(1);
        });
    });
});
