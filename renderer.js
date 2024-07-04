import { Command, Widget, application } from "./windcast.js";

function loadJS(FILE_URL, async = true) {
    let scriptEle = document.createElement("script");

    // Ensure the FILE_URL is sanitized
    if (
        typeof FILE_URL !== "string" ||
        !/^\.\/packages\/[\w\-\/\.]+\.js$/.test(FILE_URL)
    ) {
        console.error("Invalid file URL");
        return;
    }

    scriptEle.setAttribute("src", FILE_URL);
    scriptEle.setAttribute("type", "module");
    scriptEle.setAttribute("async", async);

    document.body.appendChild(scriptEle);

    // success event
    scriptEle.addEventListener("load", () => {
        console.log("File loaded");
    });
    // error event
    scriptEle.addEventListener("error", (ev) => {
        console.log("Error on loading file", ev);
    });
}

window.commands = [];
window.persistentItems = [];

window.electronAPI.loadPackages((packages) => {
    console.log(packages);
    packages.forEach((pkg) => {
        loadJS("./packages/" + pkg.filePath, false);
        console.log("loaded ./packages/" + pkg.filePath);
    });
});

window.electronAPI.updateApps((apps) => {
    apps.forEach((app) => {
        let aliasList = app.appName
            .replace(/[^a-zA-Z\s]+/g, "") // Remove non-alphabetic characters except spaces
            .trim() // Trim leading/trailing whitespace
            .split(/\s+/) // Split by whitespace into words
            .filter((word) => word.length > 1) // Filter out single-letter words
            .map((word) => new RegExp(word.toLowerCase(), "i")); // Create RegExp objects
        const command = new Command(
            app.appName,
            app.appPublisher,
            () => {
                window.electronAPI.openApp(app);
            },
            app.iconPath,
            ["Uninstall"],
            aliasList
        );
        window.commands.push(command);
        console.log(command);
    });

    document.getElementById("load").style.display = "none";
});

// Display command menu based on query
function displayCommandMenu(query) {
    console.log(window.commands);
    const resultsList = document.getElementById("resultsList");
    const results = window.commands.filter((command) => command.matches(query));
    resultsList.innerHTML = "";
    let items = 0;
    if (results.length > 0) {
        results.splice(5);
        let widget = false;
        results.forEach((item, index) => {
            let menuItem;
            if (item instanceof Command) {
                menuItem = item.createMenuItem(query, index);
                items += 1;
            } else if (item instanceof Widget) {
                if (widget == false) {
                    menuItem = item.createWidgetItem(query);
                    widget = true;
                }
            }
            resultsList.appendChild(menuItem);
        });
        window.electronAPI.setSize(
            68 +
                items * 52 +
                (widget ? 160 : 0) +
                window.persistentItems.length * 52 +
                46
        );
    } else {
        window.electronAPI.setSize(
            68 + window.persistentItems.length * 52 + 40
        );
    }

    let other = document.createElement("li");
    other.innerHTML =
        "<span>Other actions</span> <button style='float:right' class='btn-borderless'>See more</button>";
    other.classList.add("wc--list-separator");
    resultsList.appendChild(other);
    window.persistentItems.forEach((action, index) => {
        let menuItem = action.createMenuItem(query, items + index);
        resultsList.appendChild(menuItem);
    });
}

function displayRecentItems() {
    const resultsList = document.getElementById("resultsList");
    resultsList.innerHTML = "";
    let recent = document.createElement("li");
    recent.innerHTML =
        "<span>Recent searches</span><button style='float:right' class='btn-borderless' onclick='localStorage.setItem(\"history\", \"[]\");location.reload();'>Clear</button> <button style='float:right' class='btn-borderless'>See more</button>";
    recent.classList.add("wc--list-separator");
    resultsList.appendChild(recent);
    let index = 0;
    console.log(JSON.parse(localStorage.getItem("history")));
    JSON.parse(localStorage.getItem("history"))
        .sort(function (x, y) {
            return y.timestamp - x.timestamp;
        })
        .forEach((cmd) => {
            if (index < 3) {
                const deserializedCommand = new Command(
                    cmd.query,
                    cmd.item.displayName,
                    () => {
                        displayCommandMenu(cmd.query);
                        input.value = cmd.query;
                        input.dispatchEvent(new Event("input"));
                    },
                    "./assets/extensions/search.png",
                    [],
                    []
                );

                resultsList.appendChild(
                    deserializedCommand.createMenuItem(cmd.query)
                );
                index += 1;
            }
        });
    window.electronAPI.setSize(68 + index * 52 + 40);
}
// Example input event listener
const input = document.getElementById("input");

