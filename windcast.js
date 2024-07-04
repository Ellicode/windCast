/**
 * Represents a command that can be executed.
 */
class Command {
    /**
     * Creates a new Command instance.
     * @param {string} displayName - The display name of the command.
     * @param {string} subtitle - The subtitle of the command.
     * @param {Function} callback - The function to call when the command is executed.
     * @param {string} icon - The URL or path to the icon image.
     * @param {Array} menuOptions - Additional menu options for the command.
     * @param {Array<RegExp>} regexAliases - List of regular expressions used to match the command.
     */
    constructor(
        displayName,
        subtitle,
        callback,
        icon,
        menuOptions,
        regexAliases
    ) {
        this.displayName = displayName;
        this.subtitle = subtitle;
        this.callback = callback;
        this.icon = icon;
        this.menuOptions = menuOptions;
        this.regexAliases = regexAliases;
    }

    /**
     * Checks if the command matches a given query.
     * @param {string} query - The search query to match against.
     * @returns {boolean} True if the command matches the query, false otherwise.
     */
    matches(query) {
        const words = query.trim().toLowerCase().split(/\s+/);
        return words.every((word) =>
            this.regexAliases.some((regex) => regex.test(word))
        );
    }
    /**
     * Executes the command.
     * @param {string} query - The search query.
     */
    execute(query) {
        let history = JSON.parse(localStorage.getItem("history")) ?? []
        history.push({
            item: this,
            query: query,
            timestamp: Date.now(),
        })
        localStorage.setItem("history", JSON.stringify(history))
        this.callback(query)
    }
    /**
     * Creates an HTML list item for the command.
     * @param {string} query - The search query used for creating the menu item.
     * @returns {HTMLElement} The list item element representing the command.
     */
    createMenuItem(query) {
        console.log(query);
        const menuItem = document.createElement("li");
        menuItem.classList.add("wc--list-item");

        const iconElem = document.createElement("img");
        iconElem.src = this.icon;
        iconElem.alt = `${this.displayName} icon`;
        iconElem.classList.add("wc--list-icon");

        const textContainer = document.createElement("div");
        textContainer.classList.add("wc--list-text-container");

        const displayNameElem = document.createElement("span");
        displayNameElem.textContent = this.displayName;
        displayNameElem.classList.add("wc--list-display-name");

        const subtitleElem = document.createElement("span");
        subtitleElem.textContent = this.subtitle;
        subtitleElem.classList.add("wc--list-subtitle");

        textContainer.appendChild(displayNameElem);
        textContainer.appendChild(subtitleElem);

        menuItem.appendChild(iconElem);
        menuItem.appendChild(textContainer);
        menuItem.addEventListener("click", () => this.execute(query));

        return menuItem;
    }

    toJSON() {
        return {
            displayName: this.displayName,
            subtitle: this.subtitle,
            icon: this.icon,
            menuOptions: this.menuOptions,
            regexAliases: this.regexAliases,
            // Optionally, include callback information if serializable
            // callback: this.callback,
            // For demonstration purposes, omitting callback serialization
        };
    }
}

/**
 * Represents a widget that can be displayed.
 */
class Widget {
    /**
     * Creates a new Widget instance.
     * @param {string} html - The HTML content of the widget.
     * @param {Array<RegExp>} regexAliases - List of regular expressions used to match the widget.
     * @param {string} width - The width of the widget.
     * @param {Function} script - The function to call to get the script content.
     */
    constructor(html, regexAliases, width, script) {
        this.html = html;
        this.width = width;
        this.regexAliases = regexAliases;
        this.script = script;
    }

    /**
     * Checks if the widget matches a given query.
     * @param {string} query - The search query to match against.
     * @returns {boolean} True if the widget matches the query, false otherwise.
     */
    matches(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.regexAliases.some((regex) => regex.test(lowercaseQuery));
    }

    /**
     * Creates an HTML div element for the widget.
     * @param {string} query - The search query used for creating the widget item.
     * @returns {HTMLElement} The div element representing the widget.
     */
    createWidgetItem(query) {
        console.log(query);
        const widgetItem = document.createElement("div");
        widgetItem.classList.add("wc--widget");

        widgetItem.innerHTML = this.html;
        widgetItem.style.width = this.width;

        if (this.script) {
            this.script(widgetItem, query);
        }

        return widgetItem;
    }
}

/**
 * Appends an array of commands to the global commands array.
 * @param {Array<Command>} commands - The array of Command objects to append.
 */
function appendItems(commands) {
    commands.forEach((element) => {
        window.commands.push(element);
    });
}

/**
 * Appends a command to the global persistent items array.
 * @param {Array<Command>} commands - The array of Command objects to append.
 */
function appendPersistentItems(commands) {
    commands.forEach((element) => {
        window.persistentItems.push(element);
    });
}

let PACKAGE_INFO = {
    name: undefined,
    folderName: undefined,
};

/**
 * Loads an HTML template to a widget or a page.
 * @param {String} pkg_name - The path (folder name) of the application root.
 * @param {String} path - The path of the HTML file.
 */
async function loadTemplate(pkg_name, path) {
    const resp = await fetch("./packages/" + pkg_name + "/" + path);
    const html = await resp.text();
    return html;
}
/**
 * Returns a relative path to the project
 * @param {String} pkg_name - The path (folder name) of the application root.
 * @param {String} path - The path of the file.
 */
function relPath(pkg_name, path) {
    return "./packages/" + pkg_name + "/" + path
}

const application = {
    openPage: (title, id, innerHTML, height = 400) => {
        var body = document.body,
            html = document.documentElement;
        window.lastSize = parseInt(
            Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.clientHeight,
                html.scrollHeight,
                html.offsetHeight
            )
        );
        window.inPage = true;
        console.log(window.lastSize);
        document.getElementById("wc--mainPage").style.display = "none";
        const page = document.createElement("div");
        page.id = "wc--" + id;
        page.style.display = "flex";
        page.style.flexDirection = "column";
        page.style.width = "100%";
        page.classList.add("thirdpartypage");
        const titleBar = document.createElement("div");
        titleBar.innerHTML = `
    <button class="wc--btn-main" id="back" onclick='document.getElementById("wc--mainPage").style.display = "flex";document.querySelectorAll(".thirdpartypage").forEach((page) => {page.remove()});window.electronAPI.setSize(window.lastSize);'>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
    </button>
    <kbd style="margin-right: 40px;">Esc</kbd>
    <h2 class="wc--main-title">${title}</h2>
    `;
        titleBar.classList.add("wc--navbar");
        page.appendChild(titleBar);

        const content = document.createElement("div");
        content.innerHTML = innerHTML;
        content.style.overflow = "auto";
        content.style.flex = "1";
        page.appendChild(content);
        window.electronAPI.setSize(68 + height);
        document.body.appendChild(page);
    },
    goBackHome: () => {
        window.electronAPI.setSize(window.lastSize);
        window.inPage = false;

        document.getElementById("wc--mainPage").style.display = "flex";
        document.querySelectorAll(".thirdpartypage").forEach((page) => {
            page.remove();
        });
    },
};

export {
    Command,
    Widget,
    loadTemplate,
    relPath,
    appendItems,
    appendPersistentItems,
    PACKAGE_INFO,
    application,
};
