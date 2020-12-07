import Kernel from './kernel';
const {
  Integer,
  Rational,
  Literal,
  Function,
  List,
  Plus,
  Times,
  Subtract,
  Divide,
  Power,
  Expand,
  Cat,
  Hold,
  Apply,
  Map,
  Sqrt,
  LaTeX,
  Denominator,
  Form,
  _,
  Eval,
  equal,
  less,
  copy,
  same,
  has,
  subst,
  match,
  addRule,
  toString,
  $,
  $$,
  latex
} = Kernel;
const D = Form('D');
const Log = Form('Log');
const Exp = Form('Exp');
const Sin = Form('Sin');
const Cos = Form('Cos');
const Pi = Form('Pi', { symbol: true });
addRule($$`Log(1)`, () => Integer(0));
addRule($$`Exp(0)`, () => Integer(1));
addRule($$`Sin(Pi)`, () => Integer(0));
addRule($$`Sin(0)`, () => Integer(0));
addRule($$`Sin(Times(n_Integer, Pi))`, ({ n }) => Integer(0));
addRule($$`Sin(Times(p_Rational, Pi))`, ({ p }) => {
  if (p[1] < 0) return $$`-Sin(${-p[1]}/${p[2]}*Pi)`;
  if (p[1] / p[2] > 2) return $$`Sin(${p[1] % (2 * p[2])}/${p[2]}*Pi)`;
  if (p[1] / p[2] > 1) return $$`-Sin(${p[1] - p[2]}/${p[2]}*Pi)`;
  if (p[1] / p[2] > 0.5) return $$`Sin(${p[2] - p[1]}/${p[2]}*Pi)`;
  if (p[1] == 1 && p[2] == 2) return Integer(1);
  if (p[1] == 1 && p[2] == 3) return Divide(Sqrt(3), 2);
  if (p[1] == 1 && p[2] == 4) return Divide(Sqrt(2), 2);
  if (p[1] == 1 && p[2] == 6) return Divide(1, 2);
  return null;
});
addRule($$`Cos(Pi)`, () => Integer(-1));
addRule($$`Cos(0)`, () => Integer(1));
addRule($$`Cos(Times(n_Integer, Pi))`, ({ n }) =>
  Integer(n[1] % 2 == 0 ? 1 : -1)
);
addRule($$`Cos(Times(p_Rational, Pi))`, ({ p }) => {
  if (p[1] < 0) return $$`Cos(${-p[1]}/${p[2]}*Pi)`;
  if (p[1] / p[2] > 2) return $$`Cos(${p[1] % (2 * p[2])}/${p[2]}*Pi)`;
  if (p[1] / p[2] > 1) return $$`-Cos(${p[1] - p[2]}/${p[2]}*Pi)`;
  if (p[1] / p[2] > 0.5) return $$`-Cos(${p[2] - p[1]}/${p[2]}*Pi)`;
  if (p[1] == 1 && p[2] == 2) return Integer(0);
  if (p[1] == 1 && p[2] == 3) return Divide(1, 2);
  if (p[1] == 1 && p[2] == 4) return Divide(Sqrt(2), 2);
  if (p[1] == 1 && p[2] == 6) return Divide(Sqrt(3), 2);
  return null;
});
addRule($$`D(k_, x_Literal)`, ({ k, x }) => {
  if (!has(k, x)) return Integer(0);
  return null;
});
addRule($$`D(x_Literal, x_Literal)`, ({ x }) => Integer(1));
addRule($$`D(Power(x_Literal, n_Integer), x_Literal)`, ({ x, n }) =>
  Times(n, Power(x, Subtract(n, 1)))
);
addRule($$`D(Log(x_Literal), x_Literal)`, ({ x }) => Divide(1, x));
addRule($$`D(Exp(x_Literal), x_Literal)`, ({ x }) => Exp(x));
addRule($$`D(Sin(x_Literal), x_Literal)`, ({ x }) => Cos(x));
addRule($$`D(Cos(x_Literal), x_Literal)`, ({ x }) => Times(-1, Sin(x)));
addRule($$`D(Times(k_, a__), x_Literal)`, ({ k, x, a }) => {
  if (!has(k, x)) return Times(k, D(Times(a), x));
  return Plus(Times(D(k, x), a), Times(k, D(Times(a), x)));
});
addRule($$`D(Plus(a__), x_Literal)`, ({ x, a }) =>
  Eval(Map(t => D(t, x), Plus(a)))
);
addRule($$`D(Power(f_, n_Integer), x_Literal)`, ({ f, n, x }) =>
  Times(n, Power(f, Subtract(n, 1)), D(f, x))
);
addRule($$`D(Power(f_, n_Rational), x_Literal)`, ({ f, n, x }) =>
  Times(n, Power(f, Subtract(n, 1)), D(f, x))
);
addRule($$`D(f_, x_Literal)`, ({ f, x }) => {
  const F = copy(f);
  const y = F[1];
  F[1] = x;
  const dF = Eval(D(F, x));
  return Times(subst(dF, { x: y }), D(y, x));
});
addRule($$`LaTeX(Pi)`, () => Literal('\\pi'), Pi());
addRule(
  $$`LaTeX(Exp(a_))`,
  ({ a }) => Literal('e^{' + latex(a) + '}'),
  Exp()
);
addRule(
  $$`LaTeX(Log(a_))`,
  ({ a }) => Literal('\\log{' + latex(a) + '}'),
  Log()
);
addRule(
  $$`LaTeX(Sin(a_))`,
  ({ a }) => Literal('\\sin{' + latex(a) + '}'),
  Sin()
);
addRule(
  $$`LaTeX(Cos(a_))`,
  ({ a }) => Literal('\\cos{' + latex(a) + '}'),
  Cos()
);

const Calculus  = {
  D
};

export default Calculus;
