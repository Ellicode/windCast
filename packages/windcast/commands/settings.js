import { Command, application, loadTemplate } from "../../../windcast.js";

const command = new Command(
    "Settings",
    "Manage windcast settings",
    async () => {
        application.openPage("WindCast settings", "settings", await loadTemplate("windcast", "commands/_settings.html"))
    },
    "./assets/logo/64x.png",
    [],
    [/set/i, /settings/i, /wind/i]
);
export default command