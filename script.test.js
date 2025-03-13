/**
 * @jest-environment jsdom
 */

require('@testing-library/jest-dom');

const WordleGame = require('./script');

describe('WordleGame', () => {
    let game;
    
    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <div id="board">
                <div class="board-row">
                    <div class="tile" data-index="0-0"></div>
                    <div class="tile" data-index="0-1"></div>
                    <div class="tile" data-index="0-2"></div>
                    <div class="tile" data-index="0-3"></div>
                    <div class="tile" data-index="0-4"></div>
                </div>
            </div>
        `;
        
        game = new WordleGame();
        // Mock the word list loading
        game.targetWord = 'hello';
    });

    test('should initialize with empty current guess', () => {
        expect(game.currentGuess).toBe('');
    });

    test('should initialize with empty guesses array', () => {
        expect(game.guesses).toEqual([]);
    });

    test('should validate word length correctly', () => {
        expect(game.isValidWord('hello')).toBe(true);
        expect(game.isValidWord('cat')).toBe(false);
        expect(game.isValidWord('longer')).toBe(false);
    });

    test('should add letter to current guess', () => {
        expect(game.addLetter('a')).toBe(true);
        expect(game.currentGuess).toBe('a');
    });

    test('should not add letter if current guess is at max length', () => {
        game.currentGuess = 'hello';
        expect(game.addLetter('a')).toBe(false);
        expect(game.currentGuess).toBe('hello');
    });

    test('should remove letter from current guess', () => {
        game.currentGuess = 'hello';
        expect(game.removeLetter()).toBe(true);
        expect(game.currentGuess).toBe('hell');
    });

    test('should not remove letter if current guess is empty', () => {
        expect(game.removeLetter()).toBe(false);
        expect(game.currentGuess).toBe('');
    });

    // Test game board rendering
    describe('Game Board', () => {
        test('should render an empty 5x1 board row', () => {
            const tiles = document.querySelectorAll('.tile');
            expect(tiles.length).toBe(5);
            tiles.forEach(tile => {
                expect(tile.textContent).toBe('');
                expect(tile).not.toHaveClass('filled');
            });
        });
    });

    // Test letter input
    describe('Letter Input', () => {
        test('should add letter to current guess and update board', () => {
            const event = new KeyboardEvent('keydown', { key: 'h' });
            document.dispatchEvent(event);
            
            const firstTile = document.querySelector('[data-index="0-0"]');
            expect(firstTile.textContent.toLowerCase()).toBe('h');
            expect(firstTile).toHaveClass('filled');
            expect(game.currentGuess).toBe('h');
        });

        test('should not add more than 5 letters', () => {
            ['h', 'e', 'l', 'l', 'o', 'x'].forEach(letter => {
                const event = new KeyboardEvent('keydown', { key: letter });
                document.dispatchEvent(event);
            });

            const tiles = document.querySelectorAll('.tile');
            expect(game.currentGuess.length).toBe(5);
            expect(tiles[5]?.textContent || '').toBe('');
        });

        test('should remove letter when backspace is pressed', () => {
            // Add some letters first
            ['h', 'e'].forEach(letter => {
                const event = new KeyboardEvent('keydown', { key: letter });
                document.dispatchEvent(event);
            });

            // Press backspace
            const backspace = new KeyboardEvent('keydown', { key: 'Backspace' });
            document.dispatchEvent(backspace);

            expect(game.currentGuess).toBe('h');
            const secondTile = document.querySelector('[data-index="0-1"]');
            expect(secondTile.textContent).toBe('');
            expect(secondTile).not.toHaveClass('filled');
        });
    });
});
