const NumberAlgo = require('./number');
const Kernel = require('./kernel');
const Formatting = require('./formatting');

const { latex } = Formatting;

const {
  $$, kind,
  addRule, equal, copy, 
  Form, Eval,
  Plus, Times, Divide,
  Integer, List
} = Kernel;

const {
  nuples, permutations, sign
} = NumberAlgo;

const Dot = Form('Dot', { Flat: true });

const dimensions = (a) => {
  if(kind(a) === 'List') {
    let t = List();
    for(let i=1;i<a.length;++i) {
      if(i==1) t = dimensions(a[i]);
      else {
        if(!equal(dimensions(a[i]),t)) throw 'Not a tensor';
      }
    }
    t.splice(1, 0, Integer(a.length-1));
    return t;
  } else return List();
};
addRule($$`Plus(a_List, b_List, c___)`, ({ a, b, c }) => {
  if(a.length === b.length) {
    const r = List();
    for(let i=1;i<a.length;++i) r.push(Eval(Plus(a[i], b[i])));
    return Eval(Plus(r,c));
  }
  return null;
});
addRule($$`Times(a_, b_List, c___)`, ({ a, b, c }) => {
  const r = List();
  for(let i=1;i<b.length;++i) r.push(Eval(Times(a, b[i])));
  return Eval(Times(r, c));
});
const buildTensor = (dims) => {
  const r = List();
  const n = dims[0];
  if(dims.length == 1) {
    for(let i=1;i<=n;++i) r.push(Integer(0));
    return r;
  }
  const sdim = dims.slice(1);
  for(let i=1;i<=n;++i) r.push(buildTensor(sdim));
  return r;
};
const ConstantArray = Form('ConstantArray');
addRule($$`ConstantArray(c_, List(l__Integer))`, ({ c, l }) => {
  const rb = l.slice(1).map(v=>v[1]);
  const r = buildTensor(rb);
  for(let ri of nuples(rb, 1)) {
    tensorSet(r, ri, copy(c));
  }
  return r;
});
const tensorGet = (t, ii) => {
  let r = t;
  for(let i=0;i<ii.length;++i) r = r[ii[i]];
  return r;
};

const tensorSet = (t, ii, v) => {
  let r = t;
  for(let i=0;i<ii.length-1;++i) r = r[ii[i]];
  r[ii[ii.length-1]] = v;
};

addRule($$`Dot(a_)`, $$`a`);
addRule($$`Dot()`, $$`1`);
addRule($$`Dot(a_List, b_List, c___)`, ({ a, b, c }) => {
  const da = dimensions(a);
  const db = dimensions(b); 
  if(da.length == 2 && db.length == 2 && a.length == b.length) {
    let r = Integer(0);
    for(let i=1;i<a.length;++i) r = Eval(Plus(r,Times(a[i],b[i])));
    return Eval(Dot(r, c));
  }
  if(da[da.length-1][1]==db[1][1]) {
    const rab = [];
    const n = db[1][1];
    for(let i=1;i<da.length-1;++i) rab.push(da[i][1]);
    for(let i=2;i<db.length;++i) rab.push(db[i][1]);
    const r = buildTensor(rab);
    for(let ri of nuples(rab, 1)) {
      let t = Integer(0);
      const aa = ri.slice(0, da.length-2);
      aa.push(0); 
      const bb = ri.slice(da.length-2);
      bb.unshift(0);
      for(let i=1;i<=n;++i) {
        aa[da.length-2] = i;
        bb[0] = i;
        const va = tensorGet(a, aa);
        const vb = tensorGet(b, bb);
        t = Eval(Plus(t, Times(va, vb)));
      }
      tensorSet(r, ri, t);
    }
    return Eval(Dot(r, c));
  }
  return null;
});

addRule($$`Dot(a_, b_List, c___)`, ({ a, b, c }) => {
  const db = dimensions(b);
  const rb = db.slice(1).map(v=>v[1]);
  const r = buildTensor(rb);
  for(let ri of nuples(rb, 1)) {
    const v = tensorGet(b, ri);
    tensorSet(r, ri, Eval(Times(a,v)));
  }
  return Eval(Dot(r, c));
});

