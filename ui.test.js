/**
 * @jest-environment jsdom
 */

const WordleUI = require('./ui.js');
const WordleGame = require('./game.js');

describe('WordleUI', () => {
    let ui;
    let game;
    const testWordData = {
        "stare": "To look fixedly",
        "rates": "Plural of rate",
        "tears": "Drops from eyes"
    };

    beforeEach(() => {
        // Set up document body
        document.body.innerHTML = `
            <div id="board"></div>
            <div id="keyboard"></div>
            <div id="target-word"></div>
        `;
        
        game = new WordleGame(testWordData);
        ui = new WordleUI(game);
    });

    afterEach(() => {
        // Clean up
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Game End Notifications', () => {
        test('should show win notification when game is won', () => {
            // Trigger win notification
            ui.showWinNotification({
                word: 'stare',
                attempts: 3,
                definition: 'To look fixedly'
            });

            // Check if notification is displayed
            const notification = document.querySelector('.win-notification');
            expect(notification).toBeTruthy();
            expect(notification.innerHTML).toContain('CONGRATULATIONS!');
            expect(notification.innerHTML).toContain('You won in 3 tries!');
            expect(notification.innerHTML).toContain('STARE');
            expect(notification.innerHTML).toContain('To look fixedly');
        });

        test('should show lose notification when game is lost', () => {
            // Trigger lose notification
            ui.showLoseNotification({
                word: 'stare',
                definition: 'To look fixedly'
            });

            // Check if notification is displayed
            const notification = document.querySelector('.lose-notification');
            expect(notification).toBeTruthy();
            expect(notification.innerHTML).toContain('GAME OVER!');
            expect(notification.innerHTML).toContain('STARE');
            expect(notification.innerHTML).toContain('To look fixedly');
        });

        test('should remove existing notification before showing new one', () => {
            // Show win notification
            ui.showWinNotification({
                word: 'stare',
                attempts: 3,
                definition: 'To look fixedly'
            });

            // Show lose notification
            ui.showLoseNotification({
                word: 'rates',
                definition: 'Plural of rate'
            });

            // Check that only lose notification exists
            const winNotification = document.querySelector('.win-notification');
            const loseNotification = document.querySelector('.lose-notification');
            expect(winNotification).toBeNull();
            expect(loseNotification).toBeTruthy();
        });

        test('should remove notification when close button is clicked', () => {
            // Show win notification
            ui.showWinNotification({
                word: 'stare',
                attempts: 3,
                definition: 'To look fixedly'
            });

            // Find and click close button
            const closeButton = document.querySelector('.win-notification button');
            closeButton.click();

            // Check that notification is removed
            const notification = document.querySelector('.win-notification');
            expect(notification).toBeNull();
        });

        test('should handle singular/plural tries correctly in win message', () => {
            // Test singular (1 try)
            ui.showWinNotification({
                word: 'stare',
                attempts: 1,
                definition: 'To look fixedly'
            });
            let notification = document.querySelector('.win-notification');
            expect(notification.innerHTML).toContain('You won in 1 try!');

            // Remove first notification
            notification.remove();

            // Test plural (2 tries)
            ui.showWinNotification({
                word: 'stare',
                attempts: 2,
                definition: 'To look fixedly'
            });
            notification = document.querySelector('.win-notification');
            expect(notification.innerHTML).toContain('You won in 2 tries!');
        });
    });
});