input.focus();
input.addEventListener("input", async () => {
    const query = input.value.toLowerCase();
    if (query !== "") {
        document.getElementById("x").classList.add("hidden");
        document.getElementById("send").classList.remove("hidden");
        displayCommandMenu(query);
    } else {
        document.getElementById("send").classList.add("hidden");
        document.getElementById("x").classList.remove("hidden");
        displayRecentItems();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("load").style.display = "block";
    displayRecentItems();
});
let stateCheck = setInterval(() => {
    if (document.readyState === "complete") {
        clearInterval(stateCheck);
        window.electronAPI.askApps();
    }
}, 100);

document.onkeydown = function (evt) {
    evt = evt || window.event;
    if (evt.key === "Escape" || evt.key === "Esc" || evt.keyCode === 27) {
        if (window.inPage) {
            application.goBackHome();
        } else {
            window.electronAPI.closeWindow();
        }
    }
};

document.getElementById("close").onclick = () => {
    if (input.value == "") {
        window.electronAPI.closeWindow();
    } else {
        input.value = "";
        displayRecentItems();
        input.dispatchEvent(new Event("input"));
    }
};

const resultsList = document.getElementById("resultsList");

document.addEventListener("keydown", function (e) {
    const active = resultsList.querySelector(".active");
    if (e.key === "ArrowDown") {
        if (active) {
            let next = active.nextElementSibling;
            while (next && !next.classList.contains("wc--list-item")) {
                next = next.nextElementSibling;
            }
            if (next) {
                active.classList.remove("active");
                next.classList.add("active");
                active.blur();
                next.focus();
            }
        } else {
            let first = resultsList.querySelector(".wc--list-item, .flex");
            if (first) {
                first.classList.add("active");
            }
        }
    } else if (e.key === "ArrowUp") {
        if (active) {
            let prev = active.previousElementSibling;
            while (prev && !prev.classList.contains("wc--list-item")) {
                prev = prev.previousElementSibling;
            }
            if (prev) {
                active.classList.remove("active");
                prev.classList.add("active");
                active.blur();
                prev.focus();
            } else {
                active.blur();
            }
        }
    } else if (e.key === "Enter") {
        if (active) {
            active.click();
        } else {
            let first = resultsList.querySelector(".wc--list-item");
            if (first) {
                first.click();
            }
        }
    }
});
window.onscroll = function () {
    scrollFunction();
};
function scrollFunction() {
    if (
        document.body.scrollTop > 80 ||
        document.documentElement.scrollTop > 80
    ) {
        const navs = document.querySelectorAll(".flex");
        navs.forEach((nav) => {
            nav.classList.remove("add");
        });
    } else {
        const navs = document.querySelectorAll(".flex");
        navs.forEach((nav) => {
            nav.classList.remove("lift");
        });
    }
}

function playSound(soundFile) {
    const audio = new Audio(soundFile);
    audio.play().catch((error) => {
        console.error("Error playing sound:", error);
    });
}

let mic = document.getElementById("mic");
let bar = document.getElementById("mainBar");
let text = document.getElementById("aiText");
let ai = false;

mic.addEventListener("click", () => {
    bar.classList.toggle("gradient");
    input.classList.toggle("hidden");
    text.classList.toggle("hidden");
    if (ai) {
    } else {
        playSound("./assets/sounds/ai-open.mp3");
    }
    ai = !ai;
});
