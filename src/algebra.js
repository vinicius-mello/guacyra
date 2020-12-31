import NumberAlgo from './number';
const { gcd, factorization, binomial } = NumberAlgo;

const Rational = Form('Rational');
const Dot = Form('Dot', { flat: true });
const Divide = Form('Divide');
const Complex = Form('Complex');
const I = Cons(Symbol('I'))();
ownValueSet('I', Complex(0, 1));
const Conjugate = Form('Conjugate');
const Abs = Form('Abs');
const Expand = Form('Expand');
const Sqrt = Form('Sqrt');
const NumeratorDenominator = Form('NumeratorDenominator');
const Numerator = Form('Numerator');
const Denominator = Form('Denominator');
const Together = Form('Together');
const LaTeX = Form('LaTeX', { holdAll: true });

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

const fracNorm = (num, den) => {
  const g = gcd(num, den);
  num = num / g;
  den = den / g;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  return [num, den];
};
addRule(
  $$`Divide(a_Integer, b_Integer)`,
  ({ a, b }) => {
    const [num, den] = fracNorm(a[1], b[1]);
    if (den == 1) return Integer(num);
    else return Rational(num, den);
  }
);
debugEx('Divide', `21/14`);
addRule(
  $$`Divide(a_, b_)`,
  ({ a, b }) => Times(a, Power(b, -1))
);
debugEx('Divide', `a/b`);
addRule(
  $$`Plus(a_Integer, b_Rational, c___)`,
  ({ a, b, c }) => Plus(Divide(a[1] * b[2] + b[1], b[2]), c)
);
addRule(
  $$`Plus(b_Rational, a_Integer, c___)`,
  ({ a, b, c }) => Plus(Divide(a[1] * b[2] + b[1], b[2]), c)
);
debugEx('Rational', `1+3/4`);
addRule(
  $$`Plus(a_Rational, b_Rational, c___)`,
  ({ a, b, c }) => Plus(Divide(a[1] * b[2] + b[1] * a[2], a[2] * b[2]), c)
);
debugEx('Rational', `2/3+3/4`);
addRule(
  $$`Times(a_Integer, b_Rational, c___)`,
  ({ a, b, c }) => Times(Divide(a[1] * b[1], b[2]), c)
);
addRule(
  $$`Times(b_Rational, a_Integer, c___)`,
  ({ a, b, c }) => Times(Divide(a[1] * b[1], b[2]), c)
);
debugEx('Times', `3/4*10`);
addRule(
  $$`Times(a_Rational, b_Rational, c___)`,
  ({ a, b, c }) => Times(Divide(a[1] * b[1], a[2] * b[2]), c)
);
debugEx('Times', `3/4*2/3`);
addRule(
  $$`Complex(a_, 0)`,
  $$`a`
);
addRule(
  $$`Conjugate(Complex(a_, b_))`,
  $$`Complex(a, Times(-1, b))`
);
// addRule($$`Conjugate(a_)`, $$`a`);
addRule(
  $$`Abs(a_Integer)`,
  ({ a }) => Integer(Math.abs(a[1]))
);
addRule(
  $$`Abs(p_Rational)`,
  ({ p }) => Rational(Math.abs(p[1]), p[2])
);
addRule(
  $$`Abs(Complex(a_, b_))`,
  $$`Sqrt(Plus(Power(a, 2), Power(b, 2)))`
);
addRule(
  $$`Plus(n_Integer, Complex(a_, b_), c___)`,
  $$`Plus(Complex(Plus(a, n), b), c)`
);
addRule(
  $$`Plus(p_Rational, Complex(a_, b_), c___)`,
  $$`Plus(Complex(Plus(a, p), b), c)`
);
addRule(
  $$`Plus(Complex(a_,b_), Complex(c_, d_), e___)`,
  $$`Plus(Complex(Plus(a, c), Plus(b, d)), e)`
);
addRule(
  $$`Times(n_Integer, Complex(a_, b_), c___)`,
  $$`Times(Complex(Times(n, a), Times(n, b)), c)`
);
addRule(
  $$`Times(p_Rational, Complex(a_, b_), c___)`,
  $$`Times(Complex(Times(p, a), Times(p, b)), c)`
);
addRule(
  $$`Times(Complex(a_, b_), Complex(c_, d_), e___)`,
  $$`Times(
      Complex(
        Subtract(
          Times(a, c),
          Times(b, d)),
        Plus(
          Times(a, d),
          Times(b, c))
      ),
      e
    )`
);
addRule(
  $$`Times(Complex(a_,b_), c_, d___)`,
  ({ a, b, c, d }) => {
    if (isNumericEx(c)) return Times(Complex(Times(a, c), Times(b, c)), d);
    return null;
  }
);
addRule(
  $$`Plus(Complex(a_,b_), c_, d___)`,
  ({ a, b, c, d }) => {
    if (isNumericEx(c)) return Plus(Complex(Plus(a, c), b), d);
    return null;
  }
);
debugEx('I', `I*I`);
addRule(
  $$`Times(-1, Plus(a__))`,
  $$`Map(x => Times(-1,x), Plus(a))`
  /*  ({ a }) => {
      const r = Plus();
      for(let i=1;i<a.length; ++i) 
        r.push(Times(-1, a[i]));
      return r;
    }*/
);
debugEx('Times', `-(a+b+c)`);
const ins = (t, a, b) => {
  const sa = toString(a);
  if (!t[sa]) {
    t[sa] = [a, Sequence(b)];
    return false;
  } else {
    t[sa][1].push(b);
    return true;
  }
};
addRule($$`Plus(c__)`, ({ c }) => {
  const r = Plus();
  let flag = false;
  const coefs = {};
  for (let i = 1; i < c.length; ++i) {
    const cap = {};
    if (match(c[i], $$`Times(a_Integer, b_)`, cap))
      flag = ins(coefs, cap.b, cap.a) || flag;
    else if (match(c[i], $$`Times(a_Integer, b__)`, cap))
      flag = ins(coefs, cap.b, cap.a) || flag;
    else if (match(c[i], $$`Times(a_Rational, b_)`, cap))
      flag = ins(coefs, cap.b, cap.a) || flag;
    else if (match(c[i], $$`Times(a_Rational, b__)`, cap))
      flag = ins(coefs, cap.b, cap.a) || flag;
    else if (match(c[i], $$`Times(b__)`, cap))
      flag = ins(coefs, cap.b, Integer(1)) || flag;
    else flag = ins(coefs, c[i], Integer(1)) || flag;
  }
  if (flag) {
    for (let k in coefs) {
      const v = coefs[k];
      apply('Plus', v[1]);
      r.push(Times(v[1], v[0]));
    }
    return r;
  }
  return null;
});
debugEx('Plus', `3*x+4*x-x`);
addRule($$`Times(c__)`, ({ c }) => {
  const r = Times();
  let flag = false;
  const coefs = {};
  for (let i = 1; i < c.length; ++i) {
    const cap = {};
    if (match(c[i], $$`Power(a_Integer, b_Rational)`, cap))
      flag = ins(coefs, Power(cap.a, cap.b), Integer(1)) || flag;
    else if (match(c[i], $$`Power(a_, b_)`, cap))
      flag = ins(coefs, cap.a, cap.b) || flag;
    else flag = ins(coefs, c[i], Integer(1)) || flag;
  }
  if (flag) {
    for (let k in coefs) {
      const v = coefs[k];
      apply('Plus', v[1]);
      r.push(Power(v[0], v[1]));
    }
    return r;
  }
  return null;
});
addRule($$`Times(c__)`, ({ c }) => {
  const r = Times();
  let flag = false;
  const coefs = {};
  for (let i = 1; i < c.length; ++i) {
    const cap = {};
    if (match(c[i], $$`Power(a_Integer, b_)`, cap))
      flag = ins(coefs, cap.b, cap.a) || flag;
    else ins(coefs, Integer(1), c[i]);
  }
  if (flag) {
    for (let k in coefs) {
      const v = coefs[k];
      apply('Times', v[1]);
      r.push(Power(v[1], v[0]));
    }
    return r;
  }
  return null;
});
addRule($$`Power(a_Integer, b_Integer)`, ({ a, b }) => {
  if (b[1] < 0) return Rational(1, Math.pow(a[1], -b[1]));
  return null;
});
addRule($$`Power(a_Rational, b_Integer)`, ({ a, b }) => {
  if (b[1] < 0) return Divide(Math.pow(a[2], -b[1]), Math.pow(a[1], -b[1]));
  else return Rational(Math.pow(a[1], b[1]), Math.pow(a[2], b[1]));
});
const rootContent = (fact, p, q) => {
  let [u, v] = [1, 1];
  for (let i = 0; i < fact.length; ++i) {
    const fip = fact[i][1] * p;
    const prime = fact[i][0];
    const a = Math.floor(fip / q);
    const b = fip - a * q;
    u = u * Math.pow(prime, a);
    v = v * Math.pow(prime, b);
  }
  return [u, v];
};
addRule($$`Power(a_Integer, b_Rational)`, ({ a, b }) => {
  if (a[1] < 0) return null;
  const fact = factorization(a[1]);
  if (b[1] > 0) {
    const [u, v] = rootContent(fact, b[1], b[2]);
    if (u == 1 && b[1] == 1) return null;
    else return Times(u, Power(v, Rational(1, b[2])));
  } else {
    const b1 = -b[1];
    const k = Math.floor(b1 / b[2]);
    const r = b1 - k * b[2];
    const [u, v] = rootContent(fact, b[2] - r, b[2]);
    return Times(
      Divide(u, Math.pow(a[1], k + 1)),
      Power(v, Rational(1, b[2]))
    );
  }
});
addRule($$`Power(a_Rational, b_Rational)`, ({ a, b }) =>
  Times(Power(a[1], b), Power(a[2], Rational(-b[1], b[2])))
);
addRule($$`Power(Power(a_, b_), c_Integer)`, ({ a, b, c }) =>
  Power(a, Times(b, c))
);
addRule($$`Power(Times(a__), b_Integer)`, ({ a, b }) => {
  const r = Times();
  for (let i = 1; i < a.length; ++i)
    r.push(Power(a[i], b));
  return r;
});
addRule($$`Sqrt(a_)`, ({ a }) => Power(a, Rational(1, 2)));
addRule($$`Power(z_Complex, n_Integer)`, ({ z, n }) => {
  let r = Complex(1, 0);
  const p = Math.abs(n[1]);
  for (let i = 0; i < p; ++i) r = Eval(Times(r, z));
  if (n[1] < 0) return Times(Conjugate(r), Divide(1, Power(Abs(r), 2)));
  return r;
});
addRule($$`Numerator(a_Integer)`, ({ a }) => a);
addRule($$`Numerator(a_Rational)`, ({ a }) => Integer(a[1]));
addRule($$`Numerator(a_)`, ({ a }) => a);
addRule($$`Denominator(a_Integer)`, ({ a }) => Integer(1));
addRule($$`Denominator(a_Rational)`, ({ a }) => Integer(a[2]));
addRule($$`Denominator(a_)`, ({ a }) => Integer(1));
addRule($$`NumeratorDenominator(a_Integer)`, ({ a }) => List(a, Integer(1)));
addRule($$`NumeratorDenominator(a_Rational)`, ({ a }) =>
  List(Integer(a[1]), Integer(a[2]))
);
addRule($$`NumeratorDenominator(Power(a_, n_Integer))`, ({ a, n }) => {
  if (n[1] < 0) {
    return List(1, Power(a, -n[1]));
  } else {
    return List(Power(a, n), 1);
  }
});
addRule($$`NumeratorDenominator(Power(a_, n_Rational))`, ({ a, n }) => {
  if (n[1] < 0) {
    return List(1, Power(a, Rational(-n[1], n[2])));
  } else {
    return List(Power(a, n), 1);
  }
});
addRule($$`NumeratorDenominator(Times(a__))`, ({ a }) => {
  const num = Times();
  const den = Times();
  for (let i = 1; i < a.length; ++i) {
    const f = Eval(NumeratorDenominator(a[i]));
    num.push(f[1]);
    den.push(f[2]);
  };
  return List(num, den);
});
addRule($$`NumeratorDenominator(Plus(a__))`, ({ a }) => {
  const num = Plus();
  const den = Times();
  const t = {};
  const e = List();
  for (let i = 1; i < a.length; ++i) {
    const f = Eval(NumeratorDenominator(a[i]));
    e.push(f);
    const ei = f[2];
    const eis = toString(ei);
    if (!t[eis]) {
      t[eis] = true;
      den.push(ei);
    }
  }
  for (let i = 1; i < a.length; ++i) {
    const r = Eval(Times(copy(den), Divide(e[i][1], e[i][2])));
    num.push(r);
  }
  return List(num, den);
});
addRule($$`NumeratorDenominator(a_)`, ({ a }) => List(a, 1));
addRule($$`Together(a_)`, ({ a }) => {
  const l = Eval(NumeratorDenominator(a));
  if (kind(l[2]) === 'Integer') return Divide(l[1], l[2]);
  return Divide(Together(l[1]), Together(l[2]));
});
// Expand
addRule($$`Expand(Times(a__))`, ({ a }) => {
  for (let j = 1; j < a.length; ++j) {
    let cap = {};
    if (match(a[j], $$`Plus(b__)`, cap)) {
      let r = Plus();
      for (let k = 1; k < cap.b.length; ++k) {
        let t = a.slice();
        apply('Times', t);
        t[j] = cap.b[k];
        r.push(Expand(t));
      }
      return r;
    } else if (
      match(a[j], $$`Power(Plus(b__), n_Integer)`, cap) &&
      cap.n[1] > 0
    ) {
      let t = a.slice();
      apply('Times', t);
      t[j] = Expand(Power(Plus(cap.b), cap.n[1]));
      return Expand(t);
    }
  }
  return Times(a);
});
addRule($$`Expand(Power(Plus(a_, b__), n_Integer))`, ({ a, b, n }) => {
  let r = Plus();
  for (let i = 0; i <= n[1]; ++i) {
    r.push(
      Expand(
        Times(
          binomial(n[1], i),
          Power(a, n[1] - i),
          Expand(Power(Plus(b), i))
        )
      )
    );
  }
  return r;
});
addRule($$`Expand(Plus(a_, b__))`, ({ a, b }) =>
  Plus(Expand(a), Expand(Plus(b)))
);
addRule($$`Expand(a_)`, ({ a }) => a);
// LaTeX
addRule($$`LaTeX()`, ({ a }) => Literal(''));
addRule($$`LaTeX(a_Integer)`, ({ a }) => Literal(`${a[1]}`));
addRule($$`LaTeX(a_Symbol)`, ({ a }) => Literal(`${a[1]}`));
addRule($$`LaTeX(a_Literal)`, ({ a }) => a);
addRule($$`LaTeX(Times(p_Rational, a_Symbol))`, ({ p, a }) => {
  if (p[1] < 0) {
    const s = Eval(LaTeX(Times(-p[1], a)))[1];
    return Literal(`-\\frac{${s}}{${p[2]}}`);
  } else {
    const s = Eval(LaTeX(Times(p[1], a)))[1];
    return Literal(`\\frac{${s}}{${p[2]}}`);
  }
});
addRule($$`LaTeX(a_Rational)`, ({ a }) => {
  if (a[1] < 0) return Literal(`-\\frac{${-a[1]}}{${a[2]}}`);
  else return Literal(`\\frac{${a[1]}}{${a[2]}}`);
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
    if (c[1] == 1 && c[2] == 2) {
      let r = Eval(LaTeX(Power(b, c)))[1];
      let s = parenthesisFrac(d);
      if (a[1] == -1) {
        r = `-\\frac{${r}}{${a[2]}}`;
      } else {
        if (a[1] != 1) r = `${a[1]}` + r;
        r = `\\frac{${r}}{${a[2]}}`;
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
  if (b[1] == 1 && b[2] == 2) {
    let s = Eval(LaTeX(a))[1];
    return Literal(`\\sqrt{${s}}`);
  }
  if (b[1] == -1 && b[2] == 2) {
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
const latex = e => Eval(LaTeX(e))[1];

Guacyra.latex = latex;
