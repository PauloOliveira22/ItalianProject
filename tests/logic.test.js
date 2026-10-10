const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../js/logic.js");
const { UNITS } = require("../js/data.js");

const ALL = UNITS.flatMap((u) => u.items);
const DAY = 24 * 60 * 60 * 1000;

function seeded(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

test("checkAnswer accepts any alternative, ignoring case and punctuation", () => {
  assert.equal(L.checkAnswer("Grazie!", "grazie"), "correct");
  assert.equal(L.checkAnswer("  obrigada ", "obrigado / obrigada"), "correct");
  assert.equal(L.checkAnswer("dov’è il bagno", "dov'è il bagno?"), "correct");
});

test("checkAnswer flags missing accents separately", () => {
  assert.equal(L.checkAnswer("il caffe", "il caffè"), "accent");
  assert.equal(L.checkAnswer("si", "sì"), "accent");
});

test("checkAnswer rejects wrong or empty answers", () => {
  assert.equal(L.checkAnswer("prego", "grazie"), "wrong");
  assert.equal(L.checkAnswer("   ", "grazie"), "wrong");
});

test("curriculum ids are unique and every item has text", () => {
  const ids = ALL.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of ALL) {
    assert.ok(item.it.trim() && item.pt.trim(), item.id);
  }
});

test("each unit has distinct primary meanings so choices are unambiguous", () => {
  for (const unit of UNITS) {
    const pts = unit.items.map((i) => L.primary(i.pt));
    const its = unit.items.map((i) => i.it);
    assert.equal(new Set(pts).size, pts.length, unit.id + " pt");
    assert.equal(new Set(its).size, its.length, unit.id + " it");
  }
});

test("multiple-choice exercises have 4 unique options including the answer", () => {
  const rand = seeded(42);
  for (const unit of UNITS) {
    for (const item of unit.items) {
      for (const type of ["choice-it-pt", "choice-pt-it", "listen"]) {
        const ex = L.makeExercise(type, item, unit.items, ALL, rand);
        assert.equal(ex.options.length, 4);
        assert.equal(new Set(ex.options).size, 4);
        assert.ok(ex.options.includes(ex.answer));
      }
    }
  }
});

test("buildLesson practises every item twice", () => {
  const unit = UNITS[0];
  const lesson = L.buildLesson(unit, ALL, seeded(7));
  assert.equal(lesson.length, unit.items.length * 2);
  for (const item of unit.items) {
    assert.equal(lesson.filter((ex) => ex.item === item).length, 2);
  }
});

test("review moves cards through Leitner boxes", () => {
  const now = 1_000_000;
  let card = L.review(undefined, true, now);
  assert.equal(card.box, 1);
  assert.equal(card.due, now + DAY);
  card = L.review(card, true, now);
  assert.equal(card.box, 2);
  assert.equal(card.due, now + 2 * DAY);
  card = L.review(card, false, now);
  assert.equal(card.box, 0);
  assert.ok(L.isDue(card, now));
  assert.equal(card.seen, 3);
  assert.equal(card.correct, 2);
});

test("streak grows on consecutive days and resets after a gap", () => {
  const d1 = new Date(2026, 0, 10, 9).getTime();
  const d2 = new Date(2026, 0, 11, 22).getTime();
  const d4 = new Date(2026, 0, 13, 8).getTime();
  let s = L.updateStreak({ count: 0, lastDay: null }, d1);
  assert.equal(s.count, 1);
  assert.equal(L.updateStreak(s, d1).count, 1);
  s = L.updateStreak(s, d2);
  assert.equal(s.count, 2);
  assert.equal(L.currentStreak(s, d4), 0);
  assert.equal(L.updateStreak(s, d4).count, 1);
});
