const Kernel = require('./kernel');
const { 
  $$, Form, Symbol, Cons,
  has, subst, Eval,
  addRule, Integer, Literal,
  Plus, Times, Power, Sqrt, Divide, Subtract,
  debugEx, toString
} = Kernel; 
const Formatting = require('./formatting');
const {
  latex
} = Formatting;
const D = Form('D');
const Log = Form('Log');
const Exp = Form('Exp');
const Sin = Form('Sin');
const Cos = Form('Cos');
const Pi = Symbol('Pi');
addRule($$`Log(1)`, $$`0`);
addRule($$`Exp(0)`, $$`1`);
addRule($$`Sin(Pi)`, $$`0`);
addRule($$`Sin(0)`, $$`0`);
addRule($$`Sin(Times(n_Integer, Pi))`, $$`0` );
addRule($$`Sin(Times(p_Rational, Pi))`, ({ p }) => {
  if (p[1][1] < 0) return $$`-Sin(${-p[1][1]}/${p[2][1]}*Pi)`;
  if (p[1][1] / p[2][1] > 2) return $$`Sin(${p[1][1] % (2 * p[2][1])}/${p[2][1]}*Pi)`;
  if (p[1][1] / p[2][1] > 1) return $$`-Sin(${p[1][1] - p[2][1]}/${p[2][1]}*Pi)`;
  if (p[1][1] / p[2][1] > 0.5) return $$`Sin(${p[2][1] - p[1][1]}/${p[2][1]}*Pi)`;
  if (p[1][1] == 1 && p[2][1] == 2) return Integer(1);
  if (p[1][1] == 1 && p[2][1] == 3) return Divide(Sqrt(3), 2);
  if (p[1][1] == 1 && p[2][1] == 4) return Divide(Sqrt(2), 2);
  if (p[1][1] == 1 && p[2][1] == 6) return Divide(1, 2);
  return null;
});
addRule($$`Cos(Pi)`, $$`-1`);
addRule($$`Cos(0)`, $$`1`);
addRule($$`Cos(Times(n_Integer, Pi))`, ({ n }) =>
  Integer(n[1] % 2 == 0 ? 1 : -1)
);
addRule($$`Cos(Times(p_Rational, Pi))`, ({ p }) => {
  if (p[1][1] < 0) return $$`Cos(${-p[1][1]}/${p[2][1]}*Pi)`;
  if (p[1][1] / p[2][1] > 2) return $$`Cos(${p[1][1] % (2 * p[2][1])}/${p[2][1]}*Pi)`;
  if (p[1][1] / p[2][1] > 1) return $$`-Cos(${p[1][1] - p[2][1]}/${p[2][1]}*Pi)`;
  if (p[1][1] / p[2][1] > 0.5) return $$`-Cos(${p[2][1] - p[1][1]}/${p[2][1]}*Pi)`;
  if (p[1][1] == 1 && p[2][1] == 2) return Integer(0);
  if (p[1][1] == 1 && p[2][1] == 3) return Divide(1, 2);
  if (p[1][1] == 1 && p[2][1] == 4) return Divide(Sqrt(2), 2);
  if (p[1][1] == 1 && p[2][1] == 6) return Divide(Sqrt(3), 2);
  return null;
});
addRule($$`D(k_, x_Symbol)`, ({ k, x }) => {
  if (!has(k, x)) return Integer(0);
  return null;
});
addRule($$`D(x_Symbol, x_Symbol)`, ({ x }) => Integer(1));
addRule($$`D(Power(x_Symbol, n_Integer), x_Symbol)`, ({ x, n }) =>
  Times(n, Power(x, Subtract(n, 1)))
);
addRule($$`D(Log(x_Symbol), x_Symbol)`, ({ x }) => Divide(1, x));
addRule($$`D(Exp(x_Symbol), x_Symbol)`, ({ x }) => Exp(x));
addRule($$`D(Sin(x_Symbol), x_Symbol)`, ({ x }) => Cos(x));
addRule($$`D(Cos(x_Symbol), x_Symbol)`, ({ x }) => Times(-1, Sin(x)));
addRule($$`D(Times(k_, a__), x_Symbol)`, ({ k, x, a }) => {
  if (!has(k, x)) return Times(k, D(Times(a), x));
  return Plus(Times(D(k, x), a), Times(k, D(Times(a), x)));
});
addRule($$`D(Plus(a__), x_Symbol)`, 
  $$`Map( t => D(t,x), Plus(a) )`
);
addRule($$`D(Power(f_, n_Integer), x_Symbol)`, ({ f, n, x }) =>
  Times(n, Power(f, Subtract(n, 1)), D(f, x))
);
addRule($$`D(Power(f_, n_Rational), x_Symbol)`, ({ f, n, x }) =>
  Times(n, Power(f, Subtract(n, 1)), D(f, x))
);
addRule($$`D(f_(y_), x_Symbol)`, ({ f, y, x }) => {
  const sl = {};
  sl[x[1]] = y;
  return Times(subst(Eval(D(Cons(f)(x), x)), sl), D(y, x));
});
addRule($$`LaTeX(Pi)`, Literal('\\pi'), 'Pi');
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

const Calculus  = {
  D, Sin, Cos, Pi, Log, Exp
};

module.exports = Calculus;
