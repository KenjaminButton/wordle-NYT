/**
 * @jest-environment jsdom
 */

describe('WordleGame', () => {
    let game;

    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <div id="board" class="board"></div>
        `;
        game = new WordleGame();
        // Mock the word list loading
        game.targetWord = 'hello';
    });

    // Test game board initialization
    describe('Game Board Initialization', () => {
        test('should create 6x5 game board with focusable tiles', () => {
            const rows = document.querySelectorAll('.row');
            expect(rows.length).toBe(6);
            
            rows.forEach(row => {
                const tiles = row.querySelectorAll('.tile');
                expect(tiles.length).toBe(5);
                tiles.forEach(tile => {
                    expect(tile.tabIndex).toBe(0);
                });
            });
        });

        test('should focus first tile on start', () => {
            const firstTile = document.querySelector('.tile');
            expect(document.activeElement).toBe(firstTile);
        });
    });

    // Test tile focus
    describe('Tile Focus', () => {
        test('should focus tile on click', () => {
            const secondTile = document.querySelector('[data-row="0"][data-col="1"]');
            secondTile.click();
            expect(document.activeElement).toBe(secondTile);
            expect(game.activeCol).toBe(1);
        });

        test('should move focus with arrow keys', () => {
            // Start at first tile
            const firstTile = document.querySelector('[data-row="0"][data-col="0"]');
            firstTile.focus();

            // Press right arrow
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            const secondTile = document.querySelector('[data-row="0"][data-col="1"]');
            expect(document.activeElement).toBe(secondTile);

            // Press left arrow
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
            expect(document.activeElement).toBe(firstTile);
        });

        test('should not move focus beyond word length', () => {
            const lastTile = document.querySelector('[data-row="0"][data-col="4"]');
            lastTile.focus();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            expect(document.activeElement).toBe(lastTile);
        });

        test('should move focus to next letter position after input', () => {
            game.addLetter('h');
            const secondTile = document.querySelector('[data-row="0"][data-col="1"]');
            expect(document.activeElement).toBe(secondTile);
        });

        test('should move focus to previous letter position after backspace', () => {
            // Type 'he'
            game.addLetter('h');
            game.addLetter('e');
            
            // Press backspace
            game.removeLetter();
            
            const firstTile = document.querySelector('[data-row="0"][data-col="0"]');
            expect(document.activeElement).toBe(firstTile);
        });

        test('should move focus to next row after submitting guess', () => {
            // Type 'wrong'
            'wrong'.split('').forEach(letter => game.addLetter(letter));
            game.submitGuess();
            
            const nextRowFirstTile = document.querySelector('[data-row="1"][data-col="0"]');
            expect(document.activeElement).toBe(nextRowFirstTile);
        });
    });

    // Test letter input
    describe('Letter Input', () => {
        test('should add letter to current guess', () => {
            game.addLetter('h');
            expect(game.currentGuess).toBe('h');
            const firstTile = document.querySelector('.tile');
            expect(firstTile.textContent).toBe('h');
        });

        test('should not add more than 5 letters', () => {
            'hello!'.split('').forEach(letter => game.addLetter(letter));
            expect(game.currentGuess.length).toBe(5);
            expect(game.currentGuess).toBe('hello');
        });

        test('should remove last letter when backspace is pressed', () => {
            'he'.split('').forEach(letter => game.addLetter(letter));
            game.removeLetter();
            expect(game.currentGuess).toBe('h');
        });
    });

    // Test guess submission
    describe('Guess Submission', () => {
        test('should correctly mark exact matches', () => {
            'hello'.split('').forEach(letter => game.addLetter(letter));
            game.submitGuess();
            
            const tiles = document.querySelectorAll('.tile');
            for (let i = 0; i < 5; i++) {
                expect(tiles[i].classList.contains('correct')).toBe(true);
            }
        });

        test('should correctly mark present letters in wrong position', () => {
            'ehllo'.split('').forEach(letter => game.addLetter(letter));
            game.submitGuess();
            
            const tiles = document.querySelectorAll('.tile');
            expect(tiles[0].classList.contains('present')).toBe(true);
            expect(tiles[1].classList.contains('present')).toBe(true);
        });

        test('should correctly mark absent letters', () => {
            'world'.split('').forEach(letter => game.addLetter(letter));
            game.submitGuess();
            
            const tiles = document.querySelectorAll('.tile');
            expect(tiles[0].classList.contains('absent')).toBe(true);
            expect(tiles[1].classList.contains('absent')).toBe(true);
        });

        test('should not submit incomplete guess', () => {
            'hel'.split('').forEach(letter => game.addLetter(letter));
            game.submitGuess();
            
            const tiles = document.querySelectorAll('.tile');
            expect(tiles[0].classList.contains('correct')).toBe(false);
            expect(game.currentAttempt).toBe(0);
        });
    });
});
