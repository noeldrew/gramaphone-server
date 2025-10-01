// server.js
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const osc = require("osc");

const HTTP_PORT = process.env.PORT || 3000;
const OSC_UDP_PORT = Number(process.env.OSC_UDP_PORT) || 57121;
const OSC_UDP_ADDRESS = process.env.OSC_UDP_ADDRESS || "0.0.0.0";

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/osc" });

wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.send(JSON.stringify({ type: "status", message: "Connected to OSC bridge" }));

    ws.on("close", () => {
        console.log("WebSocket client disconnected");
    });
});

function broadcast(obj) {
    const data = JSON.stringify(obj);
    for (const client of wss.clients) {
        if (client.readyState === 1) {
            client.send(data);
        }
    }
}

const udpPort = new osc.UDPPort({
    localAddress: OSC_UDP_ADDRESS,
    localPort: OSC_UDP_PORT
    // metadata: true // Uncomment if you want typed args like { type, value }
});

udpPort.on("ready", () => {
    console.log(`OSC UDP listening on ${OSC_UDP_ADDRESS}:${OSC_UDP_PORT}`);
});

udpPort.on("message", (oscMsg, timeTag, info) => {
    console.log("OSC message:", oscMsg);
    // Relay to all connected browser clients
    broadcast({ type: "osc", message: oscMsg, timeTag, info });
});

udpPort.on("error", (err) => {
    console.error("OSC error:", err);
});

udpPort.open();

server.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`);
    console.log(`Send OSC messages to udp://${OSC_UDP_ADDRESS}:${OSC_UDP_PORT}`);
});

process.on("SIGINT", () => {
    console.log("Shutting down...");
    try { udpPort.close(); } catch {}
    server.close(() => process.exit(0));
});