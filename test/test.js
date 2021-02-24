const expect = require('chai').expect;
const Guacyra = require('../src/index.js');
const { $, $$, toString, isStr } = Guacyra.Kernel;
 
describe("Guacyra CAS", function () {
  describe("API", function () {
    it("isStr(Str('aaa'))", function () {
      expect(isStr($`'aaa'`)).equal(true);
    });
  });
  describe("Programming", function () {
    it("(a ; b; c) = c", function () {
      expect($`a ; b; c`).to.deep.equal($`c`);
    });
    it("(z := [4,5,6]; @z(2)) = 5", function () {
      expect($`z := [4,5,6]; @z(2)`).to.deep.equal($`5`);
    });
    it("(@z(2) := -1; z) = [4,-1,6]", function () {
      expect($`(@z(2) := -1; z)`).to.deep.equal($`[4,-1,6]`);
    });
    it("(z:=[[1,2],[3,4]]; @z(1,2) := -1; z) = [[1,-1],[3,4]]", function () {
      expect($`(z:=[[1,2],[3,4]]; @z(1,2) := -1; z)`).to.deep.equal($`[[1,-1],[3,4]]`);
    });
    it("@h(a,b,c)(0) = a", function () {
      expect($`@h(a,b,c)(0)`).to.deep.equal($`h`);
    });
    it("(z:=[1,2,3]; #z) = 3", function () {
      expect($`(z:=[1,2,3]; #z)`).to.deep.equal($`3`);
    });
    it("(s := Cat('foo','blah')) = 'fooblah'", function () {
      expect($`(s := Cat('foo','blah'))`).to.deep.equal($`'fooblah'`);
    });
    it("#s = 7", function () {
      expect($`#s`).to.deep.equal($`7`);
    });
    it("@s(4) = 'b'", function () {
      expect($`@s(4)`).to.deep.equal($`'b'`);
    });
    it("([a,b,c] := [1,2,3]; a+b+c) = 6", function () {
      expect($`([a,b,c] := [1,2,3]; a+b+c)`).to.deep.equal($`6`);
    });
    it("([a,b,c] := [1,2]; c) = Null", function () {
      expect($`([a,b,c] := [1,2]; c)`).to.deep.equal($`Null`);
    });
    it("a:=2; Block([a:=1], a) = 1", function () {
      expect($`a:=2; Block([a:=1], a)`).to.deep.equal($`1`);
    });
    it("Block([f, x:=1], f(x_):= x+1; f(4)) = 5", function () {
      expect($`Block([f, x:=1], f(x_):= x+1; f(4))`).to.deep.equal($`5`);
    });
    it("Subst(x+y, [x : m, y : n]) = m+n", function () {
      expect($`Subst(x+y, [x : m, y : n])`).to.deep.equal($`m+n`);
    });
    it("(Clear(z); z) = z", function () {
      expect($`(Clear(z); z)`).to.deep.equal($`z`);
    });
  });
  describe("Functional", function () {
    it("( x => f(x))(2) = f(2)", function () {
      expect($`( x => f(x))(2)`).to.deep.equal($`f(2)`);
    });
    it("( [x, y] => f(x, y))(2, 3) = f(2, 3)", function () {
      expect($`( [x, y] => f(x, y))(2, 3)`).to.deep.equal($`f(2, 3)`);
    });
    it("Map( x => f(x), [1,2,3]) = [f(1),f(2),f(3)]", function () {
      expect($`Map( x => f(x), [1,2,3])`).to.deep.equal($`[f(1),f(2),f(3)]`);
    });
    it("Apply(f, [1,2,3]) = f(1,2,3)", function () {
      expect($`Apply(f, [1,2,3])`).to.deep.equal($`f(1,2,3)`);
    });
    it("[1,2,3] // f = f([1,2,3])", function () {
      expect($`[1,2,3] // f`).to.deep.equal($`f([1,2,3])`);
    });
    it("Reduce(f, [1,2,3]) = f(f(1,2),3)", function () {
      expect($`Reduce(f, [1,2,3])`).to.deep.equal($`f(f(1,2),3)`);
    });
    it("Reduce(f, [1,2,3], 0) = f(f(f(0,1),2),3)", function () {
      expect($`Reduce(f, [1,2,3], 0)`).to.deep.equal($`f(f(f(0,1),2),3)`);
    });
  });
});