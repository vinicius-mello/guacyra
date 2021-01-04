const Kernel = require('./kernel');
const { 
  $$, Form, Symbol, Cons,
  has, subst, Eval,
  addRule, Integer, Literal,
  Plus, Times, Power, Sqrt, Divide, Subtract,
  debugEx, toString
} = Kernel; 
const Formatting = require('./formatting');
const { equal } = require('./kernel');
const {
  latex
} = Formatting;
const D = Form('D');
const Derivative = Form('Derivative');
const Log = Form('Log');
const Exp = Form('Exp');
const Sin = Form('Sin');
const Cos = Form('Cos');
const Pi = Symbol('Pi');
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
  $$`D(k_, x_Symbol)`,
  ({ k, x }) => {
    if (!has(k, x)) return Integer(0);
    return null;
  }
);
addRule(
  $$`D(x_Symbol, x_Symbol)`,
  $$`1`
);
addRule(
  $$`D(Power(x_Symbol, n_Integer), x_Symbol)`,
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
  $$`D(Times(k_, a__), x_Symbol)`,
  ({ k, x, a }) => {
    if (!has(k, x)) return Times(k, D(Times(a), x));
    return Plus(Times(D(k, x), a), Times(k, D(Times(a), x)));
  }
);
addRule(
  $$`D(Plus(a__), x_Symbol)`, 
  $$`Map( t => D(t,x), Plus(a) )`
);
addRule(
  $$`D(Power(f_, n_Integer), x_Symbol)`,
  ({ f, n, x }) => Times(n, Power(f, Subtract(n, 1)), D(f, x))
);
addRule(
  $$`D(Power(f_, n_Rational), x_Symbol)`,
  ({ f, n, x }) => Times(n, Power(f, Subtract(n, 1)), D(f, x))
);
addRule(
  $$`D(f_(y_), x_Symbol)`,
  $$`Times(Derivative(f)(1)(y), D(y, x))`
);
addRule(
  $$`LaTeX(Pi)`,
  Literal('\\pi'),
  'Pi'
);
debugEx('Pi', `LaTeX(Pi)`);
addRule(
  $$`LaTeX(Exp(a_))`,
  ({ a }) => Literal('e^{' + latex(a) + '}'),
  'Exp'
);
debugEx('Exp', `LaTeX(Exp(x))`);
addRule(
  $$`LaTeX(Log(a_))`,
  ({ a }) => Literal('\\log{' + latex(a) + '}'),
  'Log'
);
addRule(
  $$`LaTeX(Sin(a_))`,
  ({ a }) => Literal('\\sin{' + latex(a) + '}'),
  'Sin'
);
addRule(
  $$`LaTeX(Cos(a_))`,
  ({ a }) => Literal('\\cos{' + latex(a) + '}'),
  'Cos'
);
addRule(
  $$`LaTeX(Derivative(f_)(1)(x_))`,
  ({ f, x }) => Literal(latex(f)+"{'}(" +latex(x) +')'),
  'Derivative'
);

const Calculus  = {
  D, Derivative, Sin, Cos, Pi, Log, Exp
};

module.exports = Calculus;
