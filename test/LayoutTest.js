var assert = require("assert"),
    _ = require("lodash"),
    lo = require("../lib/Layout");

/* Some versions of Node have an undocumented in-place reverse.
 * That's not what we want. */
function reversedBuffer (b)
{
    var ba = Array.prototype.slice.call(b);
    return new Buffer(ba.reverse());
}

suite("Layout", function () {
    test("#reversedBuffer", function () {
        var b = Buffer('0102030405', 'hex');
        assert.equal(Buffer('0504030201', 'hex').compare(reversedBuffer(b)), 0);
    });
    suite("Buffer", function () {
        test("issue 3992", function () {
            var buf = new Buffer(4);
            buf.writeIntLE(-0x120000, 0, 4);
            assert.deepEqual(buf.toJSON().data, [ 0x00, 0x00, 0xee, 0xff ]);
            buf.writeIntBE(-0x120000, 0, 4);
            assert.deepEqual(buf.toJSON().data, [ 0xff, 0xee, 0x00, 0x00 ]);
        });
    });
    suite("Layout", function () {
        test("anonymous ctor", function () {
            var d = new lo.Layout(8);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 8);
            assert.equal(d.getSpan(), d.span);
            assert.strictEqual(d.property, undefined);
        });
        test("named ctor", function () {
            var d = new lo.Layout(8, 'tag');
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 8);
            assert.equal(d.getSpan(), d.span);
            assert.equal(d.property, 'tag');
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
        test("#getSpan", function () {
            assert.equal((new lo.Layout(3)).getSpan(), 3);
            assert.throws(function () { (new lo.Layout(-1)).getSpan(); }, RangeError);
        });
    });
    suite("UInt", function () {
        test("u8", function () {
            var d = lo.u8('t'),
                b = new Buffer(1);
            assert(d instanceof lo.UInt);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 1);
            assert.equal(d.getSpan(), d.span);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(23, b);
            assert.equal(Buffer('17', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 23);
        });
        test("u16", function () {
            var d = lo.u16('t'),
                b = new Buffer(2);
            assert(d instanceof lo.UInt);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 2);
            assert.equal(d.getSpan(), d.span);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x1234, b);
            assert.equal(Buffer('3412', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x1234);
        });
        test("u48", function () {
            var d = lo.u48('t'),
                b = new Buffer(6);
            assert(d instanceof lo.UInt);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 6);
            assert.equal(d.getSpan(), d.span);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x123456789abc, b);
            assert.equal(Buffer('bc9a78563412', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x123456789abc);
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
            assert.equal(d.span, 2);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x1234, b);
            assert.equal(Buffer('1234', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x1234);
        });
        test("u48be", function () {
            var d = lo.u48be('t'),
                b = new Buffer(6);
            assert(d instanceof lo.UIntBE);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 6);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x123456789abc, b);
            assert.equal(Buffer('123456789abc', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x123456789abc);
        });
        test("invalid ctor", function () {
            assert.throws(function () { new lo.UIntBE(8); }, TypeError);
        });
    });
    suite("Int", function () {
        test("s8", function () {
            var d = lo.s8('t'),
                b = new Buffer(1);
            assert(d instanceof lo.Int);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 1);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(23, b);
            assert.equal(Buffer('17', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 23);
            d.encode(-97, b);
            assert.equal(Buffer('9f', 'hex').compare(b), 0);
            assert.equal(d.decode(b), -97);
        });
        test("s16", function () {
            var d = lo.s16('t'),
                b = new Buffer(2);
            assert(d instanceof lo.Int);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 2);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x1234, b);
            assert.equal(Buffer('3412', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x1234);
            assert.equal(lo.u16be().decode(b), 0x3412);
            d.encode(-12345, b);
            assert.equal(Buffer('c7cf', 'hex').compare(b), 0);
            assert.equal(d.decode(b), -12345);
            assert.equal(lo.u16().decode(b), 0xcfc7);
            assert.equal(lo.u16be().decode(b), 0xc7cf);
        });
        test("s48", function () {
            var d = lo.s48('t'),
                b = new Buffer(6);
            assert(d instanceof lo.Int);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 6);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x123456789abc, b);
            assert.equal(Buffer('bc9a78563412', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x123456789abc);
            assert.equal(lo.u48be().decode(b), 0xbc9a78563412);
            d.encode(-123456789012345, b);
            assert.equal(Buffer('8720f279b78f', 'hex').compare(b), 0);
            assert.equal(d.decode(b), -123456789012345);
            assert.equal(lo.u48().decode(b), 0x8fb779f22087);
            assert.equal(lo.u48be().decode(b), 0x8720f279b78f);
        });
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Int(8); }, TypeError);
        });
    });
    suite("IntBE", function () {
        test("s16", function () {
            var d = lo.s16be('t'),
                b = new Buffer(2);
            assert(d instanceof lo.IntBE);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 2);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x1234, b);
            assert.equal(Buffer('1234', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x1234);
            assert.equal(lo.u16().decode(b), 0x3412);
            d.encode(-12345, b);
            assert.equal(Buffer('cfc7', 'hex').compare(b), 0);
            assert.equal(d.decode(b), -12345);
            assert.equal(lo.u16be().decode(b), 0xcfc7);
            assert.equal(lo.u16().decode(b), 0xc7cf);
        });
        test("s48", function () {
            var d = lo.s48be('t'),
                b = new Buffer(6);
            assert(d instanceof lo.IntBE);
            assert(d instanceof lo.Layout);
            assert.equal(d.span, 6);
            assert.equal(d.property, 't');
            b.fill(0);
            assert.equal(d.decode(b), 0);
            d.encode(0x123456789abc, b);
            assert.equal(Buffer('123456789abc', 'hex').compare(b), 0);
            assert.equal(d.decode(b), 0x123456789abc);
            assert.equal(lo.u48().decode(b), 0xbc9a78563412);
            d.encode(-123456789012345, b);
            assert.equal(Buffer('8fb779f22087', 'hex').compare(b), 0);
            assert.equal(d.decode(b), -123456789012345);
            assert.equal(lo.u48be().decode(b), 0x8fb779f22087);
            assert.equal(lo.u48().decode(b), 0x8720f279b78f);
        });
        test("invalid ctor", function () {
            assert.throws(function () { new lo.IntBE(8, 'u64'); }, TypeError);
        });
    });
    test("RoundedUInt64", function () {
        var be = lo.nu64be('be'),
            le = lo.nu64('le');
        assert.equal(be.span, 8);
        assert.equal(le.span, 8);
        assert.equal(be.property, 'be');
        assert.equal(le.property, 'le');

        var b = Buffer('0000003b2a2a873b', 'hex'),
            rb = reversedBuffer(b),
            v = 254110500667,
            ev = v,
            eb = new Buffer(be.span);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(b.compare(eb), 0);
        le.encode(v, eb);
        assert.equal(rb.compare(eb), 0);

        b = Buffer('001d9515553fdcbb', 'hex');
        rb = reversedBuffer(b);
        v = 8326693181709499;
        ev = v;
        assert.equal(ev, v);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(b.compare(eb), 0);
        assert.equal(be.decode(eb), ev);
        le.encode(v, eb);
        assert.equal(rb.compare(eb), 0);
        assert.equal(le.decode(eb), ev);

        /* The logic changes for the remaining cases since the exact
         * value cannot be represented in a Number: the encoded buffer
         * will not bitwise-match the original buffer. */
        b = Buffer('003b2a2aaa7fdcbb', 'hex');
        rb = reversedBuffer(b);
        v = 16653386363428027;
        ev = v + 1;
        assert.equal(ev, v);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(be.decode(eb), ev);
        le.encode(v, eb);
        assert.equal(le.decode(eb), ev);

        b = Buffer('eca8aaa9ffffdcbb', 'hex');
        rb = reversedBuffer(b);
        v = 17053067636159536315;
        ev = v + 837;
        assert.equal(ev, v);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(be.decode(eb), ev);
        le.encode(v, eb);
        assert.equal(le.decode(eb), ev);
    });
    test("RoundedInt64", function () {
        var be = lo.ns64be('be'),
            le = lo.ns64('le');
        assert.equal(be.span, 8);
        assert.equal(le.span, 8);
        assert.equal(be.property, 'be');
        assert.equal(le.property, 'le');

        var b = Buffer('ffffffff89abcdf0', 'hex'),
            rb = reversedBuffer(b),
            v = -1985229328,
            ev = v,
            eb = new Buffer(be.span);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(b.compare(eb), 0);
        le.encode(v, eb);
        assert.equal(rb.compare(eb), 0);

        b = Buffer('ffffc4d5d555a345', 'hex');
        rb = reversedBuffer(b);
        v = -65052290473147;
        ev = v;
        assert.equal(ev, v);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(b.compare(eb), 0);
        assert.equal(be.decode(eb), ev);
        le.encode(v, eb);
        assert.equal(rb.compare(eb), 0);
        assert.equal(le.decode(eb), ev);

        /* The logic changes for the remaining cases since the exact
         * value cannot be represented in a Number: the encoded buffer
         * will not bitwise-match the original buffer. */
        b = Buffer('ff13575556002345', 'hex');
        rb = reversedBuffer(b);
        v = -66613545453739195;
        ev = v + 3;
        assert.equal(ev, v);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(be.decode(eb), ev);
        le.encode(v, eb);
        assert.equal(le.decode(eb), ev);

        b = Buffer('e26aeaaac0002345', 'hex');
        rb = reversedBuffer(b);
        v = -2131633454519934139;
        ev = v - 69;
        assert.equal(ev, v);
        assert.equal(be.decode(b), ev);
        assert.equal(le.decode(rb), ev);
        be.encode(v, eb);
        assert.equal(be.decode(eb), ev);
        le.encode(v, eb);
        assert.equal(le.decode(eb), ev);
    });
    test("Float", function () {
        var be = lo.f32be('eff'),
            le = lo.f32('ffe'),
            f = 123456.125,
            fe = 3.174030951333261e-29,
            b = new Buffer(4);
        assert(be instanceof lo.FloatBE);
        assert(be instanceof lo.Layout);
        assert.equal(be.span, 4);
        assert.equal(be.getSpan(), be.span);
        assert.equal(be.property, 'eff');
        assert(le instanceof lo.Float);
        assert(le instanceof lo.Layout);
        assert.equal(le.span, 4);
        assert.equal(le.property, 'ffe');
        b.fill(0);
        assert.equal(be.decode(b), 0);
        assert.equal(le.decode(b), 0);
        le.encode(f, b);
        assert.equal(Buffer('1020f147', 'hex').compare(b), 0);
        assert.equal(le.decode(b), f);
        assert.equal(be.decode(b), fe);
        be.encode(f, b);
        assert.equal(Buffer('47f12010', 'hex').compare(b), 0);
        assert.equal(be.decode(b), f);
        assert.equal(le.decode(b), fe);
    });
    test("Double", function () {
        var be = lo.f64be('dee'),
            le = lo.f64('eed'),
            f = 123456789.125e+10,
            fe = 3.4283031083405533e-77,
            b = new Buffer(8);
        assert(be instanceof lo.DoubleBE);
        assert(be instanceof lo.Layout);
        assert.equal(be.span, 8);
        assert.equal(be.property, 'dee');
        assert(le instanceof lo.Double);
        assert(le instanceof lo.Layout);
        assert.equal(le.span, 8);
        assert.equal(le.property, 'eed');
        b.fill(0);
        assert.equal(be.decode(b), 0);
        assert.equal(le.decode(b), 0);
        le.encode(f, b);
        assert.equal(Buffer('300fc1f41022b143', 'hex').compare(b), 0);
        assert.equal(le.decode(b), f);
        assert.equal(be.decode(b), fe);
        be.encode(f, b);
        assert.equal(Buffer('43b12210f4c10f30', 'hex').compare(b), 0);
        assert.equal(be.decode(b), f);
        assert.equal(le.decode(b), fe);
    });
    suite("Sequence", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Sequence(); }, TypeError);
            assert.throws(function () { new lo.Sequence(lo.u8()); }, TypeError);
            assert.throws(function () { new lo.Sequence(lo.u8(), "5 is not an integer"); }, TypeError);
            assert.throws(function () { new lo.Sequence(lo.u8(), lo.u8()); }, TypeError);
            assert.throws(function () { new lo.Sequence(lo.u8(), lo.offset(lo.f32())); }, TypeError);
        });
        test("basics", function () {
            var seq = new lo.Sequence(lo.u8(), 4, 'id'),
                b = new Buffer(4);
            assert(seq instanceof lo.Sequence);
            assert(seq instanceof lo.Layout);
            assert(seq.elt_layout instanceof lo.UInt);
            assert.equal(seq.count, 4);
            assert.equal(seq.span, 4);
            assert.equal(seq.getSpan(), seq.span);
            assert.equal(seq.property, 'id');
            b.fill(0);
            assert.deepEqual(seq.decode(b), [0,0,0,0]);
            seq.encode([1,2,3,4], b);
            assert.deepEqual(seq.decode(b), [1,2,3,4]);
            seq.encode([5,6], b, 1);
            assert.deepEqual(seq.decode(b), [1,5,6,4]);
        });
        test("in struct", function () {
            var seq = lo.seq(lo.u8(), 4, 'id'),
                str = lo.struct([seq]),
                d = str.decode(Buffer('01020304', 'hex'));
            assert.deepEqual(d, {id:[1,2,3,4]});
        });
        test("struct elts", function () {
            var st = new lo.Structure([lo.u8('u8'),
                                       lo.s32('s32')]),
                seq = new lo.Sequence(st, 3),
                tv = [{u8:1, s32:1e4}, {u8:0, s32:0}, {u8:3, s32:-324}],
                b = new Buffer(15);
            assert.equal(st.span, 5);
            assert.equal(seq.count, 3);
            assert.strictEqual(seq.elt_layout, st);
            assert.equal(seq.span, 15);
            seq.encode(tv, b);
            assert.equal(Buffer('0110270000000000000003bcfeffff', 'hex').compare(b), 0);
            assert.deepEqual(seq.decode(b), tv);
            seq.encode([{u8:2,s32:0x12345678}], b, st.span);
            assert.equal(Buffer('0110270000027856341203bcfeffff', 'hex').compare(b), 0);
        });
        test("var count", function () {
            var clo = lo.u8('n'),
                seq = lo.seq(lo.u8(), lo.offset(clo, -1), 'a'),
                st = lo.struct([clo, seq]),
                b = Buffer('03010203', 'hex'),
                obj = st.decode(b);
            assert.equal(obj.n, 3);
            assert.deepEqual(obj.a, [1,2,3]);
            b = new Buffer(10);
            obj = { n:3, a: [5,6,7,8,9] };
            st.encode(obj, b);
            var span = st.getSpan(b);
            assert.equal(span, 6);
            assert.equal(Buffer('050506070809', 'hex').compare(b.slice(0, span)), 0);
        });
        // For variable span alone see CString in seq
        test("var count+span", function () {
            var clo = lo.u8('n'),
                seq = lo.seq(lo.cstr(), lo.offset(clo, -1), 'a'),
                st = lo.struct([clo, seq]),
                b = Buffer('036100620063646500', 'hex'),
                obj = st.decode(b);
            assert.equal(obj.n, 3);
            assert.deepEqual(obj.a, ['a', 'b', 'cde']);
            b = new Buffer(10);
            obj = { n:6, a: ['one', 'two'] };
            st.encode(obj, b);
            var span = st.getSpan(b);
            assert.equal(span, 9);
            assert.equal(Buffer('026f6e650074776f00', 'hex').compare(b.slice(0, span)), 0);
        });
        test("zero-count", function () {
            var seq = lo.seq(lo.u8(), 0),
                b = Buffer('', 'hex');
            assert.equal(seq.span, 0);
            assert.deepEqual(seq.decode(b), []);
        });
    });
    suite("Structure", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Structure(); }, TypeError);
            assert.throws(function () { new lo.Structure("stuff"); }, TypeError);
            assert.throws(function () { new lo.Structure(["stuff"]); }, TypeError);
            // no unnamed variable-length fields
            assert.throws(function () { new lo.Structure([lo.cstr()]); }, Error);
        });
        test("basics", function () {
            var st = new lo.Structure([lo.u8('u8'),
                                       lo.u16('u16'),
                                       lo.s16be('s16be')]),
                b = new Buffer(5);
            assert(st instanceof lo.Structure);
            assert(st instanceof lo.Layout);
            assert.equal(st.span, 5);
            assert.equal(st.getSpan(), st.span);
            assert.strictEqual(st.property, undefined);
            b.fill(0);
            var obj = st.decode(b);
            assert.deepEqual(obj, {u8:0, u16:0, s16be:0});
            obj = {u8:21, u16:0x1234, s16be:-5432};
            st.encode(obj, b);
            assert.equal(Buffer('153412eac8', 'hex').compare(b), 0);
            assert.deepEqual(st.decode(b), obj);
        });
        test("padding", function () {
            var st = new lo.Structure([lo.u16('u16'),
                                       lo.u8(),
                                       lo.s16be('s16be')]),
                b = new Buffer(5);
            assert.equal(st.span, 5);
            b.fill(0);
            var obj = st.decode(b);
            assert.deepEqual(obj, {u16:0, s16be:0});
            b.fill(0xFF);
            obj = {u16:0x1234, s16be:-5432};
            st.encode(obj, b);
            assert.equal(Buffer('3412ffeac8', 'hex').compare(b), 0);
            assert.deepEqual(st.decode(b), obj);
        });
        test("missing", function () {
            var st = new lo.Structure([lo.u16('u16'),
                                       lo.u8('u8'),
                                       lo.s16be('s16be')]),
                b = new Buffer(5);
            assert.equal(st.span, 5);
            b.fill(0);
            var obj = st.decode(b);
            assert.deepEqual(obj, {u16:0, u8:0, s16be:0});
            b.fill(0xa5);
            obj = {u16:0x1234, s16be:-5432};
            st.encode(obj, b);
            assert.equal(Buffer('3412a5eac8', 'hex').compare(b), 0);
            assert.deepEqual(st.decode(b), _.extend(obj, {u8:0xa5}));
        });
        test("update", function () {
            var st = new lo.Structure([lo.u8('u8'),
                                       lo.u16('u16'),
                                       lo.s16be('s16be')]),
                b = Buffer('153412eac8', 'hex'),
                rc = st.decode(b, 0);
            assert.deepEqual(rc, {u8:21, u16:0x1234, s16be:-5432});
        });
        test("nested", function () {
            var st = new lo.Structure([lo.u8('u8'),
                                       lo.u16('u16'),
                                       lo.s16be('s16be')], 'st'),
                cst = new lo.Structure([lo.u32('u32'),
                                        st,
                                        lo.s24('s24')]),
                obj = {'u32': 0x12345678,
                        'st': {
                            u8: 23,
                            u16: 65432,
                            s16be: -12345
                        },
                        's24': -123456},
                b = new Buffer(12);
            assert.equal(st.span, 5);
            assert.equal(st.property, 'st');
            assert.equal(cst.span, 12);
            cst.encode(obj, b);
            assert.equal(Buffer('785634121798ffcfc7c01dfe', 'hex').compare(b), 0);
            assert.deepEqual(cst.decode(b), obj);
        });
        test("empty", function () {
            var st = lo.struct([], 'st'),
                b = Buffer('', 'hex');
            assert.equal(st.span, 0);
            assert.deepEqual(st.decode(b), {});
        });
    });
    suite("replicate", function () {
        test("uint", function () {
            var src = lo.u32('hi'),
                dst = src.replicate('lo');
            assert(dst instanceof src.constructor);
            assert.equal(dst.span, src.span);
            assert.equal(dst.property, 'lo');
        });
        test("struct", function () {
            var src = new lo.Structure([lo.u8('a'), lo.s32('b')], 'hi'),
                dst = src.replicate('lo');
            assert(dst instanceof src.constructor);
            assert.equal(dst.span, src.span);
            assert.strictEqual(dst.fields, src.fields);
            assert.equal(dst.property, 'lo');
        });
        test("sequence", function () {
            var src = new lo.Sequence(lo.u16(), 20, 'hi');
                dst = src.replicate('lo');
            assert(dst instanceof src.constructor);
            assert.equal(dst.span, src.span);
            assert.equal(dst.count, src.count);
            assert.strictEqual(dst.elt_layout, src.elt_layout);
            assert.equal(dst.property, 'lo');
        });
        test("add", function () {
            var src = lo.u32(),
                dst = src.replicate('p');
            assert(dst instanceof src.constructor);
            assert.strictEqual(src.property, undefined);
            assert.equal(dst.property, 'p');
        });
        test("remove", function () {
            var src = lo.u32('p'),
                dst = src.replicate();
            assert(dst instanceof src.constructor);
            assert.equal(src.property, 'p');
            assert.strictEqual(dst.property, undefined);
        });
    });
    suite("VariantLayout", function () {
        test("invalid ctor", function () {
            var un = new lo.Union(lo.u8(), lo.u32());
            assert.throws(function () { new lo.VariantLayout(); }, TypeError);
            assert.throws(function () { new lo.VariantLayout("other"); }, TypeError);
            assert.throws(function () { new lo.VariantLayout(un); }, TypeError);
            assert.throws(function () { new lo.VariantLayout(un, 1.2); }, TypeError);
            assert.throws(function () { new lo.VariantLayout(un, "str"); }, TypeError);
            assert.throws(function () { new lo.VariantLayout(un, 1); }, TypeError);
            assert.throws(function () { new lo.VariantLayout(un, 1, "other"); }, TypeError);
            assert.throws(function () { new lo.VariantLayout(un, 1, lo.f64()); }, Error);
            assert.throws(function () { new lo.VariantLayout(un, 1, lo.f32()); }, TypeError);
        });
        test("ctor", function () {
            var un = new lo.Union(lo.u8(), lo.u32()),
                d = new lo.VariantLayout(un, 1, lo.f32(), 'd');
            assert(d instanceof lo.VariantLayout);
            assert(d instanceof lo.Layout);
            assert.strictEqual(d.union, un);
            assert.equal(d.span, 5);
            assert.equal(d.variant, 1);
            assert.equal(d.property, 'd');
        });
        test("span", function () {
            var un = new lo.Union(lo.u8(), lo.u32()),
                d = new lo.VariantLayout(un, 1, lo.cstr(), 's'),
                b = new Buffer(12);
            d.encode({s: 'hi!'}, b);
            assert.equal(un.getSpan(b), 5);
            assert.equal(Buffer('0168692100', 'hex').compare(b.slice(0, 5)), 0);
            // This one overruns the Buffer
            assert.throws(function () { d.encode({s:'far too long'}, b); }, RangeError);
            // This one fits in the buffer but overruns the union
            assert.throws(function () { d.encode({s:'too long'}, b); }, Error);
        });
    });
    suite("OffsetLayout", function () {
        test("ctor", function () {
            var u8 = lo.u8(),
                l0 = new lo.OffsetLayout(u8),
                nl = new lo.OffsetLayout(u8, -3, 'nl'),
                dl = new lo.OffsetLayout(lo.u8('ol'), 5),
                al = new lo.OffsetLayout(u8, 21);
            assert.strictEqual(l0.layout, u8);
            assert.equal(l0.offset, 0);
            assert.strictEqual(l0.property, undefined);
            assert.strictEqual(nl.layout, u8);
            assert.equal(nl.offset, -3);
            assert.equal(nl.property, 'nl');
            assert.equal(dl.offset, 5);
            assert.equal(dl.property, 'ol');
            assert.strictEqual(al.layout, u8);
            assert.equal(al.offset, 21);
            assert.strictEqual(al.property, undefined);
        });
        test("codec", function () {
            var u8 = lo.u8(),
                bl = lo.offset(u8, -1, 'bl'),
                al = lo.offset(u8, 1, 'al'),
                b = Buffer("0001020304050607", 'hex');
            assert.equal(u8.decode(b), 0);
            assert.equal(al.decode(b), 1);
            assert.throws(function () { bl.decode(b); }, RangeError);
            assert.equal(u8.decode(b, 4), 4);
            assert.equal(al.decode(b, 4), 5);
            assert.equal(bl.decode(b, 4), 3);
            u8.encode(0x80, b);
            al.encode(0x91, b);
            assert.throws(function () { bl.encode(0x70, b); }, RangeError);
            u8.encode(0x84, b, 4);
            al.encode(0x94, b, 4);
            bl.encode(0x74, b, 4);
            assert.equal(Buffer('8091027484940607', 'hex').compare(b), 0);
        });
        test("invalid ctor", function () {
            assert.throws(function () { new lo.OffsetLayout('hi'); }, TypeError);
            assert.throws(function () { new lo.OffsetLayout(lo.u8(), 'hi'); }, TypeError);
        });
    });
    suite("UnionDiscriminator", function () {
        test("abstract", function () {
            var ud = new lo.UnionDiscriminator('p');
            assert.equal(ud.property, 'p');
            assert.throws(function () { ud.decode(Buffer('00', 'hex')); }, Error);
            assert.throws(function () { ud.encode(0, new Buffer(1)); }, Error);
        });
    });
    suite("UnionLayoutDiscriminator", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.UnionLayoutDiscriminator('hi'); }, TypeError);
            assert.throws(function () { new lo.UnionLayoutDiscriminator(lo.f32()); }, TypeError);
            assert.throws(function () { new lo.UnionLayoutDiscriminator(lo.u8(), 'hi'); }, TypeError);
        });
    });
    suite("Union", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Union(); }, TypeError);
            assert.throws(function () { new lo.Union("other"); }, TypeError);
            assert.throws(function () { new lo.Union(lo.f32()); }, TypeError);
            assert.throws(function () { new lo.Union(lo.u8(), "other"); }, TypeError);
            assert.throws(function () { new lo.Union(lo.u8(), lo.cstr()); }, Error);
        });
        test("basics", function () {
            var dlo = lo.u8(),
                vlo = new lo.Sequence(lo.u8(), 8),
                un = new lo.Union(dlo, vlo),
                clo = un.default_layout,
                b = new Buffer(9);
            assert(un instanceof lo.Union);
            assert(un instanceof lo.Layout);
            assert.equal(un.span, 9);
            assert.equal(un.getSpan(), un.span);
            assert(un.usesPrefixDiscriminator);
            assert(un.discriminator instanceof lo.UnionLayoutDiscriminator);
            assert.notStrictEqual(clo, vlo);
            assert(clo instanceof vlo.constructor);
            assert.equal(clo.count, vlo.count);
            assert.strictEqual(clo.elt_layout, vlo.elt_layout);
            assert.equal(un.discriminator.property, 'variant');
            assert.equal(un.default_layout.property, 'content');
            assert.equal(dlo.span + vlo.span, un.span);
            assert.strictEqual(un.property, undefined);
            b.fill(0);
            var o = un.decode(b);
            assert.equal(o.variant, 0);
            assert.deepEqual(o.content, [0,0,0,0, 0,0,0,0]);
            o.variant = 5;
            o.content[3] = 3;
            o.content[7] = 7;
            un.encode(o, b);
            assert.equal(Buffer('050000000300000007', 'hex').compare(b), 0);
        });
        test("variants", function () {
            var dlo = lo.u8('v'),
                vlo = new lo.Sequence(lo.u8(), 4, 'c'),
                un = new lo.Union(dlo, vlo),
                b = new Buffer(5);
            assert.strictEqual(un.getVariant(1), undefined);
            b.fill(0);
            assert.deepEqual(un.decode(b), {v: 0, c:[0,0,0,0]});
            var lo1 = lo.u32(),
                v1 = un.addVariant(1, lo1, 'v1');
            assert(v1 instanceof lo.VariantLayout);
            assert.equal(v1.variant, 1);
            assert.strictEqual(v1.layout, lo1);
            b.fill(1);
            assert.strictEqual(un.getVariant(b), v1);
            assert.deepEqual(v1.decode(b), { v1: 0x01010101 });
            assert.deepEqual(un.decode(b), { v1: 0x01010101 });
            var lo2 = lo.f32(),
                v2 = un.addVariant(2, lo2, 'v2');
            un.discriminator.encode(v2.variant, b);
            assert.strictEqual(un.getVariant(b), v2);
            assert.deepEqual(v2.decode(b), { v2: 2.3694278276172396e-38 });
            assert.deepEqual(un.decode(b), { v2: 2.3694278276172396e-38 });
            var lo3 = new lo.Structure([lo.u8('a'), lo.u8('b'), lo.u16('c')]),
                v3 = un.addVariant(3, lo3, 'v3');
            un.discriminator.encode(v3.variant, b);
            assert.strictEqual(un.getVariant(b), v3);
            assert.deepEqual(v3.decode(b), {v3: {a:1, b:1, c:257}});
            assert.deepEqual(un.decode(b), {v3: {a:1, b:1, c:257}});
            un.discriminator.encode(v2.variant, b);
            assert.equal(Buffer('0201010101', 'hex').compare(b), 0);
            var obj = { v3: {a:5, b:6, c:1540}};
            v3.encode(obj, b);
            assert.deepEqual(un.decode(b), obj);
            assert.equal(Buffer('0305060406', 'hex').compare(b), 0);
            assert.throws(function () { v2.encode(obj, b); }, TypeError);
            assert.throws(function () { v2.decode(b); }, Error);
        });
        test("custom default", function () {
            var dlo = lo.u8('number'),
                vlo = new lo.Sequence(lo.u8(), 8, 'payload'),
                un = new lo.Union(dlo, vlo);
            assert(un instanceof lo.Union);
            assert(un instanceof lo.Layout);
            assert(un.usesPrefixDiscriminator);
            assert(un.discriminator instanceof lo.UnionLayoutDiscriminator);
            assert.equal(un.discriminator.property, dlo.property);
            assert.equal(un.discriminator.layout.offset, 0);
            assert.strictEqual(un.default_layout, vlo);
            assert.equal(un.discriminator.property, 'number');
            assert.equal(un.default_layout.property, 'payload');
        });
        test("inStruct", function () {
            var dlo = lo.u8('uid'),
                vlo = new lo.Sequence(lo.u8(), 3, 'payload'),
                un = new lo.Union(dlo, vlo, 'u'),
                st = new lo.Structure([lo.u16('u16'),
                                       un,
                                       lo.s16('s16')]),
                b = Buffer("0001020304050607", 'hex'),
                obj = st.decode(b);
            assert.equal(obj.u16, 0x0100);
            assert.equal(obj.u.uid, 2);
            assert.deepEqual(obj.u.payload, [3,4,5]);
            assert.equal(obj.s16, 1798);
            obj.u16 = 0x5432;
            obj.s16 = -3;
            obj.u.payload[1] = 23;
            var b2 = new Buffer(st.span);
            st.encode(obj, b2);
            assert.equal(Buffer('325402031705fdff', 'hex').compare(b2), 0);
        });
        test("issue#6", function () {
            var dlo = lo.u8('number'),
                vlo = new lo.Sequence(lo.u8(), 8, 'payload'),
                un = new lo.Union(dlo, vlo),
                b = Buffer("000102030405060708", 'hex'),
                obj = un.decode(b);
            assert.equal(obj.number, 0);
            assert.deepEqual(obj.payload, [1,2,3,4,5,6,7,8]);
            var b2 = new Buffer(un.span);
            un.encode(obj, b2);
            assert.equal(b2.toString('hex'), b.toString('hex'));
            var obj2 = { 'variant': obj.number,
                         'content': obj.payload };
            assert.throws(function () { un.encode(obj2, b2); });
        });
        test("issue#7.internal.anon", function () {
            var dlo = lo.u8(),
                plo = new lo.Sequence(lo.u8(), 8, 'payload'),
                vlo = new lo.Structure([plo, dlo]),
                un = new lo.Union(lo.offset(dlo, plo.span), vlo),
                clo = un.default_layout,
                b = Buffer("000102030405060708", 'hex'),
                obj = un.decode(b);
            assert(! un.usesPrefixDiscriminator);
            assert(un.discriminator instanceof lo.UnionLayoutDiscriminator);
            assert.equal(un.discriminator.property, 'variant');
            assert.equal(un.default_layout.property, 'content');
            assert.notStrictEqual(clo, vlo);
            assert(clo instanceof vlo.constructor);
            assert.strictEqual(clo.fields, vlo.fields);
            assert.deepEqual(obj.content, {payload: [0,1,2,3,4,5,6,7]});
            assert.equal(obj.variant, 8);
        });
        test("issue#7.internal.named", function () {
            var dlo = lo.u8(),
                plo = new lo.Sequence(lo.u8(), 8, 'payload'),
                vlo = new lo.Structure([plo, dlo]),
                ud = new lo.UnionLayoutDiscriminator(lo.offset(dlo, plo.span), 'tag'),
                un = new lo.Union(ud, vlo),
                clo = un.default_layout,
                b = Buffer("000102030405060708", 'hex'),
                obj = un.decode(b);
            assert(! un.usesPrefixDiscriminator);
            assert(un.discriminator instanceof lo.UnionLayoutDiscriminator);
            assert.equal(un.discriminator.property, 'tag');
            assert.equal(clo.property, 'content');
            assert.notStrictEqual(clo, vlo);
            assert(clo instanceof vlo.constructor);
            assert.strictEqual(clo.fields, vlo.fields);
            assert.deepEqual(obj.content, {payload: [0,1,2,3,4,5,6,7]});
            assert.equal(obj.tag, 8);
        });
        test("issue#7.internal.named2", function () {
            var dlo = lo.u8('vid'),
                plo = new lo.Sequence(lo.u8(), 8, 'payload'),
                vlo = new lo.Structure([plo, dlo]),
                un = new lo.Union(lo.offset(dlo, plo.span), vlo),
                clo = un.default_layout,
                b = Buffer("000102030405060708", 'hex'),
                obj = un.decode(b);
            assert(! un.usesPrefixDiscriminator);
            assert(un.discriminator instanceof lo.UnionLayoutDiscriminator);
            assert.equal(un.discriminator.property, 'vid');
            assert.equal(clo.property, 'content');
            assert.notStrictEqual(clo, vlo);
            assert(clo instanceof vlo.constructor);
            assert.strictEqual(clo.fields, vlo.fields);
            assert.deepEqual(obj.content, {payload: [0,1,2,3,4,5,6,7], vid:8});
            assert.equal(obj.vid, 8);
        });
        test("issue#7.external", function () {
            var dlo = lo.u8('vid'),
                ud = new lo.UnionLayoutDiscriminator(lo.offset(dlo, -3), 'uid'),
                un = new lo.Union(ud, lo.u32('u32'), 'u'),
                st = new lo.Structure([dlo, lo.u16('u16'), un, lo.s16('s16')]);
            assert.equal(un.span, 4);
            assert.equal(st.span, 9);
            var b = Buffer("000102030405060708", 'hex'),
                obj = st.decode(b);
            assert.equal(obj.vid, 0);
            assert.equal(obj.u16, 0x201);
            assert.equal(obj.s16, 0x807);
            assert.equal(obj.u.uid, 0);
            assert.equal(obj.u.u32, 0x06050403);
            var b2 = new Buffer(st.span);
            st.encode(obj, b2);
            assert.equal(b2.compare(b), 0);

            un.addVariant(0, lo.u32(), 'v0');
            obj = st.decode(b);
            assert.equal(obj.vid, 0);
            assert.equal(obj.u16, 0x201);
            assert.equal(obj.s16, 0x807);
            assert.equal(obj.u.v0, 0x06050403);

            var flo = lo.f32('f32'),
                vf = un.addVariant(1, flo, 'vf'),
                fb = Buffer("01234500805a429876", 'hex'),
                fobj = st.decode(fb);
            assert.equal(fobj.vid, 1);
            assert.equal(fobj.u16, 0x4523);
            assert.equal(fobj.s16, 0x7698);
            assert.equal(fobj.u.vf, 54.625);
        });
        test("from src", function () {
            var un = new lo.Union(lo.u8('v'), lo.u32('u32')),
                v1 = un.addVariant(1, lo.f32(), 'f32'),
                v2 = un.addVariant(2, lo.seq(lo.u8(), 4), 'u8.4'),
                v3 = un.addVariant(3, lo.cstr(), 'str'),
                b = new Buffer(un.span);

            assert.equal(un.span, 5);

            var src = {v:5, u32:0x12345678},
                vlo = un.getSourceVariant(src);
            assert.strictEqual(vlo, undefined);
            un.encode(src, b);
            assert.equal(Buffer('0578563412', 'hex').compare(b), 0);

            src = {f32:26.5};
            vlo = un.getSourceVariant(src);
            assert.strictEqual(vlo, v1);
            vlo.encode(src, b);
            assert.equal(Buffer('010000d441', 'hex').compare(b), 0);
            un.encode(src, b);
            assert.equal(Buffer('010000d441', 'hex').compare(b), 0);

            src = {"u8.4":[1,2,3,4]};
            vlo = un.getSourceVariant(src);
            assert.strictEqual(vlo, v2);
            vlo.encode(src, b);
            assert.equal(Buffer('0201020304', 'hex').compare(b), 0);
            un.encode(src, b);
            assert.equal(Buffer('0201020304', 'hex').compare(b), 0);

            assert.throws(function () { un.getSourceVariant({other:3}); }, Error);
            src = { str: 'hi' };
            vlo = un.getSourceVariant(src);
            assert.strictEqual(vlo, v3);
            b.fill(0xFF);
            vlo.encode(src, b);
            assert.equal(Buffer('03686900FF', 'hex').compare(b.slice(0, 5+2)), 0);
            assert(0 > vlo.layout.span);
            assert.equal(vlo.span, un.span);
            assert.equal(vlo.layout.getSpan(b, 1), 3);
            assert.equal(vlo.getSpan(b), un.span);
        });
        test("customize src", function () {
            var un = lo.union(lo.u8('v'), lo.u32('u32')),
                csrc;
            un.configGetSourceVariant(function (src) {
                csrc = src;
                return this.defaultGetSourceVariant(src);
            });
            var src = {v:3, u32:29},
                vlo = un.getSourceVariant(src);
            assert.strictEqual(src, csrc);
            assert.strictEqual(vlo, undefined);
        });
        test("variable span", function () {
            var un = lo.union(lo.u8('v')),
                v1 = un.addVariant(1, lo.u32(), 'u32'),
                v2 = un.addVariant(2, lo.f64(), 'f64'),
                v3 = un.addVariant(3, lo.cstr(), 'str'),
                b = new Buffer(16);
            assert(un.span < 0);

            b.fill(0xFF);
            assert.throws(function () { un.decode(b); }, Error);
            var obj = {u32: 0x12345678};
            un.encode(obj, b);
            assert.equal(v1.getSpan(b), 5);
            assert.equal(un.getSpan(b), 5);
            assert.equal(Buffer('0178563412ffff', 'hex').compare(b.slice(0, 5+2)), 0);
            assert.deepEqual(un.decode(b), obj);

            b.fill(0xFF);
            obj = { f64: 1234.5 };
            un.encode(obj, b);
            assert.equal(v2.getSpan(b), 9);
            assert.equal(un.getSpan(b), 9);
            assert.equal(Buffer('0200000000004a9340ffff', 'hex').compare(b.slice(0, 9+2)), 0);
            assert.deepEqual(un.decode(b), obj);

            b.fill(0xFF);
            obj = { str: 'hi!' };
            un.encode(obj, b);
            assert.equal(v3.getSpan(b), 5);
            assert.equal(un.getSpan(b), 5);
            assert.equal(Buffer('0368692100ffff', 'hex').compare(b.slice(0, 5+2)), 0);
            assert.deepEqual(un.decode(b), obj);

            b[0] = 5;
            assert.throws(function () { un.getSpan(b); }, Error);
        });
    });
    test("fromArray", function () {
        assert.strictEqual(lo.u8().fromArray([1]), undefined);
        var st = new lo.Structure([lo.u8('a'), lo.u8('b'), lo.u16('c')]);
        assert.deepEqual(st.fromArray([1,2,3]), {a:1, b:2, c:3});
        assert.deepEqual(st.fromArray([1,2]), {a:1, b:2});
        var un = new lo.Union(lo.u8('v'), lo.u32('c'));
        assert.strictEqual(un.fromArray([1,2,3]), undefined);
        var v1 = un.addVariant(1, st, 'v1'),
            v2 = un.addVariant(2, lo.f32(), 'v2');
        assert(v1 instanceof lo.VariantLayout);
        assert.deepEqual(un.getVariant(1).fromArray([1,2,3]), {a:1, b:2, c:3});
        assert.strictEqual(un.getVariant(2).fromArray([1,2,3]), undefined);
    });
    suite("BitStructure", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.BitStructure(); }, TypeError);
            assert.throws(function () { new lo.BitStructure(lo.f32()); }, TypeError);
            assert.throws(function () { new lo.BitStructure(lo.s32()); }, TypeError);
            assert.throws(function () { new lo.BitStructure(lo.u40()); }, Error);

            var bs = new lo.BitStructure(lo.u32());
            assert.throws(function () { new lo.BitField(lo.u32(), 8); }, TypeError);
            assert.throws(function () { new lo.BitField(bs, 'hi'); }, TypeError);
            assert.throws(function () { new lo.BitField(bs, 0); }, TypeError);
            assert.throws(function () { new lo.BitField(bs, 40); }, Error);
        });
        test("invalid add", function () {
            assert.throws(function () {
                var bs = lo.bits(lo.u32()),
                    bf1 = bs.addField(30),
                    bf2 = bs.addField(3);
            }, Error);
            assert.throws(function () {
                var bs = lo.bits(lo.u8()),
                    bf1 = addField(2),
                    bf2 = addField(7);
            }, Error);
            assert.throws(function () {
                var bs = lo.bits(lo.u8()),
                    bf1 = addField(0);
            }, Error);
            assert.throws(function () {
                var bs = lo.bits(lo.u8()),
                    bf1 = addField(6),
                    bf2 = addField(-2);
            }, Error);
        });
        test("size", function () {
            var bs = new lo.BitStructure(lo.u16()),
                bf10 = bs.addField(10, 'ten'),
                bf6 = bs.addField(6, 'six'),
                b = new Buffer(bs.span);
            assert.equal((1 << 10) - 1, 1023);
            assert.equal((1 << 6) - 1, 63);
            var obj = bs.decode(Buffer('ffff', 'hex'));
            assert.equal(obj.ten, (1 << 10) - 1);
            assert.equal(obj.six, (1 << 6) - 1);
            bs.encode(obj, b);
            assert.equal(Buffer('ffff', 'hex').compare(b), 0);
            b.fill(0);
            assert.equal(Buffer('0000', 'hex').compare(b), 0);
            bf10.encode((1 << 10) - 1);
            bf6.encode((1 << 6) - 1);
            assert.equal(bs._packedGetValue(), 0xFFFF);
            assert.throws(function () { bf6.encode('hi', b); }, Error);
            assert.throws(function () { bf6.encode(1 << 6, b); }, Error);
        });
        test("basic LSB", function () {
            var pbl = lo.u32(),
                bs = new lo.BitStructure(pbl);
            assert(bs instanceof lo.Layout);
            assert.strictEqual(bs.word, pbl);
            assert(! bs.msb);
            assert(bs.fields instanceof Array);
            assert.equal(bs.fields.length, 0);

            var bf1 = bs.addField(1, 'a'),
                bf2 = bs.addField(2, 'b');
            assert.equal(bs.fields.length, 2);

            assert(bf1 instanceof lo.BitField);
            assert(! (bf1 instanceof lo.Layout));
            assert.strictEqual(bf1.container, bs);
            assert.equal(bf1.bits, 1);
            assert.equal(bf1.start, 0);
            assert.equal(bf1.value_mask, 0x01);
            assert.equal(bf1.word_mask, 0x01);

            assert(bf2 instanceof lo.BitField);
            assert(! (bf2 instanceof lo.Layout));
            assert.strictEqual(bf2.container, bs);
            assert.equal(bf2.bits, 2);
            assert.equal(bf2.start, 1);
            assert.equal(bf2.value_mask, 0x03);
            assert.equal(bf2.word_mask, 0x06);

            assert.throws(function () { bs.addField(30); });
            bs.addField(29, 'x');
            var bf3 = bs.fields[2];
            assert.equal(bf3.bits, 29);
            assert.equal(bf3.start, 3);
            assert.equal(bf3.word_mask, 0xFFFFFFF8);
        });
        test("basic MSB", function () {
            var pbl = lo.u32(),
                bs = new lo.BitStructure(pbl, true);
            assert(bs instanceof lo.Layout);
            assert.strictEqual(bs.word, pbl);
            assert(bs.msb);
            assert(bs.fields instanceof Array);
            assert.equal(bs.fields.length, 0);

            var bf1 = bs.addField(1, 'a'),
                bf2 = bs.addField(2, 'b');
            assert.equal(bs.fields.length, 2);

            assert(bf1 instanceof lo.BitField);
            assert(! (bf1 instanceof lo.Layout));
            assert.strictEqual(bf1.container, bs);
            assert.equal(bf1.property, 'a');
            assert.equal(bf1.bits, 1);
            assert.equal(bf1.start, 31);
            assert.equal(bf1.value_mask, 0x01);
            assert.equal(bf1.word_mask, 0x80000000);

            assert(bf2 instanceof lo.BitField);
            assert(! (bf2 instanceof lo.Layout));
            assert.strictEqual(bf2.container, bs);
            assert.equal(bf2.property, 'b');
            assert.equal(bf2.bits, 2);
            assert.equal(bf2.start, 29);
            assert.equal(bf2.value_mask, 0x3);
            assert.equal(bf2.word_mask, 0x60000000);

            assert.throws(function () { bs.addField(30); });
            bs.addField(29, 'x');
            var bf3 = bs.fields[2];
            assert.equal(bf3.bits, 29);
            assert.equal(bf3.start, 0);
            assert.equal(bf3.word_mask, 0x1FFFFFFF);
        });
        test("lsb 32-bit field", function () {
            var bs = new lo.BitStructure(lo.u32()),
                bf = bs.addField(32, 'x');
            assert.equal(bf.bits, 32);
            assert.equal(bf.start, 0);
            assert.equal(bf.value_mask, 0xFFFFFFFF);
            assert.equal(bf.word_mask, 0xFFFFFFFF);
        });
        test("msb 32-bit field", function () {
            var bs = new lo.BitStructure(lo.u32(), true),
                bf = bs.addField(32, 'x');
            assert.equal(bf.bits, 32);
            assert.equal(bf.start, 0);
            assert.equal(bf.value_mask, 0xFFFFFFFF);
            assert.equal(bf.word_mask, 0xFFFFFFFF);
        });
        test("lsb coding", function () {
            var bs = new lo.BitStructure(lo.u32()),
                b = new Buffer(bs.span);
            bs.addField(1, 'a1');
            bs.addField(4, 'b4');
            bs.addField(11, 'c11');
            bs.addField(16, 'd16');
            b.fill(0);
            assert.deepEqual(bs.decode(b), {a1:0, b4:0, c11:0, d16:0});
            b.fill(0xFF);
            assert.deepEqual(bs.decode(b), {a1:1, b4:0x0F, c11:0x7FF, d16:0xFFFF});
            bs.encode({a1:0, b4:9, c11:0x4F1, d16:0x8a51}, b);
            assert.deepEqual(bs.decode(b), {a1:0, b4:9, c11:0x4F1, d16:0x8a51});
            assert.equal(Buffer('329e518a', 'hex').compare(b), 0);
        });
        test("msb coding", function () {
            var bs = new lo.BitStructure(lo.u32(), true),
                b = new Buffer(bs.span);
            bs.addField(1, 'a1');
            bs.addField(4, 'b4');
            bs.addField(11, 'c11');
            bs.addField(16, 'd16');
            b.fill(0);
            assert.deepEqual(bs.decode(b), {a1:0, b4:0, c11:0, d16:0});
            b.fill(0xFF);
            assert.deepEqual(bs.decode(b), {a1:1, b4:0x0F, c11:0x7FF, d16:0xFFFF});
            bs.encode({a1:0, b4:9, c11:0x4F1, d16:0x8a51}, b);
            assert.deepEqual(bs.decode(b), {a1:0, b4:9, c11:0x4F1, d16:0x8a51});
            assert.equal(Buffer('518af14c', 'hex').compare(b), 0);
        });
        test("gap coding", function () {
            var lsb = new lo.BitStructure(lo.u24()),
                msb = new lo.BitStructure(lo.u24(), true),
                b = new Buffer(lsb.span);
            lsb.addField(7, 'a5');
            lsb.addField(8);
            lsb.addField(9, 'b6');
            msb.addField(7, 'a5');
            msb.addField(8);
            msb.addField(9, 'b6');
            b.fill(0xA5);
            var lb = lsb.decode(b),
                mb = msb.decode(b);
            assert.deepEqual(lb, { a5: 0x25, b6: 0x14b });
            assert.deepEqual(mb, { a5: 0x52, b6: 0x1a5 });
            b.fill(0x69);
            lsb.encode(lb, b);
            assert.equal(Buffer('25e9a5', 'hex').compare(b), 0);
            b.fill(0x69);
            msb.encode(mb, b);
            assert.equal(Buffer('a569a5', 'hex').compare(b), 0);
        });
    });
    suite("Blob", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Blob(); }, TypeError);
            assert.throws(function () { new lo.Blob(lo.u8()); }, TypeError);
            assert.throws(function () { new lo.Blob(lo.offset(lo.f32())); }, TypeError);
        });
        test("ctor", function () {
            var bl = new lo.Blob(3, 'bl');
            assert(bl instanceof lo.Blob);
            assert(bl instanceof lo.Layout);
            assert.equal(bl.span, 3);
            assert.equal(bl.property, 'bl');
        });
        test("basics", function () {
            var bl = new lo.Blob(3, 'bl'),
                b = Buffer("0102030405", 'hex'),
                bv = bl.decode(b);
            assert(bv instanceof Buffer);
            assert.equal(bv.length, bl.span);
            assert.equal(Buffer("010203", 'hex').compare(bv), 0);
            bv = bl.decode(b, 2);
            assert.equal(Buffer("030405", 'hex').compare(bv), 0);
            bl.encode(Buffer("112233", 'hex'), b, 1);
            assert.equal(Buffer("0111223305", 'hex').compare(b), 0);
            assert.throws(function () { bl.encode('ABC', b); }, Error);
            assert.throws(function () { bl.encode(Buffer('0102', 'hex'), b); }, Error);
        });
        test("var length", function () {
            var llo = lo.u8('l'),
                blo = lo.blob(lo.offset(llo, -1), 'b'),
                st = lo.struct([llo, blo]),
                b = new Buffer(10);
            assert(0 > st.span);

            assert.strictEqual(blo.length.layout, llo);
            st.encode({b: Buffer('03040506', 'hex')}, b);
            var span = st.getSpan(b);
            assert.equal(span, 5);
            assert.equal(Buffer('0403040506', 'hex').compare(b.slice(0, span)), 0);
            var obj = st.decode(b);
            assert.equal(obj.l, 4);
            assert.equal(obj.b.toString('hex'), '03040506');
            assert.throws(function () { st.encode({b: new Buffer(b.length)}, b, 1); }, RangeError);
        });
    });
    suite("issue#8", function () {
        test("named", function () {
            var ver = lo.u8('ver'),
                hdr = new lo.Structure([lo.u8('id'),
                                        lo.u8('ver')], 'hdr'),
                pld = new lo.Union(lo.offset(ver, -ver.span), new lo.Blob(8, 'blob'), 'u'),
                pkt = new lo.Structure([hdr, pld], 's'),
                exp_blob = Buffer('1011121314151617', 'hex'),
                b = Buffer('01021011121314151617', 'hex');
            assert.deepEqual(hdr.decode(b), {id:1, ver:2});
            var du = pld.decode(b, 2);
            assert.equal(du.ver, 2);
            assert.equal(exp_blob.compare(du.blob), 0);
            var dp = pkt.decode(b);
            assert.deepEqual(dp.hdr, {id: 1, ver: 2});
            assert.equal(dp.u.ver, 2);
            assert.equal(exp_blob.compare(dp.u.blob), 0);

            var v3 = pld.addVariant(2, new lo.Sequence(lo.u32(), 2, 'u32'), 'v3');
            assert.deepEqual(pld.decode(b, 2), { v3: [0x13121110, 0x17161514] });

            dp = pkt.decode(b);
            assert.deepEqual(dp, {hdr:{id:1, ver:2}, u: { v3: [0x13121110, 0x17161514]}});
        });
        test("anon", function () {
            var ver = lo.u8('ver'),
                hdr = new lo.Structure([lo.u8('id'),
                                        lo.u8('ver')]),
                pld = new lo.Union(lo.offset(ver, -ver.span), new lo.Blob(8, 'blob')),
                pkt = new lo.Structure([hdr, pld]),
                exp_blob = Buffer('1011121314151617', 'hex'),
                b = Buffer('01021011121314151617', 'hex');
            assert.deepEqual(hdr.decode(b), {id:1, ver:2});
            var du = pld.decode(b, 2);
            assert.equal(du.ver, 2);
            assert.equal(exp_blob.compare(du.blob), 0);
            var dp = pkt.decode(b);
            /* This is what I want, but can't get. */
            //assert.equal(dp.id, 1);
            //assert.equal(dp.ver, 2);
            //assert.equal(exp_blob.compare(dp.blob), 0);

            var v3 = pld.addVariant(2, new lo.Sequence(lo.u32(), 2, 'u32'), 'v3');
            assert.deepEqual(pld.decode(b, 2), {v3: [0x13121110, 0x17161514]});

            dp = pkt.decode(b);
            /* Ditto on want */
            //assert.deepEqual(dp, {id:1, ver:2, u32: [0x13121110, 0x17161514]});
        });
    });
    suite("factories", function () {
        test("anon", function () {
            var ver = lo.u8('ver'),
                hdr = lo.struct([lo.u8('id'),
                                 lo.u8('ver')]),
                pld = lo.union(lo.offset(ver, -ver.span), lo.blob(8, 'blob')),
                pkt = lo.struct([hdr, pld]),
                exp_blob = Buffer('1011121314151617', 'hex'),
                b = Buffer('01021011121314151617', 'hex');
            assert(hdr instanceof lo.Structure);
            assert(pld instanceof lo.Union);
            assert(pld.default_layout instanceof lo.Blob);
            assert.equal(pld.default_layout.property, 'blob');
        });
    });
    suite("CString", function () {
        test("ctor", function () {
            var cst = lo.cstr();
            assert(0 > cst.span);
        });
        test("#getSpan", function () {
            var cst = new lo.CString();
            assert.throws(function () { cst.getSpan(); }, TypeError);
            assert.equal(cst.getSpan(Buffer('00', 'hex')), 1);
            assert.equal(cst.getSpan(Buffer('4100', 'hex')), 2);
            assert.equal(cst.getSpan(Buffer('4100', 'hex'), 1), 1);
            assert.equal(cst.getSpan(Buffer('4142', 'hex')), 3);
        });
        test("#decode", function () {
            var cst = new lo.CString();
            assert.equal(cst.decode(Buffer('00', 'hex')), '');
            assert.equal(cst.decode(Buffer('4100', 'hex')), 'A');
            assert.equal(cst.decode(Buffer('4100', 'hex'), 1), '');
            assert.equal(cst.decode(Buffer('4142', 'hex')), 'AB');
        });
        test("#encode", function () {
            var cst = new lo.CString(),
                b = new Buffer(4);
            b.fill(0xFF);
            assert.equal(Buffer('A', 'utf8').length, 1);
            cst.encode('', b);
            assert.equal(Buffer('00ffffff', 'hex').compare(b), 0);
            cst.encode('A', b);
            assert.equal(Buffer('4100ffff', 'hex').compare(b), 0);
            cst.encode('B', b, 1);
            assert.equal(Buffer('414200ff', 'hex').compare(b), 0);
            cst.encode(5, b);
            assert.equal(Buffer('350000ff', 'hex').compare(b), 0);
            assert.throws(function () { cst.encode('too long', b); }, RangeError);
        });
        test("in struct", function () {
            var st = lo.struct([lo.cstr('k'),
                                lo.cstr('v')]),
                b = Buffer('6100323300', 'hex');
            assert.throws(function () { st.getSpan(); }, RangeError);
            assert.equal(st.fields[0].getSpan(b), 2);
            assert.equal(st.fields[1].getSpan(b, 2), 3);
            assert.equal(st.getSpan(b), 5);
            assert.deepEqual(st.decode(b), {k: 'a', v: '23'});
            b.fill(0xff);
            st.encode({'k':'a', 'v': 23}, b);
        });
        test("in seq", function () {
            var seq = lo.seq(lo.cstr(), 3),
                b = Buffer('61006263003500', 'hex');
            assert.deepEqual(seq.decode(b), ['a', 'bc', '5']);
            seq.encode(['hi','u','c'], b);
            assert.equal(Buffer('68690075006300', 'hex').compare(b), 0);
        });
    });
    suite("Constant", function () {
        test("ctor", function () {
            var c = new lo.Constant('value', 'p');
            assert.equal(c.value, 'value');
            assert.equal(c.property, 'p');
            assert.equal(c.span, 0);
        });
        test("basics", function () {
            var b = Buffer('', 'hex');
            assert.strictEqual(lo.const(true).decode(b), true);
            assert.strictEqual(lo.const(undefined).decode(b), undefined);
            var obj = { a: 23 };
            assert.strictEqual(lo.const(obj).decode(b), obj);
            /* No return value to check, but this shouldn't throw an
             * exception (which it would if it tried to mutate the
             * zero-length buffer). */
            lo.const(32).encode(b);
            assert.equal(b.length, 0);
        });
    });
});
