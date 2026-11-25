# Generates the six page HTML files from one header and footer. Run: python3 scripts/gen-pages.py
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
pages = [
  # (output, source, title, description, nav key, entry script)
  ("index.html", "index.html", "Trivia 50", "Pick a topic and answer up to 50 trivia questions.", "play", "/src/entries/trivia.ts"),
  ("agents/index.html", "agents.html", "Agents · Trivia 50", "Chat with the agent team and approve code changes.", "agents", "/src/entries/console.ts"),
  ("how-it-works/index.html", "how-it-works.html", "How it works · Trivia 50", "How the trivia app and the Agent Console work.", "how", "/src/entries/page.ts"),
  ("resources/index.html", "resources.html", "Resources · Trivia 50", "Every link the project relies on.", "resources", "/src/entries/page.ts"),
  ("guide/index.html", "guide.html", "Setup guide · Trivia 50", "How to deploy and set up Trivia 50.", "guide", "/src/entries/page.ts"),
  ("offline.html", "offline.html", "Offline · Trivia 50", "You are offline.", "", "/src/entries/page.ts"),
]
nav = [("play", "/", "Play"), ("how", "/how-it-works/", "How it works"), ("resources", "/resources/", "Resources"),
       ("guide", "/guide/", "Guide"), ("agents", "/agents/", "Agents")]

def links(active):
    return "\n".join(
        f'        <li><a href="{href}"{" aria-current=\"page\"" if key == active else ""}>{label}</a></li>'
        for key, href, label in nav)

for out, src, title, desc, active, entry in pages:
    body = (root / "scripts/pages" / src).read_text().rstrip()
    html = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#1d4ed8">
  <meta name="apple-mobile-web-app-title" content="Trivia 50">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
  <script type="module" src="{entry}"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="/"><img src="/icons/icon-192.png" alt="" width="28" height="28">Trivia 50</a>
      <nav class="site-nav" aria-label="Main">
      <ul>
{links(active)}
      </ul>
      </nav>
      <button id="install-btn" class="btn primary small" type="button" hidden>Install</button>
    </div>
  </header>
  <div class="banner-wrap">
    <div id="offline-banner" class="banner notice" role="status" hidden><p>You're offline. New questions need a connection.</p></div>
    <div id="update-banner" class="banner glass" role="status" hidden><p>A new version is ready.</p><button class="btn primary small" type="button">Reload</button></div>
    <div id="ios-tip" class="banner glass" hidden><p>To install, tap Share, then Add to Home Screen.</p><button class="btn plain small" type="button">Not Now</button></div>
  </div>
  <main id="main">
{body}
  </main>
  <footer class="site-footer">
    <nav aria-label="Footer">
      <ul>
        <li><a href="/how-it-works/">How it works</a></li>
        <li><a href="/resources/">Resources</a></li>
        <li><a href="/guide/">Guide</a></li>
        <li><a href="/agents/">Agents</a></li>
        <li><a href="https://github.com/isaacbredy27-cloud/AgentTeam2">GitHub</a></li>
      </ul>
    </nav>
    <p>Questions from the <a href="https://opentdb.com/">Open Trivia Database</a> (opentdb.com), licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</p>
  </footer>
  <div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
</body>
</html>
'''
    p = root / out
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html)
    print("wrote", out)
