/* ── TEXAS 42 — CONSTANTS ── */

const APP_VERSION = '0.2.0';

const HUMAN   = 0;
const PARTNER = 2;
const PNAMES  = ['You', 'Adam', 'Partner', 'John'];
const PTEAM   = [0, 1, 0, 1];

const SUIT_NAMES = ['Blanks', 'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];

const PIPS = {
  0: [],
  1: [[50,50]],
  2: [[30,30],[70,70]],
  3: [[30,30],[50,50],[70,70]],
  4: [[30,30],[70,30],[30,70],[70,70]],
  5: [[30,30],[70,30],[50,50],[30,70],[70,70]],
  6: [[27,22],[73,22],[27,50],[73,50],[27,78],[73,78]]
};

const MARKS_TO_WIN  = 7;
const MIN_BID       = 30;
const TOTAL_POINTS  = 42;
const COUNT_POINTS  = 35;

const BID_NELLO    = 'nello';
const BID_SEVENS   = 'sevens';
const BID_PLUNGE   = 'plunge';
const BID_SPLASH   = 'splash';
const BID_PASS     = 'pass';

const TRUMP_DOUBLES  = 'doubles';
const TRUMP_FOLLOWME = 'followme';

const PLAYER_COLORS = ['#2E7D32', '#C0392B', '#1565C0', '#7B1FA2'];

const AI_EASY    = 'easy';
const AI_NORMAL  = 'normal';
const AI_HARD    = 'hard';
const AI_RAINMAN = 'rainman';

function poss(w)  { return w === HUMAN ? 'Your'  : `${PNAMES[w]}'s`; }
function subj(w)  { return w === HUMAN ? 'You'   : PNAMES[w]; }

module.exports = {
  APP_VERSION, HUMAN, PARTNER, PNAMES, PTEAM,
  SUIT_NAMES, PIPS,
  MARKS_TO_WIN, MIN_BID, TOTAL_POINTS, COUNT_POINTS,
  BID_NELLO, BID_SEVENS, BID_PLUNGE, BID_SPLASH, BID_PASS,
  TRUMP_DOUBLES, TRUMP_FOLLOWME,
  PLAYER_COLORS,
  AI_EASY, AI_NORMAL, AI_HARD, AI_RAINMAN,
  poss, subj,
};
