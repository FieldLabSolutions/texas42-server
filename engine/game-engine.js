/* ── TEXAS 42 — GAME ENGINE ── */
/* Pure functions — take state, return new state. No side effects. */

const {
  MARKS_TO_WIN, PTEAM,
  BID_NELLO, BID_SEVENS, BID_PLUNGE, BID_SPLASH, BID_PASS,
  HUMAN, PNAMES,
  poss, subj,
} = require('./constants');

const { mkDeck, getSuit, tWinner, nxtPl, ptVal } = require('./domino');
const { bidGt, bidLabel, isMkBid, marksFrom, trumpName } = require('./bidding');

function mkHand(dealer, marks, marksToWin = MARKS_TO_WIN) {
  if (marks[0] >= marksToWin) {
    return { phase: 'gameOver', marks: [...marks], msg: 'Your team wins!', dealer, hands: {0:[],1:[],2:[],3:[]}, done: [], tCnt: [0,0], tPts: [0,0], trick: [], bids: [null,null,null,null], hiBid: 29, hiBdr: null, bidType: null, trump: null, ls: null, sel: null, handOver: true, handResult: 'win', nextDealer: (dealer+1)%4 };
  }
  if (marks[1] >= marksToWin) {
    return { phase: 'gameOver', marks: [...marks], msg: 'Opponents win.', dealer, hands: {0:[],1:[],2:[],3:[]}, done: [], tCnt: [0,0], tPts: [0,0], trick: [], bids: [null,null,null,null], hiBid: 29, hiBdr: null, bidType: null, trump: null, ls: null, sel: null, handOver: true, handResult: 'loss', nextDealer: (dealer+1)%4 };
  }

  const deck  = mkDeck();
  const hands = {
    0: deck.slice(0,  7),
    1: deck.slice(7,  14),
    2: deck.slice(14, 21),
    3: deck.slice(21, 28)
  };
  const fb = (dealer + 1) % 4;
  return {
    phase: 'bidding', hands, dealer, marks: [...marks],
    bids: [null, null, null, null],
    hiBid: 29, hiBdr: null, bidType: null, nelloOut: null, dblHi: null,
    curBdr: fb, trump: null, curPl: null, trick: [], ls: null, done: [],
    tCnt: [0, 0], tPts: [0, 0], lastW: null, sel: null,
    handOver: false, handResult: null, plunge: false,
    nextDealer: (dealer + 1) % 4,
    msg: `${poss(fb)} turn to bid (min 30)`
  };
}

function startPlay(S, hiBid, hiBdr, bidType, bids, plunge) {
  const nelloOut = bidType === BID_NELLO ? (hiBdr + 2) % 4 : null;

  if (bidType === BID_NELLO) {
    return { ...S, bids, hiBid, hiBdr, bidType, nelloOut, trump: null, plunge,
      dblHi: null, phase: 'doublesChoice', curPl: hiBdr, ls: null, trick: [],
      msg: `${subj(hiBdr)} bid Low. Doubles high or low?` };
  }
  if (bidType === BID_SEVENS) {
    return { ...S, bids, hiBid, hiBdr, bidType, nelloOut: null, trump: null, plunge,
      phase: 'playing', curPl: hiBdr, ls: null, trick: [],
      msg: `Sevens — play closest to 7. ${subj(hiBdr)} leads.` };
  }

  const tSel = plunge ? (hiBdr + 2) % 4 : hiBdr;
  const tMsg = tSel === HUMAN ? ' Pick trump!' : ` ${PNAMES[tSel]} choosing trump…`;
  return { ...S, bids, hiBid, hiBdr, bidType, nelloOut: null, plunge,
    phase: 'selectTrump',
    msg: `${subj(hiBdr)} bid ${bidLabel(hiBid)}.${tMsg}` };
}

function doBid(S, bid) {
  if (S.phase !== 'bidding') return S;
  const bids = [...S.bids];
  bids[S.curBdr] = bid;
  let { hiBid, hiBdr, plunge, bidType } = S;

  if (bid !== BID_PASS && bidGt(bid, hiBid)) {
    hiBid = bid; hiBdr = S.curBdr; plunge = false; bidType = null;
  }

  if (bids.every(b => b != null)) {
    if (hiBdr == null) { hiBid = 30; hiBdr = S.dealer; bidType = null; }
    return startPlay(S, hiBid, hiBdr, bidType, bids, plunge);
  }

  const next = (S.curBdr + 1) % 4;
  return { ...S, bids, hiBid, hiBdr, plunge, bidType, curBdr: next,
    msg: `${subj(S.curBdr)} ${bid === BID_PASS ? 'passed' : `bid ${bidLabel(bid)}`}. ${poss(next)} turn.` };
}

