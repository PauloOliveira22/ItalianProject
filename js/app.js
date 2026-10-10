(function () {
  const { UNITS } = window.ItalianData;
  const L = window.ItalianLogic;
  const ALL_ITEMS = UNITS.flatMap((u) => u.items);
  const ITEMS_BY_ID = Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i]));
  const STORAGE_KEY = "italiano:v1";
  const XP_PER_CORRECT = 10;
  const MAX_REVIEW = 20;
  const app = document.getElementById("app");

  // ---------- persistence ----------

  function defaultState() {
    return { xp: 0, streak: { count: 0, lastDay: null }, cards: {}, units: {} };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch {
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable (private mode); progress is then per-session.
    }
  }

  let state = load();

  // ---------- speech ----------

  const canSpeak = "speechSynthesis" in window;
  let italianVoice = null;

  function pickVoice() {
    if (!canSpeak) return;
    const voices = speechSynthesis.getVoices();
    italianVoice = voices.find((v) => v.lang === "it-IT") || voices.find((v) => v.lang && v.lang.startsWith("it")) || null;
  }
  if (canSpeak) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  function speak(text) {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    u.rate = 0.9;
    if (italianVoice) u.voice = italianVoice;
    speechSynthesis.speak(u);
  }

  // ---------- helpers ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function unitProgress(unit) {
    return state.units[unit.id] || { completed: 0, best: 0 };
  }

  function isUnlocked(index) {
    return index === 0 || unitProgress(UNITS[index - 1]).completed > 0;
  }

  function learnedCount() {
    return Object.values(state.cards).filter((c) => c.correct > 0).length;
  }

  function dueItems() {
    const now = Date.now();
    return Object.entries(state.cards)
      .filter(([id, card]) => ITEMS_BY_ID[id] && L.isDue(card, now))
      .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
      .map(([id]) => ITEMS_BY_ID[id]);
  }

  function recordAnswer(item, correct) {
    state.cards[item.id] = L.review(state.cards[item.id], correct);
  }

  function finishSession(xpEarned) {
    state.xp += xpEarned;
    state.streak = L.updateStreak(state.streak);
    save();
  }

  function speakerButton(text, label = "Ouvir") {
    if (!canSpeak) return "";
    return `<button class="speak" data-say="${esc(text)}" aria-label="${label}">🔊</button>`;
  }

  function bindSpeakers(scope) {
    scope.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => speak(b.dataset.say)));
  }

  // Global Enter / number-key handling, replaced by each screen.
  let keyHandler = null;
  document.addEventListener("keydown", (e) => keyHandler && keyHandler(e));

  // ---------- home ----------

  function renderHome() {
    keyHandler = null;
    const due = dueItems().length;
    const streak = L.currentStreak(state.streak);
    app.innerHTML = `
      <header class="top">
        <h1>🇮🇹 Impara l'italiano</h1>
        <div class="stats">
          <span class="stat" title="Dias seguidos">🔥 ${streak}</span>
          <span class="stat" title="Pontos de experiência">⭐ ${state.xp} XP</span>
          <span class="stat" title="Palavras aprendidas">📚 ${learnedCount()}</span>
        </div>
      </header>
      <section class="review-banner ${due ? "" : "muted"}">
        <div>
          <strong>Revisão</strong>
          <p>${due ? `${due} ${due === 1 ? "palavra precisa" : "palavras precisam"} de revisão hoje.` : "Nada para revisar agora. Bom trabalho!"}</p>
        </div>
        <button class="btn" id="review" ${due ? "" : "disabled"}>Revisar</button>
      </section>
      <ol class="units">
        ${UNITS.map((unit, i) => {
          const p = unitProgress(unit);
          const open = isUnlocked(i);
          const starText = p.completed ? "★".repeat(L.stars(p.best)) + "☆".repeat(3 - L.stars(p.best)) : "";
          return `
            <li>
              <button class="unit ${open ? "" : "locked"}" data-unit="${unit.id}" ${open ? "" : "disabled"}>
                <span class="unit-emoji">${open ? unit.emoji : "🔒"}</span>
                <span class="unit-text">
                  <span class="unit-title">${i + 1}. ${esc(unit.title)}</span>
                  <span class="unit-desc">${esc(unit.description)} · ${unit.items.length} itens</span>
                </span>
                <span class="unit-stars" aria-label="${L.stars(p.best)} de 3 estrelas">${starText}</span>
              </button>
            </li>`;
        }).join("")}
      </ol>
      <footer class="foot">
        <button class="link" id="reset">Apagar progresso</button>
      </footer>`;

    app.querySelectorAll("[data-unit]").forEach((b) =>
      b.addEventListener("click", () => (location.hash = "#/unit/" + b.dataset.unit))
    );
    app.querySelector("#review").addEventListener("click", () => (location.hash = "#/review"));
    app.querySelector("#reset").addEventListener("click", () => {
      if (confirm("Apagar todo o progresso? Isso não pode ser desfeito.")) {
        state = defaultState();
        save();
        renderHome();
      }
    });
  }

  // ---------- lesson: introduction ----------

  function renderIntro(unit, index = 0) {
    const item = unit.items[index];
    const last = index === unit.items.length - 1;
    app.innerHTML = `
      ${lessonHeader(unit.title, index / unit.items.length)}
      <main class="card intro">
        <p class="eyebrow">Palavra nova · ${index + 1} de ${unit.items.length}</p>
        <h2 class="big-it">${esc(item.it)} ${speakerButton(item.it)}</h2>
        <p class="meaning">${esc(L.alternatives(item.pt).join(", "))}</p>
        ${item.note ? `<p class="note">💡 ${esc(item.note)}</p>` : ""}
      </main>
      <div class="actions">
        ${index > 0 ? `<button class="btn ghost" id="prev">Voltar</button>` : `<button class="btn ghost" id="skip">Pular para os exercícios</button>`}
        <button class="btn" id="next">${last ? "Começar exercícios" : "Próxima"}</button>
      </div>`;
    bindLessonHeader();
    bindSpeakers(app);
    speak(item.it);
    const next = () => (last ? startPractice(unit) : renderIntro(unit, index + 1));
    app.querySelector("#next").addEventListener("click", next);
    const prev = app.querySelector("#prev");
    if (prev) prev.addEventListener("click", () => renderIntro(unit, index - 1));
    const skip = app.querySelector("#skip");
    if (skip) skip.addEventListener("click", () => startPractice(unit));
    keyHandler = (e) => e.key === "Enter" && next();
  }

  function lessonHeader(title, progress) {
    return `
      <header class="lesson-top">
        <button class="icon-btn" id="quit" aria-label="Sair da lição">✕</button>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress * 100)}">
          <div class="bar-fill" style="width:${Math.round(progress * 100)}%"></div>
        </div>
        <span class="lesson-title">${esc(title)}</span>
      </header>`;
  }

  function bindLessonHeader() {
    app.querySelector("#quit").addEventListener("click", () => {
      if (confirm("Sair da lição? O progresso desta lição será perdido.")) location.hash = "#/";
    });
  }

  // ---------- lesson: practice ----------

  function startPractice(unit) {
    let queue = L.buildLesson(unit, ALL_ITEMS);
    if (!canSpeak) queue = queue.map((ex) => (ex.type === "listen" ? L.makeExercise("choice-it-pt", ex.item, unit.items, ALL_ITEMS) : ex));
    const session = { unit, queue, pos: 0, total: queue.length, firstTryCorrect: 0, retried: new Set(), missed: new Set() };
    renderExercise(session);
  }

  function renderExercise(session) {
    const ex = session.queue[session.pos];
    const progress = Math.min(session.pos / session.queue.length, 1);
    let body = "";
    if (ex.type === "choice-it-pt") {
      body = `
        <p class="eyebrow">O que significa?</p>
        <h2 class="big-it">${esc(ex.item.it)} ${speakerButton(ex.item.it)}</h2>
        ${optionsHtml(ex.options)}`;
    } else if (ex.type === "choice-pt-it") {
      body = `
        <p class="eyebrow">Como se diz em italiano?</p>
        <h2 class="big-pt">${esc(L.primary(ex.item.pt))}</h2>
        ${optionsHtml(ex.options)}`;
    } else if (ex.type === "listen") {
      body = `
        <p class="eyebrow">Ouça e escolha o significado</p>
        <div class="listen-box">${speakerButton(ex.item.it, "Ouvir de novo").replace('class="speak"', 'class="speak big"')}</div>
        ${optionsHtml(ex.options)}`;
    } else {
      body = `
        <p class="eyebrow">Escreva em italiano</p>
        <h2 class="big-pt">${esc(L.primary(ex.item.pt))}</h2>
        <input id="answer" class="answer" autocomplete="off" autocapitalize="off" spellcheck="false" lang="it" placeholder="Digite aqui…" />
        <div class="accents">${["à", "è", "é", "ì", "ò", "ù", "'"].map((c) => `<button class="key" data-char="${c}">${c}</button>`).join("")}</div>
        <button class="link" id="hint">Dica</button>`;
    }

    app.innerHTML = `
      ${lessonHeader(session.unit.title, progress)}
      <main class="card exercise">${body}</main>
      <div class="actions"><button class="btn" id="check" ${ex.options ? "disabled" : ""}>Verificar</button></div>
      <div id="feedback" class="feedback" hidden></div>`;
    bindLessonHeader();
    bindSpeakers(app);
    if (ex.type === "listen") speak(ex.item.it);

    let chosen = null;
    let done = false;
    const checkBtn = app.querySelector("#check");
    const input = app.querySelector("#answer");

    const choose = (btn) => {
      if (done) return;
      app.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
      btn.classList.add("selected");
      chosen = btn.dataset.value;
      checkBtn.disabled = false;
    };
    app.querySelectorAll(".option").forEach((btn) => btn.addEventListener("click", () => choose(btn)));

    if (input) {
      input.focus();
      app.querySelectorAll("[data-char]").forEach((k) =>
        k.addEventListener("click", () => {
          const { selectionStart: s, selectionEnd: e, value } = input;
          input.value = value.slice(0, s) + k.dataset.char + value.slice(e);
          input.focus();
          input.setSelectionRange(s + 1, s + 1);
        })
      );
      let hintLen = 0;
      app.querySelector("#hint").addEventListener("click", (e) => {
        hintLen = Math.min(hintLen + 1, ex.answer.length);
        e.target.textContent = "Dica: " + ex.answer.slice(0, hintLen) + "…";
      });
    }

    const check = () => {
      if (done) return;
      let verdict;
      if (input) {
        if (!input.value.trim()) return input.focus();
        verdict = L.checkAnswer(input.value, ex.answer);
        input.disabled = true;
      } else {
        if (chosen === null) return;
        verdict = chosen === ex.answer ? "correct" : "wrong";
        app.querySelectorAll(".option").forEach((o) => {
          o.disabled = true;
          if (o.dataset.value === ex.answer) o.classList.add("right");
          else if (o.dataset.value === chosen) o.classList.add("wrong");
        });
      }
      done = true;
      showFeedback(session, ex, verdict);
    };
    checkBtn.addEventListener("click", check);

    keyHandler = (e) => {
      if (done) return;
      if (e.key === "Enter") {
        e.preventDefault();
        check();
      } else if (!input && /^[1-4]$/.test(e.key)) {
        const btn = app.querySelectorAll(".option")[Number(e.key) - 1];
        if (btn) choose(btn);
      }
    };
  }

  function optionsHtml(options) {
    return `<div class="options">${options
      .map((o, i) => `<button class="option" data-value="${esc(o)}"><span class="num">${i + 1}</span>${esc(o)}</button>`)
      .join("")}</div>`;
  }

  function showFeedback(session, ex, verdict) {
    const ok = verdict !== "wrong";
    const isRetry = session.pos >= session.total;
    if (!isRetry) {
      recordAnswer(ex.item, ok);
      if (ok) session.firstTryCorrect += 1;
    }
    if (!ok) {
      session.missed.add(ex.item.id);
      // Practise a missed item once more at the end of the lesson.
      if (!session.retried.has(ex.item.id)) {
        session.retried.add(ex.item.id);
        session.queue.push(L.makeExercise("choice-pt-it", ex.item, session.unit.items, ALL_ITEMS));
      }
    }

    const fb = app.querySelector("#feedback");
    const title = verdict === "correct" ? "Bravo! 🎉" : verdict === "accent" ? "Quase! Atenção aos acentos." : "Ops, não foi dessa vez.";
    fb.className = "feedback " + (ok ? "ok" : "bad");
    fb.innerHTML = `
      <div>
        <strong>${title}</strong>
        <p>${esc(ex.item.it)} ${speakerButton(ex.item.it)} = ${esc(L.primary(ex.item.pt))}</p>
      </div>
      <button class="btn" id="continue">Continuar</button>`;
    fb.hidden = false;
    app.querySelector("#check").hidden = true;
    bindSpeakers(fb);
    if (ok) speak(ex.item.it);

    const next = () => {
      session.pos += 1;
      if (session.pos < session.queue.length) renderExercise(session);
      else renderResult(session);
    };
    const btn = fb.querySelector("#continue");
    btn.addEventListener("click", next);
    btn.focus();
    // Defer so the Enter that submitted the answer doesn't also continue.
    setTimeout(() => (keyHandler = (e) => e.key === "Enter" && (e.preventDefault(), next())), 0);
  }

  function renderResult(session) {
    const accuracy = session.firstTryCorrect / session.total;
    const xp = session.firstTryCorrect * XP_PER_CORRECT;
    const p = unitProgress(session.unit);
    state.units[session.unit.id] = { completed: p.completed + 1, best: Math.max(p.best, accuracy) };
    finishSession(xp);
    const s = L.stars(accuracy);
    const missed = [...session.missed].map((id) => ITEMS_BY_ID[id]);
    const idx = UNITS.indexOf(session.unit);
    const nextUnit = UNITS[idx + 1];

    app.innerHTML = `
      <main class="card result">
        <p class="result-stars">${"★".repeat(s)}${"☆".repeat(3 - s)}</p>
        <h2>${accuracy >= 0.8 ? "Ottimo lavoro!" : "Continua così!"}</h2>
        <p>Você acertou <strong>${Math.round(accuracy * 100)}%</strong> de primeira e ganhou <strong>${xp} XP</strong>.</p>
        <p>🔥 Sequência: ${L.currentStreak(state.streak)} ${L.currentStreak(state.streak) === 1 ? "dia" : "dias"}</p>
        ${missed.length ? `
          <h3>Para revisar</h3>
          <ul class="missed">${missed.map((i) => `<li><span>${esc(i.it)} ${speakerButton(i.it)}</span><span>${esc(L.primary(i.pt))}</span></li>`).join("")}</ul>` : ""}
      </main>
      <div class="actions">
        <button class="btn ghost" id="again">Repetir lição</button>
        <button class="btn" id="home">${nextUnit ? "Próxima unidade" : "Início"}</button>
      </div>`;
    bindSpeakers(app);
    app.querySelector("#again").addEventListener("click", () => startPractice(session.unit));
    const goOn = () => (location.hash = nextUnit ? "#/unit/" + nextUnit.id : "#/");
    app.querySelector("#home").addEventListener("click", goOn);
    keyHandler = (e) => e.key === "Enter" && goOn();
  }

  // ---------- review (flashcards) ----------

  function startReview() {
    const items = dueItems().slice(0, MAX_REVIEW);
    if (!items.length) return renderHome();
    renderFlashcard({ items: L.shuffle(items), pos: 0, known: 0 });
  }

  function renderFlashcard(rev) {
    const item = rev.items[rev.pos];
    let flipped = false;
    app.innerHTML = `
      ${lessonHeader("Revisão", rev.pos / rev.items.length)}
      <main class="card flashcard" id="card" tabindex="0" aria-live="polite">
        <p class="eyebrow">${rev.pos + 1} de ${rev.items.length} · toque para virar</p>
        <h2 class="big-it">${esc(item.it)} ${speakerButton(item.it)}</h2>
        <p class="meaning" hidden id="back">${esc(L.alternatives(item.pt).join(", "))}</p>
      </main>
      <div class="actions" id="grade" hidden>
        <button class="btn bad" id="forgot">Não lembrei</button>
        <button class="btn" id="knew">Lembrei</button>
      </div>
      <div class="actions" id="flip-row"><button class="btn" id="flip">Mostrar resposta</button></div>`;
    bindLessonHeader();
    bindSpeakers(app);
    speak(item.it);

    const flip = () => {
      if (flipped) return;
      flipped = true;
      app.querySelector("#back").hidden = false;
      app.querySelector("#grade").hidden = false;
      app.querySelector("#flip-row").hidden = true;
    };
    const grade = (knew) => {
      recordAnswer(item, knew);
      if (knew) rev.known += 1;
      rev.pos += 1;
      save();
      if (rev.pos < rev.items.length) renderFlashcard(rev);
      else renderReviewDone(rev);
    };
    app.querySelector("#card").addEventListener("click", (e) => !e.target.closest("[data-say]") && flip());
    app.querySelector("#flip").addEventListener("click", flip);
    app.querySelector("#forgot").addEventListener("click", () => grade(false));
    app.querySelector("#knew").addEventListener("click", () => grade(true));
    keyHandler = (e) => {
      if (!flipped && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        flip();
      } else if (flipped && e.key === "1") grade(false);
      else if (flipped && (e.key === "2" || e.key === "Enter")) grade(true);
    };
  }

  function renderReviewDone(rev) {
    const xp = rev.known * XP_PER_CORRECT;
    finishSession(xp);
    app.innerHTML = `
      <main class="card result">
        <p class="result-stars">🧠</p>
        <h2>Revisão concluída!</h2>
        <p>Você lembrou de <strong>${rev.known} de ${rev.items.length}</strong> palavras e ganhou <strong>${xp} XP</strong>.</p>
        <p>As palavras que você esqueceu vão aparecer de novo em breve.</p>
      </main>
      <div class="actions"><button class="btn" id="home">Início</button></div>`;
    app.querySelector("#home").addEventListener("click", () => (location.hash = "#/"));
    keyHandler = (e) => e.key === "Enter" && (location.hash = "#/");
  }

  // ---------- routing ----------

  function route() {
    if (canSpeak) speechSynthesis.cancel();
    const [, view, id] = location.hash.split("/");
    window.scrollTo(0, 0);
    if (view === "unit") {
      const i = UNITS.findIndex((u) => u.id === id);
      if (i >= 0 && isUnlocked(i)) return renderIntro(UNITS[i]);
    } else if (view === "review") {
      return startReview();
    }
    if (location.hash && location.hash !== "#/") history.replaceState(null, "", "#/");
    renderHome();
  }

  window.addEventListener("hashchange", route);
  route();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
