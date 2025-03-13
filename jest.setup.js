// Mock DOM environment for testing
global.document = {
    body: {
        innerHTML: `
            <div id="game">
                <h1>Wordle Game MVP</h1>
                <div id="target-word"></div>
                <div id="board"></div>
                <div id="keyboard"></div>
            </div>
        `
    },
    getElementById: jest.fn(),
    createElement: jest.fn(),
    addEventListener: jest.fn()
};

// Mock fetch for testing
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            "stare": "To look fixedly or vacantly",
            "light": "The natural agent that stimulates sight",
            "brain": "The organ inside the head"
        })
    })
);

// Mock window object
global.window = {
    WordleGame: null
};
