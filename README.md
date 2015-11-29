# buffer-layout

[![NPM version](https://img.shields.io/npm/v/buffer-layout.svg)](https://www.npmjs.com/package/buffer-layout "View this project on NPM")
[![Build Status](https://travis-ci.org/pabigot/buffer-layout.svg?branch=master)](https://travis-ci.org/pabigot/buffer-layout "Check build status on TravisCI")
[![Coverage Status](https://coveralls.io/repos/pabigot/buffer-layout/badge.svg?branch=master&service=github)](https://coveralls.io/github/pabigot/buffer-layout?branch=master "Check coverage status on Coveralls")

buffer-layout is a utility module implemented in pure JavaScript that
supports translations between JavaScript values and Buffers.  It is made
available through [github](https://github.com/pabigot/buffer-layout) and
released under the MIT license.

Layout support is provided for these types of data:

* Signed and unsigned integral values from 1 to 6 bytes in length, in
  little-endian or big-endian format;
* Signed and unsigned 64-bit integral values decoded as integral
  Numbers;
* Float and double values (also little-endian or big-endian);
* Sequences of instances of an arbitrary layout;
* Structures with named fields containing arbitrary layouts;
* Unions of variant layouts where the type of data is recorded in a
  prefix value, another layout element, or provided externally;
* Bit fields within 8, 16, 24, or 32-bit unsigned integers, numbering
  from the least or most significant bit;
* NUL-terminated C strings;
* Blobs of fixed or variable-length raw data.

## Installation

Development and testing is done using Node.js, supporting versions 0.12
and later.  Install with `npm install buffer-layout`.

## Examples

All examples are from the `test/examples.js` unit test and assume the
following context:

    var assert = require("assert"),
        lo = require("buffer-layout");

The examples give only a taste of what can be done.  Structures, unions,
and sequences can nest; [union
discriminators](http://pabigot.github.io/buffer-layout/module-Layout-UnionDiscriminator.html)
can be within the union or external to it; sequence and blob lengths may
be fixed or read from the buffer.

For full details see the [documentation](http://pabigot.github.io/buffer-layout/).

### Four-element array of 16-bit signed little-endian integers

The C definition:

    int16_t arr[4] = { 1, -1, 3, -3 };

The buffer-layout way:

    var ds = lo.seq(lo.s16(), 4),
        b = new Buffer(8);
    ds.encode([1, -1, 3, -3], b);
    assert.equal(Buffer('0100ffff0300fdff', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b), [1, -1, 3, -3]);

See [Int](http://pabigot.github.io/buffer-layout/module-Layout-Int.html)
and [Sequence](http://pabigot.github.io/buffer-layout/module-Layout-Sequence.html).

### A native C `struct` on a 32-bit little-endian machine

The C definition:

    struct ds {
      uint8_t v;
      uint32_t u32;
    } st;

The buffer-layout way:

    var ds = lo.struct([lo.u8('v'),
                        lo.seq(lo.u8(), 3), // alignment padding
                        lo.u32('u32')]),
        b = new Buffer(8);
    b.fill(0xbd);
    ds.encode({v:1, u32: 0x12345678}, b);
    assert.equal(Buffer('01bdbdbd78563412', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b), {v: 1, u32: 0x12345678});

Note that the C language requires padding which must be explicitly added
in the buffer-layout structure definition.  Since the padding is not
accessible, the corresponding layout has no
[property](http://pabigot.github.io/buffer-layout/module-Layout-Layout.html#property).

See [Structure](http://pabigot.github.io/buffer-layout/module-Layout-Structure.html).

### A packed C `struct` on a 32-bit little-endian machine

The C definition:

    struct ds {
      uint8_t v;
      uint32_t u32;
    } __attribute__((__packed__)) st;

The buffer-layout way:

    var ds = lo.struct([lo.u8('v'),
                        lo.u32('u32')]),
        b = new Buffer(5);
    b.fill(0xbd);
    ds.encode({v:1, u32: 0x12345678}, b);
    assert.equal(Buffer('0178563412', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b), {v: 1, u32: 0x12345678});

### A tagged union of 4-byte values

Assume a 5-byte packed structure where the interpretation of the last
four bytes depends on the first byte.  The C definition:

    struct {
      uint8_t t;
      union ds {
        uint8_t u8[4];  // default interpretation
        int16_t s16[2]; // when t is 'h'
        uint32_t u32;   // when t is 'w'
        float f32;      // when t is 'f'
      } u;
    } __attribute__((__packed__)) un;

The buffer-layout way:

    var t = lo.u8('t'),
        un = lo.union(t, lo.seq(lo.u8(), 4, 'u8')),
        u32 = un.addVariant('w'.charCodeAt(0), lo.u32(), 'u32'),
        s16 = un.addVariant('h'.charCodeAt(0), lo.seq(lo.s16(), 2), 's16'),
        f32 = un.addVariant('f'.charCodeAt(0), lo.f32(), 'f32'),
        b = new Buffer(un.span);
    assert.deepEqual(un.decode(Buffer('7778563412', 'hex')), { u32: 0x12345678 });
    assert.deepEqual(un.decode(Buffer('660000bd41', 'hex')), { f32: 23.625 });
    assert.deepEqual(un.decode(Buffer('a5a5a5a5a5', 'hex')), { t: 0xa5, u8:[ 0xa5, 0xa5, 0xa5, 0xa5 ]});
    s16.encode({s16:[123, -123]}, b);
    assert.equal(Buffer('687b0085ff', 'hex').compare(b), 0);

See [Union](http://pabigot.github.io/buffer-layout/module-Layout-Union.html).

#### Packed bit fields on a little-endian machine

The C definition:

    struct ds {
      unsigned int b00l03: 3;
      unsigned int b03l01: 1;
      unsigned int b04l18: 24;
      unsigned int b1Cl04: 4;
    } st;

The buffer-layout way:

    var ds = lo.bits(lo.u32()),
        b = new Buffer(4);
    ds.addField(3, 'b00l03');
    ds.addField(1, 'b03l01');
    ds.addField(24, 'b04l18');
    ds.addField(4, 'b1Cl04');
    b.fill(0xff);
    ds.encode({b00l03:3, b04l18:24, b1Cl04:4}, b);
    assert.equal(Buffer('8b010040', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b), {b00l03:3, b03l01:1, b04l18:24, b1Cl04:4});

See [BitStructure](http://pabigot.github.io/buffer-layout/module-Layout-BitStructure.html).

### 64-bit values as Numbers

The C definition:

    uint64_t v = 0x0102030405060708ULL;

The buffer-layout way:

    var ds = lo.nu64be(),
        b = Buffer('0102030405060708', 'hex'),
        v = 72623859790382856,
        nv = v - 6;
    assert.equal(v, nv);
    assert.equal(ds.decode(b), nv);

Note that because the exact value is not less than 2^53 it cannot be
represented as a JavaScript Number, and is instead approximated by a
nearby representable integer that is equivalent within Numbers.

See [NearUInt64](http://pabigot.github.io/buffer-layout/module-Layout-NearUInt64BE.html).

### A NUL-terminated C string

The C definition:

    const char str[] = "hi!";

The buffer-layout way:

    var ds = lo.cstr(),
        b = new Buffer(8);
    ds.encode('hi!', b);
    var slen = ds.getSpan(b);
    assert.equal(slen, 4);
    assert.equal(Buffer('68692100', 'hex').compare(b.slice(0, slen)), 0);
    assert.equal(ds.decode(b), 'hi!');

See [CString](http://pabigot.github.io/buffer-layout/module-Layout-CString.html).

### A fixed-length block of data offset within a buffer

The buffer-layout way:

    var ds = lo.blob(4),
        b = Buffer('0102030405060708', 'hex');
    assert.equal(Buffer('03040506', 'hex').compare(ds.decode(b, 2)), 0);

See [Blob](http://pabigot.github.io/buffer-layout/module-Layout-Blob.html).

### A variable-length array of pairs of C strings

The buffer-layout way:

    var pr = lo.seq(lo.cstr(), 2),
        n = lo.u8('n'),
        vla = lo.seq(pr, lo.offset(n, -1), 'a'),
        st = lo.struct([n, vla], 'st'),
        b = new Buffer(32),
        arr = [['k1', 'v1'], ['k2', 'v2'], ['k3', 'etc']];
    b.fill(0);
    st.encode({a: arr}, b);
    var span = st.getSpan(b);
    assert.equal(span, 20);
    assert.equal(Buffer('036b31007631006b32007632006b330065746300', 'hex').compare(b.slice(0, span)), 0);
    assert.deepEqual(st.decode(b), { n:3, a:arr});

See [OffsetLayout](http://pabigot.github.io/buffer-layout/module-Layout-OffsetLayout.html).

### Tagged values, or variable-length unions

Storing arbitrary data using a leading byte to identify the content then
a value that takes up only as much room as is necessary.

The example also shows how to extend the variant recognition API to
support abitrary constant without consuming space for them in the
encoded union.  This could be used to make something similar to
[BSON](http://bsonspec.org/spec.html).

Here's the code that defines the union, the variants, and the
recognition of `true` and `false` values for `b` as distinct variants:

    var un = lo.union(lo.u8('t')),
        u8 = un.addVariant('B'.charCodeAt(0), lo.u8(), 'u8'),
        s16 = un.addVariant('h'.charCodeAt(0), lo.s16(), 's16'),
        s48 = un.addVariant('Q'.charCodeAt(0), lo.s48(), 's48'),
        cstr = un.addVariant('s'.charCodeAt(0), lo.cstr(), 'str'),
        tr = un.addVariant('T'.charCodeAt(0), lo.const(true), 'b'),
        fa = un.addVariant('F'.charCodeAt(0), lo.const(false), 'b'),
        b = new Buffer(1+6);
    un.configGetSourceVariant(function (src) {
        if (src.hasOwnProperty('b')) {
            return src.b ? tr : fa;
        }
        return this.defaultGetSourceVariant(src);
    });

And here are examples of encoding, checking the encoded length, and
decoding each of the alternatives:

    b.fill(0xff);
    un.encode({u8: 1}, b);
    assert.equal(un.getSpan(b), 2);
    assert.equal(Buffer('4201ffffffffff', 'hex').compare(b), 0);
    assert.equal(un.decode(b).u8, 1);

    b.fill(0xff);
    un.encode({s16: -32000}, b);
    assert.equal(un.getSpan(b), 3);
    assert.equal(Buffer('680083ffffffff', 'hex').compare(b), 0);
    assert.equal(un.decode(b).s16, -32000);

    b.fill(0xff);
    var v48 = Math.pow(2, 47) - 1;
    un.encode({s48: v48}, b);
    assert.equal(un.getSpan(b), 7);
    assert.equal(Buffer('51ffffffffff7f', 'hex').compare(b), 0);
    assert.equal(un.decode(b).s48, v48);

    b.fill(0xff);
    un.encode({b: true}, b);
    assert.equal(un.getSpan(b), 1);
    assert.equal(Buffer('54ffffffffffff', 'hex').compare(b), 0);
    assert.strictEqual(un.decode(b).b, true);

    b.fill(0xff);
    un.encode({b: false}, b);
    assert.equal(un.getSpan(b), 1);
    assert.equal(Buffer('46ffffffffffff', 'hex').compare(b), 0);
    assert.strictEqual(un.decode(b).b, false);


**NOTE** This code tickles a long-standing [bug in
Buffer.writeInt{L,B}E](https://github.com/nodejs/node/pull/3994). `buffer-layout`
provides a [module that patches
`Buffer`](http://pabigot.github.io/buffer-layout/module-patchIssue3992.html)
to fix the bug if it detects that the running Node has the error.