addRule($$`Dot(b_List, a_Integer, c___)`, $$`Dot(a, b, c)`);

addRule($$`Dot(b_List, a_Rational, c___)`, $$`Dot(a, b, c)`);

addRule($$`Dot(b_List, a_Complex, c___)`, $$`Dot(a, b, c)`);

const size = A => {
  const dim = dimensions(A);
  if(dim.length!=3) throw 'Not a matrix';
  return [dim[1][1], dim[2][1]];
};

const forEachEntry = (A, f) => {
  const [m, n] = size(A);
  for (let i = 1; i <= m; ++i) for (let j = 1; j <= n; ++j) f(i, j, A);
};

const det = A => {
  const [m, n] = size(A);
  if(m != n) throw 'Not a square matrix';
  if (m == 1) return A[1][1];
  let r = Integer(0);
  const ra = Array.from(Array(m), (_, i) => i + 1);
  for (let p of permutations(ra)) {
    let s = Integer(sign(p));
    for (let i = 1; i <= m; ++i) s = Eval(Times(s, A[i][p[i - 1]]));
    r = Eval(Plus(r, s));
  }
  return r;
};

const Det = Form('Det');
addRule($$`Det(a_List)`, ({ a }) => {
  try {
    return det(a);
  } catch(e) {
    console.log(e);
    return null;
  }
});

const tr = A => {
  const [m, n] = size(A);
  if (m == 1) return A[1][1];
  let r = Integer(0);
  for (let i = 1; i <= m; ++i) {
    r = Eval(Plus(r, A[i][i]));
  }
  return r;
};

const Tr = Form('Tr');
addRule($$`Tr(a_List)`, ({ a }) => {
  try {
    return tr(a);
  } catch(e) {
    console.log(e);
    return null;
  }
});

const rowSwap = (A, i1, i2) => {
  const t = A[i1];
  A[i1] = A[i2];
  A[i2] = t;
};

const rowAdd = (A, i1, i2, k) => {
  const [m, n] = size(A);
  for (let j = 1; j <= n; ++j)
    A[i1][j] = Eval(Plus(A[i1][j], Times(k, A[i2][j])));
};

const rowScale = (A, i, k) => {
  const [m, n] = size(A);
  for (let j = 1; j <= n; ++j) A[i][j] = Eval(Times(k, A[i][j]));
};

function* rowEchelonSteps(A) {
  const [m, n] = size(A);
  yield { A: A, op: 'init', text: 'init' };
  let ii = 1;
  for (let j = 1; j <= n; ++j) {
    let i;
    for (i = ii; i <= m; ++i) if(!equal(A[i][j], Integer(0))) break;
    if (i > m) continue;
    if (i != ii) {
      rowSwap(A, i, ii);
      yield {
        A: A,
        op: 'rswap',
        i: i,
        ip: ii,
        text: `L_{${i}}\\leftrightarrow L_{${ii}}`
      };
    }
    yield { op: 'pivot', pivot: [ii, j] };
    for (i = ii + 1; i <= m; ++i) {
      const k = Eval(Times(-1, Divide(A[i][j], A[ii][j])));
      if (equal(k, Integer(0))) continue;
      rowAdd(A, i, ii, k);
      let kt = latex(Times(k, `L_${ii}`));
      if (!kt.startsWith('-')) kt = '+' + kt;
      kt = `L_{${i}}` + kt;
      yield {
        A: A,
        op: 'radd',
        i: i,
        ip: ii,
        k: k,
        text: `L_{${i}}\\rightarrow ${kt}`
      };
    }
    if (ii == m) break;
    ii = ii + 1;
  }
}

