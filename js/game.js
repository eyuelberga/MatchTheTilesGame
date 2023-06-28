const MOVE_STATE = {
    INCORRECT: "INCORRECT",
    CORRECT: "CORRECT",
    INCOMPLETE: "INCOMPLETE",
    INVALID: "INVALID"
};

class DOMUtils {
    static get(selector) {
        return document.querySelector(selector);
    }
    static getAll(selector) {
        return document.querySelectorAll(selector);
    }
    static removeCls(selector, cl) {
        var elem = document.querySelector(selector);
        if (elem && elem.classList.contains(cl) === true) {
            elem.classList.remove(cl);
        }
    }
    static addCls(selector, cl) {
        var elem = document.querySelector(selector);
        if (elem && elem.classList.contains(cl) !== true) {
            elem.classList.add(cl);
        }
    }
    static update(selector, value) {
        var elem = document.querySelector(selector);
        if (elem) {
            if (elem.tagName === "INPUT") {
                elem.setAttribute("value", value);
            }
            else {
                elem.innerHTML = value;
            }
            return true;
        }
        return false;
    }

    static formatTime(totalSeconds) {
        if (typeof totalSeconds !== "number") return totalSeconds;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const seconds = (totalSeconds % 60).toString();
        const hours = Math.floor(totalMinutes / 60).toString();
        const minutes = (totalMinutes % 60).toString();
        const zeroPad = (value) => value.length === 1 ? value.padStart(2, "0") : value;

        return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}`;
    }
}

class Tile {
    constructor(value) {
        this.playable = true;
        this.value = value;
    }
}

class Board {
    #state = [];
    #size = 16;
    #lastIndex = null;
    #currentIndex = null;
    #time = 0;
    #allowedTime = null;
    #allowedWrongTries = null;
    #wrongTries = 0;
    #timeInterval = null;
    constructor(config) {
        if (config) this.#configure(config);
        this.#init();
    }
    #init() {
        const shuffle = function (array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        };
        const firstHalf = [...Array(this.#size / 2).keys()];
        const secondHalf = [...firstHalf];
        shuffle(firstHalf);
        shuffle(secondHalf);
        this.#state = [...firstHalf, ...secondHalf].map((value) => new Tile(value));
        this.#timeInterval = setInterval(() => { this.#time += 1; }, 1000);
    }
    #configure(config) {
        if (config.time) {
            this.#allowedTime = config.time;
        }
        if (config.tries) {
            this.#allowedWrongTries = config.tries;
        }
        if (config.size) {
            if (config.size % 2 === 0)
                this.#size = config.size;
            else this.#size = config.size + 1;
        }
    }
    #isSecondMove(index) {
        return this.#lastIndex !== null && this.#lastIndex !== index;
    }
    #isPlayable(index) {
        return this.#state[index].playable;
    }
    isGameOver() {
        const won = this.#state.every(tile => tile.playable === false);
        let timeUp = false;
        let maxTries = false;
        if (this.#allowedTime) {
            timeUp = this.#allowedTime - this.#time <= 0;
        }

        if (this.#allowedWrongTries) {
            maxTries = this.#wrongTries >= this.#allowedWrongTries;
        }
        const gameOver = won || timeUp || maxTries;
        if (gameOver) {
            clearInterval(this.#timeInterval);
        }
        let message = "";
        if (timeUp) {
            message = "Time is up!";
        }
        if (maxTries) {
            message = "Maximum Tries Excedded!";
        }
        if (won) {
            message = "You Won!";
        }
        return [gameOver, message, won];

    }
    makeMove(index) {
        this.#currentIndex = index;
        if (!this.#isPlayable(index)) return MOVE_STATE.INVALID;
        if (this.#isSecondMove(index)) {
            const lastValue = this.#state[this.#lastIndex].value;
            const newValue = this.#state[index].value;
            // got a match
            if (lastValue === newValue) {
                this.#state[this.#lastIndex].playable = false;
                this.#state[index].playable = false;
                this.#lastIndex = null;
                return MOVE_STATE.CORRECT;
            }
            // reset last index
            this.#lastIndex = null;
            this.#wrongTries += 1;
            return MOVE_STATE.INCORRECT;
        }
        else {
            this.#lastIndex = index;
            return MOVE_STATE.INCOMPLETE;
        }
    }
    getTime() {
        return this.#time;
    }
    getState() {
        return this.#state.map(tile => tile.playable);
    }
    getTileValue(index) {
        return this.#state[index].value;
    }
    getAllowedTime() {
        return this.#allowedTime || "Infinity";
    }
    getAllowedTries() {
        return this.#allowedWrongTries || "Unlimited";
    }
    getWrongTriesLeft() {
        if (this.#allowedWrongTries)
            return this.#allowedWrongTries - this.#wrongTries;
        return "Infinity";
    }
    getSize() {
        return this.#size;
    }
    getLastIndex() {
        return this.#lastIndex
    }
    getCurrentIndex() {
        return this.#currentIndex;
    }
}

class Player {
    #board = null;
    #wrongTries = 0;
    #correctTries = 0;
    #streak = 0;
    constructor(board) {
        this.#board = board;
    }
    move(index) {
        const moveState = this.#board.makeMove(index);
        switch (moveState) {
            case MOVE_STATE.CORRECT:
                this.#correctTries += 1;
                this.#streak += 1;
                break;
            case MOVE_STATE.INCORRECT:
                this.#streak = 0;
                this.#wrongTries += 1;
                break;
        }
    }

    getWrongTries() {
        return this.#wrongTries;
    }

    getCorrectTries() {
        return this.#correctTries;
    }

    getTotalTries() {
        return this.#wrongTries + this.#correctTries;
    }
    getStreak() {
        return this.#streak;
    }
    getPoints() {
        return this.#streak + this.#correctTries;
    }

}

const UI_ELEMENTS = {
    GAME_STATS_SIZE: "#stat-size",
    GAME_STATS_WRONG_TRIES: "#stat-wrong-tries",
    GAME_STATS_STREAK: "#stat-streak",
    GAME_STATS_TOTAL_POINTS: "#stat-total-points",
    GAME_STATS_WRONG_TRIES_LEFT: "#stat-wrong-tries-left",
    GAME_STATS_REMANING_TIME: "#stat-time-remaning",
    GAME_STATS_TIME: "#stat-time",
    TILES_BOARD: "#tiles-board",
    GAME_BOARD: ".game-board",
    GAMEOVER_FORM: "#gameover-form",
    SCORE_REGISTER_FORM: "#score-registration",
    GAMEOVER_MESSAGE: "#gameover-message",
    END_GAME_STATS_TIME: "#end-game-stat-time",
    END_GAME_STATS_WRONG_TRIES: "#end-game-stat-wrong-tries",
    END_GAME_STATS_STREAK: "#end-game-stat-streak",
    END_GAME_STATS_TOTAL_POINTS: "#end-game-stat-total-points",
    END_GAME_CONFIG_SIZE: "#end-game-config-size",
    END_GAME_CONFIG_TYPE: "#end-game-config-type",
    END_GAME_CONFIG_TRIES: "#end-game-config-tries",
    END_GAME_CONFIG_TIME: "#end-game-config-time",
    GAME_START_FORM: "#game-start-form",
    GAME_TYPE_SELECTOR: "#game-start-form > select[name=type]",
    GAMEOVER_FORM: "#gameover-form",
    RESTART_GAME_BUTTON: "#restart-button",
    END_GAME_BUTTON: "#end-button",
    NEW_GAME_BUTTON: "#new-game-button"
}

class Game {
    #board = null;
    #config = null;
    #player = null;
    #remaningTimeCounter = null;
    #timeCounter = null
    constructor(config) {
        this.#config = config;
        this.#board = new Board(config);
        this.#player = new Player(this.#board);
    }
    #init() {
        this.#updateStats();
        this.#timeCounter = setInterval(() => { DOMUtils.update(UI_ELEMENTS.GAME_STATS_TIME, DOMUtils.formatTime(this.#board.getTime())) }, 1000);
        if (typeof this.#board.getAllowedTime() === "number") {
            this.#remaningTimeCounter = setInterval(() => {
                const remaningTime = this.#board.getAllowedTime() - this.#board.getTime();
                if (remaningTime < 1) {
                    this.#validateGameover();
                }
                DOMUtils.update(UI_ELEMENTS.GAME_STATS_REMANING_TIME, DOMUtils.formatTime(remaningTime));
            }, 1000);
        }
        this.#generateBoard();
    }

    #generateBoard() {
        const board = DOMUtils.get(UI_ELEMENTS.TILES_BOARD);
        board.replaceChildren();
        this.#board.getState().forEach((_, index) => {
            const tile = document.createElement("div");
            tile.setAttribute("class", "tile tile-hidden");
            tile.setAttribute("id", `tile_${index}`);;
            tile.appendChild(document.createTextNode("x"));
            tile.addEventListener("click", () => {
                this.#player.move(index);
                this.#redraw();
            })
            board.appendChild(tile);
        });
    }
    #updateStats() {
        DOMUtils.update(UI_ELEMENTS.GAME_STATS_WRONG_TRIES, this.#player.getWrongTries());
        DOMUtils.update(UI_ELEMENTS.GAME_STATS_STREAK, this.#player.getStreak());
        DOMUtils.update(UI_ELEMENTS.GAME_STATS_TOTAL_POINTS, this.#player.getPoints());
        DOMUtils.update(UI_ELEMENTS.GAME_STATS_WRONG_TRIES_LEFT, this.#board.getWrongTriesLeft());
        DOMUtils.update(UI_ELEMENTS.GAME_STATS_SIZE, this.#board.getSize());
        DOMUtils.update(UI_ELEMENTS.GAME_STATS_WRONG_TRIES_LEFT, this.#board.getWrongTriesLeft());
    }

    #redraw() {
        this.#updateStats();
        const currentIndex = this.#board.getCurrentIndex();
        const lastIndex = this.#board.getLastIndex();
        const currentIndexSelector = `#tile_${currentIndex}`;
        const value = this.#board.getTileValue(currentIndex);
        DOMUtils.update(currentIndexSelector, value);
        DOMUtils.removeCls(currentIndexSelector, "tile-hidden");
        this.#board.getState().forEach((playable, index) => {
            const selector = `#tile_${index}`;
            if (lastIndex === null && playable) {
                setTimeout(() => {
                    DOMUtils.addCls(selector, "tile-hidden");
                    DOMUtils.update(selector, "x");
                }, 500);
            }
            if (!playable) {
                DOMUtils.removeCls(selector, "tile-hidden");
                DOMUtils.addCls(selector, "tile-matched");
            }
            this.#validateGameover();
        });

    }
    #validateGameover() {
        const [gameOver, message, won] = this.#board.isGameOver();
        if (won) {
            DOMUtils.get(UI_ELEMENTS.SCORE_REGISTER_FORM).removeAttribute("style");
        }
        if (gameOver) {
            DOMUtils.get(UI_ELEMENTS.GAME_BOARD).style.display = "none";
            DOMUtils.get(UI_ELEMENTS.GAMEOVER_FORM).removeAttribute("style");
            DOMUtils.update(UI_ELEMENTS.END_GAME_STATS_TIME, DOMUtils.formatTime(this.#board.getTime()));
            DOMUtils.update(UI_ELEMENTS.END_GAME_STATS_WRONG_TRIES, this.#player.getWrongTries());
            DOMUtils.update(UI_ELEMENTS.END_GAME_STATS_STREAK, this.#player.getStreak());
            DOMUtils.update(UI_ELEMENTS.END_GAME_STATS_TOTAL_POINTS, this.#player.getPoints());
            DOMUtils.update(UI_ELEMENTS.END_GAME_CONFIG_TYPE, this.#config.type);
            DOMUtils.update(UI_ELEMENTS.END_GAME_CONFIG_SIZE, this.#board.getSize());
            DOMUtils.update(UI_ELEMENTS.END_GAME_CONFIG_TRIES, this.#board.getAllowedTries());
            DOMUtils.update(UI_ELEMENTS.END_GAME_CONFIG_TIME, DOMUtils.formatTime(this.#board.getAllowedTime()));
            DOMUtils.update(UI_ELEMENTS.GAMEOVER_MESSAGE, message);

            // clear intervals 
            if (this.#remaningTimeCounter) clearInterval(this.#remaningTimeCounter);
            if (this.#timeCounter) clearInterval(this.#timeCounter);
        }
    }
    start() {
        this.#init();
    }
    restart() {
        this.#board = new Board(this.#config)
        this.#player = new Player(this.#board);
        this.#init();
    }


}

let game = null;
DOMUtils.get(UI_ELEMENTS.GAME_TYPE_SELECTOR).addEventListener("change", this.toggleCustomOptionsHandler);
DOMUtils.get(UI_ELEMENTS.GAME_START_FORM).addEventListener("submit", this.startGameHandler);
DOMUtils.get(UI_ELEMENTS.GAMEOVER_FORM).addEventListener("submit", this.registerScoreHandler);
DOMUtils.get(UI_ELEMENTS.RESTART_GAME_BUTTON).addEventListener("click", this.restartGameHandler);
DOMUtils.get(UI_ELEMENTS.END_GAME_BUTTON).addEventListener("click", this.endGameHandler);
DOMUtils.get(UI_ELEMENTS.NEW_GAME_BUTTON).addEventListener("click", this.newGameHandler);

function toggleCustomOptionsHandler(e) {
    const gameType = e.target.value;
    const CUSTOM_OPTIONS_SELECTOR = "#custom-options";
    const CustomOptions = DOMUtils.get(CUSTOM_OPTIONS_SELECTOR);
    if (gameType === "custom") {
        CustomOptions.setAttribute("style", "display:block;");
        DOMUtils.getAll("#custom-options .required ").forEach(e => e.setAttribute("required", true));
    }
    else {
        CustomOptions.setAttribute("style", "display:none;");
        DOMUtils.getAll("#custom-options .required").forEach(e => e.removeAttribute("required"));

    }
}
function startGameHandler(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const type = formData.get("type");
    const config = {
        type,
        size: null,
        tries: null,
        time: null,
    };
    switch (type) {
        case "one-minute":
            config.time = 60;
            break;
        case "custom":
            config.size = parseInt(formData.get("size"));
            config.tries = parseInt(formData.get("tries"));
            config.time = parseInt(formData.get("time"));
    }
    e.target.style.display = "none";
    game = new Game(config);
    DOMUtils.get(UI_ELEMENTS.GAME_BOARD).removeAttribute("style");
    DOMUtils.get(UI_ELEMENTS.SCORE_REGISTER_FORM).style.display = "none";
    game.start();
}
function registerScoreHandler(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = { date: new Date().toLocaleDateString("en-US") };
    for (const [key, value] of formData.entries()) {
        payload[key] = value;
    }
    // TODO change with indexedDB
    const scoreBoard = localStorage.getItem("scoreboard");
    try {
        previousScores = JSON.parse(scoreBoard).data;
        localStorage.setItem("scoreboard", JSON.stringify({ data: [payload, ...previousScores] }));
    }
    catch (e) {
        localStorage.setItem("scoreboard", JSON.stringify({ data: [payload] }));
    }
    newGameHandler();
    window.location.assign("scoreboard.html");

}
function restartGameHandler() {
    if (confirm("Are you sure you want to restart game?")) {
        game.restart();
    }
}
function newGameHandler() {
    game = null;
    DOMUtils.get(UI_ELEMENTS.GAMEOVER_FORM).style.display = "none";
    DOMUtils.get(UI_ELEMENTS.GAME_BOARD).style.display = "none";
    DOMUtils.get(UI_ELEMENTS.GAME_START_FORM).removeAttribute("style");
}
function endGameHandler() {
    if (confirm("Are you sure you want to end game?")) {
        newGameHandler();
    }
}


