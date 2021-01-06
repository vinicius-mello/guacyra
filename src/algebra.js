const Kernel = require('./kernel');
const NumberAlgo = require('./number');
const { 
  $, $$, Form, Symbol, ownValueSet,
  equal, kind, apply, match, Eval,
  addRule, Integer,
  Plus, Times, Power, Sequence, List,
  Less, True, False,
  debugEx, toString
} = Kernel;
const { gcd, factorization, binomial } = NumberAlgo;

const Rational = Form('Rational');
const Divide = Form('Divide');
const Complex = Form('Complex');
const I = Symbol('I', 'reserved');
ownValueSet(I, Complex(0, 1));
const Conjugate = Form('Conjugate');
const Abs = Form('Abs');
const Expand = Form('Expand');
const Sqrt = Form('Sqrt');
const NumeratorDenominator = Form('NumeratorDenominator');
const Numerator = Form('Numerator');
const Denominator = Form('Denominator');
const Together = Form('Together');

const isNumeric = e => kind(e) === 'Integer' || kind(e) === 'Rational';
const isNumericEx = e => {
  if (isAtom(e)) return isNumeric(e);
  if (kind(e[0]) !== 'Symbol') return false;
  for (let i = 1; i < e.length; ++i)
    if (!isNumericEx(e[i])) return false;
  return true;
};
addRule(
  $$`Rational(a_Integer, b_Integer)`,
  ({ a, b }) => {
    let num = a[1];
    let den = b[1];
    const g = gcd(num, den);
    if(g == 1 && den > 0 && den != 1) return null;
    num = num / g;
    den = den / g;
    if (den < 0) {
      num = -num;
      den = -den;
    }
    if (den == 1) return Integer(num);
    else return Rational(num, den);
  }
);
debugEx('Rational', `Rational(14,2)`);
addRule($$`Numeric(a_Rational)`, True, 'Rational');
addRule(
  $$`Less(a_Integer, b_Rational)`,
  ({ a, b }) => {
    if(a[1]*b[2][1]<b[1][1]) return True;
    return False;
  }, 'Rational'
);
addRule(
  $$`Less(a_Rational, b_Integer)`,
  ({ a, b }) => {
    if(a[1][1]<b[1]*a[2][1]) return True;
    return False;
  }, 'Rational'
);
addRule(
  $$`Less(a_Rational, b_Rational)`,
  ({ a, b }) => {
    if(a[1][1]*b[2][1]<b[1][1]*a[2][1]) return True;
    return False;
  }, 'Rational'
);
addRule(
  $$`Less(a_Rational, b_)`,
  True, 'Rational'
);
addRule(
  $$`Less(a_, b_Rational)`,
  False, 'Rational'
);
addRule(
  $$`Divide(a_Integer, b_Integer)`,
  $$`Rational(a, b)`
);
debugEx('Divide', `21/14`);
addRule(
  $$`Divide(a_, b_)`,
  $$`Times(a, Power(b, -1))`
);
debugEx('Divide', `a/b`);
addRule(
  $$`Plus(a_Integer, Rational(b_Integer, c_Integer), d___)`,
  $$`Plus(Rational(a*c+b, c), d)`
);
addRule(
  $$`Plus(Rational(b_Integer, c_Integer), a_Integer, d___)`,
  $$`Plus(Rational(a*c+b, c), d)`
);
debugEx('Rational', `1+3/4`);
addRule(
  $$`Plus(Rational(a_Integer, b_Integer), Rational(c_Integer, d_Integer), e___)`,
  $$`Plus(Rational(a*d+b*c, b*d), e)`
);
debugEx('Rational', `2/3+3/4`);
addRule(
  $$`Times(a_Integer, Rational(b_Integer, c_Integer), d___)`,
  $$`Times(Rational(a*b,c), d)`
);
addRule(
  $$`Times(Rational(b_Integer, c_Integer), a_Integer, d___)`,
  $$`Times(Rational(a*b,c), d)`
);
debugEx('Times', `3/4*10`);
addRule(
  $$`Times(Rational(a_Integer, b_Integer), Rational(c_Integer, d_Integer), e___)`,
  $$`Times(Rational(a*c, b*d), e)`
);
debugEx('Times', `(3/4)*(2/3)`);
addRule($$`Numeric(a_Complex)`, True, 'Complex');
addRule(
  $$`Less(Complex(a_, b_), Complex(c_, d_))`,
  $$`If(a=c, b<d, a<c)`, 'Complex'
);
debugEx('Complex/Less', `(2+5*I)<(3+2*I)`);
addRule(
  $$`Less(a_Complex, b_)`,
  ({a, b}) => {
    const kb = kind(b);
    if(kb === 'Integer' || kb === 'Rational') return False;
    else return True;
  }, 'Complex'
);
addRule(
  $$`Less(a_, b_Complex)`,
  ({a, b}) => {
    const ka = kind(a);
    if(ka === 'Integer' || ka === 'Rational') return True;
    else return False;
  }, 'Complex'
);
addRule(
  $$`Complex(a_, 0)`,
  $$`a`
);
addRule(
  $$`Conjugate(Complex(a_, b_))`,
  $$`Complex(a, Times(-1, b))`
);
/*addRule(
  $$`Abs(a_Integer)`,
  $$`If(a<0, -a, a)`
);*/
$`Abs(a_Integer) := If(a<0, -a, a);
  Abs(Rational(a_Integer, b_Integer)) := Rational(Abs(a), b)`;
