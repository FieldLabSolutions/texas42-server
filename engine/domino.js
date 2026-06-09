/* ── TEXAS 42 — DOMINO LOGIC ── */

const {
  TRUMP_DOUBLES, TRUMP_FOLLOWME,
  BID_SEVENS, BID_NELLO,
} = require('./constants');

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = 0 | Math.random() * (i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function mkDeck() {
  const b = [];
  for (let h = 0; h <= 6; h++)
    for (let l = 0; l <= h; l++)
      b.push({ h, l, id: `${h}-${l}` });
  return shuffle(b);
}

function ptVal(d) {
  const s = d.h + d.l;
  return s === 5 ? 5 : s === 10 ? 10 : 0;
}

function dist7(d) { return Math.abs(d.h + d.l - 7); }

function nDbl(hand) {
  return hand.filter(Boolean).filter(d => d.h === d.l).length;
}

function isTrump(d, t) {
  if (t == null || t === TRUMP_FOLLOWME) return false;
  if (t === TRUMP_DOUBLES) return d.h === d.l;
  return d.h === t || d.l === t;
}

function getSuit(d, t) {
  if (isTrump(d, t)) return 'T';
  return d.h;
}

function inSuit(d, ls, t) {
  if (t === TRUMP_FOLLOWME) {
    if (d.h === d.l) return ls === d.h;
    return ls === d.h || ls === d.l;
  }
  if (isTrump(d, t)) return ls === 'T';
  if (d.h === d.l)   return ls === d.h;
  return ls === d.h || ls === d.l;
}

function tRank(d, t) {
  if (t === TRUMP_DOUBLES) return d.h;
  if (d.h === d.l) return 100;
  return d.h === t ? d.l : d.h;
}

function sRank(d, ls) {
  if (d.h === d.l) return 100;
  return d.h === ls ? d.l : d.h;
}

function fmRank(d, ls) {
  if (d.h === d.l) return 100;
  return d.h === ls ? d.l : d.h;
}

function lowRank(d, ls, dHi) {
  if (d.h === d.l) return dHi ? 100 : -1;
  return d.h === ls ? d.l : d.h;
}

function legal(hand, ls, t, bidType) {
  const b = hand.filter(Boolean);
  if (bidType === BID_SEVENS) {
    if (!b.length) return [];
    const m = Math.min(...b.map(dist7));
    return b.filter(d => dist7(d) === m);
  }
  if (bidType === BID_NELLO) {
    if (ls == null) return b;
    const f = b.filter(d => inSuit(d, ls, null));
    return f.length ? f : b;
  }
  if (ls == null) return b;
  const f = b.filter(d => inSuit(d, ls, t));
  return f.length ? f : b;
}

function tWinner(plays, ls, t, bidType, dHi) {
  if (bidType === BID_SEVENS) {
    const m = Math.min(...plays.map(p => dist7(p.d)));
    return plays.find(p => dist7(p.d) === m).who;
  }
  if (bidType === BID_NELLO) {
    const il   = plays.filter(p => inSuit(p.d, ls, null));
    const pool = il.length ? il : plays;
    return pool.reduce((b, p) => lowRank(p.d, ls, dHi) > lowRank(b.d, ls, dHi) ? p : b).who;
  }
  if (t === TRUMP_FOLLOWME) {
    const il   = plays.filter(p => inSuit(p.d, ls, TRUMP_FOLLOWME));
    const pool = il.length ? il : plays;
    return pool.reduce((b, p) => fmRank(p.d, ls) > fmRank(b.d, ls) ? p : b).who;
  }
  const tr = plays.filter(p => isTrump(p.d, t));
  if (tr.length) return tr.reduce((b, p) => tRank(p.d, t) > tRank(b.d, t) ? p : b).who;
  const sr = plays.filter(p => inSuit(p.d, ls, t));
  return (sr.length ? sr : plays).reduce((b, p) => sRank(p.d, ls) > sRank(b.d, ls) ? p : b).who;
}

function nxtPl(who, out) {
  let n = (who + 1) % 4;
  if (out != null && n === out) n = (n + 1) % 4;
  return n;
}

module.exports = {
  shuffle, mkDeck,
  ptVal, dist7, nDbl,
  isTrump, getSuit, inSuit,
  tRank, sRank, fmRank, lowRank,
  legal, tWinner, nxtPl,
};
