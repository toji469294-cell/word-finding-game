
let words = [];

const levelSettings = {
    easy: {
        words: ["CAT", "DOG", "SUN", "BALL", "BOOK"],
        time: 180
    },
    medium: {
        words: ["APPLE", "GRAPE", "MANGO", "PEACH", "BERRY", "LEMON"],
        time: 240
    },
    hard: {
        words: ["BANANA", "ORANGE", "CHERRY", "COCONUT", "PAPAYA", "MELON", "GRAPE", "LEMON"],
        time: 300
    }
};

const difficultySelect = document.getElementById("difficultySelect");


const gridElement = document.getElementById("grid");
const wordList = document.getElementById("wordList");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const progressElement = document.getElementById("progress");
const messageElement = document.getElementById("message");
const progressBar = document.getElementById("progressBar");

const hintBtn = document.getElementById("hintBtn");
const newGameBtn = document.getElementById("newGameBtn");
const modal = document.getElementById("modal");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const finalScore = document.getElementById("finalScore");
const playAgainBtn = document.getElementById("playAgainBtn");

const SIZE = 10;
let letters = [];
let foundWords = [];
let score = 0;
let timeLeft = 240;
let timerInterval;
let firstCell = null;
let gameOver = false;


function playGameSound(frequency = 600) {
    try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();

        oscillator.connect(volume);
        volume.connect(audio.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        volume.gain.setValueAtTime(0.12, audio.currentTime);
        volume.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.25
        );

        oscillator.start();
        oscillator.stop(audio.currentTime + 0.25);

        oscillator.onended = () => audio.close();
    } catch (error) {
        console.log("Sound is not available.");
    }
}


