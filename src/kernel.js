const Kernel = {};
const reserved = {};
const global = {};
const stack = [reserved, global];

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
AtomSymbol[2] = new SymbolValues();

reserved['Symbol'] = AtomSymbol;

const mkSymbol = (s) => {
  const symb = [AtomSymbol, s, new SymbolValues()];
  return symb;
}
const Symbol = (s, tab = 'global') => {
  for(let i = stack.length - 1; i>=0; --i) {
    const symb = stack[i][s];
    if(symb) return symb;
  }
  const symb = mkSymbol(s);
  if(tab === 'reserved') {
    reserved[s] = symb;
  } else {
    global[s] = symb;
  }
  return symb;
}
const symbolAttr = s => {
  return s[2].attr;
}
const upValues = e => {
  if(isSymbol(e)) return e[2].up;
  if(isLiteral(e)) return upValues(Symbol(e[1]));
  return upValues(e[0]);
}
const downValues = e => {
  if(isSymbol(e[0])) return e[0][2].down;
  if(isLiteral(e[0])) return Symbol(e[0][1])[2].down;
}
const subValues = e => {
  if(isSymbol(e)) return e[2].sub;
  if(isLiteral(e)) return subValues(Symbol(e[1]));
  return subValues(e[0]);
}
const ownValue = s => {
  return s[2].own;
}
const ownValueSet = (s, v) => {
  s[2].own = v;
}
const AtomInteger = Symbol('Integer', 'reserved');
const Integer = (n) => [AtomInteger, n];
const AtomStr = Symbol('Str', 'reserved');
const Str = (l) => [AtomStr, l];
const AtomLiteral = Symbol('Literal', 'reserved');
const Literal = (l) => [AtomLiteral, l];
const Cons = (h) =>
  ((...t) => [h, ...t]);
const toExpression = o => {
  switch (typeof o) {
    case 'string':
      return Str(o);
    case 'number':
      return Integer(o);
    default:
      return o;
  }
}
const Form = (name, attr = {}) => {
  const obj = Symbol(name, 'reserved');
  const fn = (...ex) => {
    ex = ex.map(o => toExpression(o));
    return Cons(obj)(...ex);
  };
  Kernel[name] = fn;
  Object.assign(symbolAttr(obj), attr);
  return fn;
};
const List = Form('List');
const Sequence = Form('Sequence');
const True = Symbol('True', 'reserved');
const False = Symbol('False', 'reserved');
const Null = Symbol('Null', 'reserved');
const $Skip = Symbol('$Skip', 'reserved');
Kernel.True = True;
Kernel.False = False;
Kernel.Null = Null;
Kernel.$Skip = $Skip;
const If = Form('If', { HoldAll: true });
const Cond = Form('Cond', { HoldAll: true });
const And = Form('And', { HoldAll: true });
const Or = Form('Or', { HoldAll: true });
const Not = Form('Not');
const While = Form('While', { HoldAll: true });
const Block = Form('Block', { HoldAll: true });
const ClearAll = Form('ClearAll');
const Clear = Form('Clear', { HoldAll: true });
const Print = Form('Print');
const Cat = Form('Cat');
const ToString = Form('ToString');
const Apply = Form('Apply');
const AppendTo = Form('AppendTo');
const Map = Form('Map');
const Reduce = Form('Reduce');
const Lambda = Form('Lambda', { HoldAll: true });
const Do = Form('Do', { Flat: true, HoldAll: true });
const Return = Form('Return');
const Def = Form('Def', { HoldAll: true });
const Tag = Form('Tag', { HoldAll: true });
const At = Form('At', { HoldAll: true });
const Len = Form('Len');
const Match = Form('Match' /*, { HoldAll: true }*/);
const Subst = Form('Subst');
const Equal = Form('Equal');
const Less = Form('Less');
const Great = Form('Great');
const Kind = Form('Kind');
const Blank = Form('Blank', { HoldAll: true });
const BlankSequence = Form('BlankSequence', { HoldAll: true });
const BlankNullSequence = Form('BlankNullSequence', { HoldAll: true });
const Hold = Form('Hold', { HoldAll: true });
const Sort = Form('Sort', { Orderless: true });
const Plus = Form('Plus', { Flat: true, Orderless: true });
const Times = Form('Times', { Flat: true, Orderless: true });
const Subtract = Form('Subtract');
const Quotient = Form('Quotient');
const Mod = Form('Mod');
const UnaryMinus = Form('UnaryMinus');
const Power = Form('Power');
const Numeric = Form('Numeric');
const isAtom = e => {
  return (
    e[0] === AtomSymbol ||
    e[0] === AtomStr ||
    e[0] === AtomLiteral ||
    e[0] === AtomInteger
  );
};
const isSymbol = e => e[0] === AtomSymbol;
const isLiteral = e => e[0] === AtomLiteral;
const isInteger = e => e[0] === AtomInteger;

