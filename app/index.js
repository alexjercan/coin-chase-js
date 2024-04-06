let ALLOW_HACKING = false;

const minX = 0;
const maxX = 16;
const minY = 0;
const maxY = 12;
const cellSize = 50;
const screenWidth = maxX * cellSize;
const screenHeight = maxY * cellSize;

class Player {
    constructor(id) {
        this.id = id;
        this.score = 0;
        this.x = 0;
        this.y = 0;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }

    updateScore(score) {
        this.score = score;
    }

    draw(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, cellSize, cellSize);
        ctx.fillStyle = "black";
        ctx.fillText(this.score, this.x + 10, this.y + 20);
    }
}

class Coin {
    constructor() {
        this.radius = 10;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx) {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(this.x + cellSize / 2, this.y + cellSize / 2, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}

const rootDiv = document.getElementById("root");
rootDiv.style.display = "flex";
rootDiv.style.flexDirection = "column";
rootDiv.style.alignItems = "center";

const connectionDiv = document.createElement("div");
connectionDiv.style.display = "flex";
connectionDiv.style.flexDirection = "row";
connectionDiv.style.alignItems = "center";

const connectInput = document.createElement("input");
connectInput.setAttribute("type", "text");
connectInput.setAttribute("placeholder", "IP:Port");
connectionDiv.appendChild(connectInput);

const connectButton = document.createElement("button");
connectButton.innerText = "Connect";
connectionDiv.appendChild(connectButton);

rootDiv.appendChild(connectionDiv);

const gameCanvas = document.createElement("canvas");
gameCanvas.width = screenWidth;
gameCanvas.height = screenHeight;
rootDiv.appendChild(gameCanvas);

const ctx = gameCanvas.getContext("2d");

let players = [];
let client = null;

let buffer = new Uint8Array();
let playerId = null;
let coin = new Coin();

function sendPlayerInput(w, a, s, d) {
    if (client) {
        const buffer = new Uint8Array(13);
        const view = new DataView(buffer.buffer);

        view.setInt8(0, 50);
        view.setBigInt64(1, playerId, false);
        view.setInt8(9, a);
        view.setInt8(10, d);
        view.setInt8(11, w);
        view.setInt8(12, s);

        client.send(buffer);
    }
}

function handleBlobData(blob) {
    blob.arrayBuffer().then((data) => {
        buffer = new Uint8Array([...buffer, ...new Uint8Array(data)]);

        while (buffer.length > 0) {
            const type = buffer[0];

            if (type == 48) { // player position
                if (buffer.length < 25) {
                    break;
                }

                const id = buffer.slice(1, 9);
                const x = buffer.slice(9, 17);
                const y = buffer.slice(17, 25);

                const idView = new DataView(id.buffer);
                const xView = new DataView(x.buffer);
                const yView = new DataView(y.buffer);

                const playerId = idView.getBigInt64(0, false);
                const player = players.find((player) => player.id === playerId);

                if (player) {
                    player.update(Number(xView.getBigInt64(0, false)), Number(yView.getBigInt64(0, false)));
                }

                buffer = buffer.slice(25);
            } else if (type === 49) { // coin position
                if (buffer.length < 17) {
                    break;
                }

                const x = buffer.slice(1, 9);
                const y = buffer.slice(9, 17);

                const xView = new DataView(x.buffer);
                const yView = new DataView(y.buffer);

                coin.update(Number(xView.getBigInt64(0, false)), Number(yView.getBigInt64(0, false)));

                buffer = buffer.slice(17);
            } else if (type === 51) { // player connected
                if (buffer.length < 9) {
                    break;
                }

                const id = buffer.slice(1, 9);

                const idView = new DataView(id.buffer);

                const playerId = idView.getBigInt64(0, false);

                players.push(new Player(playerId));

                buffer = buffer.slice(9);

                console.log("Player connected with id:", playerId);
            } else if (type === 52) { // player authorize
                if (buffer.length < 9) {
                    break;
                }

                const id = buffer.slice(1, 9);

                const idView = new DataView(id.buffer);

                playerId = idView.getBigInt64(0, false);

                players.push(new Player(playerId));

                buffer = buffer.slice(9);

                console.log("Player authorized with id:", playerId);
            } else if (type === 53) { // player score
                if (buffer.length < 17) {
                    break;
                }

                const id = buffer.slice(1, 9);
                const score = buffer.slice(9, 17);

                const idView = new DataView(id.buffer);
                const scoreView = new DataView(score.buffer);

                const playerId = idView.getBigInt64(0, false);
                const player = players.find((player) => player.id === playerId);

                if (player) {
                    player.updateScore(scoreView.getBigInt64(0, false));
                }

                buffer = buffer.slice(17);
            } else if (type === 54) { // player disconnected
                if (buffer.length < 9) {
                    break;
                }

                const id = buffer.slice(1, 9);

                const idView = new DataView(id.buffer);

                const playerId = idView.getBigInt64(0, false);

                players = players.filter((player) => player.id !== playerId);

                buffer = buffer.slice(9);

                console.log("Player disconnected with id:", playerId);
            } else if (type === 55) { // player fight win
                if (buffer.length < 9) {
                    break;
                }

                const id = buffer.slice(1, 9);

                const idView = new DataView(id.buffer);

                const playerId = idView.getBigInt64(0, false);

                buffer = buffer.slice(9);

                console.log("Player won against player with id:", playerId);
            } else if (type === 56) { // player fight lose
                if (buffer.length < 9) {
                    break;
                }

                const id = buffer.slice(1, 9);

                const idView = new DataView(id.buffer);

                const playerId = idView.getBigInt64(0, false);

                buffer = buffer.slice(9);

                console.log("Player lost against player with id:", playerId);
            } else if (type === 57) { // id player won round
                if (buffer.length < 9) {
                    break;
                }

                const id = buffer.slice(1, 9);

                const idView = new DataView(id.buffer);

                const playerId = idView.getBigInt64(0, false);

                buffer = buffer.slice(9);

                console.log("Player won round:", playerId);
            } else {
                console.error("Unknown type:", type);
                break;
            }
        }
    });
}

connectButton.onclick = () => {
    if (client) {
        client.close();
    }

    players = [];
    playerId = null;

    client = new WebSocket("ws://" + connectInput.value);
    client.onopen = () => {
        console.log("Connected to server");
    };

    client.onmessage = (event) => {
        const data = event.data;
        handleBlobData(data);
    };

    client.onclose = () => {
        console.log("Disconnected from server");
    };
}

let a = 0, w = 0, s = 0, d = 0, space = 0;
document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (key === "w") {
        w = 1;
    } else if (key === "a") {
        a = 1;
    } else if (key === "s") {
        s = 1;
    } else if (key === "d") {
        d = 1;
    } else if (key === " ") {
        space = 1;
    }
});

