const Kernel = require('./kernel');
const Algebra = require('./algebra');

const { 
  $$, Form,
  equal, kind, Eval,
  addRule, Integer, Literal,
  Plus, Times, Power, 
  debugEx, toString
} = Kernel;

const {
  isNumeric,
  NumeratorDenominator
} = Algebra;

const LaTeX = Form('LaTeX'/*, { HoldAll: true }*/);
const value = e => kind(e) === 'Integer' ? e[1] : e[1][1]/e[2][1];

// LaTeX
const lessMath = (a, b) => {
  const ka = kind(a);
  const kb = kind(b);
  if (isNumeric(a) && isNumeric(b)) return value(a) < value(b);
  if (ka === 'Symbol' && kb === 'Symbol') return a[1] < b[1];
  if (
    (ka === 'Plus' && kb === 'Plus') ||
    (ka === 'Times' && kb === 'Times')
  ) {
    let m = a.length - 1;
    let n = b.length - 1;
    while (m >= 1 && n >= 1) {
      if (equal(a[m], b[n])) {
        m = m - 1;
        n = n - 1;
      } else {
        return lessMath(a[m], b[n]);
      }
    }
    return m < n;
  }
  if (ka === 'Power' && kb === 'Power') {
    if (equal(a[2], b[2])) return lessMath(a[1], b[1]);
    return lessMath(b[2], a[2]);
  }
  if (ka === kb) {
    let m = a.length;
    let n = b.length;
    let i = 1;
    while (i < m && i < n) {
      if (equal(a[i], b[i])) {
        i = i + 1;
      } else return lessMath(a[i], b[i]);
    }
    return m < n;
  }
  if (ka === 'Times') return lessMath(a, Times(b));
  else if (kb === 'Times') return lessMath(Times(a), b);
  if (ka === 'Power') return lessMath(a, Power(b, 1));
  else if (b === 'Power') return lessMath(Power(a, 1), b);
  if (ka === 'Plus') return lessMath(a, Plus(b));
  else if (kb === 'Plus') return lessMath(Plus(a), b);
  if (isNumeric(a) && !isNumeric(b)) return false;
  else if (!isNumeric(a) && isNumeric(b)) return true;
};
addRule($$`LaTeX()`, ({ a }) => Literal(''));
addRule($$`LaTeX(a_Integer)`, ({ a }) => Literal(`${a[1]}`));
addRule($$`LaTeX(a_Symbol)`, ({ a }) => Literal(`${a[1]}`));
addRule($$`LaTeX(a_Literal)`, ({ a }) => a);
addRule($$`LaTeX(Times(p_Rational, a_Symbol))`, ({ p, a }) => {
  if (p[1] < 0) {
    const s = Eval(LaTeX(Times(-p[1][1], a)))[1];
    return Literal(`-\\frac{${s}}{${p[2][1]}}`);
  } else {
    const s = Eval(LaTeX(Times(p[1][1], a)))[1];
    return Literal(`\\frac{${s}}{${p[2][1]}}`);
  }
});
addRule($$`LaTeX(a_Rational)`, ({ a }) => {
  if (a[1][1] < 0) return Literal(`-\\frac{${-a[1][1]}}{${a[2][1]}}`);
  else return Literal(`\\frac{${a[1][1]}}{${a[2][1]}}`);
});
addRule($$`LaTeX(Complex(a_,b_))`, ({ a, b }) => {
  let at = Eval(LaTeX(a))[1];
  if (equal(a, Integer(0))) at = '';
  const bt = Eval(LaTeX(Times(b, Literal('\\mathrm{i}'))))[1];
  if (!bt.startsWith('-') && at !== '') at = at + '+';
  return Literal(`${at}${bt}`);
});
addRule($$`LaTeX(Plus(c__))`, ({ c }) => {
  let r = '';
  let ex = c.slice(1);
  ex.sort((a, b) => (lessMath(a, b) ? -1 : 1));
  for (let i = 0; i < ex.length; ++i) {
    const s = Eval(LaTeX(ex[i]))[1];
    if (!s.startsWith('-') && i != 0) {
      r = r + '+';
    }
    r = r + s;
  }
  return Literal(r);
});
const parenthesisPlus = c => {
  let r = '';
  for (let i = 1; i < c.length; ++i) {
    let s = Eval(LaTeX(c[i]))[1];
    if (kind(c[i]) === 'Plus') {
      s = '(' + s + ')';
    }
    r = r + s;
  }
  return r;
};
const parenthesisFrac = c => {
  const l = Eval(NumeratorDenominator(Times(c)));
  if (kind(l[2]) === 'Integer') return parenthesisPlus(c);
  const n = Eval(LaTeX(l[1]))[1];
  const d = Eval(LaTeX(l[2]))[1];
  return `\\frac{${n}}{${d}}`;
};
addRule($$`LaTeX(Times(a_Integer, c__))`, ({ a, c }) => {
  if (a[1] < 0) {
    const r = '-' + Eval(LaTeX(Eval(Times(-a[1], c))))[1];
    return Literal(r);
  } else {
    const r = parenthesisFrac(Eval(Times(a[1], c)));
    return Literal(r);
  }
});
addRule(
  $$`LaTeX(Times(a_Rational, Power(b_Integer, c_Rational), d___))`,
  ({ a, b, c, d }) => {
    if (c[1][1] == 1 && c[2][1] == 2) {
      let r = Eval(LaTeX(Power(b, c)))[1];
      let s = parenthesisFrac(d);
      if (a[1][1] == -1) {
        r = `-\\frac{${r}}{${a[2][1]}}`;
      } else {
        if (a[1][1] != 1) r = `${a[1][1]}` + r;
        r = `\\frac{${r}}{${a[2][1]}}`;
      }
      return Literal(r + s);
    }
    return null;
  }
);
addRule($$`LaTeX(Times(c__))`, ({ c }) => {
  return Literal(parenthesisFrac(c));
});
addRule($$`LaTeX(Power(a_, b_Rational))`, ({ a, b }) => {
  if (b[1][1] == 1 && b[2][1] == 2) {
    let s = Eval(LaTeX(a))[1];
    return Literal(`\\sqrt{${s}}`);
  }
  if (b[1][1] == -1 && b[2][1] == 2) {
    let s = Eval(LaTeX(a))[1];
    return Literal(`\\frac{1}{\\sqrt{${s}}}`);
  }
  return null;
});
addRule($$`LaTeX(Power(a_, b_Integer))`, ({ a, b }) => {
  if (b[1] < 0) {
    let s = Eval(LaTeX(Eval(Power(a, -b[1]))))[1];
    return Literal(`\\frac{1}{${s}}`);
  }
  return null;
});
addRule($$`LaTeX(Power(a_, b_))`, ({ a, b }) => {
  let r = '';
  let s = Eval(LaTeX(a))[1];
  if (!(kind(a) === 'Symbol' || kind(a) === 'Integer')) {
    s = '(' + s + ')';
  }
  r = r + s + '^{' + Eval(LaTeX(b))[1] + '}';
  return Literal(r);
});
addRule($$`LaTeX(a_)`, ({ a }) => Literal(toString(a)));
latex = e => Eval(LaTeX(e))[1];

const Formatting = {};

Formatting.LaTeX = LaTeX;
Formatting.latex = latex;

module.exports = Formatting;