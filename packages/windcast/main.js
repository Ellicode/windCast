import { appendItems, appendPersistentItems } from "../../windcast.js";
import Calculator from "./widgets/calculator.js"
import Store from "./commands/store.js"
import Settings from "./commands/settings.js"
import Google from "./persistent/google.js"
import Dictionary from "./persistent/dictionary.js"

appendPersistentItems([Google, Dictionary]);
appendItems([Calculator, Store, Settings]);