function hackPlayerInput() {
    let player = players.find((player) => player.id === playerId);

    let xDiff = (coin.x - player.x) / cellSize;
    let yDiff = (coin.y - player.y) / cellSize;

    if (xDiff >= 0) {
        for (let i = 0; i < xDiff; i++) {
            sendPlayerInput(0, 0, 0, 1);
        }
    } else {
        for (let i = 0; i < -xDiff; i++) {
            sendPlayerInput(0, 1, 0, 0);
        }
    }

    if (yDiff >= 0) {
        for (let i = 0; i < yDiff; i++) {
            sendPlayerInput(0, 0, 1, 0);
        }
    } else {
        for (let i = 0; i < -yDiff; i++) {
            sendPlayerInput(1, 0, 0, 0);
        }
    }
};

function draw() {
    ctx.clearRect(0, 0, screenWidth, screenHeight);

    if (playerId !== null) {
        if (space === 1 && ALLOW_HACKING) {
            hackPlayerInput();
        } else {
            sendPlayerInput(w, a, s, d);
        }
    }

    w = 0;
    a = 0;
    s = 0;
    d = 0;
    space = 0;

    players.forEach((player) => {
        if (player.id === playerId) {
            player.draw(ctx, "green");
        } else {
            player.draw(ctx, "red");
        }
    });

    coin.draw(ctx);

    requestAnimationFrame(draw);
}

draw();
