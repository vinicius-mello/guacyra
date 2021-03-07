const Kernel = require('./kernel');
const { 
  $$, Form, mkReservedSymbol, Cons,
  has, subst, Eval,
  addRule, Integer, Str,
  Plus, Times, Power, Sqrt, Divide, Subtract,
  toString
} = Kernel; 
const Formatting = require('./formatting');
const { equal } = require('./kernel');
const {
  latex
} = Formatting;
const Diff = Form('Diff');
const Derivative = Form('Derivative');
const Log = Form('Log');
const Exp = Form('Exp');
const Sin = Form('Sin');
const Cos = Form('Cos');
const Pi = mkReservedSymbol('Pi');
addRule(
  $$`Log(1)`,
  $$`0`
);
addRule(
  $$`Exp(0)`,
  $$`1`
);
addRule(
  $$`Sin(Pi)`,
  $$`0`
);
addRule(
  $$`Sin(0)`,
  $$`0`
);
addRule(
  $$`Sin(Times(n_Integer, Pi))`,
  $$`0`
);
addRule(
  $$`Sin(Times(Rational(a_Integer, b_Integer), Pi))`,
  ({ a, b }) => {
    if (a[1] < 0) return $$`-Sin(${-a[1]}/${b[1]}*Pi)`;
    if (a[1] / b[1] > 2) return $$`Sin(${a[1] % (2 * b[1])}/${b[1]}*Pi)`;
    if (a[1] / b[1] > 1) return $$`-Sin(${a[1] - b[1]}/${b[1]}*Pi)`;
    if (a[1] / b[1] > 0.5) return $$`Sin(${b[1] - a[1]}/${b[1]}*Pi)`;
    if (a[1] == 1 && b[1] == 2) return Integer(1);
    if (a[1] == 1 && b[1] == 3) return Divide(Sqrt(3), 2);
    if (a[1] == 1 && b[1] == 4) return Divide(Sqrt(2), 2);
    if (a[1] == 1 && b[1] == 6) return Divide(1, 2);
    return null;
  }
);
addRule(
  $$`Cos(Pi)`,
  $$`-1`
);
addRule(
  $$`Cos(0)`,
  $$`1`
);
addRule($$
  `Cos(Times(n_Integer, Pi))`,
  ({ n }) => Integer(n[1] % 2 == 0 ? 1 : -1)
);
addRule(
  $$`Cos(Times(Rational(a_Integer, b_Integer), Pi))`,
  ({ a, b }) => {
    if (a[1] < 0) return $$`Cos(${-a[1]}/${b[1]}*Pi)`;
    if (a[1] / b[1] > 2) return $$`Cos(${a[1] % (2 * b[1])}/${b[1]}*Pi)`;
    if (a[1] / b[1] > 1) return $$`-Cos(${a[1] - b[1]}/${b[1]}*Pi)`;
    if (a[1] / b[1] > 0.5) return $$`-Cos(${b[1] - a[1]}/${b[1]}*Pi)`;
    if (a[1] == 1 && b[1] == 2) return Integer(0);
    if (a[1] == 1 && b[1] == 3) return Divide(1, 2);
    if (a[1] == 1 && b[1] == 4) return Divide(Sqrt(2), 2);
    if (a[1] == 1 && b[1] == 6) return Divide(Sqrt(3), 2);
    return null;
  }
);
addRule(
  $$`Diff(k_, x_Literal)`,
  ({ k, x }) => {
    if (!has(k, x)) return Integer(0);
    return null;
  }
);
addRule(
  $$`Diff(x_Literal, x_Literal)`,
  $$`1`
);
addRule(
  $$`Diff(Power(x_Literal, n_Integer), x_Literal)`,
  $$`n*x^(n-1)`
);
addRule(
  $$`Derivative(Log)(1)(x_)`,
  $$`1/x`
);
addRule(
  $$`Derivative(Exp)(1)(x_)`,
  $$`Exp(x)`
);
addRule(
  $$`Derivative(Sin)(1)(x_)`,
  $$`Cos(x)`
);
addRule(
  $$`Derivative(Cos)(1)(x_)`,
  $$`-Sin(x)`
);
addRule(
  $$`Diff(Times(k_, a__), x_Literal)`,
  ({ k, x, a }) => {
    if (!has(k, x)) return Times(k, Diff(Times(a), x));
    return Plus(Times(Diff(k, x), a), Times(k, Diff(Times(a), x)));
  }
);
addRule(
  $$`Diff(Plus(a__), x_Literal)`, 
  $$`Map( t => Diff(t,x), Plus(a) )`
);
addRule(
  $$`Diff(Power(f_, n_Integer), x_Literal)`,
  ({ f, n, x }) => Times(n, Power(f, Subtract(n, 1)), Diff(f, x))
);
addRule(
  $$`Diff(Power(f_, n_Rational), x_Literal)`,
  ({ f, n, x }) => Times(n, Power(f, Subtract(n, 1)), Diff(f, x))
);
addRule(
  $$`Diff(f_(y_), x_Literal)`,
  $$`Times(Derivative(f)(1)(y), Diff(y, x))`
);
addRule(
  $$`LaTeX(Pi)`,
  Str('\\pi'),
  'Pi'
);
addRule(
  $$`LaTeX(Exp(a_))`,
  ({ a }) => Str('e^{' + latex(a) + '}'),
  'Exp'
);
addRule(
  $$`LaTeX(Log(a_))`,
  ({ a }) => Str('\\log{' + latex(a) + '}'),
  'Log'
);
addRule(
  $$`LaTeX(Sin(a_))`,
  ({ a }) => Str('\\sin{' + latex(a) + '}'),
  'Sin'
);
addRule(
  $$`LaTeX(Cos(a_))`,
  ({ a }) => Str('\\cos{' + latex(a) + '}'),
  'Cos'
);
addRule(
  $$`LaTeX(Derivative(f_)(1)(x_))`,
  ({ f, x }) => Str(latex(f)+"{'}(" +latex(x) +')'),
  'Derivative'
);

const Calculus  = {
  Diff, Derivative, Sin, Cos, Pi, Log, Exp
};

module.exports = Calculus;