/*addRule(
  $$`Abs(Rational(a_Integer, b_Integer))`,
  $$`Rational(Abs(a), b)`
);*/
debugEx('Abs', `Abs(-3/7)`);
addRule(
  $$`Abs(Complex(a_, b_))`,
  $$`Sqrt(a^2+b^2)`
);
addRule(
  $$`Plus(n_Integer, Complex(a_, b_), c___)`,
  $$`Plus(Complex(a+n, b), c)`
);
addRule(
  $$`Plus(p_Rational, Complex(a_, b_), c___)`,
  $$`Plus(Complex(a+p, b), c)`
);
addRule(
  $$`Plus(Complex(a_, b_), Complex(c_, d_), e___)`,
  $$`Plus(Complex(a+c, b+d), e)`
);
addRule(
  $$`Times(n_Integer, Complex(a_, b_), c___)`,
  $$`Times(Complex(n*a, n*b), c)`
);
addRule(
  $$`Times(p_Rational, Complex(a_, b_), c___)`,
  $$`Times(Complex(Times(p, a), Times(p, b)), c)`
);
addRule(
  $$`Times(Complex(a_, b_), Complex(c_, d_), e___)`,
  $$`Times(Complex(a*c-b*d, a*d+b*c), e)`
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
debugEx('Abs', `Abs(I+2)`);
debugEx('Complex', `(1+I)+(5-3*I)`);
debugEx('Complex', `(1+I)*(5-3*I)`);
addRule(
  $$`Times(-1, Plus(a__))`,
  $$`Map(x => Times(-1,x), Plus(a))`
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
addRule(
  $$`Plus(c__)`, 
  ({ c }) => {
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
  }
);
debugEx('Plus', `3*x+4*x-x`);
addRule(
  $$`Times(c__)`,
  ({ c }) => {
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
  }
);
addRule(
  $$`Times(c__)`,
  ({ c }) => {
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
  }
);
addRule(
  $$`Power(a_Integer, b_Integer)`,
  $$`Rational(1, a^(-b))`
);
debugEx('Power', `5^(-2)`);
addRule(
  $$`Power(Rational(a_Integer, b_Integer), c_Integer)`,
  $$`If(c<0, Rational(b^(-c), a^(-c)), Rational(a^c, b^c))`
);
debugEx('Power', `(2/3)^(-2)`);
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
addRule(
  $$`Power(a_Integer, b_Rational)`,
  ({ a, b }) => {
    if (a[1] < 0) return null;
    const fact = factorization(a[1]);
    if (b[1][1] > 0) {
      const [u, v] = rootContent(fact, b[1][1], b[2][1]);
      if (u == 1 && b[1][1] == 1)
        return null;
      else 
        return Times(u, Power(v, Rational(1, b[2][1])));
    } else {
      const b1 = -b[1][1];
      const k = Math.floor(b1 / b[2][1]);
      const r = b1 - k * b[2][1];
      const [u, v] = rootContent(fact, b[2][1] - r, b[2][1]);
      return Times(
        Rational(u, Math.pow(a[1], k + 1)),
        Power(v, Rational(1, b[2][1]))
      );
    }
  }
);
addRule(
  $$`Power(Rational(a_Integer, b_Integer), c_Rational)`, 
  $$`a^(c)*b^(-c)`
);
debugEx('Power', `(2/3)^(1/2)`);
addRule(
  $$`Power(Power(a_, b_), c_Integer)`,
  $$`Power(a, Times(b, c))`
);
debugEx('Power', `(a^3)^2`);
addRule(
  $$`Power(Times(a__), b_Integer)`,
  $$`Map( x => x^b, Times(a))`
);
debugEx('Power', `(a*b*c)^2`);
addRule(
  $$`Sqrt(a_)`,
  $$`Power(a, Rational(1, 2))`
);
debugEx('Power', `Sqrt(a)`);
addRule(
  $$`Power(z_Complex, n_Integer)`,
  ({ z, n }) => {
    let r = Complex(1, 0);
    const p = Math.abs(n[1]);
    for (let i = 0; i < p; ++i) r = Eval(Times(r, z));
    if (n[1] < 0) return Times(Conjugate(r), Divide(1, Power(Abs(r), 2)));
    return r;
  }
);
addRule(
  $$`Numerator(a_Integer)`,
  $$`a`
);
addRule(
  $$`Numerator(Rational(a_Integer, b_Integer))`,
  $$`a`
);
addRule(
  $$`Numerator(a_)`,
  $$`a`
);
addRule(
  $$`Denominator(a_Integer)`,
  $$`1`
);
addRule($$`Denominator(a_Rational)`, ({ a }) => Integer(a[2][1]));
addRule($$`Denominator(a_)`, ({ a }) => Integer(1));
addRule($$`NumeratorDenominator(a_Integer)`, ({ a }) => List(a, Integer(1)));
addRule($$`NumeratorDenominator(a_Rational)`, ({ a }) =>
  List(Integer(a[1][1]), Integer(a[2][1]))
);
addRule($$`NumeratorDenominator(Power(a_, n_Integer))`, ({ a, n }) => {
  if (n[1] < 0) {
    return List(1, Power(a, -n[1]));
  } else {
    return List(Power(a, n), 1);
  }
});
addRule($$`NumeratorDenominator(Power(a_, n_Rational))`, ({ a, n }) => {
  if (n[1][1] < 0) {
    return List(1, Power(a, Rational(-n[1][1], n[2][1])));
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

const Algebra = {};
Algebra.Rational = Rational;
Algebra.Divide = Divide;
Algebra.Complex = Complex;
Algebra.I = I;
Algebra.Conjugate = Conjugate;
Algebra.Abs = Abs;
Algebra.Expand = Expand;
Algebra.Sqrt = Sqrt;
Algebra.NumeratorDenominator = NumeratorDenominator;
Algebra.Numerator = Numerator;
Algebra.Denominator = Denominator;
Algebra.Together = Together;
Algebra.isNumeric = isNumeric;
Algebra.isNumericEx = isNumericEx;

module.exports = Algebra;