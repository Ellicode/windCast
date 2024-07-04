import { Command } from "../../../windcast.js";

const command = new Command(
    "Google search",
    "Search google.com",
    (query) => {
        window.electronAPI.openBrowser(
            "https://www.google.com/search?q=" + query
        );
    },
    "./assets/extensions/google.png",
    [],
    []
);
export default command