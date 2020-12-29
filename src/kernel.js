const Guacyra = {};
const symbolTable = {};
function SymbolValues() {
  this.attr = {};
  this.up = [];
  this.down = [];
  this.sub = [];
  this.own = null;
}
const AtomSymbol = [];
AtomSymbol[0] = AtomSymbol;
AtomSymbol[1] = 'Symbol';
symbolTable['Symbol'] = {
  name: 'Symbol',
  atom: AtomSymbol,
  stack: [new SymbolValues()]
};
const Symbol = (s) => {
  let symb = symbolTable[s];
  if (symb) return symb.atom;
  symb = [AtomSymbol, s];
  symbolTable[s] = {
    name: s,
    atom: symb,
    stack: [new SymbolValues()]
  };
  return symb;
}
const stackTop = s => {
  const stack = symbolTable[s].stack;
  return stack[stack.length - 1];
}
const symbolAttr = s => {
  return stackTop(s).attr;
}
const upValues = s => {
  return stackTop(s).up;
}
const downValues = s => {
  return stackTop(s).down;
}
const subValues = s => {
  return stackTop(s).sub;
}
const ownValue = s => {
  return stackTop(s).own;
}
const ownValueSet = (s, v) => {
  stackTop(s).own = v;
}
const AtomInteger = Symbol('Integer');
const Integer = (n) => [AtomInteger, n];
const AtomRational = Symbol('Rational');
const Rational = (n, d) => [AtomRational, n, d];
const AtomLiteral = Symbol('Literal');
const Literal = (l) => [AtomLiteral, l];
const Cons = (h) =>
  ((...t) => [h, ...t]);
