/** Support for translating between Buffer instances and Objects.
 *
 * {@link module:Layout~Layout|Layout} is the basis of a class
 * hierarchy that associates property names with sequences of encoded
 * bytes.
 *
 * Layouts are supported for these scalar types:
 * * {@link module:Layout~UInt|Unsigned integers in little-endian
 *   format} with {@link module:Layout.u8|8-bit}, {@link
 *   module:Layout.u16|16-bit}, {@link module:Layout.u24|24-bit},
 *   {@link module:Layout.u32|32-bit}, {@link
 *   module:Layout.u40|40-bit}, and {@link module:Layout.u48|48-bit}
 *   representation ranges;
 * * {@link module:Layout~UIntBE|Unsigned integers in big-endian
 *   format} with {@link module:Layout.u16be|16-bit}, {@link
 *   module:Layout.u24be|24-bit}, {@link module:Layout.u32be|32-bit},
 *   {@link module:Layout.u40be|40-bit}, and {@link
 *   module:Layout.u48be|48-bit} representation ranges;
 * * {@link module:Layout~Int|Signed integers in little-endian
 *   format} with {@link module:Layout.s8|8-bit}, {@link
 *   module:Layout.s16|16-bit}, {@link module:Layout.s24|24-bit},
 *   {@link module:Layout.s32|32-bit}, {@link
 *   module:Layout.s40|40-bit}, and {@link module:Layout.s48|48-bit}
 *   representation ranges;
 * * {@link module:Layout~IntBE|Signed integers in big-endian format}
 *   with {@link module:Layout.s16be|16-bit}, {@link
 *   module:Layout.s24be|24-bit}, {@link module:Layout.s32be|32-bit},
 *   {@link module:Layout.s40be|40-bit}, and {@link
 *   module:Layout.s48be|48-bit} representation ranges;
 * * 32-bit floating point values with {@link
 *   module:Layout.f32|little-endian} and {@link
 *   module:Layout.f32be|big-endian} representations.
 * * 64-bit floating point values with {@link
 *   module:Layout.f64|little-endian} and {@link
 *   module:Layout.f64be|big-endian} representations.
 *
 * @local Layout
 * @local UInt
 * @local UIntBE
 * @local Int
 * @local IntBE
 * @local Float
 * @local FloatBE
 * @local Double
 * @local DoubleBE
 * @module Layout
 * @license MIT
 */

/*jslint
    bitwise, this, white
 */
"use strict";

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger */
Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" &&
           isFinite(value) &&
           Math.floor(value) === value;
};

/** Base class for layout objects.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * Layout#encode|encode} or {@link Layout#decode|decode} functions.
 *
 * @param {Number} span - Default for {@link Layout#span|span}.  The
 * parameter must be a positive integer.
 *
 * @param {string} [property] - Default for {@link
 * Layout#property|property}.
 *
 * @constructor */
function Layout (span, property) {
    if ((! Number.isInteger(span)) || (0 >= span)) {
        throw new TypeError("span must be positive integer");
    }
    /** The span of the layout in bytes. */
    this.span = span;
    /** The property name used when this layout is represented in an
     * Object.
     *
     * Used only for layouts that {@link Layout#decode|decode} to
     * Object instances.  If left undefined the corresponding span of
     * bytes will be treated as padding: it will not be mutated by
     * {@link Layout#encode|encode} nor represented as a property in
     * the decoded Object. */
    this.property = property;
}

/** Decode from a Buffer into an Javascript value.
 *
 * @param {Buffer} b - the buffer from which encoded data is read.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred.
 *
 * @returns {(Number|Object)} - the value of the decoded data. */
Layout.prototype.decode = function () {
    throw new Error('Layout is abstract');
};

/** Encode a Javascript value into a Buffer.
 *
 * @param {(Number|Object)} src - the value to be encoded into the
 * buffer.
 *
 * @param {Buffer} b - the buffer into which encoded data will be
 * written.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred. */
Layout.prototype.encode = function () {
    throw new Error('Layout is abstract');
};

/** Represent an unsigned integer in little-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function UInt (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
UInt.prototype = Object.create(Layout.prototype);
UInt.prototype.constructor = UInt;
/** Implement {@link Layout#decode|decode} for {@link UInt|UInt}. */
UInt.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readUIntLE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link UInt|UInt}. */
UInt.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeUIntLE(src, offset, this.span);
};

/** Represent an unsigned integer in big-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function UIntBE (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
UIntBE.prototype = Object.create(Layout.prototype);
UIntBE.prototype.constructor = UIntBE;
/** Implement {@link Layout#decode|decode} for {@link UIntBE|UIntBE}. */
UIntBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readUIntBE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link UIntBE|UIntBE}. */
UIntBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeUIntBE(src, offset, this.span);
};

/** Represent a signed integer in little-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Int (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
Int.prototype = Object.create(Layout.prototype);
Int.prototype.constructor = Int;
/** Implement {@link Layout#decode|decode} for {@link Int|Int}. */
Int.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readIntLE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link Int|Int}. */
Int.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeIntLE(src, offset, this.span);
};

