const Kernel = require('./kernel');
const Algebra = require('./algebra');
const LinearAlgebra = require('./linearAlgebra');

const { 
  $$, Form,
  equal, kind, Eval,
  addRule, Integer, Str,
  Plus, Times, Power, isAtom,
  toString
} = Kernel;

const {
  isNumeric,
  NumeratorDenominator
} = Algebra;

const {
  size, reducedRowEchelonSteps, rowEchelonSteps
} = LinearAlgebra;

const LaTeX = Form('LaTeX'/*, { HoldAll: true }*/);
const Output = Form('Output'/*, { HoldAll: true }*/);
const value = e => kind(e) === 'Integer' ? e[1] : e[1][1]/e[2][1];
const latex = e => Eval(LaTeX(e))[1];
const output = e => Eval(Output(e))[1];
const Display = Form('Display');
const RowReduceSteps = Form('RowReduceSteps');
const GaussianEliminationSteps = Form('GaussianEliminationSteps');
const SOL = s => s === 'Symbol' || s === 'Literal'; 
// LaTeX
const lessMath = (a, b) => {
  const ka = kind(a);
  const kb = kind(b);
  if (isNumeric(a) && isNumeric(b)) return value(a) < value(b);
  if (SOL(ka) && SOL(kb)) return a[1] < b[1];
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
addRule($$`LaTeX()`, Str(''));
addRule($$`LaTeX(a_Integer)`, $$`ToString(a)`);
addRule($$`LaTeX(a_Symbol)`, $$`ToString(a)`);
addRule($$`LaTeX(a_Literal)`, $$`ToString(a)`);
addRule($$`LaTeX(a_Str)`, $$`a`);
addRule($$`LaTeX(Times(p_Rational, a_))`, ({ p, a }) => {
  if(!SOL(kind(a))) return null;
  if (p[1][1] < 0) {
    const s = Eval(LaTeX(Times(-p[1][1], a)))[1];
    return Str(`-\\frac{${s}}{${p[2][1]}}`);
  } else {
    const s = Eval(LaTeX(Times(p[1][1], a)))[1];
    return Str(`\\frac{${s}}{${p[2][1]}}`);
  }
});
addRule($$`LaTeX(a_Rational)`, ({ a }) => {
  if (a[1][1] < 0) return Str(`-\\frac{${-a[1][1]}}{${a[2][1]}}`);
  else return Str(`\\frac{${a[1][1]}}{${a[2][1]}}`);
});
addRule($$`LaTeX(Complex(a_,b_))`, ({ a, b }) => {
  let at = Eval(LaTeX(a))[1];
  if (equal(a, Integer(0))) at = '';
  const bt = Eval(LaTeX(Times(b, Str('\\mathrm{i}'))))[1];
  if (!bt.startsWith('-') && at !== '') at = at + '+';
  return Str(`${at}${bt}`);
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
  return Str(r);
});
const parenthesisPlus = c => {
  let r = '';
  for (let i = 1; i < c.length; ++i) {
    let s = Eval(LaTeX(c[i]))[1];
    if (kind(c[i]) === 'Plus') {
      s = '(' + s + ')';
    } else if (kind(c[i]) === 'Complex' && !equal(c[i][1],Integer(0))) {
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
    return Str(r);
  } else {
    const r = parenthesisFrac(Eval(Times(a[1], c)));
    return Str(r);
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
      return Str(r + s);
    }
    return null;
  }
);
addRule($$`LaTeX(Times(c__))`, ({ c }) => {
  return Str(parenthesisFrac(c));
});
addRule($$`LaTeX(Power(a_, b_Rational))`, ({ a, b }) => {
  if (b[1][1] == 1 && b[2][1] == 2) {
    let s = Eval(LaTeX(a))[1];
    return Str(`\\sqrt{${s}}`);
  }
  if (b[1][1] == -1 && b[2][1] == 2) {
    let s = Eval(LaTeX(a))[1];
    return Str(`\\frac{1}{\\sqrt{${s}}}`);
  }
  return null;
});
addRule($$`LaTeX(Power(a_, b_Integer))`, ({ a, b }) => {
  if (b[1] < 0) {
    let s = Eval(LaTeX(Eval(Power(a, -b[1]))))[1];
    return Str(`\\frac{1}{${s}}`);
  }
  return null;
});
addRule($$`LaTeX(Power(a_, b_))`, ({ a, b }) => {
  let r = '';
  let s = Eval(LaTeX(a))[1];
  if (!isAtom(a)) {
    s = '(' + s + ')';
  }
  r = r + s + '^{' + Eval(LaTeX(b))[1] + '}';
  return Str(r);
});

const formatMatrix = (A, bra = ['[', ']']) => {
  const [m, n] = size(A);
  const cc = 'r'.repeat(n);
  let r = '';
  r = r + `\\left${bra[0]}\\begin{array}{${cc}}`;
  for (let i = 1; i <= m; ++i) {
    for (let j = 1; j <= n; ++j) {
      r = r + latex(A[i][j]);
      if (j != n) r = r + '&';
    }
    if (i != m) r = r + '\\\\';
  }
  r = r + `\\end{array}\\right${bra[1]}`;
  return r;
};

addRule($$`LaTeX(A_List)`, ({ A }) => {
  try {
    return Str(formatMatrix(A));
  } catch(e) {
    return Str(output(A));
  }
});
addRule($$`LaTeX(a_)`, ({ a }) => Str(toString(a)));
 

addRule($$`Output()`, Str(''));
addRule($$`Output(a_Integer)`, $$`ToString(a)`);
addRule($$`Output(a_Symbol)`, $$`ToString(a)`);
addRule($$`Output(a_Literal)`, $$`ToString(a)`);
addRule($$`Output(a_Str)`, $$`a`);
addRule($$`Output(Times(p_Rational, a_))`, ({ p, a }) => {
  if(!SOL(kind(a))) return null;
  if (p[1] < 0) {
    const s = Eval(Output(Times(-p[1][1], a)))[1];
    return Str(`-${s}/${p[2][1]}`);
  } else {
    const s = Eval(Output(Times(p[1][1], a)))[1];
    return Str(`${s}/${p[2][1]}`);
  }
});
addRule($$`Output(a_Rational)`, ({ a }) => {
  if (a[1][1] < 0) return Str(`-${-a[1][1]}/${a[2][1]}`);
  else return Str(`${a[1][1]}/${a[2][1]}`);
});
addRule($$`Output(Complex(a_,b_))`, ({ a, b }) => {
  let at = Eval(Output(a))[1];
  if (equal(a, Integer(0))) at = '';
  const bt = Eval(Output(Times(b, Str('I'))))[1];
  if (!bt.startsWith('-') && at !== '') at = at + '+';
  return Str(`${at}${bt}`);
});
addRule($$`Output(Plus(c__))`, ({ c }) => {
  let r = '';
  let ex = c.slice(1);
  ex.sort((a, b) => (lessMath(a, b) ? -1 : 1));
  for (let i = 0; i < ex.length; ++i) {
    const s = Eval(Output(ex[i]))[1];
    if (!s.startsWith('-') && i != 0) {
      r = r + '+';
    }
    r = r + s;
  }
  return Str(r);
});
addRule($$`Output(List(c__))`, ({ c }) => {
  let r = '[';
  for (let i = 1; i < c.length; ++i) {
    let s = Eval(Output(c[i]))[1];
    if (i != 1) {
      s = ', ' + s;
    }
    r = r + s;
  }
  r = r + ']';
  return Str(r);
});
const parenthesisPlusO = c => {
  let r = '';
  for (let i = 1; i < c.length; ++i) {
    let s = Eval(Output(c[i]))[1];
    if (kind(c[i]) === 'Plus') {
      s = '(' + s + ')';
    } else if (kind(c[i]) === 'Complex' && !equal(c[i][1],Integer(0))) {
      s = '(' + s + ')';
    }
    if(i != 1) s = '*'+s;
    r = r + s;
  }
  return r;
};
const parenthesisFracO = c => {
  const l = Eval(NumeratorDenominator(Times(c)));
  if (kind(l[2]) === 'Integer') return parenthesisPlusO(c);
  const n = Eval(Output(l[1]))[1];
  const d = Eval(Output(l[2]))[1];
  return `(${n})/(${d})`;
};
addRule($$`Output(Times(a_Integer, c__))`, ({ a, c }) => {
  if (a[1] < 0) {
    const r = '-' + Eval(Output(Eval(Times(-a[1], c))))[1];
    return Str(r);
  } else {
    const r = parenthesisFracO(Eval(Times(a[1], c)));
    return Str(r);
  }
});
addRule(
  $$`Output(Times(a_Rational, Power(b_Integer, c_Rational), d___))`,
  ({ a, b, c, d }) => {
    if (c[1][1] == 1 && c[2][1] == 2) {
      let r = Eval(Output(Power(b, c)))[1];
      let s = parenthesisFracO(d);
      if (a[1][1] == -1) {
        r = `-${r}/${a[2][1]}`;
      } else {
        if (a[1][1] != 1) r = `${a[1][1]}` + '*' + r;
        r = `${r}/${a[2][1]}`;
      }
      return Str(r + s);
    }
    return null;
  }
);
addRule($$`Output(Times(c__))`, ({ c }) => {
  return Str(parenthesisFracO(c));
});
addRule($$`Output(Power(a_, b_Rational))`, ({ a, b }) => {
  if (b[1][1] == 1 && b[2][1] == 2) {
    let s = Eval(Output(a))[1];
    return Str(`Sqrt(${s})`);
  }
  if (b[1][1] == -1 && b[2][1] == 2) {
    let s = Eval(Output(a))[1];
    return Str(`1/Sqrt(${s})`);
  }
  return null;
});
addRule($$`Output(Power(a_, b_Integer))`, ({ a, b }) => {
  if (b[1] < 0) {
    let s = Eval(Output(Eval(Power(a, -b[1]))))[1];
    return Str(`1/${s}`);
  }
  return null;
});
addRule($$`Output(Power(a_, b_))`, ({ a, b }) => {
  let r = '';
  let s = Eval(Output(a))[1];
  if (!isAtom(a)) {
    s = '(' + s + ')';
  }
  r = r + s + '^' + Eval(Output(b))[1];
  return Str(r);
});
addRule($$`Output(a_)`, ({ a }) => Str(toString(a)));
addRule($$`Display(a_)`, ({ a }) => Str('$$'+latex(a)));

const formatEchelonSteps = (A, options = {}) => {
  let { method = reducedRowEchelonSteps, format = m => formatMatrix(m) } = options;
  let last;
  let r = String.raw`\begin{array}{c}`;
  for (let s of method(A)) {
    if (s.op === 'pivot') {
      continue;
    }
    let tt;
    if (s.op === 'init') {
      last = format(s.A);
      continue;
    } else if(s.op === 'rswap') {
      tt = `L_{${s.i}} \\rightarrow L_{${s.ip}}`;  
    } else if(s.op === 'rscale') {
      const l = latex($`${s.k}*LLLLL`).replace('LLLLL', `L_{${s.i}}`);
      tt = `L_{${s.i}} \\rightarrow ${l}`;  
    } else if(s.op === 'radd') {
      const l = latex($`AAAAA+${s.k}*BBBBB`).replace('AAAAA', `L_{${s.i}}`).replace('BBBBB', `L_{${s.ip}}`);
      tt = `L_{${s.i}} \\rightarrow ${l}`;  
    }
    const ta = format(s.A);
    r = r + String.raw` ${last} \;\underrightarrow{${tt}}\;${ta} \\ \\ `;
    last = ta;
  }
  return r+String.raw`\end{array}`;
};

addRule($$`RowReduceSteps(A_)`, ({ A }) =>
{
  const [m, n] = size(A);
  let r = buildTensor([m, n]);
  forEachEntry(A, (i, j) => {
    r[i][j] = A[i][j];
  });
  return Str('$$' + formatEchelonSteps(r));
});

addRule($$`GaussianEliminationSteps(A_)`, ({ A }) =>
{
  const [m, n] = size(A);
  let r = buildTensor([m, n]);
  forEachEntry(A, (i, j) => {
    r[i][j] = A[i][j];
  });
  return Str('$$' + formatEchelonSteps(r, {method: rowEchelonSteps}));
});

const Formatting = {};

Formatting.LaTeX = LaTeX;
Formatting.latex = latex;
Formatting.Output = Output;
Formatting.output = output;
Formatting.formatMatrix = formatMatrix;

module.exports = Formatting;