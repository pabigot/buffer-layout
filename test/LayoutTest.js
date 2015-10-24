var assert = require("assert"),
    lo = require("../lib/Layout");

suite("Layout", function () {
    suite("Layout", function () {
        test("anonymous ctor", function () {
            var d = new lo.Layout(8);
            assert(d instanceof lo.Layout);
            assert.equal(8, d.span);
            assert.strictEqual(undefined, d.property);
        });
        test("named ctor", function () {
            var d = new lo.Layout(8, 'tag');
            assert(d instanceof lo.Layout);
            assert.equal(8, d.span);
            assert.equal('tag', d.property);
        });
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Layout(); }, TypeError);
            assert.throws(function () { new lo.Layout("3"); }, TypeError);
            assert.throws(function () { new lo.Layout("three"); }, TypeError);
        });
        test("abstractness", function () {
            var d = new lo.Layout(3),
                b = new Buffer(3);
            assert.throws(function () { d.decode(b); });
            assert.throws(function () { d.encode('sth', b); });
        });
    });
    suite("UInt", function () {
        test("u8", function () {
            var d = lo.u8('t'),
                b = new Buffer(1);
            assert(d instanceof lo.UInt);
            assert(d instanceof lo.Layout);
            assert.equal(1, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(23, b);
            assert.equal(0, Buffer('17', 'hex').compare(b));
            assert.equal(23, d.decode(b));
        });
        test("u16", function () {
            var d = lo.u16('t'),
                b = new Buffer(2);
            assert(d instanceof lo.UInt);
            assert(d instanceof lo.Layout);
            assert.equal(2, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x1234, b);
            assert.equal(0, Buffer('3412', 'hex').compare(b));
            assert.equal(0x1234, d.decode(b));
        });
        test("u48", function () {
            var d = lo.u48('t'),
                b = new Buffer(6);
            assert(d instanceof lo.UInt);
            assert(d instanceof lo.Layout);
            assert.equal(6, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x123456789abc, b);
            assert.equal(0, Buffer('bc9a78563412', 'hex').compare(b));
            assert.equal(0x123456789abc, d.decode(b));
        });
        test("invalid ctor", function () {
            assert.throws(function () { new lo.UInt(8); }, TypeError);
        });
    });
    suite("UIntBE", function () {
        test("u16be", function () {
            var d = lo.u16be('t'),
                b = new Buffer(2);
            assert(d instanceof lo.UIntBE);
            assert(d instanceof lo.Layout);
            assert.equal(2, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x1234, b);
            assert.equal(0, Buffer('1234', 'hex').compare(b));
            assert.equal(0x1234, d.decode(b));
        });
        test("u48be", function () {
            var d = lo.u48be('t'),
                b = new Buffer(6);
            assert(d instanceof lo.UIntBE);
            assert(d instanceof lo.Layout);
            assert.equal(6, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x123456789abc, b);
            assert.equal(0, Buffer('123456789abc', 'hex').compare(b));
            assert.equal(0x123456789abc, d.decode(b));
        });
        test("invalid ctor", function () {
            assert.throws(function () { new lo.UIntBE(8); }, TypeError);
        });
    });
    test("Float", function () {
        var be = lo.f32be('eff'),
            le = lo.f32('ffe'),
            f = 123456.125,
            fe = 3.174030951333261e-29,
            b = new Buffer(4);
        assert(be instanceof lo.FloatBE);
        assert(be instanceof lo.Layout);
        assert.equal(4, be.span);
        assert.equal('eff', be.property);
        assert(le instanceof lo.Float);
        assert(le instanceof lo.Layout);
        assert.equal(4, le.span);
        assert.equal('ffe', le.property);
        b.fill(0);
        assert.equal(0, be.decode(b));
        assert.equal(0, le.decode(b));
        le.encode(f, b);
        assert.equal(0, Buffer('1020f147', 'hex').compare(b));
        assert.equal(f, le.decode(b));
        assert.equal(fe, be.decode(b));
        be.encode(f, b);
        assert.equal(0, Buffer('47f12010', 'hex').compare(b));
        assert.equal(f, be.decode(b));
        assert.equal(fe, le.decode(b));
    });

});
