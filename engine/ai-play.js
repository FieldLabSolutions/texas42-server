/* ── TEXAS 42 — AI PLAY STRATEGY ── */

const {
  PTEAM, TRUMP_DOUBLES,
  BID_SEVENS, BID_NELLO,
  AI_EASY, AI_NORMAL, AI_HARD, AI_RAINMAN,
} = require('./constants');

const { lowRank, tWinner, getSuit, isTrump, inSuit, sRank, tRank, ptVal } = require('./domino');

function aiPlay(leg, ls, t, who, trick, hiBdr, bidType, td, dHi, difficulty = AI_NORMAL, done = []) {
  if (leg.length === 1) return leg[0];

  const mt        = PTEAM[who];
  const bt        = hiBdr != null ? PTEAM[hiBdr] : -1;
  const onB       = mt === bt;
  const myPartner = (who + 2) % 4;
  const lowestAny = arr => arr.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);

  if (bidType === BID_SEVENS) return leg[0];
  if (bidType === BID_NELLO) {
    if (ls != null) return leg.reduce((b, d) => lowRank(d, ls, dHi) < lowRank(b, ls, dHi) ? d : b);
    return leg.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
  }

  if (difficulty === AI_EASY) return lowestAny(leg);

  if (difficulty === AI_NORMAL) {
    if (trick.length === 0) return lowestAny(leg);
    const cW = tWinner(trick, ls, t, bidType, dHi);
    if (PTEAM[cW] !== mt) {
      const canWin = leg.filter(d => tWinner([...trick, { who, d }], ls, t, bidType, dHi) === who);
      if (canWin.length) return canWin.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
    }
    return lowestAny(leg);
  }

  let playedBones = [];
  if (done.length) {
    done.forEach(tk => tk.plays.forEach(p => playedBones.push(p.d)));
    trick.forEach(p => playedBones.push(p.d));
  }
  const isAdvanced    = difficulty === AI_HARD || difficulty === AI_RAINMAN;
  const countPlayed   = isAdvanced ? playedBones.filter(d => ptVal(d) > 0) : [];
  const trumpPlayed   = isAdvanced ? playedBones.filter(d => isTrump(d, t)) : [];

  const voidSuits = {};
  if (difficulty === AI_RAINMAN && done.length) {
    done.forEach(tk => {
      const ledSuit = tk.plays.length > 0 ? getSuit(tk.plays[0].d, t) : null;
      if (!ledSuit || ledSuit === 'T') return;
      tk.plays.forEach(p => {
        if (p.who === who || PTEAM[p.who] === mt) return;
        const followed = inSuit(p.d, ledSuit, t) || isTrump(p.d, t);
        if (!followed) {
          if (!voidSuits[p.who]) voidSuits[p.who] = [];
          if (!voidSuits[p.who].includes(ledSuit)) voidSuits[p.who].push(ledSuit);
        }
      });
    });
  }

  const isWalker = (d) => {
    if (!isAdvanced || isTrump(d, t)) return false;
    const suit = d.h;
    const allInSuit = [...playedBones, ...leg].filter(x =>
      (x.h === suit || x.l === suit) && !(x.h === x.l) && !isTrump(x, t)
    );
    const myRank      = sRank(d, suit);
    const higherExist = allInSuit.some(x => sRank(x, suit) > myRank && x.id !== d.id);
    return !higherExist && d.h === d.l;
  };

  if (trick.length === 0) {
    if (onB) {
      if (isAdvanced && t === TRUMP_DOUBLES) {
        const doubles = leg.filter(d => d.h === d.l);
        if (doubles.length) {
          return doubles.reduce((b, d) => tRank(d, t) > tRank(b, t) ? d : b);
        }
      }
      const tr = leg.filter(d => isTrump(d, t));
      const shouldPullTrump = tr.length && (
        (td || 0) < 2 || (isAdvanced && trumpPlayed.length < 3 && tr.length > 0)
      );
      if (shouldPullTrump) {
        let trumpToLead = tr.reduce((b, d) => tRank(d, t) > tRank(b, t) ? d : b);
        if (t === TRUMP_DOUBLES) {
          const has66       = tr.some(d => d.h === 6 && d.l === 6);
          const played66    = playedBones.some(d => d.h === 6 && d.l === 6);
          const fiveDanger  = !has66 && !played66;
          if (fiveDanger) {
            const saferTr = tr.filter(d => !(d.h === 5 && d.l === 5));
            if (saferTr.length) trumpToLead = saferTr.reduce((b, d) => tRank(d, t) > tRank(b, t) ? d : b);
          }
        }
        return trumpToLead;
      }
      if (isAdvanced) {
        const walkers = leg.filter(d => isWalker(d) && !isTrump(d, t));
        if (walkers.length) return walkers.reduce((b, d) => ptVal(d) > ptVal(b) ? d : b);
      }
      const ct = leg.filter(d => ptVal(d) > 0 && !isTrump(d, t));
      if (ct.length) return ct.reduce((b, d) => ptVal(d) > ptVal(b) ? d : b);
    }

    if (difficulty === AI_RAINMAN && !onB) {
      const oppPlayers = [1, 3].filter(p => PTEAM[p] !== mt);
      const voidLeads  = leg.filter(d => {
        if (isTrump(d, t)) return false;
        const suit = getSuit(d, t);
        return oppPlayers.some(p => voidSuits[p] && voidSuits[p].includes(suit));
      });
      if (voidLeads.length) return voidLeads.reduce((b, d) => ptVal(d) > ptVal(b) ? d : b);
      const offs = leg.filter(d => !isTrump(d, t) && !isWalker(d) && ptVal(d) === 0);
      if (offs.length) return offs.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
    }

    if (isAdvanced && !onB) {
      const nT = leg.filter(d => !isTrump(d, t) && ptVal(d) === 0);
      if (nT.length) return nT[0 | Math.random() * nT.length];
    }

    const nT = leg.filter(d => !isTrump(d, t));
    if (nT.length) return nT[0 | Math.random() * nT.length];
    return leg[0 | Math.random() * leg.length];
  }

  const cW            = tWinner(trick, ls, t, bidType, dHi);
  const weW           = PTEAM[cW] === mt;
  const partnerWinning = cW === myPartner;

  if (partnerWinning) {
    const nonTrump = leg.filter(d => !isTrump(d, t));
    if (nonTrump.length) {
      const ct = nonTrump.filter(d => ptVal(d) > 0);
      if (ct.length) return ct.reduce((b, d) => ptVal(d) > ptVal(b) ? d : b);
      return lowestAny(nonTrump);
    }
    return leg.reduce((b, d) => tRank(d, t) < tRank(b, t) ? d : b);
  }

  if (weW) {
    const ct = leg.filter(d => ptVal(d) > 0);
    if (ct.length) return ct.reduce((b, d) => ptVal(d) > ptVal(b) ? d : b);
    const nT = leg.filter(d => !isTrump(d, t));
    if (nT.length) return nT.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
    return leg.reduce((b, d) => tRank(d, t) < tRank(b, t) ? d : b);
  }

  const cWin = leg.filter(d => tWinner([...trick, { who, d }], ls, t, bidType, dHi) === who);
  if (cWin.length) {
    if (isAdvanced) {
      const trickHasCount = trick.some(p => ptVal(p.d) > 0);
      const winWithCount  = cWin.filter(d => ptVal(d) > 0);
      if (trickHasCount || winWithCount.length) {
        if (winWithCount.length) return winWithCount.reduce((b, d) => ptVal(d) > ptVal(b) ? d : b);
        return cWin.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
      }
      const cheapWin = cWin.filter(d => ptVal(d) === 0 && !isTrump(d, t));
      if (cheapWin.length) return cheapWin.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
    }
    const wc = cWin.filter(d => ptVal(d) > 0);
    if (wc.length) return wc.reduce((b, d) => ptVal(d) > ptVal(b) ? d : b);
    return cWin.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
  }

  const nC  = leg.filter(d => ptVal(d) === 0 && !isTrump(d, t));
  if (nC.length)  return nC.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
  const nCA = leg.filter(d => ptVal(d) === 0);
  if (nCA.length) return nCA.reduce((b, d) => (d.h + d.l) < (b.h + b.l) ? d : b);
  return leg.reduce((b, d) => ptVal(d) < ptVal(b) ? d : b);
}

module.exports = { aiPlay };
