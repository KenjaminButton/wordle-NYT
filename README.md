# Wordle Clone

A browser-based implementation of the popular word game Wordle.

<div align="center">
  <h1>Kenjamin Button's Wordle Clone</h1>

  <h3>A Modern Implementation of the Popular Word Game</h3>

  <p align="center">
    <h2>
      <a href="https://wordle-nyt.vercel.app/" style="font-size: 24px;">
        🎮 PLAY LIVE DEMO 🎮
      </a>
    </h2>
    <br />
    A thoroughly tested implementation of the NYT Wordle game using HTML, CSS, and JavaScript.
    Complete with comprehensive Jest test coverage and professional development practices.
    <br />
    <a href="https://github.com/KenjaminButton/wordle-NYT"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/KenjaminButton/wordle-NYT/issues">Report Bug</a>
    ·
    <a href="https://github.com/KenjaminButton/wordle-NYT/issues">Request Feature</a>
  </p>
</div>

## About The Project

A modern, web-based implementation of the New York Times' Wordle game. This project features a clean, responsive design, intuitive keyboard interface, and comprehensive test coverage using Jest. Players can enjoy guessing a daily five-letter word with color-coded feedback, backed by robust code quality and testing practices.

### Screenshots

<div align="center">
  <h3>Game Start</h3>
  <img src="images/1.jpg" alt="Game Start Screen" width="600"/>
  
  <h3>In Progress</h3>
  <img src="images/2.jpg" alt="Game in Progress" width="600"/>
  
  <h3>Game Won</h3>
  <img src="images/3.jpg" alt="Game Won Screen" width="600"/>
</div>

## Project Structure
```
wordle-NYT/
├── index.html          # Main game interface
├── styles.css          # Game styling with custom keyboard layout
│                      # - Return key: 110px
│                      # - Space key: 220px
│                      # - Functional ⌫ key
│                      # - Disabled ▲, 123, ☺ keys
├── ui.js              # UI components and keyboard handling
├── ui.test.js         # UI component tests
├── game.js            # Core game logic
├── game.test.js       # Game logic tests
├── jest.setup.js      # Jest configuration
├── lib/               # Supporting libraries
│   └── clean.json     # Word list and definitions
└── package.json       # Project dependencies
```

### Features

#### Game Mechanics
* Five-letter word guessing
* Six attempts per game
* Color-coded feedback system
  * Green: Correct letter in correct position
  * Yellow: Correct letter in wrong position
  * Gray: Letter not in word
* Word definition hints
* Real-time game state tracking

#### User Interface
* Clean and modern design
* Responsive virtual keyboard
* Custom key widths and styling:
  * Return key: 110px width
  * Space key: 220px width
  * Functional backspace key (⌫)
  * Disabled special keys (▲, 123, ☺)
* Interactive tile animations
* Clear game status indicators

#### Technical Implementation
* Pure JavaScript without external dependencies
* Efficient game state management
* Modular code structure
* Fast loading and performance
* Cross-browser compatibility
* Comprehensive Jest test suite
* Test-driven development approach
* 100% core feature test coverage

### Built With

* ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
* ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
* ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
* ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* A modern web browser (Chrome, Firefox, Safari, or Edge)
* A text editor if you want to modify the code (VS Code recommended)
* Node.js and npm for running tests

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/KenjaminButton/wordle-NYT.git
   ```
2. Navigate to the project directory
   ```sh
   cd wordle-NYT
   ```
3. Install dependencies
   ```sh
   npm install
   ```
4. Run tests
   ```sh
   npm test
   ```
5. Open index.html in your web browser
   ```sh
   open index.html
   ```

## Testing

The project uses Jest for comprehensive testing of all game functionality. The test suite covers:

### Game Setup Tests
- Board initialization
- Keyboard layout verification
- Initial state setup
- Word definition display

### Game Mechanics Tests
- Letter input validation
- Backspace functionality
- Word submission
- Color feedback accuracy
- Definition hint system

### Keyboard Interface Tests
- Key layout and styling
- Special key states (disabled/enabled)
- Key width specifications
- Input handling
- Touch event support

### UI Response Tests
- Tile animations
- Color updates
- Keyboard feedback
- Game state indicators
- Screen rotation handling

### Running Tests
```sh
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch
```

All tests are located in `ui.test.js` and use Jest's testing environment with jsdom for DOM manipulation.

## Roadmap

Our development journey followed these major milestones:

### Phase 1: Core Game Implementation 
- [x] Create game board layout
- [x] Implement keyboard interface
- [x] Add game state management
- [x] Develop word validation
- [x] Add color feedback system
- [x] Implement definition hints

### Phase 2: Keyboard Enhancement
- [x] Set return key width to 110px
- [x] Set space key width to 220px
- [x] Enable backspace key functionality
- [x] Disable special keys (▲, 123, ☺)
- [x] Implement touch support
- [x] Add responsive layout

### Phase 3: Testing Implementation
- [x] Set up Jest testing environment
- [x] Test game setup functionality
- [x] Test keyboard interface
- [x] Test word validation
- [x] Test color feedback
- [x] Test definition system
- [x] Achieve 100% test coverage for core features

### Future Enhancements 
- [ ] Add statistics tracking
- [ ] Implement daily word rotation
- [ ] Add share functionality
- [ ] Create dark mode
- [ ] Add accessibility features
- [ ] Support multiple languages

See the [open issues](https://github.com/KenjaminButton/wordle-NYT/issues) for a full list of proposed features and known issues.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Kenneth Chang - [@KenjaminButton](https://kenjaminbutton.com/contact)

Project Link: [https://github.com/KenjaminButton/wordle-NYT](https://github.com/KenjaminButton/wordle-NYT)

## Acknowledgments

* [New York Times Wordle](https://www.nytimes.com/games/wordle) - for inspiration
* [Shields.io](https://shields.io) - for README badges
* [GitHub Pages](https://pages.github.com) - for hosting
