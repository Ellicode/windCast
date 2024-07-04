import { Command, application, loadTemplate } from "../../../windcast.js";

const command = new Command(
    "Store",
    "Browse windcast extensions",
    async () => {
        application.openPage("WindCast store", "store", await loadTemplate("windcast", "commands/_store.html"))
    },
    "./assets/logo/64x.png",
    [],
    [/shop/i, /store/i, /sto/i, /wind/i]
);
export default command