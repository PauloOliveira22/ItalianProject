// Pure learning logic (no DOM): answer checking, spaced repetition,
// exercise generation and streaks. Shared by the browser app and the tests.
(function (root) {
  // Days until the next review for each Leitner box (box 0 = new/failed).
  const BOX_INTERVALS = [0, 1, 2, 4, 7, 15, 30];
  const DAY_MS = 24 * 60 * 60 * 1000;

  function alternatives(text) {
    return text.split(" / ").map((s) => s.trim()).filter(Boolean);
  }

  function primary(text) {
    return alternatives(text)[0];
  }

  function stripAccents(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function normalize(s) {
    return s
      .toLowerCase()
      .replace(/[’`´]/g, "'")
      .replace(/[?!.,;:¿¡"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Returns "correct", "accent" (right apart from accents) or "wrong".
  function checkAnswer(input, expected) {
    const given = normalize(input);
    if (!given) return "wrong";
    const options = alternatives(expected).map(normalize);
    if (options.includes(given)) return "correct";
    const bare = stripAccents(given);
    if (options.some((o) => stripAccents(o) === bare)) return "accent";
    return "wrong";
  }

  function shuffle(list, rand = Math.random) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Picks `count` distractors for `item`, preferring the same unit.
  function distractors(item, sameUnit, allItems, field, count = 3, rand = Math.random) {
    const seen = new Set([primary(item[field])]);
    const picked = [];
    for (const pool of [shuffle(sameUnit, rand), shuffle(allItems, rand)]) {
      for (const other of pool) {
        if (picked.length >= count) break;
        const label = primary(other[field]);
        if (seen.has(label)) continue;
        seen.add(label);
        picked.push(label);
      }
    }
    return picked;
  }

  // Builds one exercise of the given type for an item.
  function makeExercise(type, item, sameUnit, allItems, rand = Math.random) {
    if (type === "choice-it-pt" || type === "listen") {
      const answer = primary(item.pt);
      const options = shuffle([answer, ...distractors(item, sameUnit, allItems, "pt", 3, rand)], rand);
      return { type, item, answer, options };
    }
    if (type === "choice-pt-it") {
      const answer = item.it;
      const options = shuffle([answer, ...distractors(item, sameUnit, allItems, "it", 3, rand)], rand);
      return { type, item, answer, options };
    }
    if (type === "type-it") return { type, item, answer: item.it };
    throw new Error("Unknown exercise type: " + type);
  }

  // A lesson practises every item twice: once by recognition and once by
  // recall (typing or listening), ordered so recognition comes first.
  function buildLesson(unit, allItems, rand = Math.random) {
    const first = shuffle(unit.items, rand).map((item) =>
      makeExercise(rand() < 0.5 ? "choice-it-pt" : "choice-pt-it", item, unit.items, allItems, rand)
    );
    const second = shuffle(unit.items, rand).map((item) =>
      makeExercise(rand() < 0.6 ? "type-it" : "listen", item, unit.items, allItems, rand)
    );
    return [...first, ...second];
  }

  function newCard() {
    return { box: 0, due: 0, seen: 0, correct: 0 };
  }

  function review(card, wasCorrect, now = Date.now()) {
    const c = Object.assign(newCard(), card);
    c.seen += 1;
    if (wasCorrect) {
      c.correct += 1;
      c.box = Math.min(c.box + 1, BOX_INTERVALS.length - 1);
    } else {
      c.box = 0;
    }
    c.due = now + BOX_INTERVALS[c.box] * DAY_MS;
    return c;
  }

  function isDue(card, now = Date.now()) {
    return !!card && card.due <= now;
  }

  function dayKey(date) {
    const d = new Date(date);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // Updates the streak after studying on `now`.
  function updateStreak(streak, now = Date.now()) {
    const today = dayKey(now);
    if (streak.lastDay === today) return streak;
    const yesterday = dayKey(new Date(now).setDate(new Date(now).getDate() - 1));
    return { count: streak.lastDay === yesterday ? streak.count + 1 : 1, lastDay: today };
  }

  // A streak is only alive if the last study day was today or yesterday.
  function currentStreak(streak, now = Date.now()) {
    if (!streak || !streak.lastDay) return 0;
    const yesterday = dayKey(new Date(now).setDate(new Date(now).getDate() - 1));
    return streak.lastDay === dayKey(now) || streak.lastDay === yesterday ? streak.count : 0;
  }

  function stars(accuracy) {
    if (accuracy >= 0.95) return 3;
    if (accuracy >= 0.8) return 2;
    if (accuracy > 0) return 1;
    return 0;
  }

  const api = {
    BOX_INTERVALS,
    alternatives,
    primary,
    normalize,
    checkAnswer,
    shuffle,
    distractors,
    makeExercise,
    buildLesson,
    newCard,
    review,
    isDue,
    dayKey,
    updateStreak,
    currentStreak,
    stars,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ItalianLogic = api;
})(this);