function doForced(S, type, who = HUMAN) {
  if (type === BID_NELLO) {
    const nelloOut = (who + 2) % 4;
    const bids = [...S.bids].map((b, i) => i === who ? type : b);
    const msg  = who === HUMAN ? 'Low! Doubles high or low?' : `${PNAMES[who]} bid Low. Doubles high or low?`;
    return { ...S, hiBid: 100, hiBdr: who, bidType: type, nelloOut, trump: null,
      dblHi: null, phase: 'doublesChoice', curPl: who, ls: null, trick: [], bids, msg };
  }
  if (type === BID_SEVENS) {
    const bids = [...S.bids].map((b, i) => i === who ? type : b);
    const msg  = who === HUMAN ? 'Sevens! Play closest to 7. You lead.' : `${PNAMES[who]} bid Sevens! Play closest to 7.`;
    return { ...S, hiBid: 100, hiBdr: who, bidType: type, nelloOut: null, trump: null,
      phase: 'playing', curPl: who, ls: null, trick: [], bids, msg };
  }
  const bids = [...S.bids].map((b, i) => i === who ? type : b);
  return startPlay({ ...S, bids }, type, who, null, bids, false);
}

function doDblChoice(S, dblHi) {
  return { ...S, dblHi, phase: 'playing',
    msg: `Low — Doubles ${dblHi ? 'HIGH' : 'LOW'}. ${subj(S.hiBdr)} leads.` };
}

function doPlungeAsk(S, who = HUMAN) {
  return { ...S, phase: 'plungeAsk', plungeBidder: who, msg: 'Asking Partner to Plunge…' };
}

function doPlungeResp(S, agreed) {
  const bidder  = S.plungeBidder != null ? S.plungeBidder : HUMAN;
  const partner = (bidder + 2) % 4;
  if (!agreed) return { ...S, phase: 'bidding', plungeBidder: null,
    msg: `Partner declined. ${poss(S.curBdr)} turn.` };
  const bids = [...S.bids];
  bids[bidder]  = BID_PLUNGE;
  bids[partner] = 'plunge-agree';
  const hiBid = 400, hiBdr = bidder, plunge = true;
  const next = (bidder + 1) % 4;
  if (bids.filter(b => b != null).length >= 4) return startPlay(S, hiBid, hiBdr, null, bids, plunge);
  const actualNext = bids[next] != null ? (next + 1) % 4 : next;
  if (bids.filter(b => b != null).length >= 4 || bids[actualNext] != null)
    return startPlay(S, hiBid, hiBdr, null, bids, plunge);
  return { ...S, bids, hiBid, hiBdr, plunge, curBdr: actualNext, phase: 'bidding',
    msg: `Plunge! 4 Marks. ${poss(actualNext)} turn.` };
}

function doSplashAsk(S, who = HUMAN) {
  return { ...S, phase: 'plungeAsk', plungeBidder: who, splashBid: true, msg: 'Asking Partner for Splash…' };
}

function doSplashResp(S, agreed) {
  const bidder  = S.plungeBidder != null ? S.plungeBidder : HUMAN;
  const partner = (bidder + 2) % 4;
  if (!agreed) return { ...S, phase: 'bidding', plungeBidder: null, splashBid: false,
    msg: `Partner declined. ${poss(S.curBdr)} turn.` };
  const bids = [...S.bids];
  bids[bidder]  = BID_SPLASH;
  bids[partner] = 'splash-agree';
  const hiBid = 200, hiBdr = bidder, plunge = true;
  const next = (bidder + 1) % 4;
  if (bids.filter(b => b != null).length >= 4) return startPlay(S, hiBid, hiBdr, null, bids, plunge);
  const actualNext = bids[next] != null ? (next + 1) % 4 : next;
  if (bids[actualNext] != null) return startPlay(S, hiBid, hiBdr, null, bids, plunge);
  return { ...S, bids, hiBid, hiBdr, plunge, splashBid: false, curBdr: actualNext, phase: 'bidding',
    msg: `Splash! 2 Marks. ${poss(actualNext)} turn.` };
}

function doTrump(S, trump, sel) {
  const exp = S.plunge ? (S.hiBdr + 2) % 4 : S.hiBdr;
  if (sel !== exp) return S;
  const tName  = trumpName(trump);
  const leader = S.plunge ? (S.hiBdr + 2) % 4 : S.hiBdr;
  return { ...S, trump, phase: 'playing', curPl: leader, ls: null, trick: [],
    msg: `Trump: ${tName}. ${subj(leader)} leads.` };
}

