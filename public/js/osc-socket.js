function handleWSMessage(address, args) {
    if(args[0] === 1) {
        console.log(address);
        switch (address.split('/')[1]) {
            case 'toggle':
                toggleMenu();
                break;
            case 'reset':
                reset();
                break;
            default:
                playTrack(parseInt(address.split('/')[1]));
                break;

        }
    }
}

function connect() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/osc`);

    ws.addEventListener("open", () => {
        console.log("Connected", true);
    });

    ws.addEventListener("message", (ev) => {
        try {
            const payload = JSON.parse(ev.data);
            if (payload.type === "osc") {
                handleWSMessage(payload.message.address, payload.message.args);
            } else if (payload.type === "status") {
                //handleWSMessage(payload.message);
            } else {
                //handleWSMessage(ev.data);
            }
        } catch (e) {
            //handleWSMessage(ev.data);
        }
    });

    ws.addEventListener("close", () => {
        console.log("Disconnected. Reconnecting in 2s…", false);
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