/** Represent a signed integer in big-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function IntBE (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
IntBE.prototype = Object.create(Layout.prototype);
IntBE.prototype.constructor = IntBE;
/** Implement {@link Layout#decode|decode} for {@link IntBE|IntBE}. */
IntBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readIntBE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link IntBE|IntBE}. */
IntBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeIntBE(src, offset, this.span);
};

/** Represent a 32-bit floating point number in little-endian format.
 *
 * Factory function is {@link module:Layout.f32|f32}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Float (property) {
    Layout.call(this, 4, property);
    Object.freeze(this);
}
Float.prototype = Object.create(Layout.prototype);
Float.prototype.constructor = Float;
/** Implement {@link Layout#decode|decode} for {@link Float|Float}. */
Float.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readFloatLE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link Float|Float}. */
Float.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeFloatLE(src, offset);
};

/** Represent a 32-bit floating point number in big-endian format.
 *
 * Factory function is {@link module:Layout.f32be|f32be}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function FloatBE (property) {
    Layout.call(this, 4, property);
    Object.freeze(this);
}
FloatBE.prototype = Object.create(Layout.prototype);
FloatBE.prototype.constructor = FloatBE;
/** Implement {@link Layout#decode|decode} for {@link FloatBE|FloatBE}. */
FloatBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readFloatBE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link FloatBE|FloatBE}. */
FloatBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeFloatBE(src, offset);
};

/** Represent a 64-bit floating point number in little-endian format.
 *
 * Factory function is {@link module:Layout.f64|f64}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Double (property) {
    Layout.call(this, 8, property);
    Object.freeze(this);
}
Double.prototype = Object.create(Layout.prototype);
Double.prototype.constructor = Double;
/** Implement {@link Layout#decode|decode} for {@link Double|Double}. */
Double.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readDoubleLE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link Double|Double}. */
Double.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeDoubleLE(src, offset);
};

/** Represent a 64-bit floating point number in big-endian format.
 *
 * Factory function is {@link module:Layout.f64be|f64be}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function DoubleBE (property) {
    Layout.call(this, 8, property);
    Object.freeze(this);
}
DoubleBE.prototype = Object.create(Layout.prototype);
DoubleBE.prototype.constructor = DoubleBE;
/** Implement {@link Layout#decode|decode} for {@link DoubleBE|DoubleBE}. */
DoubleBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readDoubleBE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link DoubleBE|DoubleBE}. */
DoubleBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeDoubleBE(src, offset);
};

exports.Layout = Layout;
exports.UInt = UInt;
exports.UIntBE = UIntBE;
exports.Int = Int;
exports.IntBE = IntBE;
exports.Float = Float;
exports.FloatBE = FloatBE;
exports.Double = Double;
exports.DoubleBE = DoubleBE;

/** Factory for {@link UInt|unsigned int layouts} spanning one
 * byte. */
exports.u8 = function (property) { return new UInt(1, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning two bytes. */
exports.u16 = function (property) { return new UInt(2, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning three bytes. */
exports.u24 = function (property) { return new UInt(3, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning four bytes. */
exports.u32 = function (property) { return new UInt(4, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning five bytes. */
exports.u40 = function (property) { return new UInt(5, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning six bytes. */
exports.u48 = function (property) { return new UInt(6, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning two bytes. */
exports.u16be = function (property) { return new UIntBE(2, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning three bytes. */
exports.u24be = function (property) { return new UIntBE(3, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning four bytes. */
exports.u32be = function (property) { return new UIntBE(4, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning five bytes. */
exports.u40be = function (property) { return new UIntBE(5, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning six bytes. */
exports.u48be = function (property) { return new UIntBE(6, property); };

/** Factory for {@link Int|signed int layouts} spanning one
 * byte. */
exports.s8 = function (property) { return new Int(1, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning two bytes. */
exports.s16 = function (property) { return new Int(2, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning three bytes. */
exports.s24 = function (property) { return new Int(3, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning four bytes. */
exports.s32 = function (property) { return new Int(4, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning five bytes. */
exports.s40 = function (property) { return new Int(5, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning six bytes. */
exports.s48 = function (property) { return new Int(6, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning two bytes. */
exports.s16be = function (property) { return new IntBE(2, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning three bytes. */
exports.s24be = function (property) { return new IntBE(3, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning four bytes. */
exports.s32be = function (property) { return new IntBE(4, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning five bytes. */
exports.s40be = function (property) { return new IntBE(5, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning six bytes. */
exports.s48be = function (property) { return new IntBE(6, property); };

/** Factory for {@link Float|little-endian 32-bit floating point} values. */
exports.f32 = function (property) { return new Float(property); };

/** Factory for {@link FloatBE|big-endian 32-bit floating point} values. */
exports.f32be = function (property) { return new FloatBE(property); };

/** Factory for {@link Double|little-endian 64-bit floating point} values. */
exports.f64 = function (property) { return new Double(property); };

/** Factory for {@link DoubleBE|big-endian 64-bit floating point} values. */
exports.f64be = function (property) { return new DoubleBE(property); };
