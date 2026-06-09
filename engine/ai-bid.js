/* ── TEXAS 42 — AI BIDDING ── */

const {
  TRUMP_DOUBLES,
  AI_EASY, AI_NORMAL, AI_HARD, AI_RAINMAN,
  BID_PASS, BID_SEVENS, BID_NELLO,
} = require('./constants');

const { isTrump, ptVal, nDbl, dist7 } = require('./domino');
const { bidGt, isMkBid } = require('./bidding');

function calcOffs(hand, trumpSuit) {
  let offCount = 0, offFiveCount = 0;
  [0,1,2,3,4,5,6].forEach(s => {
    if (trumpSuit !== TRUMP_DOUBLES && s === trumpSuit) return;
    const inS = hand.filter(d => {
      if (trumpSuit === TRUMP_DOUBLES) return d.h !== d.l && (d.h === s || d.l === s);
      return (d.h === s || d.l === s) && !isTrump(d, trumpSuit);
    });
    if (inS.length === 0) return;
    const hasDbl = inS.some(d => d.h === d.l);
    if (!hasDbl) {
      inS.forEach(d => {
        offCount++;
        if (ptVal(d) > 0) offFiveCount++;
      });
    }
  });
  return { offCount, offFiveCount };
}

function maxSafeBid(offCount, offFiveCount) {
  if (offCount === 0)                              return 42;
  if (offCount === 1 && offFiveCount === 0)        return 41;
  if (offCount === 2 && offFiveCount === 0)        return 40;
  if (offCount === 1 && offFiveCount === 1)        return 36;
  if (offCount === 2 && offFiveCount === 1)        return 35;
  if (offCount <= 3  && offFiveCount <= 1)         return 33;
  if (offCount <= 2)                               return 31;
  return 30;
}

function bestTrumpSuit(hand) {
  let bestSuit = 0, bestCount = 0;
  const dc = nDbl(hand);
  for (let s = 0; s <= 6; s++) {
    const c = hand.filter(d => d.h === s || d.l === s).length;
    if (c > bestCount) { bestCount = c; bestSuit = s; }
  }
  if (dc > bestCount) { bestCount = dc; bestSuit = TRUMP_DOUBLES; }
  return { bestSuit, bestCount };
}

function aiBid(hand, hiBid, isOpening, difficulty = AI_NORMAL) {
  const { bestSuit, bestCount } = bestTrumpSuit(hand);
  const dc  = nDbl(hand);
  const pts = hand.reduce((a, d) => a + ptVal(d), 0);
  const str = bestCount * 5 + pts;
  const { offCount, offFiveCount } = calcOffs(hand, bestSuit);
  const safeBid = maxSafeBid(offCount, offFiveCount);
  const markStrength = bestCount >= 5 || (dc >= 3 && bestCount >= 4);

  if (difficulty === AI_EASY) {
    if (str >= 70 && bidGt(38, hiBid)) return 38;
    if (str >= 60 && bidGt(34, hiBid)) return 34;
    return BID_PASS;
  }

  if (difficulty === AI_NORMAL) {
    const normalSafe = Math.max(30, safeBid - 5);
    if (normalSafe >= 36 && bidGt(36, hiBid)) return 36;
    if (normalSafe >= 33 && bidGt(33, hiBid)) return 33;
    if (normalSafe >= 31 && bidGt(31, hiBid)) return 31;
    return BID_PASS;
  }

  if (difficulty === AI_HARD) {
    if (markStrength && safeBid >= 38) {
      if (hiBid === 300) return 400;
      if (hiBid === 200) return 300;
      if (hiBid === 100 || (!isMkBid(hiBid) && isOpening)) return 200;
      if (!isMkBid(hiBid)) return 100;
    }
    if (safeBid >= 38 && bidGt(38, hiBid)) return 38;
    if (safeBid >= 35 && bidGt(35, hiBid)) return 35;
    if (safeBid >= 34 && bidGt(34, hiBid)) return 34;
    if (safeBid >= 32 && bidGt(32, hiBid)) return 32;
    if (safeBid >= 31 && bidGt(31, hiBid)) return 31;
    if (safeBid >= 30 && bidGt(30, hiBid)) return 30;
    return BID_PASS;
  }

  // RAINMAN
  if (markStrength) {
    if (hiBid === 300) return 400;
    if (hiBid === 200) return 300;
    if (hiBid === 100 || (!isMkBid(hiBid) && isOpening)) return 200;
    if (!isMkBid(hiBid) && safeBid >= 38) return 100;
  }
  if (safeBid >= 41 && bidGt(41, hiBid)) return 41;
  if (safeBid >= 40 && bidGt(40, hiBid)) return 40;
  if (safeBid >= 38 && bidGt(38, hiBid)) return 38;
  if (safeBid >= 36 && bidGt(36, hiBid)) return 36;
  if (safeBid >= 35 && bidGt(35, hiBid)) return 35;
  if (safeBid >= 34 && bidGt(34, hiBid)) return 34;
  if (safeBid >= 32 && bidGt(32, hiBid)) return 32;
  if (safeBid >= 31 && bidGt(31, hiBid)) return 31;
  if (safeBid >= 30 && bidGt(30, hiBid)) return 30;
  return BID_PASS;
}

function aiForced(hand, difficulty) {
  const cleanHand = hand.filter(Boolean);
  const { bestSuit } = bestTrumpSuit(cleanHand);
  const { offCount, offFiveCount } = calcOffs(cleanHand, bestSuit);
  const safeBid = maxSafeBid(offCount, offFiveCount);

  const pointOdds = safeBid >= 42 ? 100 : safeBid >= 40 ? 85 : safeBid >= 38 ? 75
                  : safeBid >= 35 ? 65  : safeBid >= 33 ? 55 : safeBid >= 31 ? 45 : 35;

  const avgDist = cleanHand.reduce((a, d) => a + dist7(d), 0) / cleanHand.length;
  const sevensOdds = avgDist <= 1 ? 90 : avgDist <= 2 ? 75 : avgDist <= 3 ? 55 : avgDist <= 4 ? 35 : 15;

  const dc = nDbl(cleanHand);
  const lowPenalty = dc * 15;
  const lowBonus   = cleanHand.filter(d => ptVal(d) === 0 && d.h + d.l <= 6).length * 8;
  const lowOdds    = Math.max(10, Math.min(90, 50 + lowBonus - lowPenalty));

  const best = Math.max(pointOdds, sevensOdds, lowOdds);
  if (best === pointOdds) {
    const bid = aiBid(cleanHand, 29, true, difficulty);
    return bid !== BID_PASS ? bid : 30;
  }
  if (best === sevensOdds) return BID_SEVENS;
  return BID_NELLO;
}

function aiTrump(hand) {
  const { bestSuit } = bestTrumpSuit(hand);
  return bestSuit;
}

function aiDblHi(hand) {
  return nDbl(hand.filter(Boolean)) === 0;
}

module.exports = { calcOffs, maxSafeBid, bestTrumpSuit, aiBid, aiForced, aiTrump, aiDblHi };
