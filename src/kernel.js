const Kernel = {};
const symbolTable = {};
function SymbolValues() {
  this.attr = {};
  this.up = [];
  this.down = [];
  this.sub = [];
  this.own = [null];
}
const AtomSymbol = [];
AtomSymbol[0] = AtomSymbol;
AtomSymbol[1] = 'Symbol';
symbolTable['Symbol'] = {
  name: 'Symbol',
  atom: AtomSymbol,
  values: new SymbolValues()
};
const Symbol = (s) => {
  let symb = symbolTable[s];
  if (symb) return symb.atom;
  symb = [AtomSymbol, s];
  symbolTable[s] = {
    name: s,
    atom: symb,
    values: new SymbolValues()
  };
  return symb;
}
const stackTop = s => {
  const stack = symbolTable[s].values.own;
  return stack[stack.length - 1];
}
const stackPush = s => {
  const stack = symbolTable[s].values.own;
  return stack.push(null);
}
const stackPop = s => {
  const stack = symbolTable[s].values.own;
  return stack.pop();
}
const symbolAttr = s => {
  return symbolTable[s].values.attr;
}
const upValues = s => {
  return symbolTable[s].values.up;
}
const downValues = s => {
  return symbolTable[s].values.down;
}
const subValues = s => {
  return symbolTable[s].values.sub;
}
const ownValue = s => {
  return stackTop(s);
}
const ownValueSet = (s, v) => {
  const stack = symbolTable[s].values.own;
  stack[stack.length - 1] = v;
}
const AtomInteger = Symbol('Integer');
const Integer = (n) => [AtomInteger, n];
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
  Kernel[name] = fn;
  Object.assign(symbolAttr(name), attr);
  return fn;
};
const List = Form('List');
const Sequence = Form('Sequence');
const True = Symbol('True');
const False = Symbol('False');
const Null = Symbol('Null');
Kernel.True = True;
Kernel.False = False;
Kernel.Null = Null;
const If = Form('If', { HoldRest: true });
const And = Form('And', { HoldAll: true });
const Or = Form('Or', { HoldAll: true });
const Not = Form('Not');
const While = Form('While', { HoldAll: true });
const Block = Form('Block', { HoldRest: true });
const Print = Form('Print');
const Cat = Form('Cat');
const Apply = Form('Apply');
const Map = Form('Map');
const Lambda = Form('Lambda', { HoldAll: true });
const Do = Form('Do', { Flat: true, HoldAll: true });
const Def = Form('Def', { HoldAll: true });
const Equal = Form('Equal');
const Less = Form('Less');
const Great = Form('Great');
const Blank = Form('Blank');
const BlankSequence = Form('BlankSequence');
const BlankNullSequence = Form('BlankNullSequence');
const Hold = Form('Hold', { HoldAll: true });
const Plus = Form('Plus', { Flat: true, Orderless: true });
const Times = Form('Times', { Flat: true, Orderless: true });
const Subtract = Form('Subtract');
const UnaryMinus = Form('UnaryMinus');
const Power = Form('Power');
const isAtom = e => {
  return (
    e[0] === AtomSymbol ||
    e[0] === AtomLiteral ||
    e[0] === AtomInteger
  );
};
const kind = e => {
  if (isAtom(e) || isAtom(e[0])) return e[0][1];
  return 'compound';
};
const test = e => {
  if(equal(e, True)) return true;
  if(kind(e) === 'Integer') return e[1] != 0;
  return false;
}
const subKind = e => {
  if (isAtom(e[0])) return e[0][1];
  return subKind(e[0]);
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
  if (symbolAttr(k).Flat) {
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
    rex: /(\w+)/,
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
      return Blank(s[0], s[1]);
    case 3:
      return BlankSequence(s[0], s[2]);
    case 4:
      return BlankNullSequence(s[0], s[3]);
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
      t = Cons(Symbol(op))(t, t1);
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
    } else if (lexer.isTerminal(next())) {
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
  if (k === 'Literal') return "'" + e[1] + "'";
  if (k === 'Symbol') return e[1];
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
  if(isAtom(a) && isAtom(b)) return a[1]<b[1];
  if(isAtom(a))  return true;
  if(isAtom(b))  return false;
  if(ka === kb) {
    if(a.length<b.length) return true;
    if(a.length>b.length) return false;
    for(let i=0; i<a.length; ++i) {
      if(!equal(a[i], b[i])) return less(a[i], b[i]);
    }
    return false;
  }
  if(kb === 'compound') return true;
  if(ka === 'compound') return false;
  return ka < kb;
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
console.debug('#Functional')
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
    let r = True;
    for (let i = 1; i < a.length; ++i)
      r = Eval(a[i]);
    return r;
  }
);
debugEx('Do', `a;b;c`);
addRule(
  $$`Def(a_Symbol, b_)`,
  ({ a, b }) => {
    const r = Eval(b);
    ownValueSet(a[1], r);
    return r;
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
debugEx('Apply', `Apply(f, [1,2,3])`);
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
    if(test(c)) {
      return Eval(t);
    } else {
      return Eval(f);
    }
  }
);
addRule(
  $$`While(c_,e_)`,
  ({c, e}) => {
    let r = Null; 
    while(test(Eval(c))) {
      r = Eval(e);
    }
    return r;
  }
);
addRule(
  $$`Block(List(vars___Symbol),e_)`,
  ({vars, e}) => {
    for(let i=1;i<vars.length; ++i)
      stackPush(vars[i][1]);
    const r = Eval(e);
    for(let i=1;i<vars.length; ++i)
      stackPop(vars[i][1]);
    return r;
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
//  ({ a }) => Times(-1, a)
);
addRule(
  $$`Subtract(a_, b_)`,
  $$`Plus(a, Times(-1, b))`
//  ({ a, b }) => Plus(a, Times(-1, b))
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
addRule($$`Power(a_Integer, b_Integer)`, ({ a, b }) => {
  if (b[1] > 0) return Integer(Math.pow(a[1], b[1]));
  return null;
});
debugEx('Power', `3^4`);
//Exports
Kernel.toString = toString;
Kernel.Eval = Eval;
Kernel.Form = Form;
Kernel.Symbol = Symbol;
Kernel.Cons = Cons;
Kernel.Integer = Integer;
Kernel.Literal = Literal;
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