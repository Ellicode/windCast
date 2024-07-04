import { Widget, loadTemplate } from "../../../windcast.js";

const widget = new Widget(
    await loadTemplate("windcast", "widgets/_calculator.html"),
    [/^(\d+(\.\d+)?\s*[-+*/]\s*)+\d+(\.\d+)?$/],
    "400px",
    (widgetItem, query) => {        
        const queryElem = widgetItem.querySelector("#query");
        if (queryElem) {
            queryElem.innerHTML = query + "=";
        }

        const resultElem = widgetItem.querySelector("#result");
        if (resultElem) {
            resultElem.innerText = eval(query);
        }

        const copyButton = widgetItem.querySelector("#copy");
        if (copyButton) {
            copyButton.addEventListener("click", async () => {
                await navigator.clipboard.writeText(eval(query));

                const iconCopy = widgetItem.querySelector("#icon-copy");
                const iconCheck = widgetItem.querySelector("#icon-check");
                
                if (iconCopy && iconCheck) {
                    iconCopy.classList.add("hidden");
                    iconCheck.classList.remove("hidden");

                    setTimeout(() => {
                        iconCopy.classList.remove("hidden");
                        iconCheck.classList.add("hidden");
                    }, 2000);
                }
            });
        }
    }
);

export default widget;