const kind = e => {
  if (isAtom(e) || isAtom(e[0])) return e[0][1];
  return 'compound';
};
const subKind = e => {
  if (isSymbol(e)) return e[1];
  else return subKind(e[0]);
}
const test = e => {
  if(equal(e, True)) return true;
  if(isInteger(e)) return e[1] != 0;
  return false;
}
const copy = e => {
  if (isAtom(e)) return e;
  return e.map(x => copy(x));
};
const apply = (h, e) => {
  e[0] = Symbol(h);
}
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
  if (isAtom(ex)) return equal(ex, subex);
  if (equal(ex, subex)) return true;
  for (let i = 0; i < ex.length; ++i)
    if (has(ex[i], subex)) return true;
  return false;
};
const subst = (ex, sub) => {
  if (isAtom(ex)) {
    if ((isLiteral(ex) || isSymbol(ex)) && sub[ex[1]]) return copy(sub[ex[1]]);
    else return ex;
  } else {
    return ex.map(x => subst(x, sub));
  }
};
const match = (ex, pat, cap) => {
  const matchR = (ex, pat, cap) => {
    if (
        (isLiteral(pat) && isSymbol(ex)) ||
        (isLiteral(ex) && isSymbol(pat))
      ) return ex[1]==pat[1];
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
  if (isSymbol(e[0]) && symbolAttr(e[0]).Flat) {
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

const lexTab = [
  {
    tok: 'Space',
    rex: /(\s+)/,
    type: {}
  },
  {
    tok: 'Integer',
    rex: /(\d+)/,
    type: {isTerminal : true}
  },
  {
    tok: 'String',
    rex: /'(.*?)'/,
    type: {isTerminal : true}
  },
  {
    tok: 'Symbol',
    rex: /([$\w]+)/,
    type: {isTerminal : true}
  },
  {
    tok: 'Do',
    rex: /(;)/,
    type: {
      binary: {
        precedence: 0,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Def',
    rex: /(:=)/,
    type: {
      binary: {
        precedence: 5,
        associativity: 'Right'
      }
    }
  },
  {
    tok: 'Tag',
    rex: /(:)/,
    type: {
      binary: {
        precedence: 3,
        associativity: 'Right'
      }
    }
  },
  {
    tok: 'Lambda',
    rex: /(=>)/,
    type: {
      binary: {
        precedence: 5,
        associativity: 'Right'
      }
    }
  },
  {
    tok: 'Equal',
    rex: /(=)/,
    type: {
      binary: {
        precedence: 5,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Less',
    rex: /(<)/,
    type: {
      binary: {
        precedence: 5,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Great',
    rex: /(>)/,
    type: {
      binary: {
        precedence: 5,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Plus',
    rex: /(\+)/,
    type: {
      binary: {
        precedence: 10,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Minus',
    rex: /(\-)/,
    type: {
      binary: {
        op: 'Subtract',
        precedence: 10,
        associativity: 'Left'
      },
      unary: {
        op: 'UnaryMinus',
        precedence: 20
      }
    }
  },
  {
    tok: 'At',
    rex: /(@)/,
    type: {
      unary: {
        precedence: 50
      }
    }
  },
  {
    tok: 'Len',
    rex: /(#)/,
    type: {
      unary: {
        precedence: 50
      }
    }
  },
  {
    tok: 'Times',
    rex: /(\*)/,
    type: {
      binary: {
        precedence: 30,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Dot',
    rex: /(\.)/,
    type: {
      binary: {
        precedence: 30,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Divide',
    rex: /(\/)/,
    type: {
      binary: {
        precedence: 30,
        associativity: 'Left'
      }
    }
  },
  {
    tok: 'Power',
    rex: /(\^)/,
    type: {
      binary: {
        precedence: 40,
        associativity: 'Right'
      }
    }
  },
  {
    tok: 'Left',
    rex: /(\()/,
    type: {}
  },
  {
    tok: 'Right',
    rex: /(\))/,
    type: {}
  },
  {
    tok: 'LeftBra',
    rex: /(\[)/,
    type: {}
  },
  {
    tok: 'RightBra',
    rex: /(\])/,
    type: {}
  },
  {
    tok: 'Comma',
    rex: /(,)/,
    type: {}
  },
  {
    tok: 'End',
    rex: /end/,
    type: {}
  }
];
class Lexer {
  constructor(lexTab) {
    this.lex = lexTab.map( ({tok, rex, type}) => {
      return [ new RegExp('^'+rex.source+'(.*)'), tok];
    });
    this.tokens = {};
    this.ops = {};
    lexTab.forEach( ({tok, rex, type}) => {
      const t = {};
      t.isTerminal = type.isTerminal ? true : false;
      if(type.binary !== undefined) {
        t.isBinary = true;
        let op = type.binary.op;
        if(!op) op = tok;
        t.binary = op;
        this.ops[op] = type.binary;
      } else t.isBinary = false;
      if(type.unary !== undefined) {
        t.isUnary = true;
        let op = type.unary.op;
        if(!op) op = tok;
        t.unary = op;
        this.ops[op] = type.unary;
      } else t.isUnary = false;
      this.tokens[tok] = t;
    });
  }
  isTerminal(tok) {
    return this.tokens[tok].isTerminal;
  }
  isBinary(tok) {
    return this.tokens[tok].isBinary;
  }
  binary(tok) {
    return this.tokens[tok].binary;  
  }
  isUnary(tok) {
    return this.tokens[tok].isUnary;
  }
  unary(tok) {
    return this.tokens[tok].unary;  
  }
  prec(op) {
    return this.ops[op].precedence;  
  }
  associativity(op) {
    return this.ops[op].associativity;  
  }
  tokenize(str) {
    let s = str.replace(/\r?\n|\r/gm, '');
    const r = [];
    while (s) {
      for (let i = 0; i < this.lex.length; ++i) {
        let m = s.match(this.lex[i][0]);
        if (m) {
          const l = this.lex[i][1];
          if (l !== 'Space') r.push([l, m[1]]);
          s = m[2];
          break;
        }
      }
    }
    r.push(["End", ""]);
    return r;
  }
}
const lexer = new Lexer(lexTab);
const Bl = b => {
  const s = b.split('_');
  switch (s.length) {
    case 2:
      return Blank(Literal(s[0]), Literal(s[1]));
    case 3:
      return BlankSequence(Literal(s[0]), Literal(s[2]));
    case 4:
      return BlankNullSequence(Literal(s[0]), Literal(s[3]));
  }
  throw 'Ill formed Blank';
};
const parse = str => {
  const l = lexer.tokenize(str);
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
    while (lexer.isBinary(next()) &&
      lexer.prec(lexer.binary(next())) >= p) {
      const op = lexer.binary(next());
      consume();
      const q = lexer.prec(op) + 
        (lexer.associativity(op) === 'Right' ? 0 : 1);
      const t1 = Exp(q);
      t = Cons(reserved[op])(t, t1);
    }
    return t;
  };
  P = () => {
    if (lexer.isUnary(next())) {
      const op = lexer.unary(next());
      consume();
      const q = lexer.prec(op);
      const t = Exp(q);
      if(op === 'UnaryMinus' && kind(t) === 'Integer')
        return Integer(-t[1]);
      return Cons(reserved[op])(t);
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
    } else if (lexer.isTerminal(next())) {
      if (next() == 'String') {
        const t = Str(value());
        consume();
        return t;
      } else if (next() == 'Integer') {
        const t = Integer(Number(value()));
        consume();
        return t;
      } else if (next() == 'Symbol') {
        let v = value();
        consume();
        if (v.includes('_')) {
          return Bl(v);
        }
        let s = reserved[v];
        if (s) return s;
        return Literal(v);
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
  if (k === 'Str') return "'" + e[1] + "'";
  if (k === 'Symbol') return e[1];
  if (k === 'Literal') return '$'+e[1];
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
  if (k === 'Str') return "'" + e[1] + "'";
  if (k === 'Symbol') return e[1];
  if (k === 'Literal') return '$'+e[1];
  let s = '(';
  s += toLisp(e[0]);
  for (let i = 1; i < e.length; ++i)
    s += ' ' + toLisp(e[i]);
  s += ')';
  return s;
};
const less = (a, b) => {
  const ka = kind(a);
  const kb = kind(b);
  if(ka === 'Integer' && kb !== 'Integer') return true;
  if(ka !== 'Integer' && kb === 'Integer') return false;
  if(isAtom(a) && isAtom(b)) return a[1]<b[1]; // Symbol table?
  if(isAtom(a))  return true;
  if(isAtom(b))  return false;
  if(ka === kb) {
    const mi = Math.min(a.length, b.length);
    for(let i=0; i<mi; ++i) {
      if(!equal(a[i], b[i])) return less(a[i], b[i]);
    }
    return a.length < b.length;
  }
  if(kb === 'compound') return true;
  if(ka === 'compound') return false;
  return ka < kb;
};
const wasEvaluated = (e) => e!==null && e!==$Skip;
const Eval = e => {
  const ke = kind(e);
  if (isAtom(e)) {
    if (ke === 'Symbol') {
      const value = ownValue(e);
      if (value) return value;
    } else if(ke === 'Literal') {
      return Eval(Symbol(e[1]));
    }
    return e;
  }
  const he = Eval(e[0]);
  if(!equal(he, e[0])) {
    const ex = copy(e);
    ex[0] = he;
    return Eval(ex);
  }
  if (ke === 'compound') {
    const ex = copy(e);
    for (let i = 1; i < ex.length; ++i)
      ex[i] = Eval(ex[i]);
    let tex;
    for (let i = 1; i < ex.length; ++i) {
      let exi = ex[i];
      const ups = upValues(exi);
      for (let j = 0; j < ups.length; ++j) {
        tex = ups[j](ex);
        if (wasEvaluated(tex)) {
          return Eval(tex);
        }
      }
    }
    const subs = subValues(ex);
    for (let j = 0; j < subs.length; ++j) {
      tex = subs[j](ex);
      if (wasEvaluated(tex)) {
        return Eval(tex);
      }
    }
    return ex;
  } else {
    const attr = symbolAttr(he);
    let ex = [];
    if (attr.HoldAll || attr.HoldRest) {
      for (let i = 1; i < e.length; ++i) 
        if (i == 1 && attr.HoldRest) ex.push(Eval(e[i]));
        else ex.push(e[i]);
    } else {
      for (let i = 1; i < e.length; ++i)
        if (i == 1 && attr.HoldFirst) ex.push(e[i]);
        else ex.push(Eval(e[i]));
    }
    if (!attr.SequenceHold) {
      let i = 0;
      while (i < ex.length) {
        let exi = ex[i];
        if (kind(exi) === 'Sequence') {
          ex.splice(i, 1, ...exi.slice(1));
          i = i + exi.length - 1;
        } else i = i + 1;
      }
    }
    if (attr.Flat) {
      let i = 0;
      while (i < ex.length) {
        let exi = ex[i];
        if (kind(exi) === ke) {
          ex.splice(i, 1, ...exi.slice(1));
          i = i + exi.length - 1;
        } else i = i + 1;
      }
    }
    if (attr.Orderless) ex.sort((a, b) => {
      return test(Eval(Less(a, b))) ? -1 : 1;
    });
    ex.splice(0, 0, he);
    let tex;
    for (let i = 1; i < ex.length; ++i) {
      let exi = ex[i];
      const ups = upValues(exi);
      //console.log('Up: ', toString(exi), ups.length)
      for (let j = 0; j < ups.length; ++j) {
        tex = ups[j](ex);
        if (wasEvaluated(tex)) {
          return Eval(tex);
        }
      }
    }
    const downs = downValues(ex);
    for (let j = 0; j < downs.length; ++j) {
      tex = downs[j](ex);
      if (wasEvaluated(tex)) {
        return Eval(tex);
      }
    }
    return ex;
  }
};
const substToDef = (cap) => {
  const r = List();
  for (const [key, value] of Object.entries(cap)) {
    r.push(Def(Literal(key), value));
  }
  return r;
};
const addRule = (rule, fn, up) => {
  let tab;
  if (up) {
    tab = upValues(Symbol(up));
  } else {
    if (kind(rule) !== 'compound')
      tab = downValues(rule);
    else
      tab = subValues(rule);
  }
  if (typeof fn === 'function') {
    tab.push(ex => {
      let cap = {};
      if (match(ex, rule, cap)) return fn(cap);
      return null;
    });
  } else {
    if(has(fn, reserved['Def']) || has(fn, reserved['Block'])) {
      tab.push(ex => {
        let cap = {};
        if (match(ex, rule, cap)) {
          const r = Eval(Block(substToDef(cap), fn));
          if(kind(r) === 'Return') return r[1];
          return r;
        }
        return null;
      });
    } else {
      tab.push(ex => {
        let cap = {};
        if (match(ex, rule, cap))
          return Eval(subst(fn, cap));
        return null;
      });
    }
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
  $$`Lambda(a_Literal, b_)(c_)`,
  ({ a, b, c }) => {
    const substList = {};
    substList[a[1]] = c;
    return Eval(subst(b, substList));
  }
);
addRule(
  $$`Lambda(List(a__Literal), b_)(c__)`,
  ({ a, b, c }) => {
    const substList = {};
    for(let i=1; i<a.length; ++i) substList[a[i][1]] = c[i];
    return Eval(subst(b, substList));
  }
);
addRule(
  $$`Do(a__)`,
  ({ a }) => {
    let r = Null;
    for (let i = 1; i < a.length; ++i) {
      r = Eval(a[i]);
      if(kind(r) === 'Return') break;
    }
    return r;
  }
);
addRule(
  $$`Def(a_Literal, b_)`,
  ({ a, b }) => {
    const r = Eval(b);
    ownValueSet(Symbol(a[1]), r);
    return r;
  }
);
addRule(
  $$`Def(List(a__Literal), b_)`,
  ({ a, b }) => {
    const r = Eval(b);
    for(let i=1; i<a.length; ++i) {
      if(i>=b.length)
        ownValueSet(Symbol(a[i][1]), Null);
      else
        ownValueSet(Symbol(a[i][1]), r[i]);
    }
    return r;
  }
);
addRule(
  $$`Def(At(a_Literal(b_)), c_)`,
  ({ a, b, c }) => {
    const v = ownValue(Symbol(a[1]));
    const i = Eval(b);
    if(kind(i) !== 'Integer') throw 'Index must be a integer';
    if(i[1]>=v.length || i[1]<0) throw 'Out of bounds';
    v[i[1]] = Eval(c);
    return c;
  }
);
addRule(
  $$`Def(a_, b_)`,
  ({ a, b }) => {
    addRule(a, b);
    return Null;
  }
);
addRule(
  $$`Tag(t_Literal, Def(a_, b_))`,
  ({ t, a, b }) => {
    addRule(a, b, t[1]);
    return Null;
  }
);
addRule(
  $$`Tag(t_Symbol, Def(a_, b_))`,
  ({ t, a, b }) => {
    addRule(a, b, t[1]);
    return Null;
  }
);
addRule(
  $$`At(a_Literal(b_))`,
  ({ a, b }) => {
    const v = ownValue(Symbol(a[1]));
    const i = Eval(b);
    if(!isInteger(i)) throw 'Index must be a integer';
    if(kind(v) === 'Str') {
      if(i[1]>v[1].length || i[1]<=0) throw 'Out of bounds';
      return Str(v[1][i[1]-1]);
    } 
    if(i[1]>=v.length || i[1]<0) throw 'Out of bounds';
    return v[i[1]];
  }
);
addRule(
  $$`Len(a_)`,
  ({ a }) => {
    if(kind(a) === 'Str') return Integer(a[1].length);
    return Integer(a.length-1);
  }
);
addRule(
  $$`Map(f_, a_)`,
  ({ f, a }) => {
    let r = copy(a);
    for (let i = 1; i < a.length; ++i)
      r[i] = Eval(Cons(f)(a[i]));
    return r;
  }
);
addRule(
  $$`Reduce(f_, a_)`,
  ({ f, a }) => {
    let r = a[1];
    for (let i = 2; i < a.length; ++i)
      r = Eval(Cons(f)(r, a[i]));
    return r;
  }
);
addRule(
  $$`Reduce(f_, a_, s_)`,
  ({ f, a, s }) => {
    let r = s;
    for (let i = 1; i < a.length; ++i)
      r = Eval(Cons(f)(r, a[i]));
    return r;
  }
);
addRule(
  $$`Apply(f_, a_)`,
  ({ f, a }) => {
    a[0] = f;
    return a;
  }
);
addRule(
  $$`AppendTo(a_, b_)`,
  ({ a, b }) => {
    a.push(b);
    return a;
  }
);
addRule(
  $$`Cat(l___)`,
  ({ l }) => {
    let r = '';
    for (let i = 1; i < l.length; ++i)
      r = r + l[i][1];
    return Str(r);
  }
);
debugEx('Cat', `Cat('a','b','c')`);
addRule(
  $$`If(c_, t_, f_)`,
  ({c,t,f}) => {
    if(test(Eval(c))) {
      return Eval(t);
    } else {
      return Eval(f);
    }
  }
);
addRule(
  $$`Cond(s__List)`,
  ({s}) => {
    for(let i=1; i<s.length;++i) {
      const t = s[i];
      if(test(Eval(t[1]))) return Eval(t[2]);
    }
    return Null;
  }   
);
addRule(
  $$`While(c_, e_)`,
  ({c, e}) => {
    let r = Null; 
    while(test(Eval(c))) {
      r = Eval(e);
    }
    return r;
  }
);
addRule(
  $$`Match(p_, e_)`,
  ({p, e}) => {
    let cap = {};
    if(match(e, p, cap)) {
      for (const [key, value] of Object.entries(cap)) {
        ownValueSet(Symbol(key), value);
      }
      return True;
    }
    return False;
  }
);
addRule(
  $$`Subst(e_, List(s__Tag))`,
  ({e, s}) => {
    const substList = {};
    for(let i=1; i<s.length; ++i)
      substList[s[i][1][1]] = s[i][2];
    const r = subst(e, substList);
    return r;
  }
);
addRule(
  $$`Block(List(vars__), e_)`,
  ({vars, e}) => {
    const st = {};
    for(let i=1;i<vars.length; ++i) {
      if(kind(vars[i]) === 'Literal')
        st[vars[i][1]] = mkSymbol(vars[i][1]);
      if(kind(vars[i]) === 'Def') {
        const name = vars[i][1][1];
        const v = mkSymbol(name)
        st[name] = v;
        ownValueSet(v, vars[i][2]);
      }
    }
    stack.push(st);
    let r = Eval(e);
    stack.pop();
    if(kind(r) === 'Return') return r[1];
    return r;
  }
);
addRule(
  $$`ClearAll()`,
  ({}) => {
    for (let v in global) delete global[v];
    return Null;
  }
);
addRule(
  $$`Clear(v__Literal)`,
  ({v}) => {
    for (let i=1; i<v.length; ++i) delete global[v[i][1]];
    return Null;
  }
);
addRule(
  $$`Print(e__)`,
  ({e}) => {
    for(let i=1;i<e.length; ++i)
      console.log(toString(e[i]));
    return Null;
  }
);
addRule(
  $$`ToString(e_)`,
  ({e}) => {
    return Str(toString(e));
  }
);
addRule(
  $$`And(c__)`,
  ({c}) => { 
    for(let i = 1;i<c.length; ++i) {
      if(!test(Eval(c[i]))) return False;
    }
    return True;
  }
);
addRule(
  $$`Or(c__)`,
  ({c}) => { 
    for(let i = 1;i<c.length; ++i) {
      if(test(Eval(c[i]))) return True;
    }
    return False;
  }
);
addRule(
  $$`Not(c_)`,
  ({c}) => { 
    if(test(c)) return False;
    return True;
  }
);
addRule(
  $$`Equal(a_,b_)`,
  ({a, b}) => {
    if(equal(a,b)) return True;
    return False;
  }
);
addRule(
  $$`Less(a_,b_)`,
  ({a, b}) => {
    if(less(a, b)) return True;
    return False;
  }
);
addRule(
  $$`Great(a_,b_)`,
  ({a, b}) => {
    if(less(b, a)) return True;
    return False;
  }
);
addRule(
  $$`Kind(a_)`,
  ({a}) => {
    const ka = kind(a);
    if(ka === 'compound') return Null;
    return Symbol(ka);
  }
);
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
  $$`Times(-1, a)`
);
addRule(
  $$`Subtract(a_, b_)`,
  $$`Plus(a, Times(-1, b))`
);
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
addRule(
  $$`Power(a_Integer, b_Integer)`,
  ({ a, b }) => {
    if (b[1] > 0) return Integer(Math.pow(a[1], b[1]));
    return null;
  }
);
debugEx('Power', `3^4`);
addRule(
  $$`Quotient(a_Integer, b_Integer)`,
  ({ a, b }) => {
    return Integer(Math.floor(a[1]/b[1]));
  }
);
debugEx('Quotient', `Quotient(-25,3)`);
addRule(
  $$`Mod(a_Integer, b_Integer)`,
  ({ a, b }) => {
    if (a[1] == 0) return Integer(0);
    if ((a[1]>0) == (b[1]>0)) return Integer(a[1] % b[1]);
    return Integer(a[1] % b[1] + b[1]);
  }
);
debugEx('Mod', `Mod(-25,3)`);
$`Numeric(a_Integer) := True`;
$`Numeric(a_) := False`;
//Exports
Kernel.toString = toString;
Kernel.Eval = Eval;
Kernel.Form = Form;
Kernel.Symbol = Symbol;
Kernel.Cons = Cons;
Kernel.Integer = Integer;
Kernel.Str = Str;
Kernel.ownValueSet = ownValueSet;
Kernel.kind = kind;
Kernel.apply = apply;
Kernel.equal = equal;
Kernel.less = less;
Kernel.copy = copy;
Kernel.has = has;
Kernel.subst = subst;
Kernel.match = match;
Kernel.addRule = addRule;
Kernel.parse = parse;
Kernel.debugEx = debugEx;
Kernel.$ = $;
Kernel.$$ = $$;

module.exports = Kernel;