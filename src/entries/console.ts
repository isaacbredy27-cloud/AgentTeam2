import "../styles/app.css";
import "../styles/console.css";
import { setupPwa } from "../pwa/pwa.ts";
import { ConsoleApp } from "../console/console-app.ts";

setupPwa();
void new ConsoleApp(document.getElementById("console")!, document.getElementById("announcer")!).start();
