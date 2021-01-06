const expect = require('chai').expect;
const Guacyra = require('../src/index.js');
const {$, $$, toString} = Guacyra.Kernel;

describe("Guacyra CAS", function () {
    describe("Functional", function () {
        it("Lambda", function () {
          expect($`( x => f(x))(2)`).to.deep.equal($`f(2)`);
        });
        it("Do", function () {
          expect($`a ; b; c`).to.deep.equal($`c`);
        });
        it("Def/At", function () {
          expect($`z := [4,5,6]; @z(2)`).to.deep.equal($`5`);
        });
        it("Def/At", function () {
          expect($`@z(2) := -1; z`).to.deep.equal($`[4,-1,6]`);
        });
    });
});