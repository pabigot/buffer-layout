var assert = require('assert');
var lo = require('../lib/Layout');

suite('Examples', function() {
  test('4-elt array of int16_t le', function() {
    /*
int16_t arr[4] = { 1, -1, 3, -3 };
     */
    var ds = lo.seq(lo.s16(), 4);
    var b = new Buffer(8);
    assert.equal(ds.encode([1, -1, 3, -3], b), 4 * 2);
    assert.equal(Buffer('0100ffff0300fdff', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b), [1, -1, 3, -3]);
  });
  test('native C', function() {
    /*
struct ds {
  uint8_t v;
  uint32_t u32;
} st;
     */
    var ds = lo.struct([lo.u8('v'),
                        lo.seq(lo.u8(), 3), // alignment padding
                        lo.u32('u32')]);
    var b = new Buffer(8);
    b.fill(0xbd);
    assert.equal(ds.encode({v: 1, u32: 0x12345678}, b), 1 + 3 + 4);
    assert.equal(Buffer('01bdbdbd78563412', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b), {v: 1, u32: 0x12345678});
  });
  test('packed native C', function() {
    /*
struct ds {
  uint8_t v;
  uint32_t u32;
} __attribute__((__packed__)) st;
     */
    var ds = lo.struct([lo.u8('v'),
                        lo.u32('u32')]);
    var b = new Buffer(5);
    b.fill(0xbd);
    assert.equal(ds.encode({v: 1, u32: 0x12345678}, b), 1 + 4);
    assert.equal(Buffer('0178563412', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b), {v: 1, u32: 0x12345678});
  });
  test('tagged union of 4-byte values', function() {
    /*
struct {
  uint8_t t;
  union ds {
    uint8_t u8[4];  // default interpretation
    int16_t s16[2]; // when t is 'h'
    uint32_t u32;   // when t is 'w'
    float f32;      // when t is 'f'
  } u;
} __attribute__((__packed__)) un;
     */
    var t = lo.u8('t');
    var un = lo.union(t, lo.seq(lo.u8(), 4, 'u8'));
    var u32 = un.addVariant('w'.charCodeAt(0), lo.u32(), 'u32');
    var s16 = un.addVariant('h'.charCodeAt(0), lo.seq(lo.s16(), 2), 's16');
    var f32 = un.addVariant('f'.charCodeAt(0), lo.f32(), 'f32');
    var b = new Buffer(un.span);
    assert.deepEqual(un.decode(Buffer('7778563412', 'hex')),
                     {u32: 0x12345678});
    assert.deepEqual(un.decode(Buffer('660000bd41', 'hex')),
                     {f32: 23.625});
    assert.deepEqual(un.decode(Buffer('a5a5a5a5a5', 'hex')),
                     {t: 0xa5, u8: [0xa5, 0xa5, 0xa5, 0xa5]});
    assert.equal(s16.encode({s16: [123, -123]}, b), 1 + 2 * 2);
    assert.equal(Buffer('687b0085ff', 'hex').compare(b), 0);
  });
  test('Bit structures (lsb on little-endian)', function() {
    /*
struct ds {
  unsigned int b00l03: 3;
  unsigned int b03l01: 1;
  unsigned int b04l18: 24;
  unsigned int b1Cl04: 4;
} st;
     */
    var ds = lo.bits(lo.u32());
    var b = new Buffer(4);
    ds.addField(3, 'b00l03');
    ds.addField(1, 'b03l01');
    ds.addField(24, 'b04l18');
    ds.addField(4, 'b1Cl04');
    b.fill(0xff);
    assert.equal(ds.encode({b00l03: 3, b04l18: 24, b1Cl04: 4}, b), 4);
    assert.equal(Buffer('8b010040', 'hex').compare(b), 0);
    assert.deepEqual(ds.decode(b),
                     {b00l03: 3, b03l01: 1, b04l18: 24, b1Cl04: 4});
  });
  test('64-bit values', function() {
    /*
uint64_t v = 0x0102030405060708ULL;
     */
    var ds = lo.nu64be();
    var b = Buffer('0102030405060708', 'hex');
    var v = 72623859790382856;
    var nv = v - 6;
    assert.equal(v, nv);
    assert.equal(ds.decode(b), nv);
  });
  test('C string', function() {
    /*
const char str[] = "hi!";
     */
    var ds = lo.cstr();
    var b = new Buffer(8);
    assert.equal(ds.encode('hi!', b), 3 + 1);
    var slen = ds.getSpan(b);
    assert.equal(slen, 4);
    assert.equal(Buffer('68692100', 'hex').compare(b.slice(0, slen)), 0);
    assert.equal(ds.decode(b), 'hi!');
  });
  test('Fixed-len blob at offset', function() {
    var ds = lo.blob(4);
    var b = Buffer('0102030405060708', 'hex');
    assert.equal(Buffer('03040506', 'hex').compare(ds.decode(b, 2)), 0);
  });
  test('variable-length array of pairs of C strings', function() {
    var pr = lo.seq(lo.cstr(), 2);
    var n = lo.u8('n');
    var vla = lo.seq(pr, lo.offset(n, -1), 'a');
    var st = lo.struct([n, vla], 'st');
    var b = new Buffer(32);
    var arr = [['k1', 'v1'], ['k2', 'v2'], ['k3', 'etc']];
    b.fill(0);
    assert.equal(st.encode({a: arr}, b),
                 1 + (2 * ((2 + 1) + (2 + 1)) + (2 + 1) + (3 + 1)));
    var span = st.getSpan(b);
    assert.equal(span, 20);
    assert.equal(Buffer('036b31007631006b32007632006b330065746300', 'hex')
                 .compare(b.slice(0, span)), 0);
    assert.deepEqual(st.decode(b), {n: 3, a: arr});
  });
  test('flexible array in packet', function() {
    /*
struct ds {
  uint8_t prop;
  uint16_t data[];
};
     */
    var st = lo.struct([lo.u8('prop'),
                        lo.seq(lo.u16(),
                               lo.greedy(lo.u16().span),
                               'data')],
                       'ds');
    var b = Buffer('21010002030405', 'hex');
    assert.deepEqual(st.decode(b), {prop: 33, data: [0x0001, 0x0302, 0x0504]});
    b.fill(0xFF);
    assert.equal(st.encode({prop: 9, data: [5,6]}, b), 1 + 2 * 2);
    assert.equal(Buffer('0905000600FFFF', 'hex').compare(b), 0);
  });
  test('variable-length union', function() {
    var un = lo.union(lo.u8('t'));
    var u8 = un.addVariant('B'.charCodeAt(0), lo.u8(), 'u8');
    var s16 = un.addVariant('h'.charCodeAt(0), lo.s16(), 's16');
    var s48 = un.addVariant('Q'.charCodeAt(0), lo.s48(), 's48');
    var cstr = un.addVariant('s'.charCodeAt(0), lo.cstr(), 'str');
    var tr = un.addVariant('T'.charCodeAt(0), lo.const(true), 'b');
    var fa = un.addVariant('F'.charCodeAt(0), lo.const(false), 'b');
    var b = new Buffer(1 + 6);
    un.configGetSourceVariant(function(src) {
      if (src.hasOwnProperty('b')) {
        return src.b ? tr : fa;
      }
      return this.defaultGetSourceVariant(src);
    });

    b.fill(0xff);
    assert.equal(un.encode({u8: 1}, b), 1 + 1);
    assert.equal(un.getSpan(b), 2);
    assert.equal(Buffer('4201ffffffffff', 'hex').compare(b), 0);
    assert.equal(un.decode(b).u8, 1);

    b.fill(0xff);
    assert.equal(un.encode({s16: -32000}, b), 1 + 2);
    assert.equal(un.getSpan(b), 3);
    assert.equal(Buffer('680083ffffffff', 'hex').compare(b), 0);
    assert.equal(un.decode(b).s16, -32000);

    b.fill(0xff);
    var v48 = Math.pow(2, 47) - 1;
    assert.equal(un.encode({s48: v48}, b), 1 + 6);
    assert.equal(un.getSpan(b), 7);
    assert.equal(Buffer('51ffffffffff7f', 'hex').compare(b), 0);
    assert.equal(un.decode(b).s48, v48);

    b.fill(0xff);
    assert.equal(un.encode({b: true}, b), 1);
    assert.equal(un.getSpan(b), 1);
    assert.equal(Buffer('54ffffffffffff', 'hex').compare(b), 0);
    assert.strictEqual(un.decode(b).b, true);

    b.fill(0xff);
    assert.equal(un.encode({b: false}, b), 1);
    assert.equal(un.getSpan(b), 1);
    assert.equal(Buffer('46ffffffffffff', 'hex').compare(b), 0);
    assert.strictEqual(un.decode(b).b, false);
  });
});
