var assert = require("assert"),
    _ = require("lodash"),
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
    suite("Int", function () {
        test("s8", function () {
            var d = lo.s8('t'),
                b = new Buffer(1);
            assert(d instanceof lo.Int);
            assert(d instanceof lo.Layout);
            assert.equal(1, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(23, b);
            assert.equal(0, Buffer('17', 'hex').compare(b));
            assert.equal(23, d.decode(b));
            d.encode(-97, b);
            assert.equal(0, Buffer('9f', 'hex').compare(b));
            assert.equal(-97, d.decode(b));
        });
        test("s16", function () {
            var d = lo.s16('t'),
                b = new Buffer(2);
            assert(d instanceof lo.Int);
            assert(d instanceof lo.Layout);
            assert.equal(2, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x1234, b);
            assert.equal(0, Buffer('3412', 'hex').compare(b));
            assert.equal(0x1234, d.decode(b));
            assert.equal(0x3412, lo.u16be().decode(b));
            d.encode(-12345, b);
            assert.equal(0, Buffer('c7cf', 'hex').compare(b));
            assert.equal(-12345, d.decode(b));
            assert.equal(0xcfc7, lo.u16().decode(b));
            assert.equal(0xc7cf, lo.u16be().decode(b));
        });
        test("s48", function () {
            var d = lo.s48('t'),
                b = new Buffer(6);
            assert(d instanceof lo.Int);
            assert(d instanceof lo.Layout);
            assert.equal(6, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x123456789abc, b);
            assert.equal(0, Buffer('bc9a78563412', 'hex').compare(b));
            assert.equal(0x123456789abc, d.decode(b));
            assert.equal(0xbc9a78563412, lo.u48be().decode(b));
            d.encode(-123456789012345, b);
            assert.equal(0, Buffer('8720f279b78f', 'hex').compare(b));
            assert.equal(-123456789012345, d.decode(b));
            assert.equal(0x8fb779f22087, lo.u48().decode(b));
            assert.equal(0x8720f279b78f, lo.u48be().decode(b));
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
            assert.equal(2, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x1234, b);
            assert.equal(0, Buffer('1234', 'hex').compare(b));
            assert.equal(0x1234, d.decode(b));
            assert.equal(0x3412, lo.u16().decode(b));
            d.encode(-12345, b);
            assert.equal(0, Buffer('cfc7', 'hex').compare(b));
            assert.equal(-12345, d.decode(b));
            assert.equal(0xcfc7, lo.u16be().decode(b));
            assert.equal(0xc7cf, lo.u16().decode(b));
        });
        test("s48", function () {
            var d = lo.s48be('t'),
                b = new Buffer(6);
            assert(d instanceof lo.IntBE);
            assert(d instanceof lo.Layout);
            assert.equal(6, d.span);
            assert.equal('t', d.property);
            b.fill(0);
            assert.equal(0, d.decode(b));
            d.encode(0x123456789abc, b);
            assert.equal(0, Buffer('123456789abc', 'hex').compare(b));
            assert.equal(0x123456789abc, d.decode(b));
            assert.equal(0xbc9a78563412, lo.u48().decode(b));
            d.encode(-123456789012345, b);
            assert.equal(0, Buffer('8fb779f22087', 'hex').compare(b));
            assert.equal(-123456789012345, d.decode(b));
            assert.equal(0x8fb779f22087, lo.u48be().decode(b));
            assert.equal(0x8720f279b78f, lo.u48().decode(b));
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
    test("Double", function () {
        var be = lo.f64be('dee'),
            le = lo.f64('eed'),
            f = 123456789.125e+10,
            fe = 3.4283031083405533e-77,
            b = new Buffer(8);
        assert(be instanceof lo.DoubleBE);
        assert(be instanceof lo.Layout);
        assert.equal(8, be.span);
        assert.equal('dee', be.property);
        assert(le instanceof lo.Double);
        assert(le instanceof lo.Layout);
        assert.equal(8, le.span);
        assert.equal('eed', le.property);
        b.fill(0);
        assert.equal(0, be.decode(b));
        assert.equal(0, le.decode(b));
        le.encode(f, b);
        assert.equal(0, Buffer('300fc1f41022b143', 'hex').compare(b));
        assert.equal(f, le.decode(b));
        assert.equal(fe, be.decode(b));
        be.encode(f, b);
        assert.equal(0, Buffer('43b12210f4c10f30', 'hex').compare(b));
        assert.equal(f, be.decode(b));
        assert.equal(fe, le.decode(b));
    });
    suite("Sequence", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Sequence(); }, TypeError);
            assert.throws(function () { new lo.Sequence(lo.u8()); }, TypeError);
            assert.throws(function () { new lo.Sequence(lo.u8(), "5 is not an integer"); }, TypeError);
        });
        test("basics", function () {
            var seq = new lo.Sequence(lo.u8(), 4, 'id'),
                b = new Buffer(4);
            assert(seq instanceof lo.Sequence);
            assert(seq instanceof lo.Layout);
            assert(seq.elt_layout instanceof lo.UInt);
            assert.equal(4, seq.count);
            assert.equal(4, seq.span);
            assert.equal('id', seq.property);
            b.fill(0);
            assert(_.isEqual([0,0,0,0], seq.decode(b)));
            seq.encode([1,2,3,4], b);
            assert(_.isEqual([1,2,3,4], seq.decode(b)));
            seq.encode([5,6], b, 1);
            assert(_.isEqual([1,5,6,4], seq.decode(b)));
        });
        test("struct elts", function () {
            var st = new lo.Structure([lo.u8('u8'),
                                       lo.s32('s32')]),
                seq = new lo.Sequence(st, 3),
                tv = [{u8:1, s32:1e4}, {u8:0, s32:0}, {u8:3, s32:-324}],
                b = new Buffer(15);
            assert.equal(5, st.span);
            assert.equal(3, seq.count);
            assert.strictEqual(st, seq.elt_layout);
            assert.equal(15, seq.span);
            seq.encode(tv, b);
            assert.equal(0, Buffer('0110270000000000000003bcfeffff', 'hex').compare(b));
            assert(_.isEqual(tv, seq.decode(b)));
            seq.encode([{u8:2,s32:0x12345678}], b, st.span);
            assert.equal(0, Buffer('0110270000027856341203bcfeffff', 'hex').compare(b));
        });
    });
    suite("Structure", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Structure(); }, TypeError);
            assert.throws(function () { new lo.Structure("stuff"); }, TypeError);
            assert.throws(function () { new lo.Structure(["stuff"]); }, TypeError);
        });
        test("basics", function () {
            var st = new lo.Structure([lo.u8('u8'),
                                       lo.u16('u16'),
                                       lo.s16be('s16be')]),
                b = new Buffer(5);
            assert(st instanceof lo.Structure);
            assert(st instanceof lo.Layout);
            assert.equal(5, st.span);
            assert.strictEqual(undefined, st.property);
            b.fill(0);
            var obj = st.decode(b);
            assert(_.isEqual({u8:0, u16:0, s16be:0}, obj));
            obj = {u8:21, u16:0x1234, s16be:-5432};
            st.encode(obj, b);
            assert.equal(0, Buffer('153412eac8', 'hex').compare(b));
            assert(_.isEqual(obj, st.decode(b)));
        });
        test("padding", function () {
            var st = new lo.Structure([lo.u16('u16'),
                                       lo.u8(),
                                       lo.s16be('s16be')]),
                b = new Buffer(5);
            assert.equal(5, st.span);
            b.fill(0);
            var obj = st.decode(b);
            assert(_.isEqual({u16:0, s16be:0}, obj));
            b.fill(0xFF);
            obj = {u16:0x1234, s16be:-5432};
            st.encode(obj, b);
            assert.equal(0, Buffer('3412ffeac8', 'hex').compare(b));
            assert(_.isEqual(obj, st.decode(b)));
        });
        test("missing", function () {
            var st = new lo.Structure([lo.u16('u16'),
                                       lo.u8('u8'),
                                       lo.s16be('s16be')]),
                b = new Buffer(5);
            assert.equal(5, st.span);
            b.fill(0);
            var obj = st.decode(b);
            assert(_.isEqual({u16:0, u8:0, s16be:0}, obj));
            b.fill(0xFF);
            obj = {u16:0x1234, s16be:-5432};
            st.encode(obj, b);
            assert.equal(0, Buffer('341200eac8', 'hex').compare(b));
            assert(_.isEqual(_.extend(obj, {u8:0}), st.decode(b)));
        });
        test("update", function () {
            var st = new lo.Structure([lo.u8('u8'),
                                       lo.u16('u16'),
                                       lo.s16be('s16be')]),
                obj = {},
                b = Buffer('153412eac8', 'hex'),
                rc = st.decode(b, 0, obj);
            assert(_.isEqual({u8:21, u16:0x1234, s16be:-5432}, obj));
            assert.strictEqual(obj, rc);
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
            assert.equal(5, st.span);
            assert.equal('st', st.property);
            assert.equal(12, cst.span);
            cst.encode(obj, b);
            assert.equal(0, Buffer('785634121798ffcfc7c01dfe', 'hex').compare(b));
            assert(_.isEqual(obj, cst.decode(b)));
        });

    });
    suite("replicate", function () {
        test("uint", function () {
            var src = lo.u32('hi'),
                dst = src.replicate('lo');
            assert(dst instanceof src.constructor);
            assert.equal(src.span, dst.span);
            assert.equal('lo', dst.property);
        });
        test("struct", function () {
            var src = new lo.Structure([lo.u8('a'), lo.s32('b')], 'hi'),
                dst = src.replicate('lo');
            assert(dst instanceof src.constructor);
            assert.equal(src.span, dst.span);
            assert.strictEqual(src.fields, dst.fields);
            assert.equal('lo', dst.property);
        });
        test("sequence", function () {
            var src = new lo.Sequence(lo.u16(), 20, 'hi');
                dst = src.replicate('lo');
            assert(dst instanceof src.constructor);
            assert.equal(src.span, dst.span);
            assert.equal(src.count, dst.count);
            assert.strictEqual(src.elt_layout, dst.elt_layout);
            assert.equal('lo', dst.property);
        });
        test("add", function () {
            var src = lo.u32(),
                dst = src.replicate('p');
            assert(dst instanceof src.constructor);
            assert.strictEqual(undefined, src.property);
            assert.equal('p', dst.property);
        });
        test("remove", function () {
            var src = lo.u32('p'),
                dst = src.replicate();
            assert(dst instanceof src.constructor);
            assert.equal('p', src.property);
            assert.strictEqual(undefined, dst.property);
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
        });
        test("ctor", function () {
            var un = new lo.Union(lo.u8(), lo.u32()),
                d = new lo.VariantLayout(un, 1, lo.f32());
            assert(d instanceof lo.VariantLayout);
            assert(d instanceof lo.Layout);
            assert.strictEqual(un, d.union);
            assert.equal(5, d.span);
            assert.equal(1, d.variant);
            assert.strictEqual(undefined, d.property);
        });
    });
    suite("Union", function () {
        test("invalid ctor", function () {
            assert.throws(function () { new lo.Union(); }, TypeError);
            assert.throws(function () { new lo.Union("other"); }, TypeError);
            assert.throws(function () { new lo.Union(lo.f32()); }, TypeError);
            assert.throws(function () { new lo.Union(lo.u8()); }, TypeError);
            assert.throws(function () { new lo.Union(lo.u8(), "other"); }, TypeError);
        });
        test("basics", function () {
            var dlo = lo.u8(),
                vlo = new lo.Sequence(lo.u8(), 8),
                un = new lo.Union(dlo, vlo),
                b = new Buffer(9);
            assert(un instanceof lo.Union);
            assert(un instanceof lo.Layout);
            assert.strictEqual(dlo, un.discr_layout);
            assert.strictEqual(vlo, un.default_layout);
            assert(un.layout instanceof lo.Structure);
            assert.equal('variant', un.layout.fields[0].property);
            assert.equal('content', un.layout.fields[1].property);
            assert.equal(un.span, dlo.span + vlo.span);
            assert.strictEqual(undefined, un.property);
            b.fill(0);
            var o = un.decode(b);
            assert.equal(0, o.variant);
            assert(_.isEqual([0,0,0,0, 0,0,0,0], o.content));
            o.variant = 5;
            o.content[3] = 3;
            o.content[7] = 7;
            un.encode(o, b);
            assert.equal(0, Buffer('050000000300000007', 'hex').compare(b));
        });
        test("variants", function () {
            var dlo = lo.u8('v'),
                vlo = new lo.Sequence(lo.u8(), 4, 'c'),
                un = new lo.Union(dlo, vlo),
                b = new Buffer(5);
            assert.strictEqual(undefined, un.getVariant(1));
            b.fill(0);
            assert(_.isEqual({v: 0, c:[0,0,0,0]}, un.decode(b)));
            var obj = { destination: true },
                rv = un.decode(b, 0, obj);
            assert.strictEqual(rv, obj);
            assert(_.isEqual({v: 0, c:[0,0,0,0], destination:true}, obj));
            var lo1 = lo.u32(),
                v1 = un.addVariant(1, lo1);
            assert(v1 instanceof lo.VariantLayout);
            assert.equal(1, v1.variant);
            assert.strictEqual(lo1, v1.layout);
            b.fill(1);
            assert.strictEqual(v1, un.getVariant(b));
            assert.equal(0x01010101, v1.decode(b));
            assert.equal(0x01010101, un.decode(b));
            obj = { destination: true };
            rv = un.decode(b, 0, obj);
            assert.equal(0x01010101, rv);
            var lo2 = lo.f32(),
                v2 = un.addVariant(2, lo2);
            un.discr_layout.encode(v2.variant, b);
            assert.strictEqual(v2, un.getVariant(b));
            assert.equal(2.3694278276172396e-38, v2.decode(b));
            assert.equal(2.3694278276172396e-38, un.decode(b));
            var lo3 = new lo.Structure([lo.u8('a'), lo.u8('b'), lo.u16('c')]),
                v3 = un.addVariant(3, lo3);
            un.discr_layout.encode(v3.variant, b);
            assert.strictEqual(v3, un.getVariant(b));
            assert(_.isEqual({a:1, b:1, c:257}, v3.decode(b)));
            assert(_.isEqual({a:1, b:1, c:257}, un.decode(b)));
            obj = { destination: true };
            rv = un.decode(b, 0, obj);
            assert.strictEqual(rv, obj);
            assert(_.isEqual({a:1, b:1, c:257, destination:true}, rv));
        })
        test("custom default", function () {
            var dlo = lo.u8('number'),
                vlo = new lo.Sequence(lo.u8(), 8, 'payload'),
                un = new lo.Union(dlo, vlo);
            assert(un instanceof lo.Union);
            assert(un instanceof lo.Layout);
            assert.strictEqual(dlo, un.discr_layout);
            assert.strictEqual(vlo, un.default_layout);
            assert(un.layout instanceof lo.Structure);
            assert.equal('number', un.layout.fields[0].property);
            assert.equal('payload', un.layout.fields[1].property);
        });
    });
});
