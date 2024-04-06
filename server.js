const WebSocket = require("ws");
const net = require("net");

// WebSocket server
const wss = new WebSocket.Server({ port: 3000 });

wss.on("connection", function connection(ws) {
    console.log("WebSocket client connected");

    const client = net.createConnection({ host: "127.0.0.1", port: 6969 });

    ws.on("message", function incoming(message) {
        let type = Buffer.from(message).readUInt8(0);

        if (type !== 50 || message.length !== 13) {
            console.error("Invalid message from WebSocket client");
            return;
        }

        client.write(Buffer.from(message, "utf-8"));
    });

    ws.on("close", function() {
        console.log("WebSocket client disconnected");
        client.end();
    });

    client.on("data", function(data) {
        ws.send(data);
    });

    client.on("end", function() {
        console.log("Unix socket server disconnected");
    });

    client.on("error", function(err) {
        console.error("Unix socket error:", err);
    });
});
