const Kernel = require('./kernel');
const {
  $$, kind,
  addRule, equal, copy, 
  Form, Eval, lookup, newDef,
  Plus, Times, Divide, Cons,
  Integer, Null, List, toString
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
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = randInteger(0,i);
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}
seed('init');

const RandInteger = Form('RandInteger', { Impure: true });
addRule($$`RandInteger(a_Integer, b_Integer)`, ({ a, b }) => {
  return Integer(randInteger(a[1], b[1]));
});

const RandCombination = Form('RandCombination', { Impure: true });
addRule($$`RandCombination(n_Integer, m_Integer)`, ({ n, m }) => {
  const l = randCombination(n[1], m[1]).map( i => Integer(i));
  return List(...l);
});

const RandPermutation = Form('RandPermutation', { Impure: true });
addRule($$`RandPermutation(n_Integer)`, ({ n }) => {
  const l = [];
  for(let i=1;i<=n[1]; ++i) l.push(Integer(i));
  shuffleArray(l);
  return List(...l);
});

addRule($$`RandPermutation(l_List)`, ({ l }) => {
  const r = l.slice(1);
  shuffleArray(r);
  return List(...r);
});

const Seed = Form('Seed', { Impure: true });
addRule($$`Seed(a_)`, ({ a }) => {
  seed(toString(a));
  return Null;
});

const Random = { seed, rand, randInteger, randCombination };

module.exports = Random;