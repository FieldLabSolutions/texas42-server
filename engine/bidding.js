/* ── TEXAS 42 — BIDDING LOGIC ── */

const {
  BID_PASS, BID_NELLO, BID_SEVENS, BID_PLUNGE, BID_SPLASH,
  TRUMP_DOUBLES, TRUMP_FOLLOWME,
  SUIT_NAMES,
} = require('./constants');

const isMkBid = b => typeof b === 'number' && b >= 100;

function marksFrom(b) {
  if (b === BID_PLUNGE) return 4;
  if (b === BID_SPLASH) return 2;
  if (typeof b === 'string') return 1;
  if (b >= 100) return b / 100;
  return 1;
}

function bidLabel(b, short = false) {
  if (b == null || b === BID_PASS)   return 'Pass';
  if (b === BID_NELLO)               return 'Low';
  if (b === BID_SEVENS)              return short ? '7s' : 'Sevens';
  if (b === BID_PLUNGE)              return 'Plunge';
  if (b === BID_SPLASH)              return 'Splash';
  if (b >= 100) return short ? `${b / 100}Mk` : `${b / 100} Mark${b > 100 ? 's' : ''}`;
  return `${b}`;
}

function bidGt(a, b) {
  if (b == null || b === BID_PASS || b === 29) return true;
  if (isMkBid(a) && !isMkBid(b) && typeof b === 'number') return true;
  if (!isMkBid(a) && isMkBid(b)) return false;
  if (typeof a === 'number' && typeof b === 'number') return a > b;
  return false;
}

function availBids(hiBid, isOpening) {
  const out = [];

  for (let i = 30; i <= 41; i++)
    if (bidGt(i, hiBid)) out.push({ v: i, label: `${i}`, st: 'gold' });

  if (!isMkBid(hiBid)) {
    out.push({ v: 100, label: '1 Mark',  st: 'purp' });
    out.push({ v: 200, label: '2 Marks', st: 'purp' });
  }

  if (isMkBid(hiBid) && hiBid < 500) {
    out.push({ v: hiBid + 100, label: `${hiBid / 100 + 1} Marks`, st: 'purp' });
  }

  return out;
}

function trumpName(t) {
  if (t === TRUMP_DOUBLES)  return 'Doubles';
  if (t === TRUMP_FOLLOWME) return 'Follow Me';
  return SUIT_NAMES[t];
}

module.exports = {
  isMkBid, marksFrom,
  bidLabel, bidGt, availBids,
  trumpName,
};