function* reducedRowEchelonSteps(A) {
  const [m, n] = size(A);
  yield { A: A, op: 'init', text: 'init' };
  let ii = 1;
  for (let j = 1; j <= n; ++j) {
    let i;
    for (i = ii; i <= m; ++i) if (!equal(A[i][j], Integer(0))) break;
    if (i > m) continue;
    if (i != ii) {
      rowSwap(A, i, ii);
      yield {
        A: A,
        op: 'rswap',
        i: i,
        ip: ii,
        text: `L_{${i}}\\leftrightarrow L_{${ii}}`
      };
    }
    yield { op: 'pivot', pivot: [ii, j] };
    {
      const k = Eval(Divide(1, A[ii][j]));
      if (!equal(k, Integer(1))) {
        let kt = latex(Times(k, `L_${ii}`));
        rowScale(A, ii, k);
        yield {
          A: A,
          op: 'rscale',
          i: ii,
          ip: ii,
          k: k,
          text: `L_{${ii}}\\rightarrow ${kt}`
        };
      }
    }
    for (i = ii - 1; i >= 1; --i) {
      const k = Eval(Times(-1, Divide(A[i][j], A[ii][j])));
      if (equal(k, Integer(0))) continue;
      rowAdd(A, i, ii, k);
      let kt = latex(Times(k, `L_${ii}`));
      if (!kt.startsWith('-')) kt = '+' + kt;
      kt = `L_{${i}}` + kt;
      yield {
        A: A,
        op: 'radd',
        i: i,
        ip: ii,
        k: k,
        text: `L_{${i}}\\rightarrow ${kt}`
      };
    }
    for (i = ii + 1; i <= m; ++i) {
      const k = Eval(Times(-1, Divide(A[i][j], A[ii][j])));
      if (equal(k, Integer(0))) continue;
      rowAdd(A, i, ii, k);
      let kt = latex(Times(k, `L_${ii}`));
      if (!kt.startsWith('-')) kt = '+' + kt;
      kt = `L_{${i}}` + kt;
      yield {
        A: A,
        op: 'radd',
        i: i,
        ip: ii,
        k: k,
        text: `L_{${i}}\\rightarrow ${kt}`
      };
    }
    if (ii == m) break;
    ii = ii + 1;
  }
}

const del = (A, i0, j0) => {
  const [m, n] = size(A);
  const r = buildTensor([m - 1, n - 1]);
  forEachEntry(r, (i, j) => {
    r[i][j] = A[i + (i >= i0 ? 1 : 0)][j + (j >= j0 ? 1 : 0)];
  });
  return r;
};

const transpose = A => {
  const [m, n] = size(A);
  let At = buildTensor([n, m]);
  forEachEntry(A, (i, j) => {
    At[j][i] = A[i][j];
  });
  return At;
};

const Transpose = Form('Transpose');
addRule($$`Transpose(a_List)`, ({ a }) => {
  try {
    return transpose(a);
  } catch(e) {
    console.log(e);
    return null;
  }
});

const adj = A => {
  const [m, n] = size(A);
  const r = buildTensor([m, n]);
  forEachEntry(A, (i, j) => {
    r[i][j] = Eval(Times((-1) ** (i + j), det(del(A, i, j))));
  });
  return transpose(r);
};

const Adj = Form('Adj');
addRule($$`Adj(a_List)`, ({ a }) => {
  try {
    return adj(a);
  } catch(e) {
    console.log(e);
    return null;
  }
});

const inverse = A => {
  const [m, n] = size(A);
  if (m != n) throw "Not a square matrix.";
  let AI = buildTensor([n, 2 * n]);
  forEachEntry(A, (i, j) => {
    AI[i][j] = A[i][j];
    AI[i][j + n] = Integer(i == j ? 1 : 0);
  });
  for (let s of reducedRowEchelonSteps(AI)) {
  }
  const r = buildTensor([n, n]);
  forEachEntry(r, (i, j) => {
    r[i][j] = AI[i][j + n];
  });
  return r;
};

const Inverse = Form('Inverse');
addRule($$`Inverse(a_List)`, ({ a }) => {
  try {
    return inverse(a);
  } catch(e) {
    console.log(e);
    return null;
  }
});

const LinearAlgebra = {
  Dot, dimensions,
  buildTensor, tensorGet, tensorSet,
  Det, Tr, Transpose, Adj, Inverse, ConstantArray
};

module.exports = LinearAlgebra;