function createGame() {
    clearInterval(timerInterval);

    letters = Array.from({ length: SIZE }, () =>
        Array(SIZE).fill("")
    );


    const settings = levelSettings[difficultySelect.value];
    words = [...settings.words];

    foundWords = [];
    score = 0;
    timeLeft = settings.time;

    firstCell = null;
    gameOver = false;

    modal.classList.add("hidden");
    messageElement.textContent = "Find the hidden words!";
    scoreElement.textContent = score;

    timerElement.textContent =
        `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;

    placeWords();
    fillEmptyCells();
    drawGrid();
    drawWordList();
    updateProgress();

    timerInterval = setInterval(updateTimer, 1000);
}

function placeWords() {
    words.forEach(word => {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 500) {
            attempts++;

            const row = Math.floor(Math.random() * SIZE);
            const col = Math.floor(Math.random() * SIZE);

            const directions = [
                [0, 1], [1, 0], [1, 1],
                [0, -1], [-1, 0], [-1, -1],
                [1, -1], [-1, 1]
            ];

            const [dr, dc] =
                directions[Math.floor(Math.random() * directions.length)];

            const endRow = row + dr * (word.length - 1);
            const endCol = col + dc * (word.length - 1);

            if (
                endRow < 0 || endRow >= SIZE ||
                endCol < 0 || endCol >= SIZE
            ) continue;

            let canPlace = true;

            for (let i = 0; i < word.length; i++) {
                const r = row + dr * i;
                const c = col + dc * i;

                if (letters[r][c] !== "" && letters[r][c] !== word[i]) {
                    canPlace = false;
                    break;
                }
            }

            if (canPlace) {
                for (let i = 0; i < word.length; i++) {
                    letters[row + dr * i][col + dc * i] = word[i];
                }
                placed = true;
            }
        }
    });
}

function fillEmptyCells() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (letters[r][c] === "") {
                letters[r][c] =
                    alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

function drawGrid() {
    gridElement.innerHTML = "";

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const cell = document.createElement("button");

            cell.className = "cell";
            cell.textContent = letters[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.setAttribute("aria-label", letters[r][c]);

            cell.addEventListener("click", () => selectCell(r, c));

            gridElement.appendChild(cell);
        }
    }
}

function drawWordList() {
    wordList.innerHTML = "";

    words.forEach(word => {
        const item = document.createElement("div");

        item.className = "word-item";
        item.textContent = word;

        if (foundWords.includes(word)) {
            item.classList.add("found");
        }

        wordList.appendChild(item);
    });
}

function selectCell(row, col) {
    if (gameOver) return;

    if (!firstCell) {
        firstCell = { row, col };
        highlightCell(row, col);
        messageElement.textContent = "Now click the last letter of the word.";
        return;
    }

    const start = firstCell;
    firstCell = null;

    const rowDiff = row - start.row;
    const colDiff = col - start.col;

    const straightLine =
        rowDiff === 0 ||
        colDiff === 0 ||
        Math.abs(rowDiff) === Math.abs(colDiff);

    if (!straightLine) {
        messageElement.textContent = "Choose a straight line. Try again!";
        drawGrid();
        return;
    }

    const rowStep = Math.sign(rowDiff);
    const colStep = Math.sign(colDiff);
    const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff)) + 1;

    let selectedWord = "";

    for (let i = 0; i < length; i++) {
        selectedWord += letters[
            start.row + rowStep * i
        ][
            start.col + colStep * i
        ];
    }

    const reversedWord = selectedWord.split("").reverse().join("");

    const matchedWord = words.find(word =>
        (word === selectedWord || word === reversedWord) &&
        !foundWords.includes(word)
    );

    if (matchedWord) {
        foundWords.push(matchedWord);
        playGameSound(750);
        score += matchedWord.length * 10;
        scoreElement.textContent = score;
        messageElement.textContent = "Amazing! You found " + matchedWord + "!";
        drawGrid();
        drawWordList();
        highlightFoundWord(start, rowStep, colStep, length);
        updateProgress();

        if (foundWords.length === words.length) {
            endGame(true);
        }
    } else {
        messageElement.textContent = "Not a hidden word. Try again!";
        drawGrid();
    }
}

function highlightCell(row, col) {
    const cell = gridElement.querySelector(
        `[data-row="${row}"][data-col="${col}"]`
    );

    if (cell) cell.classList.add("selected");
}

function highlightFoundWord(start, rowStep, colStep, length) {
    for (let i = 0; i < length; i++) {
        const r = start.row + rowStep * i;
        const c = start.col + colStep * i;

        const cell = gridElement.querySelector(
            `[data-row="${r}"][data-col="${c}"]`
        );

        if (cell) cell.classList.add("found-cell");
    }
}

function updateProgress() {
    progressElement.textContent = `${foundWords.length}/${words.length}`;

    if (progressBar) {
        progressBar.style.width =
            `${(foundWords.length / words.length) * 100}%`;
    }
}

function updateTimer() {
    if (gameOver) return;

    timeLeft--;

    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");

    timerElement.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
        endGame(false);
    }
}

function showHint() {
    if (gameOver) return;

    const remainingWord = words.find(word => !foundWords.includes(word));

    if (!remainingWord) return;

    score = Math.max(0, score - 5);
    scoreElement.textContent = score;

    const positions = [];

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (letters[r][c] === remainingWord[0]) {
                positions.push({ row: r, col: c });
            }
        }
    }

    messageElement.textContent =
        `Hint: Find "${remainingWord}" — it starts with ${remainingWord[0]}.`;

    if (positions.length > 0) {
        const position = positions[
            Math.floor(Math.random() * positions.length)
        ];

        drawGrid();
        highlightCell(position.row, position.col);
    }
}

function endGame(won) {
    gameOver = true;
    if (won) playGameSound(950);
    clearInterval(timerInterval);

    resultTitle.textContent = won ? "Amazing! You Won!" : "Time's Up!";
    resultText.textContent = won
        ? "You found every hidden word!"
        : `You found ${foundWords.length} out of ${words.length} words.`;

    finalScore.textContent = score;
    modal.classList.remove("hidden");
}

hintBtn.addEventListener("click", showHint);
newGameBtn.addEventListener("click", createGame);
playAgainBtn.addEventListener("click", createGame);

difficultySelect.addEventListener("change", createGame);

createGame();