const toExpression = o => {
  switch (typeof o) {
    case 'string':
      return Literal(o);
    case 'number':
      return Integer(o);
    default:
      return o;
  }
}
const Form = (name, attr = {}) => {
  const obj = Symbol(name);
  const fn = (...ex) => {
    ex = ex.map(o => toExpression(o));
    return Cons(obj)(...ex);
  };
  Guacyra[name] = fn;
  Object.assign(symbolAttr(name), attr);
  return fn;
};
const List = Form('List');
const Sequence = Form('Sequence');
const Plus = Form('Plus', { flat: true, orderless: true });
const Times = Form('Times', { flat: true, orderless: true });
const Dot = Form('Dot', { flat: true });
const Divide = Form('Divide');
const Subtract = Form('Subtract');
const UnaryMinus = Form('UnaryMinus');
const Power = Form('Power');
const Complex = Form('Complex');
const I = Cons(Symbol('I'))();
ownValueSet('I', Complex(0, 1));
const Conjugate = Form('Conjugate');
const Abs = Form('Abs');
const Expand = Form('Expand');
const True = Cons(Symbol('True'))();
const False = Cons(Symbol('False'))();
const If = Form('If');
const Cat = Form('Cat');
const Apply = Form('Apply');
const Map = Form('Map');
const Lambda = Form('Lambda', { holdAll: true });
const Do = Form('Do', { flat: true, holdAll: true });
const Def = Form('Def', { holdAll: true });
const Sqrt = Form('Sqrt');
const NumeratorDenominator = Form('NumeratorDenominator');
const Numerator = Form('Numerator');
const Denominator = Form('Denominator');
const Together = Form('Together');
const Blank = Form('Blank');
const BlankSequence = Form('BlankSequence');
const BlankNullSequence = Form('BlankNullSequence');
const Hold = Form('Hold', { holdAll: true });
const LaTeX = Form('LaTeX', { holdAll: true });
const isAtom = e => {
  return e[0] === AtomSymbol ||
    e[0] === AtomLiteral ||
    e[0] === AtomInteger ||
    e[0] === AtomRational
};
const kind = e => {
  if (isAtom(e) || isAtom(e[0])) return e[0][1];
  return 'compound';
};
const subKind = e => {
  if (isAtom(e[0])) return e[0][1];
  return subKind(e[0]);
}
const apply = (h, e) => {
  e[0] = Symbol(h);
  return e;
}
const copy = e => {
  if (isAtom(e)) return e;
  return e.map(x => copy(x));
};
const equal = (a, b) => {
  if (a.length != b.length) return false;
  if (isAtom(a) && isAtom(b)) {
    for (let i = 0; i < a.length; ++i)
      if (a[i] !== b[i]) return false;
    return true;
  } else if (!isAtom(a) && !isAtom(b)) {
    for (let i = 0; i < a.length; ++i)
      if (!equal(a[i], b[i])) return false;
    return true;
  }
  return false;
};
const has = (ex, subex) => {
  if (equal(ex, subex)) return true;
  for (let i = 0; i < length; ++i)
    if (has(ex[i], subex)) return true;
  return false;
};
const subst = (ex, sub) => {
  if (isAtom(ex)) {
    if ((kind(ex) === 'Symbol') && sub[ex[1]]) return copy(sub[ex[1]]);
    else return ex;
  } else {
    return ex.map(x => subst(x, sub));
  }
};
const match = (ex, pat, cap) => {
  const matchR = (ex, pat, cap) => {
    if (isAtom(pat)) return equal(ex, pat);
    if (kind(pat) === 'Blank') {
      const name = pat[1][1];
      const head = pat[2][1];
      if (head && kind(ex) !== head) return false;
      if (!name) return true;
      const en = cap[name];
      if (en) return equal(ex, en);
      cap[name] = ex;
      return true;
    }
    if (!matchR(ex[0], pat[0], cap)) return false;
    for (let i = 1; i < pat.length; ++i) {
      const kpi = kind(pat[i]);
      if (
        (kpi === 'BlankNullSequence' ||
          kpi === 'BlankSequence') && i != pat.length - 1
      ) throw "BlankSequence not at last";
      if (
        kpi === 'BlankNullSequence' ||
        (kpi === 'BlankSequence' && i < ex.length)
      ) {
        const name = pat[i][1][1];
        const head = pat[i][2][1];
        const exr = Sequence();
        for (let j = i; j < ex.length; ++j) {
          exr.push(ex[j]);
          if (head && kind(ex[j]) !== head) return false;
        }
        if (!name) return true;
        const en = cap[name];
        if (en) return equal(exr, en);
        cap[name] = exr;
        return true;
      }
      if (i == ex.length) return false;
      if (!matchR(ex[i], pat[i], cap)) return false;
    }
    if (pat.length < ex.length) return false;
    return true;
  };
  const cap2 = {};
  const r = matchR(ex, pat, cap2);
  if (r) Object.assign(cap, cap2);
  return r;
};
const flatten = (e) => {
  if (isAtom(e)) return e;
  for (let i = 0; i < e.length; ++i)
    e[i] = flatten(e[i]);
  const k = kind(e);
  if (k === 'compound')
    return e;
  if (symbolAttr(k).flat) {
    let i = 1;
    while (i < e.length) {
      let ei = e[i];
      if (kind(ei) === k) {
        e.splice(i, 1, ...ei.slice(1));
        i = i + ei.length - 1;
      } else i = i + 1;
    }
  }
  return e;
}
const tokenizer = str => {
  const lex = [
    [/^(\s+)(.*)/, "Space"],
    [/^(\d+)(.*)/, "Integer"],
    [/^'(.*?)'(.*)/, "String"],
    [/^(;)(.*)/, "Do"],
    [/^(:=)(.*)/, "Def"],
    [/^(=>)(.*)/, "Lambda"],
    [/^(\w+)(.*)/, "Symbol"],
    [/^(\+)(.*)/, "Plus"],
    [/^(\-)(.*)/, "Minus"],
    [/^(\*)(.*)/, "Times"],
    [/^(\.)(.*)/, "Dot"],
    [/^(\/)(.*)/, "Divide"],
    [/^(\^)(.*)/, "Power"],
    [/^(\()(.*)/, "Left"],
    [/^(\))(.*)/, "Right"],
    [/^(\[)(.*)/, "LeftBra"],
    [/^(\])(.*)/, "RightBra"],
    [/^({)(.*)/, "LeftCurly"],
    [/^(})(.*)/, "RightCurly"],
    [/^(,)(.*)/, "Comma"]
  ];
  let s = str.replace(/\r?\n|\r/gm, '');
  const r = [];
  while (s) {
    for (let i = 0; i < lex.length; ++i) {
      let m = s.match(lex[i][0]);
      if (m) {
        const l = lex[i][1];
        if (l !== 'Space') r.push([l, m[1]]);
        s = m[2];
        break;
      }
    }
  }
  r.push(["End", ""]);
  return r;
};
const Bl = b => {
  const s = b.split('_');
  switch (s.length) {
    case 2:
      return Blank(s[0], s[1]);
    case 3:
      return BlankSequence(s[0], s[2]);
    case 4:
      return BlankNullSequence(s[0], s[3]);
  }
  throw 'Ill formed Blank';
};
const parse = str => {
  const l = tokenizer(str);
  let it = 0;
  const next = () => l[it][0];
  const nextnext = () => l[it + 1][0];
  const value = () => l[it][1];
  const consume = () => (it = it + 1);
  const expect = tok => {
    if (next() === tok) consume();
    else throw `next = ${next()}, ${tok} expected.`;
  };
  let Eparser, Exp, P;
  const isBinary = tok => {
    return (
      tok === 'Do' ||
      tok === 'Def' ||
      tok === 'Lambda' ||
      tok === 'Plus' ||
      tok === 'Minus' ||
      tok === 'Times' ||
      tok === 'Dot' ||
      tok === 'Divide' ||
      tok === 'Power'
    );
  };
  const isTerminal = tok => {
    return tok === 'Integer' ||
      tok === 'String' ||
      tok === 'Symbol';
  };
  const binary = tok => {
    if (tok === 'Minus') return 'Subtract';
    return tok;
  };
  const isUnary = tok => {
    return tok === 'Minus';
  };
  const unary = tok => {
    return 'Unary' + tok;
  };
  const associativity = op => {
    if (op === 'Power' || op === 'Lambda') return 'Right';
    else return 'Left';
  };
  const prec = op => {
    switch (op) {
      case 'UnaryMinus':
        return 20;
      case 'Do':
        return 0;
      case 'Def':
        return 5;
      case 'Lambda':
        return 5;
      case 'Plus':
        return 10;
      case 'Subtract':
        return 10;
      case 'Times':
        return 30;
      case 'Dot':
        return 30;
      case 'Divide':
        return 30;
      case 'Power':
        return 40;
    }
  };
  Eparser = () => {
    const t = Exp(0);
    expect('End');
    return t;
  };
  Exp = p => {
    let t = P();
    while (next() === 'Left') {
      let ch = [];
      if (nextnext() === 'Right') {
        consume();
      } else {
        do {
          consume();
          ch.push(Exp(0));
        } while (next() === 'Comma');
      }
      expect('Right');
      t = Cons(t)(...ch);
    }
    while (isBinary(next()) && prec(binary(next())) >= p) {
      const op = binary(next());
      consume();
      const q = prec(op) + (associativity(op) === 'Right' ? 0 : 1);
      const t1 = Exp(q);
      t = Cons(Symbol(op))(t, t1);
    }
    return t;
  };
  P = () => {
    if (isUnary(next())) {
      const op = unary(next());
      consume();
      const q = prec(op);
      const t = Exp(q);
      if (op === 'UnaryMinus') {
        if (kind(t) === 'Integer')
          return Integer(-t[1]);
        else
          return Times(-1, t);
      }
      return Cons(Symbol(op))(t);
    } else if (next() === 'Left') {
      consume();
      const t = Exp(0);
      expect('Right');
      return t;
    } else if (next() === 'LeftBra') {
      let ch = [];
      if (nextnext() === 'RightBra') {
        consume();
      } else {
        do {
          consume();
          ch.push(Exp(0));
        } while (next() === 'Comma');
      }
      expect('RightBra');
      return List(...ch);
    } else if (isTerminal(next())) {
      if (next() == 'String') {
        const t = Literal(value());
        consume();
        return t;
      } else if (next() == 'Integer') {
        const t = Integer(Number(value()));
        consume();
        return t;
      } else if (next() == 'Symbol') {
        let v = value();
        if (v.includes('_')) {
          const t = Bl(v);
          consume();
          return t;
        }
        let s = Symbol(v);
        consume();
        return s;
      }
    } else throw 'Syntax error';
  }
  return flatten(Eparser());
}
function $$(strings, ...expressions) {
  if (expressions.length == 0) {
    let string = String.raw.apply(String, arguments);
    return parse(string);
  } else {
    const labels = expressions.map((v, i) => `xXxLaBeL${i}`);
    const substList = {};
    labels.forEach((v, i) => substList[v] = toExpression(expressions[i]));
    let string = String.raw.apply(String, [strings, ...labels]);
    return subst(parse(string), substList);
  }
}
function $() {
  return Eval($$.apply(String, arguments));
}
const toString = e => {
  const k = kind(e);
  if (k === 'Integer') return e[1].toString();
  if (k === 'Rational') return `Rational(${e[1]}, ${e[2]})`;
  if (k === 'Literal') return "'" + e[1] + "'";
  if (k === 'Symbol') return e[1];
  let r = toString(e[0]) + '(';
  for (let i = 1; i < e.length; ++i) {
    if (i != 1) r = r + ',';
    r = r + toString(e[i]);
  }
  return r + ')';
};
const toLisp = (e) => {
  const k = kind(e);
  if (k === 'Integer') return e[1].toString();
  if (k === 'Rational') return `(Rational ${e[1]} ${e[2]})`;
  if (k === 'Literal') return "'" + e[1] + "'";
  if (k === 'Symbol') return e[1];
  let s = '(';
  s += toLisp(e[0]);
  for (let i = 1; i < e.length; ++i)
    s += ' ' + toLisp(e[i]);
  s += ')';
  return s;
};
const isNumeric = e => kind(e) === 'Integer' || kind(e) === 'Rational';
const isNumericEx = e => {
  if (isAtom(e)) return isNumeric(e);
  if (kind(e[0]) !== 'Symbol') return false;
  for (let i = 1; i < e.length; ++i)
    if (!isNumericEx(e[i])) return false;
  return true;
};
const value = e => kind(e) === 'Rational' ? e[1] / e[2] : e[1];
const less = (a, b) => {
  const ka = kind(a);
  const kb = kind(b);
  if (isNumeric(a) && isNumeric(b)) return value(a) < value(b);
  if (isNumeric(a) && kb === 'Complex') return true;
  if (ka === 'Complex' && isNumeric(b)) return false;
  if (ka === 'Complex' && kb === 'Complex') {
    if (equal(a[1], b[1])) return less(a[2], b[2]);
    return less(a[1], b[1]);
  }
  if (ka === 'Complex') return true;
  if (kb === 'Complex') return false;
  if (ka === 'Symbol' && kb === 'Symbol') return a[1] < b[1];
  if (ka === 'Literal' && kb === 'Literal') return a[1] < b[1];
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
        return less(a[m], b[n]);
      }
    }
    return m < n;
  }
  if (ka === 'Power' && kb === 'Power') {
    if (equal(a[1], b[1])) return less(a[2], b[2]);
    return less(a[1], b[1]);
  }
  if (ka === kb) {
    let m = a.length;
    let n = b.length;
    let i = 1;
    while (i < m && i < n) {
      if (equal(a[i], b[i])) {
        i = i + 1;
      } else return less(a[i], b[i]);
    }
    return m < n;
  }
  if (isNumeric(a) && !isNumeric(b)) return true;
  else if (!isNumeric(a) && isNumeric(b)) return false;
  if (ka === 'Times') return less(a, Times(b));
  else if (kb === 'Times') return less(Times(a), b);
  if (ka === 'Power') return less(a, Power(b, 1));
  else if (kb === 'Power') return less(Power(a, 1), b);
  if (ka === 'Plus') return less(a, Plus(b));
  else if (kb === 'Plus') return less(Plus(a), b);
};
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
const Eval = e => {
  const ke = kind(e);
  if (isAtom(e)) {
    if (ke === 'Symbol') {
      const value = ownValue(e[1]);
      if (value) return value;
    }
    return e;
  }
  if (ke === 'compound') {
    let ex = copy(e);
    ex[0] = Eval(ex[0]);
    const ke0 = kind(ex[0]);
    if (ke0 === 'Symbol') return Eval(ex);
    for (let i = 1; i < ex.length; ++i)
      ex[i] = Eval(ex[i]);
    let tex;
    for (let i = 1; i < ex.length; ++i) {
      let exi = ex[i];
      const ups = upValues(subKind(exi));
      for (let j = 0; j < ups.length; ++j) {
        tex = ups[j](ex);
        if (tex) {
          return Eval(tex);
        }
      }
    }
    const subs = subValues(subKind(ex));
    for (let j = 0; j < subs.length; ++j) {
      tex = subs[j](ex);
      if (tex) {
        return Eval(tex);
      }
    }
    return ex;
  } else {
    const attr = symbolAttr(ke);
    let ex = [];
    if (attr.holdAll) {
      for (let i = 1; i < e.length; ++i) ex.push(e[i]);
    } else {
      for (let i = 1; i < e.length; ++i)
        if (i == 1 && attr.holdFirst) ex.push(e[i]);
        else ex.push(Eval(e[i]));
    }
    if (!attr.sequenceHold) {
      let i = 0;
      while (i < ex.length) {
        let exi = ex[i];
        if (kind(exi) === 'Sequence') {
          ex.splice(i, 1, ...exi.slice(1));
          i = i + exi.length - 1;
        } else i = i + 1;
      }
    }
    if (attr.flat) {
      let i = 0;
      while (i < ex.length) {
        let exi = ex[i];
        if (kind(exi) === ke) {
          ex.splice(i, 1, ...exi.slice(1));
          i = i + exi.length - 1;
        } else i = i + 1;
      }
    }
    if (attr.orderless) ex.sort((a, b) => (less(a, b) ? -1 : 1));
    ex.splice(0, 0, e[0]);
    let tex;
    for (let i = 1; i < ex.length; ++i) {
      let exi = ex[i];
      const ups = upValues(subKind(exi));
      for (let j = 0; j < ups.length; ++j) {
        tex = ups[j](ex);
        if (tex) {
          return Eval(tex);
        }
      }
    }
    const downs = downValues(kind(ex));
    for (let j = 0; j < downs.length; ++j) {
      tex = downs[j](ex);
      if (tex) {
        return Eval(tex);
      }
    }
    return ex;
  }
};
const addRule = (rule, fn, up) => {
  let tab;
  if (up) {
    tab = upValues(up);
  } else {
    if (kind(rule) !== 'compound')
      tab = downValues(kind(rule));
    else
      tab = subValues(subKind(rule));
  }
  if (typeof fn === 'function') {
    tab.push(ex => {
      let cap = {};
      if (match(ex, rule, cap)) return fn(cap);
      return null;
    });
  } else {
    tab.push(ex => {
      let cap = {};
      if (match(ex, rule, cap)) return subst(fn, cap);
      return null;
    });
  }
};
//Debug
const debugEx = (p, e) => {
  console.debug(
    p, ':',
    e, ' -> ',
    toString(Eval(parse(e)))
  )
}
//Functional
addRule(
  $$`Lambda(a_Symbol, b_)(c_)`,
  ({ a, b, c }) => {
    const substList = {};
    substList[a[1]] = c;
    return Eval(subst(b, substList));
  }
);
debugEx('Lambda', `(x => f(x))(3)`);
addRule(
  $$`Do(a__)`,
  ({ a }) => {
    let r;
    for (let i = 1; i < a.length; ++i)
      r = Eval(a[i]);
    return r;
  }
);
debugEx('Do', `a;b;c`);
addRule(
  $$`Def(a_Symbol, b_)`,
  ({ a, b }) => {
    ownValueSet(a[1], b);
    return b;
  }
);
addRule(
  $$`Def(a_, b_)`,
  ({ a, b }) => {
    addRule(a, b);
    return b;
  }
);
addRule(
  $$`Map(f_, a_)`,
  ({ f, a }) => {
    for (let i = 1; i < a.length; ++i)
      a[i] = Cons(f)(a[i]);
    return a;
  }
);
debugEx('Map', `Map( x => f(x), [1,2,3])`);
addRule(
  $$`Apply(f_, a_)`,
  ({ f, a }) => {
    a[0] = f;
    return a;
  }
);
debugEx('Apply', `Apply(Plus, [1,2,3])`);
addRule(
  $$`Cat(l___)`,
  ({ l }) => {
    let r = '';
    for (let i = 1; i < l.length; ++i)
      r = r + l[i][1];
    return Literal(r);
  }
);
debugEx('Cat', `Cat('a','b','c')`);
addRule(
  $$`If(c_,t_,f_)`,
  ({c,t,f}) => {
    const kc = kind(c);
    if(
      kc === 'Integer' && c[1] != 0 ||
      kc == 'Symbol' && c[1] === 'True'
    ) {
      return t;
    } else {
      return f;
    }
  }
)
//Arithmetic
addRule(
  $$`Plus()`,
  $$`0`
);
addRule(
  $$`Plus(a_)`,
  $$`a`
);
addRule(
  $$`Plus(0, a__)`,
  $$`Plus(a)`
);
addRule(
  $$`Plus(a_Integer, b_Integer, c___)`,
  ({ a, b, c }) => Plus(a[1] + b[1], c)
);
debugEx('Plus', `0+2+2+x`);
addRule(
  $$`UnaryMinus(a_Integer)`,
  ({ a }) => Integer(-a[1])
);
addRule(
  $$`UnaryMinus(a_)`,
  ({ a }) => Times(-1, a)
);
addRule(
  $$`Subtract(a_, b_)`,
  ({ a, b }) => Plus(a, Times(-1, b))
);
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
  $$`Times()`,
  $$`1`
);
addRule(
  $$`Times(a_)`,
  $$`a`
);
addRule(
  $$`Times(1, a__)`,
  $$`Times(a)`
);
addRule(
  $$`Times(0, a__)`,
  $$`0`
);
addRule(
  $$`Times(a_Integer, b_Integer, c___)`,
  ({ a, b, c }) => Times(a[1] * b[1], c)
);
debugEx('Times', `3*4*x`);
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
addRule(
  $$`Power(_, 0)`,
  $$`1`
);
addRule(
  $$`Power(1, _)`,
  $$`1`
);
addRule(
  $$`Power(a_, 1)`,
  $$`a`
);
addRule($$`Power(a_Integer, b_Integer)`, ({ a, b }) => {
  if (b[1] < 0) return Rational(1, Math.pow(a[1], -b[1]));
  else return Integer(Math.pow(a[1], b[1]));
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
//Exports
Guacyra.toString = toString;
Guacyra.Eval = Eval;
Guacyra.Form = Form;
Guacyra.equal = equal;
Guacyra.value = value;
Guacyra.less = less;
Guacyra.copy = copy;
Guacyra.has = has;
Guacyra.subst = subst;
Guacyra.match = match;
Guacyra.addRule = addRule;
Guacyra.parse = parse;
Guacyra.$ = $;
Guacyra.$$ = $$;
Guacyra.latex = latex;

export default Guacyra;