function doPlay(S, who, d, marksToWin = MARKS_TO_WIN) {
  if (S.phase !== 'playing' || S.curPl !== who) return S;
  const slots = [...S.hands[who]];
  const idx   = slots.findIndex(b => b && b.id === d.id);
  if (idx === -1) return S;
  slots[idx] = null;
  const hands = { ...S.hands, [who]: slots };
  const ls    = S.trick.length === 0 ? getSuit(d, S.trump) : S.ls;
  const trick = [...S.trick, { who, d }];
  const tsz   = S.nelloOut != null ? 3 : 4;

  if (trick.length < tsz) {
    const next = nxtPl(who, S.nelloOut);
    return { ...S, hands, trick, ls, curPl: next, sel: null, msg: `${poss(next)} turn` };
  }

  const w     = tWinner(trick, ls, S.trump, S.bidType, S.dblHi);
  const wt    = PTEAM[w];
  const bonus = trick.reduce((a, p) => a + ptVal(p.d), 0);
  const tCnt  = [...S.tCnt]; tCnt[wt]++;
  const tPts  = [...S.tPts]; tPts[wt] += bonus + 1;
  const done  = [...S.done, { plays: trick, w }];
  const bt    = PTEAM[S.hiBdr];
  const ms    = marksFrom(S.hiBid);

  if ((isMkBid(S.hiBid) && S.bidType !== BID_NELLO || S.bidType === BID_SEVENS) && PTEAM[w] !== bt) {
    const nm = [...S.marks]; nm[1 - bt] += ms;
    const hr = bt === 0 ? 'loss' : 'win';
    const base = { ...S, hands, trick, ls, done, tCnt, tPts, marks: nm, lastW: w, sel: null,
      phase: 'trickOver', handOver: true, handResult: hr,
      nextDealer: (S.dealer + 1) % 4, msg: `${subj(w)} took a trick — bid is set!` };
    if (nm[0] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Your team wins!' };
    if (nm[1] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Opponents win.' };
    return base;
  }

  if (S.bidType === BID_NELLO && PTEAM[w] === bt) {
    const nm = [...S.marks]; nm[1 - bt] += ms;
    const hr = bt === 0 ? 'loss' : 'win';
    const base = { ...S, hands, trick, ls, done, tCnt, tPts, marks: nm, lastW: w, sel: null,
      phase: 'trickOver', handOver: true, handResult: hr,
      nextDealer: (S.dealer + 1) % 4, msg: `${subj(w)} caught a trick — Low bid is set!` };
    if (nm[0] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Your team wins!' };
    if (nm[1] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Opponents win.' };
    return base;
  }

  if (done.length === 7) {
    const made = S.bidType === BID_NELLO   ? tCnt[bt] === 0
               : isMkBid(S.hiBid) || S.bidType === BID_SEVENS ? tCnt[bt] === 7
               : tPts[bt] >= S.hiBid;
    const nm   = [...S.marks]; nm[made ? bt : 1 - bt] += ms;
    const hr   = (made && bt === 0) || (!made && bt !== 0) ? 'win' : 'loss';
    const bname = bidLabel(S.hiBid);
    const msg  = made
      ? `${bt === 0 ? 'Your team' : 'Opponents'} made ${bname}!${ms > 1 ? ` +${ms} marks` : ''}`
      : `${bt === 0 ? 'Your team was' : 'Opponents were'} set on ${bname}.`;
    const base = { ...S, hands, trick, ls, done, tCnt, tPts, marks: nm, lastW: w, sel: null,
      phase: 'trickOver', handOver: true, handResult: hr,
      msg, nextDealer: (S.dealer + 1) % 4 };
    if (nm[0] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Your team wins!' };
    if (nm[1] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Opponents win.' };
    return base;
  }

  return { ...S, hands, trick, ls, done, tCnt, tPts, lastW: w, sel: null,
    phase: 'trickOver',
    msg: `${subj(w)} wins the trick!${S.bidType !== BID_NELLO && S.bidType !== BID_SEVENS ? ` (+${bonus + 1} pts)` : ''}` };
}

function doThrowIn(S, bidderWins, marksToWin = MARKS_TO_WIN) {
  const bt    = PTEAM[S.hiBdr];
  const ms    = marksFrom(S.hiBid);
  const nm    = [...S.marks]; nm[bidderWins ? bt : 1 - bt] += ms;
  const hr    = (bidderWins && bt === 0) || (!bidderWins && bt !== 0) ? 'win' : 'loss';
  const bname = bidLabel(S.hiBid);
  const msg   = bidderWins
    ? `${bt === 0 ? 'Your team' : 'Opponents'} claimed ${bname}! +${ms} mark${ms > 1 ? 's' : ''}.`
    : `${bt === 0 ? 'Your team was set on' : 'Opponents were set on'} ${bname}.`;
  const base  = { ...S, marks: nm, handOver: true, handResult: hr, msg,
    phase: 'trickOver', nextDealer: (S.dealer + 1) % 4, skipAnim: true };
  if (nm[0] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Your team wins!' };
  if (nm[1] >= marksToWin) return { ...base, phase: 'gameOver', msg: 'Opponents win.' };
  return base;
}

module.exports = {
  mkHand, startPlay, doBid, doForced,
  doDblChoice, doPlungeAsk, doPlungeResp,
  doSplashAsk, doSplashResp,
  doTrump, doPlay, doThrowIn,
};
