import "../styles/app.css";
import "../styles/trivia.css";
import { setupPwa } from "../pwa/pwa.ts";
import { TriviaApp } from "../ui/trivia-app.ts";

setupPwa();
const app = new TriviaApp(document.getElementById("app")!, document.getElementById("announcer")!);
void app.start();
