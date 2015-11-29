/* Material in this file modified from Node.js under LICENSE:

Copyright Joyent, Inc. and other Node contributors. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
 */

/** Determine whether {@link
 * https://github.com/nodejs/node/issues/3992|Node.js issue #3992} is
 * fixed, and if not replace the Buffer functions with ones that work
 * correctly.
 *
 * This module exports no behavior.  It may modify the Buffer
 * prototype.
 *
 * This module originates from {@link
 * https://github.com/pabigot/buffer-layout|buffer-layout on GitHub}.
 *
 * @module patchIssue3992
 * @license MIT
 */

/* Test whether Buffer.writeIntLE() gets the right answer for
 * problematic negative integers */
var issue_3992_is_resolved = (function () {
    var buf = new Buffer(2);
    buf.writeIntLE(-0x100, 0, 2);
    // The value would be 0xFE if the bug is present
    return (0xFF === buf[1]);
})();

/* NB: Backfill code modified from node lib/buffer.js as of
 * 8bc80386879538de63cd6f2aef288f59324eb004 (2015-11-20) */
/* istanbul ignore next */
function checkInt(buffer, value, offset, ext, max, min) {
    if (!(buffer instanceof Buffer))
        throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min)
        throw new TypeError('"value" argument is out of bounds');
    if (offset + ext > buffer.length)
        throw new RangeError('Index out of range');
}

/* The grotesquery here is because jshint whines about strict mode
 * violations if the function doesn't appear to be a method, and about
 * defining functions within a block if the test is in an if
 * statement. */
Buffer.prototype.writeIntLE = issue_3992_is_resolved ? Buffer.prototype.writeIntLE : function(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        checkInt(this,
                 value,
                 offset,
                 byteLength,
                 Math.pow(2, 8 * byteLength - 1) - 1,
                 -Math.pow(2, 8 * byteLength - 1));
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value;
    while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0)
            sub = 1;
        this[offset + i] = ((value / mul) >> 0) - sub;
    }

    return offset + byteLength;
};

Buffer.prototype.writeIntBE = issue_3992_is_resolved ? Buffer.prototype.writeIntBE : function(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        checkInt(this,
                 value,
                 offset,
                 byteLength,
                 Math.pow(2, 8 * byteLength - 1) - 1,
                 -Math.pow(2, 8 * byteLength - 1));
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value;
    while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0)
            sub = 1;
        this[offset + i] = ((value / mul) >> 0) - sub;
    }

    return offset + byteLength;
};
