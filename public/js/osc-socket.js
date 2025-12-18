let isToggled = false;

function handleWSMessage(address, args) {
    if(args[0] === 1) {
        const command = address.split('/')[1];
        switch (command) {
            case 'toggle':
                toggleMenu();
                break;
            case 'reset':
                reset();
                break;
            default:
                const trackNum = parseInt(command);
                playTrack(trackNum);
                closeMenu();
                break;
        }
    }
}

function connect() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/osc`);

    ws.addEventListener("open", () => {
        // Connected to WebSocket
    });

    ws.addEventListener("message", (ev) => {
        try {
            const payload = JSON.parse(ev.data);
            if (payload.type === "osc") {
                handleWSMessage(payload.message.address, payload.message.args);
            }
        } catch (e) {
            // Error parsing message
        }
    });

    ws.addEventListener("close", () => {
        setTimeout(connect, 2000);
    });

    ws.addEventListener("error", () => {
        // Let the close handler do the reconnect
    });
}

// let evt = new MouseEvent("click", {
//     bubbles: true,
//     cancelable: true,
//     view: window,
//   });
// document.dispatchEvent(evt);

connect()