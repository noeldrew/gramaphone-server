// server.js
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const osc = require("osc");
var exec = require('child_process').exec;

const HTTP_PORT = process.env.PORT || 3000;
const OSC_UDP_PORT = Number(process.env.OSC_UDP_PORT) || 57121;
const OSC_UDP_ADDRESS = process.env.OSC_UDP_ADDRESS || "0.0.0.0";

// Default browser command based on platform
const DEFAULT_BROWSER = process.platform === 'darwin'
    ? '/Applications/Chromium.app/Contents/MacOS/Chromium'
    : 'chromium-browser';
const BROWSER_COMMAND = process.env.BROWSER_COMMAND || DEFAULT_BROWSER;

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
server.on('listening', () => console.log('Server is listening on port ' + server.address().port));

const wss = new WebSocketServer({ server, path: "/osc" });

wss.on("connection", (ws) => {
    console.log("====================================");
    console.log("WebSocket client connected!");
    console.log("Total clients:", wss.clients.size);
    console.log("====================================");
    ws.send(JSON.stringify({ type: "status", message: "Connected to OSC bridge" }));

    ws.on("close", () => {
        console.log("WebSocket client disconnected. Remaining:", wss.clients.size - 1);
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
    console.log("====================================");
    console.log("OSC message received:", oscMsg);
    console.log("Connected WebSocket clients:", wss.clients.size);
    console.log("====================================");
    // Relay to all connected browser clients
    broadcast({ type: "osc", message: oscMsg, timeTag, info });
});

udpPort.on("error", (err) => {
    console.error("OSC error:", err);
});

udpPort.open();

function ExecuteChromium() {
    const os = require('os');
    const path = require('path');
    const userDataDir = path.join(os.tmpdir(), 'chromium-gramaphone');

    const flags = [
        '--kiosk',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-features=MediaSessionService',
        '--disable-infobars',
        '--disable-session-crashed-bubble',
        '--no-first-run',
        `--user-data-dir="${userDataDir}"`,
        '--disable-web-security',
        '--allow-file-access-from-files',
        '--remote-debugging-port=9222'  // Enable remote debugging
    ].join(' ');

    const cmd = `"${BROWSER_COMMAND}" ${flags} http://localhost:${HTTP_PORT}`;
    console.log(`Launching browser with flags for media playback...`);
    console.log(`Remote debugging available at: http://localhost:9222`);
    exec(cmd, function(error, stdout, stderr) {
        if (stdout) console.log("stdout: " + stdout);
        if (stderr && !stderr.includes('DevTools listening')) {
            // Only log stderr if it's not just the DevTools message
            console.log("stderr: " + stderr);
        }
        if (error !== null) {
            console.log("Browser launch error: " + error.message);
            console.log("If Chromium is not installed, run: sudo apt install chromium-browser");
            console.log("Or set BROWSER_COMMAND env var to your browser executable");
        } else {
            console.log("Browser launched successfully");
        }
    });
}

server.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`);
    console.log(`Send OSC messages to udp://${OSC_UDP_ADDRESS}:${OSC_UDP_PORT}`);
    ExecuteChromium();
});

process.on("SIGINT", () => {
    console.log("Shutting down...");
    try { udpPort.close(); } catch {}
    server.close(() => process.exit(0));
});