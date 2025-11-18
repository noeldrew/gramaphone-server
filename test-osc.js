#!/usr/bin/env node
// test-osc.js - Simple OSC message sender for testing

const osc = require("osc");

const OSC_UDP_PORT = Number(process.env.OSC_UDP_PORT) || 57121;
const OSC_UDP_ADDRESS = process.env.OSC_UDP_ADDRESS || "127.0.0.1";

// Create UDP port to send messages
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 0, // Use any available port
    remoteAddress: OSC_UDP_ADDRESS,
    remotePort: OSC_UDP_PORT
});

udpPort.on("ready", () => {
    console.log(`OSC Test Client ready. Sending to ${OSC_UDP_ADDRESS}:${OSC_UDP_PORT}`);
    console.log("");
    showHelp();
});

udpPort.on("error", (err) => {
    console.error("OSC error:", err);
});

udpPort.open();

function showHelp() {
    console.log("Available commands:");
    console.log("  0-6       - Play track 0-6");
    console.log("  toggle    - Toggle menu");
    console.log("  reset     - Reset player");
    console.log("  help      - Show this help");
    console.log("  quit/exit - Exit test client");
    console.log("");
}

function sendOscMessage(address, value = 1) {
    const message = {
        address: address,
        args: [value]
    };

    console.log(`Sending OSC: ${address} ${value}`);
    udpPort.send(message);
}

// Interactive mode
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "OSC> "
});

rl.prompt();

rl.on("line", (line) => {
    const input = line.trim().toLowerCase();

    if (input === "quit" || input === "exit") {
        console.log("Closing...");
        udpPort.close();
        process.exit(0);
    } else if (input === "help") {
        showHelp();
    } else if (input === "toggle") {
        sendOscMessage("/toggle", 1);
    } else if (input === "reset") {
        sendOscMessage("/reset", 1);
    } else if (input >= "0" && input <= "6") {
        sendOscMessage(`/${input}`, 1);
    } else if (input) {
        console.log(`Unknown command: ${input}`);
        console.log("Type 'help' for available commands");
    }

    rl.prompt();
});

rl.on("close", () => {
    console.log("\nClosing...");
    udpPort.close();
    process.exit(0);
});

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
    // Non-interactive mode - send one message and exit
    setTimeout(() => {
        const cmd = args[0].toLowerCase();
        if (cmd >= "0" && cmd <= "6") {
            sendOscMessage(`/${cmd}`, 1);
        } else {
            sendOscMessage(`/${cmd}`, 1);
        }

        setTimeout(() => {
            udpPort.close();
            process.exit(0);
        }, 100);
    }, 100);
}
