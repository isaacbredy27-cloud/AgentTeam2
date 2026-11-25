// Minimal quiz screen used by the e2e example. Renders text with textContent only.
const res = await fetch("https://opentdb.com/api.php?amount=2&category=9&encode=url3986");
const body = await res.json();
const q = body.results[0];
const d = decodeURIComponent;
document.getElementById("question").textContent = d(q.question);
const answers = [q.correct_answer, ...q.incorrect_answers].map(d);
const box = document.getElementById("answers");
for (const text of answers) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.addEventListener("click", () => {
    const right = text === d(q.correct_answer);
    document.getElementById("feedback").textContent =
      right ? "Correct." : `Wrong. The answer is ${d(q.correct_answer)}.`;
  });
  box.append(b);
}
