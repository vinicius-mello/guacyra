const Kernel = require('./kernel');
const {
  $$, kind,
  addRule, equal, copy, 
  Form, Eval,
  Plus, Times, Divide,
  Integer, List, toString
} = Kernel;


// https://github.com/bryc/code/blob/master/jshash/PRNGs.md#jsf--smallprng
function jsf32(a, b, c, d) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    var t = (a - ((b << 27) | (b >>> 5))) | 0;
    a = b ^ ((c << 17) | (c >>> 15));
    b = (c + d) | 0;
    c = (d + t) | 0;
    d = (a + t) | 0;
    return (d >>> 0) / 4294967296;
  };
}
function xmur3(str) {
  for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)),
      (h = (h << 13) | (h >>> 19));
  return function () {
    (h = Math.imul(h ^ (h >>> 16), 2246822507)),
      (h = Math.imul(h ^ (h >>> 13), 3266489909));
    return (h ^= h >>> 16) >>> 0;
  };
}
let rnd;
const seed = str => {
  const s = xmur3(str.toString(2));
  rnd = jsf32(s(), s(), s(), s());
};
const rand = () => {
  return rnd();
};
const randInteger = (a = 0, b = 99) => {
  return Math.floor(a + (b + 1 - a) * rnd());
};
// https://stackoverflow.com/questions/2394246/algorithm-to-select-a-single-random-combination-of-values
const randCombination = (n, m) => {
  const s = [];
  for (let j = n - m + 1; j <= n; ++j) {
    const t = randInteger(1, j);
    if (s.findIndex(x => x == t) == -1) s.push(t);
    else s.push(j);
  }
  return s.sort();
};
seed('init');

const RandInteger = Form('RandInteger');
addRule($$`RandInteger(a_Integer, b_Integer)`, ({ a, b }) => {
  return Integer(randInteger(a[1], b[1]));
});

const Random = { seed, rand, randInteger, randCombination };

module.exports = Random;