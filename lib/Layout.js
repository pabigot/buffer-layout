/* The MIT License (MIT)
 *
 * Copyright (c) 2015 Peter A. Bigot
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/** Support for translating between Buffer instances and JavaScript
 * native types.
 *
 * {@link module:Layout~Layout|Layout} is the basis of a class
 * hierarchy that associates property names with sequences of encoded
 * bytes.
 *
 * Layouts are supported for these scalar (numeric) types:
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
 * and for these aggregate types:
 * * {@link module:Layout.seq|Sequence}s of instances of a {@link
 *   module:Layout~Layout|Layout}, with JavaScript representation as
 *   an Array;
 * * {@link module:Layout.struct|Structure}s that aggregate a
 *   heterogeneous sequence of {@link module:Layout~Layout|Layout}
 *   instances, with JavaScript representation as an Object;
 * * {@link module:Layout.union|Union}s that support multiple {@link
 *   module:Layout~VariantLayout|variant layouts} over the same span
 *   of bytes, using an unsigned integer at the start the span or a
 *   separate {@link module:Layout.unionLayoutDiscriminator|layout
 *   element} to determine the layout used to interpret the remainder
 *   of the span.
 * * {@link module:Layout.bits|BitStructure}s that contain a
 *   sequence of individual {@link module:Layout~BitField#addField|BitField}s
 *   packed into an 8, 16, 24, or 32-bit unsigned integer;
 * * {@link module:Layout.cstr|C strings} of varying length;
 * * {@link module:Layout.blob|Blobs} of fixed length.
 *
 * All {@link module:Layout~Layout|Layout} instances are immutable
 * after construction, to prevent internal state from becoming
 * inconsistent.
 *
 * @local Layout
 * @local OffsetLayout
 * @local UInt
 * @local UIntBE
 * @local Int
 * @local IntBE
 * @local Float
 * @local FloatBE
 * @local Double
 * @local DoubleBE
 * @local Sequence
 * @local Structure
 * @local UnionDiscriminator
 * @local UnionLayoutDiscriminator
 * @local Union
 * @local VariantLayout
 * @local BitStructure
 * @local BitField
 * @local Blob
 * @local CString
 * @module Layout
 * @license MIT
 * @author Peter A. Bigot
 * @see {@link https://github.com/pabigot/buffer-layout|buffer-layout on GitHub}
 */

/*jslint
    bitwise:true, this:true, white:true
 */
/*jshint -W034 */ // don't whine about explicit "use strict"
"use strict";

var assert = require('assert');

/* istanbul ignore next */
/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger */
Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" &&
           isFinite(value) &&
           Math.floor(value) === value;
};

/* istanbul ignore next */
/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign */
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(nextSource);
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

/** Base class for layout objects.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * Layout#encode|encode} or {@link Layout#decode|decode} functions.
 *
 * **NOTE** All instances of concrete extensions of this class are
 * frozen prior to being returned from the constructor so that state
 * relationships between layouts are not inadvertently corrupted.
 *
 * @param {Number} span - Default for {@link Layout#span|span}.  The
 * parameter must be a positive integer, or a negative value to
 * indicate that the span is {@link Layout#getSpan|value-specific}.
 *
 * @param {string} [property] - Default for {@link
 * Layout#property|property}.
 *
 * @constructor */
function Layout (span, property) {
    if ((! Number.isInteger(span)) || (0 === span)) {
        throw new TypeError("span must be non-zero integer");
    }

    /** The span of the layout in bytes.
     *
     * A negative value indicates that the span is value-specific, and
     * must be obtained using {@link Layout#getSpan|getSpan}. */
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

/** Decode from a Buffer into an JavaScript value.
 *
 * @param {Buffer} b - the buffer from which encoded data is read.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred.
 *
 * @returns {(Number|Array|Object)} - the value of the decoded data. */
Layout.prototype.decode = function () {
    throw new Error('Layout is abstract');
};

/** Encode a JavaScript value into a Buffer.
 *
 * @param {(Number|Array|Object)} src - the value to be encoded into
 * the buffer.  The type accepted depends on the (sub-)type of {@link
 * Layout|Layout}.
 *
 * @param {Buffer} b - the buffer into which encoded data will be
 * written.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred. */
Layout.prototype.encode = function () {
    throw new Error('Layout is abstract');
};

/** Calculate the span of a specific instance of a layout.
 *
 * @param {Buffer} b - the buffer that contains an encoded instance.
 *
 * @param {Number} [offset] - the offset at which the encoded instance
 * starts.  If absent a zero offset is inferred.
 *
 * @return {Number} - the number of bytes covered by the layout
 * instance.  If this method is not overridden in a subclass the
 * definition-time constant {@link Layout#span|span} will be
 * returned.
 *
 * @throws {RangeError} - if the length of the value cannot be
 * determined. */
Layout.prototype.getSpan = function (b, offset) {
    if (0 > this.span) {
        throw new RangeError('indeterminate span');
    }
    return this.span;
};

/** Replicate the layout using a new property.
 *
 * This function must be used to get a structurally-equivalent layout
 * with a different name since all {@link Layout|Layout} instances are
 * immutable.
 *
 * **NOTE** This is a shallow copy.  All fields except {@link
 * Layout#property|property} are strictly equal to the origin layout.
 *
 * @param property - the value for {@link Layout#property|property} in
 * the replica.
 *
 * @returns {Layout} - the copy with {@link Layout#property|property}
 * set to `property`. */
Layout.prototype.replicate = function (property) {
    var rv = Object.create(this.constructor.prototype);
    Object.assign(rv, this);
    rv.property = property;
    Object.freeze(rv);
    return rv;
};

/** Create an object from layout properties and an array of values.
 *
 * **NOTE** This function returns `undefined` if invoked on a layout
 * that does not return its value as an Object.  Objects are returned
 * for things that are a {@link Structure|Structure}, which includes
 * {@link VariantLayout|variant layouts} if they are structures, and
 * excludes {@link Union|Union}s.  If you want this feature for a
 * union you must use {@link Union.getVariant|getVariant} to select
 * the desired layout.
 *
 * @param {Array} values - an array of values that correspond to the
 * default order for properties.  As with {@link Layout#decode|decode}
 * layout elements that have no property name are skipped when
 * iterating over the array values.  Only the top-level properties are
 * assigned; arguments are not assigned to properties of contained
 * layouts.  Any unused values are ignored.
 *
 * @return {(Object|undefined)} */
Layout.prototype.fromArray = function () {
    return undefined;
};

/** An object that supports accessing a {@link Layout|Layout} at a
 * fixed offset from the start of another Layout.  The offset may be
 * before, within, or after the base layout.
 *
 * @param {Layout} layout - initializer for {@link
 * OffsetLayout#layout|layout}, modulo `property`.
 *
 * @param {Number} [offset] - Initializes {@link
 * OffsetLayout#offset|offset}.  Defaults to zero.
 *
 * @param {string} [property] - Optional new property name for a
 * {@link Layout#replicate| replica} of `layout` to be used as {@link
 * OffsetLayout#layout|layout}.  If not provided the `layout` is used
 * unchanged.
 *
 * @constructor
 * @augments {Layout} */
function OffsetLayout (layout, offset, property) {
    if (! (layout instanceof Layout)) {
        throw new TypeError("layout must be a Layout");
    }

    if (undefined === offset) {
        offset = 0;
    } else if (! Number.isInteger(offset)) {
        throw new TypeError("offset must be integer or undefined");
    }

    Layout.call(this, layout.span, property || layout.property);

    /** The subordinated layout. */
    this.layout = layout;

    /** The location of {@link OffsetLayout#layout} relative to the
     * start of another layout.
     *
     * The value may be positive or negative, but an error will thrown
     * if at the point of use it goes outside the span of the Buffer
     * being accessed.  */
    this.offset = offset;

    Object.freeze(this);
}
OffsetLayout.prototype = Object.create(Layout.prototype);
OffsetLayout.prototype.constructor = OffsetLayout;
/** Return `true` iff {@link OffsetLayout#layout|layout} is an unsigned integer layout.
 *
 * In that case it can be used as the source of {@link
 * Sequence#count|Sequence} counts. */
OffsetLayout.prototype.isCount = function () {
    return ((this.layout instanceof UInt)
            || (this.layout instanceof UIntBE));
};
/** Implement {@link Layout#decode|decode} for {@link OffsetLayout|OffsetLayout}. */
OffsetLayout.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return this.layout.decode(b, offset+this.offset);
};
/** Implement {@link Layout#encode|encode} for {@link OffsetLayout|OffsetLayout}. */
OffsetLayout.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return this.layout.encode(src, b, offset+this.offset);
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

/** Represent a contiguous sequence of a specific layout as an Array.
 *
 * @param {Layout} elt_layout - initializer for {@link
 * Sequence#elt_layout|elt_layout}.
 *
 * @param {(Number|Layout)} count - initializer for {@link
 * Sequence#count|count}.  The parameter must be either a positive
 * integer or an instance of {@link OffsetLayout}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Sequence (elt_layout, count, property) {
    if (! (elt_layout instanceof Layout)) {
        throw new TypeError("elt_layout must be a Layout");
    }
    if (! (((count instanceof OffsetLayout) && count.isCount())
           || (Number.isInteger(count) && (0 < count)))) {
        throw new TypeError("count must be positive integer or an unsigned integer OffsetLayout");
    }
    var span = -1;
    if ((! (count instanceof OffsetLayout))
        && (0 < elt_layout.span)) {
        span = count * elt_layout.span;
    }

    Layout.call(this, span, property);

    /** The layout for individual elements of the sequence. */
    this.elt_layout = elt_layout;

    /** The number of elements in the sequence.
     *
     * This will be either a positive integer or an instance of {@link
     * OffsetLayout|OffsetLayout}. */
    this.count = count;

    Object.freeze(this);
}
Sequence.prototype = Object.create(Layout.prototype);
Sequence.prototype.constructor = Sequence;
/** Implement {@link Layout#getSpan|getSpan} for {@link Sequence|Sequence}. */
Sequence.prototype.getSpan = function (b, offset) {
    if (0 < this.span) {
        return this.span;
    }
    if (undefined === offset) {
        offset = 0;
    }
    var span = 0,
        count = this.count;
    if (count instanceof OffsetLayout) {
        count = count.decode(b, offset);
    }
    if (0 < this.elt_layout.span) {
        span = count * this.elt_layout.span;
    } else {
        var idx = 0;
        while (idx < count) {
            var esp = this.elt_layout.getSpan(b, offset + span);
            span += esp;
            ++idx;
        }
    }
    return span;
};
/** Implement {@link Layout#decode|decode} for {@link Sequence|Sequence}. */
Sequence.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var rv = [],
        i = 0,
        count = this.count;
    if (count instanceof OffsetLayout) {
        count = count.decode(b, offset);
    }
    while (i < count) {
        rv.push(this.elt_layout.decode(b, offset));
        offset += this.elt_layout.getSpan(b, offset);
        i += 1;
    }
    return rv;
};
/** Implement {@link Layout#encode|encode} for {@link Sequence|Sequence}.
 *
 * **NOTE** If `src` is shorter than {@link Sequence#count|count} then
 * the unused space in the buffer is left unchanged.  If `src` is
 * longer than {@link Sequence#count|count} the unneeded elements are
 * ignored.
 *
 * **NOTE** If {@link Layout#count|count} is an instance of {@link
 * OffsetLayout|OffsetLayout} then the length of `src` will be encoded
 * as the count after `src` is encoded. */
Sequence.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var elo = this.elt_layout;
    var span = 0;
    src.forEach(function (v) {
        elo.encode(v, b, offset + span);
        span += elo.getSpan(b, offset + span);
    });
    if (this.count instanceof OffsetLayout) {
        this.count.encode(src.length, b, offset);
    }
};

/** Represent a contiguous sequence of arbitrary layout elements as an
 * Object.
 *
 * **NOTE** The {@link Layout#span|span} of the structure is variable
 * if any layout in {@link Structure#fields|fields} has a variable
 * span.  When {@link Layout|encode|encoding} we must have a value for
 * all variable-length fields, or we wouldn't be able to figure out
 * how much space to use for storage.  We can only identify the value
 * for a field when it has a {@link Layout#property|property}.  As
 * such, although a structure may contain both unnamed fields and
 * variable-length fields, it cannot contain an unnamed
 * variable-length field.
 *
 * @param {Layout[]} fields - initializer for {@link
 * Structure#fields|fields}.  An error is raised if this contains a
 * variable-length field for which a {@link Layout#property|property}
 * is not defined.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @throws {Error} - if `fields` contains an unnamed variable-length
 * layout.
 *
 * @constructor
 * @augments {Layout} */
function Structure (fields, property) {
    if ((! (fields instanceof Array))
        || (! fields.reduce(function (v, fd) { return v && (fd instanceof Layout); }, true))) {
        throw new TypeError("fields must be array of Layout instances");
    }

    /* Verify absence of unnamed variable-length fields. */
    fields.forEach(function (fd) {
        if ((0 > fd.span)
            && (undefined === fd.property)) {
            throw new Error('fields cannot contain unnamed variable-length layout');
        }
    });

    var span = -1;
    try {
        span = fields.reduce(function (v, fd) { return v+fd.getSpan(); }, 0);
    } catch (e) {
    }
    Layout.call(this, span, property);

    /** The sequence of {@link Layout|Layout} values that comprise the
     * structure.
     *
     * The individual elements need not be the same type, and may be
     * either scalar or aggregate layouts.  If a member layout leaves
     * its {@link Layout#property|property} undefined the
     * corresponding region of the buffer associated with the element
     * will not be mutated.
     *
     * @type {Layout[]} */
    this.fields = fields;

    Object.freeze(this);
}
Structure.prototype = Object.create(Layout.prototype);
Structure.prototype.constructor = Structure;
/** Implement {@link Layout#getSpan|getSpan} for {@link Structure|Structure}. */
Structure.prototype.getSpan = function (b, offset) {
    if (0 < this.span) {
        return this.span;
    }
    if (undefined === offset) {
        offset = 0;
    }
    var span = 0;
    try {
        span = this.fields.reduce(function (v, fd) {
            var fsp = fd.getSpan(b, offset);
            offset += fsp;
            return v+fsp;
        }, 0);
    } catch (e) {
        throw new RangeError('indeterminate span');
    }
    return span;
};
/** Implement {@link Layout#decode|decode} for {@link Structure|Structure}. */
Structure.prototype.decode = function (b, offset) {
    var dest = {};
    if (undefined === offset) {
        offset = 0;
    }
    this.fields.map(function (fd) {
        if (undefined !== fd.property) {
            dest[fd.property] = fd.decode(b, offset);
        }
        offset += fd.getSpan(b, offset);
    });
    return dest;
};
/** Implement {@link Layout#encode|encode} for {@link Structure|Structure}.
 *
 * If `src` is missing a property for a member with a defined {@link
 * Layout#property|property} the corresponding region of the buffer is
 * left unmodified. */
Structure.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }

    this.fields.forEach(function (fd) {
        var span = fd.span;
        if (undefined === fd.property) {
            /* By construction the field must be fixed-length (because
             * unnamed variable-length fields are disallowed when
             * encoding).  But check it anyway. */
            assert(0 < span);
        } else {
            var fv = src[fd.property];
            if (undefined !== fv) {
                fd.encode(fv, b, offset);
                if (0 > span) {
                    /* Read the as-encoded span */
                    span = fd.getSpan(b, offset);
                }
            }
        }
        offset += span;
    });
};
/** Implement {@link Layout#fromArray|fromArray} for {@link
 * Structure|Structure}. */
Structure.prototype.fromArray = function (values) {
    var dest = {};
    this.fields.forEach(function (fd) {
        if ((undefined !== fd.property)
            && (0 < values.length)) {
            dest[fd.property] = values.shift();
        }
    });
    return dest;
};

/** An object that can provide a {@link
 * Union#discriminator|discriminator} API for {@link * Union|Union}.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * UnionDiscriminator#encode|encode} or {@link
 * UnionDiscriminator#decode|decode} functions.
 *
 * @param {string} [property] - Default for {@link
 * UnionDiscriminator#property|property}.
 *
 * @constructor */
function UnionDiscriminator (property) {
    /** The {@link Layout#property|property} to be used when the
     * discriminator is referenced in isolation (generally when {@link
     * Union#decode|Union decode} cannot delegate to a specific
     * variant). */
    this.property = property;
}
/** Analog to {@link Layout#decode|Layout decode} for union discriminators.
 *
 * The implementation of this method need not reference the buffer if
 * variant information is available through other means. */
UnionDiscriminator.prototype.decode = function () {
    throw new Error('UnionDiscriminator is abstract');
};
/** Analog to {@link Layout#decode|Layout encode} for union discriminators.
 *
 * The implementation of this method need not store the value if
 * variant information is maintained through other means. */
UnionDiscriminator.prototype.encode = function () {
    throw new Error('UnionDiscriminator is abstract');
};

/** An object that can provide a {@link
 * UnionDiscriminator|discriminator API} for {@link Union|Union} using
 * an unsigned integral {@link Layout|Layout} instance located either
 * inside or outside the union.
 *
 * @param {Layout} layout - Base layout used in {@link
 * UnionLayoutDiscriminator#layout|layout}.  Must be an instance of
 * {@link UInt|UInt} or {@link UIntBE|UIntBE}.
 *
 * @param {Number} [offset] - The offset of `layout` relative to the
 * start of the union.  Defaults to zero, in which case the
 * discriminator is assumed to be a {@link
 * Union#usesPrefixDiscriminator|prefix} of the union.
 *
 * @param {string} [property] - Default for {@link
 * UnionDiscriminator#property|property}, superseding the property
 * from `layout`, but defaulting to `variant` if neither `property`
 * nor layout provide a property name.
 *
 * @constructor
 * @augments {UnionDiscriminator} */
function UnionLayoutDiscriminator (layout, offset, property) {
    if (! ((layout instanceof UInt)
           || (layout instanceof UIntBE))) {
        throw new TypeError("layout must produce unsigned integer");
    }

    /** The {@link OffsetLayout|OffsetLayout} used to access the
     * discriminator value. */
    this.layout = new OffsetLayout(layout, offset);

    UnionDiscriminator.call(this, property || layout.property || 'variant');

    Object.freeze(this);
}
UnionLayoutDiscriminator.prototype = Object.create(UnionDiscriminator.prototype);
UnionLayoutDiscriminator.prototype.constructor = UnionLayoutDiscriminator;
/** Delegate decoding to {@link UnionLayoutDiscriminator#layout|layout}. */
UnionLayoutDiscriminator.prototype.decode = function (b, offset) {
    return this.layout.decode(b, offset);
};
/** Delegate encoding to {@link UnionLayoutDiscriminator#layout|layout}. */
UnionLayoutDiscriminator.prototype.encode = function (src, b, offset) {
    return this.layout.encode(src, b, offset);
};

/** Represent any number of span-compatible layouts.
 *
 * The {@link Layout.span|span} of a union includes its {@link
 * Union#discriminator|discriminator} if the variant is a {@link
 * Union#usesPrefixDiscriminator|prefix of the union}, plus its {@link
 * Union#default_layout|default layout}.
 *
 * {@link
 * VariantLayout#layout|Variant layout}s are added through {@link
 * Union#addVariant|addVariant} and may be any layout that does not
 * exceed span of the {@link Union#default_layout|default layout}.
 *
 * The variant for a buffer can only be identified from the {@link
 * Union#discriminator|discriminator} {@link
 * UnionDiscriminator#property|property} (in the case of the {@link
 * Union#default_layout|default layout}), or by using {@link
 * Union#getVariant|getVariant} and examining the resulting {@link
 * VariantLayout|VariantLayout} instance.
 *
 * @param {(UnionDiscriminator|Layout)} discr - describes how to
 * identify the layout used to interpret the union contents.  The
 * parameter must be an instance of {@link
 * UnionDiscriminator|UnionDiscriminator} or {@link UInt|UInt} (or
 * {@link UIntBE|UIntBE}).  When a layout element is passed the
 * discriminator is a {@link Union#usesPrefixDiscriminator|prefix} of
 * the {@link Union#layout|layout} and a {@link
 * UnionLayoutDiscriminator|UnionLayoutDiscriminator} instance is
 * synthesized.  In either case, the discriminator object is available
 * as {@link Union#discriminator|discriminator}.
 *
 * @param {Layout} default_layout - initializer for {@link
 * Union#default_layout|default_layout}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Union (discr,
                default_layout,
                property) {
    var upv = ((discr instanceof UInt)
               || (discr instanceof UIntBE)),
        orig_discr = discr;
    if (upv) {
        discr = new UnionLayoutDiscriminator(discr);
    } else if (! (discr instanceof UnionDiscriminator)) {
        throw new TypeError("discr must be a UnionDiscriminator or an unsigned integer layout");
    }
    if (! (default_layout instanceof Layout)) {
        throw new TypeError("default_layout must be a Layout");
    }

    /* Synthesize the structure, starting with the internal
     * discriminator if present, then the default layout. */
    var lo_elts = [];
    if (upv) {
        lo_elts.push(orig_discr);
    }
    var clo = default_layout;
    if (undefined === clo.property) {
        clo = clo.replicate('content');
    }
    lo_elts.push(clo);
    var layout = new Structure(lo_elts);

    /* The union spans its layout. */
    Layout.call(this, layout.span, property);

    /** The layout for unrecognized variants.
     *
     * This is a {@link Structure|Structure} layout containing one or
     * two fields.
     *
     * If the {@link Union#discriminator|discriminator} is a {@link
     * Union#usesPrefixDiscriminator|prefix discriminator} there are
     * two fields, the first being the discriminator layout element.
     * If the provided discriminator layout element was not given a
     * {@link Layout#property|property}, `variant` will be used.
     *
     * The last field in the layout is the {@link
     * Union#default_layout|default layout}.  If the provided default
     * layout was not given a {@link Layout#property|property},
     * `content` will be used. */
    this.layout = layout;

    /** The interface for the discriminator value in isolation.
     *
     * This is the discriminator object passed to the constructor, or
     * a {@link UnionDiscriminator|UnionDiscriminator} synthesized
     * from an unsigned integer layout element passed as the
     * discriminator.  In the latter case it is structurally identical
     * to the first component of {@link Union#layout|layout} but may
     * use a different {@link Layout#property|property}, and {@link
     * Union#usesPrefixDiscriminator|usesPrefixDiscriminator} will be
     * `true`. */
    this.discriminator = discr;

    /** `true` if the {@link Union#discriminator|discriminator} is the
     * first field in the union.
     *
     * If `false` the discriminator is either external to the union or
     * encoded within the {@link Union#default_layout|default
     * layout}. */
    this.usesPrefixDiscriminator = upv;

    /** The layout for non-discriminator content when the value of the
     * discriminator is not recognized.
     *
     * This is the value passed to the constructor.  It is
     * structurally equivalent to the second component of {@link
     * Union#layout|layout} but may have a different property
     * name. */
    this.default_layout = default_layout;

    /** A registry of allowed variants.
     *
     * The keys are unsigned integers which should be compatible with
     * {@link Union.discriminator|discriminator}.  The property value
     * is the corresponding {@link VariantLayout|VariantLayout}
     * instances assigned to this union by {@link
     * Union#addVariant|addVariant}.
     *
     * **NOTE** The registry remains mutable so that variants can be
     * {@link Union#addVariant|added} at any time.  Users should not
     * manipulate the content of this property. */
    this.registry = {};

    Object.freeze(this);
}
Union.prototype = Object.create(Layout.prototype);
Union.prototype.constructor = Union;
/** Implement {@link Layout#decode|decode} for {@link Union|Union}.
 *
 * If the variant is {@link Union#addVariant|registered} the return
 * value is an instance of that variant, with no explicit
 * discriminator.  Otherwise the {@link Union#default_layout|default
 * layout} is used to decode the content. */
Union.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var dest = {};
    var dlo = this.discriminator,
        discr = dlo.decode(b, offset),
        clo = this.registry[discr];
    if (undefined === clo) {
        var content_offset = 0;
        clo = this.layout.fields[0];
        if (this.usesPrefixDiscriminator) {
            content_offset = dlo.layout.span;
            clo = this.layout.fields[1];
        }
        dest[dlo.property] = discr;
        dest[clo.property] = this.default_layout.decode(b, offset + content_offset);
    } else {
        dest = clo.decode(b, offset);
    }
    return dest;
};
/** Implement {@link Layout#encode|encode} for {@link Union|Union}.
 *
 * This API assumes the `src` object is consistent with the union's
 * {@link Union#default_layout|default layout}.  To encode variants
 * use the appropriate variant-specific {@link VariantLayout#encode}
 * method. */
Union.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var dlo = this.discriminator,
        discr = src[dlo.property];
    var content_offset = 0,
        clo = this.layout.fields[0];
    if (this.usesPrefixDiscriminator) {
        content_offset = dlo.layout.span;
        clo = this.layout.fields[1];
    }
    var content = src[clo.property];
    if ((undefined === discr) || (undefined === content)) {
        throw new Error("default union encode must be provided " + dlo.property + " and " + clo.property);
    }
    dlo.encode(discr, b, offset);
    clo.encode(content, b, offset + content_offset);
};
/** Register a new variant structure within a union.  The newly
 * created variant is returned.
 *
 * @param {Number} variant - initializer for {@link
 * VariantLayout#variant|variant}.
 *
 * @param {Layout} layout - initializer for {@link
 * VariantLayout#layout|layout}.
 *
 * @param {String} property - initializer for {@link
 * Layout#property|property}.
 *
 * @return {VariantLayout} */
Union.prototype.addVariant = function (variant, layout, property) {
    var rv = new VariantLayout(this, variant, layout, property);
    this.registry[variant] = rv;
    return rv;
};
/** Get the layout associated with a registered variant.
 *
 * If `vb` does not produce a registered variant the function returns
 * `undefined`.
 *
 * @param {(Number|Buffer)} vb - either the variant number, or a
 * buffer from which the discriminator is to be read.
 *
 * @param {Number} offset - offset into `vb` for the start of the
 * union.  Used only when `vb` is an instance of {Buffer}.
 *
 * @return {({VariantLayout}|undefined)} */
Union.prototype.getVariant = function (vb, offset) {
    var variant = vb;
    if (vb instanceof Buffer) {
        if (undefined === offset) {
            offset = 0;
        }
        variant = this.discriminator.decode(vb, offset);
    }
    return this.registry[variant];
};

/** Represent a specific variant within a containing union.
 *
 * **NOTE** The {@link Layout#span|span} of the variant may include
 * the span of the {@link Union#discriminator|discriminator} used to
 * identify it, but values read and written using the variant strictly
 * conform to the content of {@link VariantLayout#layout|layout}.
 *
 * **NOTE** User code should not invoke this constructor directly.  Use
 * the union {@link Union#addVariant|addVariant} helper method.
 *
 * @param {Union} union - initializer for {@link
 * VariantLayout#union|union}.
 *
 * @param {Number} variant - initializer for {@link
 * VariantLayout#variant|variant}.
 *
 * @param {Layout} layout - initializer for {@link
 * VariantLayout#layout|layout}.
 *
 * @param {String} property - initializer for {@link
 * Layout#property|property}.  Unlike many other layouts, variant
 * layouts must include a property so they can be identified within
 * their containing @{link Union|Union}.
 *
 * @constructor
 * @augments {Layout} */
function VariantLayout (union,
                        variant,
                        layout,
                        property) {
    if (! (union instanceof Union)) {
        throw new TypeError("union must be a Union");
    }
    if ((! Number.isInteger(variant)) || (0 > variant)) {
        throw new TypeError("variant must be a non-negative integer");
    }
    if (! (layout instanceof Layout)) {
        throw new TypeError("layout must be a Layout");
    }
    if (layout.span > union.default_layout.span) {
        throw new Error("layout span exceeds content span of containing union");
    }
    if (typeof property != 'string') {
        throw new TypeError("variant must have a String property");
    }
    Layout.call(this, layout.span, property);
    if (union.usesPrefixDiscriminator) {
        this.span += union.discriminator.layout.span;
    }

    /** The {@link Union|Union} to which this variant belongs. */
    this.union = union;

    /** The unsigned integral value identifying this variant within
     * the {@link Union#discriminator|discriminator} of the containing
     * union. */
    this.variant = variant;

    /** The {@link Layout|Layout} to be used when reading/writing the
     * non-discriminator part of the {@link
     * VariantLayout#union|union}. */
    this.layout = layout;

    Object.freeze(this);
}
VariantLayout.prototype = Object.create(Layout.prototype);
VariantLayout.prototype.constructor = VariantLayout;
/** Implement {@link Layout#decode|decode} for {@link VariantLayout|VariantLayout}. */
VariantLayout.prototype.decode = function (b, offset) {
    var dest = {};
    if (undefined === offset) {
        offset = 0;
    }
    if (this !== this.union.getVariant(b, offset)) {
        throw new Error("variant mismatch");
    }
    var content_offset = 0;
    if (this.union.usesPrefixDiscriminator) {
        content_offset = this.union.discriminator.layout.span;
    }
    dest[this.property] = this.layout.decode(b, offset + content_offset);
    return dest;
};
/** Implement {@link Layout#encode|encode} for {@link VariantLayout|VariantLayout}. */
VariantLayout.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var content_offset = 0;
    if (this.union.usesPrefixDiscriminator) {
        content_offset = this.union.discriminator.layout.span;
    }
    if (! src.hasOwnProperty(this.property)) {
        throw new TypeError('variant lacks property ' + this.property);
    }
    this.union.discriminator.encode(this.variant, b, offset);
    this.layout.encode(src[this.property], b, offset + content_offset);
};
/** Delegate {@link Layout#fromArray|fromArray} to {@link
 * VariantLayout#layout|layout}. */
VariantLayout.prototype.fromArray = function (values) {
    return this.layout.fromArray(values);
};

/** JavaScript chose to define bitwise operations as operating on
 * signed 32-bit values in 2's complement form, meaning any integer
 * with bit 31 set is going to look negative.  For right shifts that's
 * not a problem, because `>>>` is a logical shift, but for every
 * other bitwise operator we have to compensate for possible negative
 * results. */
function fix_bw_result (v) {
    if (0 > v) {
        v += 0x100000000;
    }
    return v;
}

/** Contain a sequence of bit fields as an unsigned integer.
 *
 * This is a container element; within it there are {@link
 * BitField|BitField} instances that provide the extracted properties.
 * The container simply defines the aggregate representation and its
 * bit ordering.  The representation is an object containing
 * properties with numeric values.
 *
 * {@link BitField|BitField}s are added with the {@link
 * BitStructure#addField|addField} method.

 * @param {Layout} word - initializer for {@link
 * BitStructure#word|word}.  The parameter must be an instance of
 * {@link UInt|UInt} (or {@link UIntBE|UIntBE}) that is no more than 4
 * bytes wide.
 *
 * @param {bool} msb - `true` if the bit numbering starts at the most
 * significant bit of the containing word; `false` (default) if it
 * starts at the least significant bit of the containing word.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function BitStructure (word, msb, property) {
    if (! ((word instanceof UInt)
           || (word instanceof UIntBE))) {
        throw new TypeError("word must be a UInt or UIntBE layout");
    }
    if (4 < word.span) {
        throw new Error("word cannot exceed 32 bits");
    }
    Layout.call(this, word.span, property);

    /** The layout used for the packed value.  {@link
     * BitField|BitField} instances are packed sequentially depending
     * on {@link BitStructure#msb|msb}. */
    this.word = word;

    /** Whether the bit sequences are packed starting at the most
     * significant bit growing down (`true`), or the least significant
     * bit growing up (`false`).
     *
     * **NOTE** Regardless of this value, the least significant bit of
     * any {@link BitField|BitField} value is the least significant
     * bit of the corresponding section of the packed value. */
    this.msb = !!msb;

    /** The sequence of {@link BitField|BitField} layouts that
     * comprise the packed structure.
     *
     * **NOTE** The array remains mutable to allow fields to be {@link
     * BitStructure#addField|added} after construction.  Users should
     * not manipulate the content of this property.*/
    this.fields = [];

    /* Storage for the value.  This is not an instance property
     * because the layout is frozen to preserve structural
     * invariants, so we capture a variable instead. */
    var value = 0;
    this._packedSetValue = function (v) {
        value = fix_bw_result(v);
        return this;
    };
    this._packedGetValue = function () {
        return value;
    };

    Object.freeze(this);
}
BitStructure.prototype = Object.create(Layout.prototype);
BitStructure.prototype.constructor = BitStructure;
/** Implement {@link Layout#decode|decode} for {@link BitStructure|BitStructure}. */
BitStructure.prototype.decode = function (b, offset) {
    var dest = {};
    if (undefined === offset) {
        offset = 0;
    }
    var value = this.word.decode(b, offset);
    this._packedSetValue(value);
    this.fields.map(function (fd) {
        if (undefined !== fd.property) {
            dest[fd.property] = fd.decode(value);
        }
    });
    return dest;
};
/** Implement {@link Layout#encode|encode} for {@link BitStructure|BitStructure}.
 *
 * If `src` is missing a property for a member with a defined {@link
 * Layout#property|property} the corresponding region of the packed
 * value is left unmodified.  Unused bits are also left unmodified. */
BitStructure.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var value = this.word.decode(b, offset);
    this._packedSetValue(value);
    this.fields.forEach(function (fd) {
        if (undefined !== fd.property) {
            var fv = src[fd.property];
            if (undefined !== fv) {
                fd.encode(fv);
            }
        }
    });
    this.word.encode(this._packedGetValue(), b, offset);
};
/** Register a new bitfield with a containing bit structure.  The
 * resulting bitfield is returned.
 *
 * @param {Number} bits - initializer for {@link BitField#bits|bits}.
 *
 * @param {string} property - initializer for {@link
 * Layout#property|property}.
 *
 * @return {BitField} */
BitStructure.prototype.addField = function (bits, property) {
    var bf = new BitField(this, bits, property);
    this.fields.push(bf);
    return bf;
};

/** Represent a sequence of bits within a {@link
 * BitStructure|BitStructure}.
 *
 * All bit field values are represented as unsigned integers.
 *
 * **NOTE** User code should not invoke this construtor directly.  Use
 * the container {@link BitStructure#addField|addField} helper method.
 *
 * **NOTE** BitField instances are not instances of {@link
 * Layout|Layout} since {@link Layout#span|span} measures 8-bit units.
 *
 * @param {BitStructure} container - initializer for {@link
 * BitField#container|container}.
 *
 * @param {Number} bits - initializer for {@link BitField#bits|bits}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor */
function BitField (container, bits, property) {
    if (! (container instanceof BitStructure)) {
        throw new TypeError("container must be a BitStructure");
    }
    if ((! Number.isInteger(bits)) || (0 >= bits)) {
        throw new TypeError("bits must be positive integer");
    }
    var total_bits = 8 * container.span,
        used_bits = container.fields.reduce(function (c, fd) { return c + fd.bits; }, 0);
    if ((bits + used_bits) > total_bits) {
        throw new Error("bits too long for span remainder ("
                        + (total_bits - used_bits) + " of "
                        + total_bits + " remain)");
    }

    /** The {@link BitStructure|BitStructure} instance to which this
     * bit field belongs. */
    this.container = container;

    /** The span of this value in bits. */
    this.bits = bits;

    /** A mask of {@link BitField#bits|bits} bits isolating value bits
     * that fit within the field. */
    this.value_mask = (1 << bits) - 1;
    if (32 == bits) { // shifted value out of range
        this.value_mask = 0xFFFFFFFF;
    }

    /** The offset of the value within the containing packed unsigned
     * integer.  The least significant bit of the packed value is at
     * offset zero, regardless of bit ordering used. */
    this.start = used_bits;
    if (this.container.msb) {
        this.start = total_bits - used_bits - bits;
    }

    /** A mask of {@link BitField#bits|bits} isolating the field value
     * within the containing packed unsigned integer. */
    this.word_mask = fix_bw_result(this.value_mask << this.start);

    /** The property name used when this bitfield is represented in an
     * Object.
     *
     * Intended to be functionally equivalent to {@link
     * Layout#property}.
     *
     * If left undefined the corresponding span of bits will be
     * treated as padding: it will not be mutated by {@link
     * Layout#encode|encode} nor represented as a property in the
     * decoded Object. */
    this.property = property;
    Object.freeze(this);
}
/** Store a value into the corresponding subsequence of the containing
 * bit field. */
BitField.prototype.decode = function () {
    var word = this.container._packedGetValue(),
        word_value = fix_bw_result(word & this.word_mask),
        value = word_value >>> this.start;
    return value;
};
/** Store a value into the corresponding subsequence of the containing
 * bit field. */
BitField.prototype.encode = function (value) {
    if ((! Number.isInteger(value))
        || (value != fix_bw_result(value & this.value_mask))) {
        throw new Error("value must be integer not exceeding " + this.value_mask);
    }
    var word = this.container._packedGetValue(),
        word_value = fix_bw_result(value << this.start);
    this.container._packedSetValue(fix_bw_result(word & ~this.word_mask) | word_value);
};

/** Contain a fixed-length block of arbitrary data, represented as a
 * Buffer.
 *
 * @param {Number} length - the number of bytes in the blob.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Blob (length, property) {
    if (! Number.isInteger(length)) {
        throw new TypeError("length must be unsigned integer");
    }
    Layout.call(this, length, property);
    Object.freeze(this);
}
Blob.prototype = Object.create(Layout.prototype);
Blob.prototype.constructor = Blob;
/** Implement {@link Layout#decode|decode} for {@link Blob|Blob}. */
Blob.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.slice(offset, offset + this.getSpan(b, offset));
};
/** Implement {@link Layout#encode|encode} for {@link Blob|Blob}. */
Blob.prototype.encode = function (src, b, offset) {
    var span = this.getSpan(b, offset);
    if (! ((src instanceof Buffer)
           && (span === src.length))) {
        throw new Error("Blob.encode requires length " + span + " Buffer as src");
    }
    b.write(src.toString('hex'), offset, span, 'hex');
};

/** Contain a `NUL`-terminated UTF8 string.
 *
 * **NOTE** Any UTF8 string that incorporates a zero-valued byte will
 * not be correctly decoded by this layout.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function CString (property) {
    Layout.call(this, -1, property);
    Object.freeze(this);
}
CString.prototype = Object.create(Layout.prototype);
CString.prototype.constructor = CString;
/** Implement {@link Layout#getSpan|getSpan} for {@link CString|CString}. */
CString.prototype.getSpan = function (b, offset) {
    if (! (b instanceof Buffer)) {
        throw new TypeError("b must be a Buffer");
    }
    if (undefined === offset) {
        offset = 0;
    }
    var span = 0,
        idx = offset;
    while ((idx < b.length) && (0 !== b[idx])) {
        idx += 1;
    }
    return 1 + idx - offset;
};
/** Implement {@link Layout#decode|decode} for {@link CString|CString}. */
CString.prototype.decode = function (b, offset, dest) {
    if (undefined === offset) {
        offset = 0;
    }
    var span = this.getSpan(b, offset);
    return b.slice(offset, offset+span-1).toString('utf-8');
};
/** Implement {@link Layout#encode|encode} for {@link CString|CString}. */
CString.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    /* Must force this to a string, lest it be a number and the
     * "utf8-encoding" below actually allocate a buffer of length
     * src */
    if (! (src instanceof String)) {
        src = src.toString();
    }
    var srcb = new Buffer(src, 'utf8');
    var span = srcb.length;
    srcb.copy(b, offset);
    b[offset+span] = 0;
};

exports.Layout = Layout;
exports.OffsetLayout = OffsetLayout;
exports.UInt = UInt;
exports.UIntBE = UIntBE;
exports.Int = Int;
exports.IntBE = IntBE;
exports.Float = Float;
exports.FloatBE = FloatBE;
exports.Double = Double;
exports.DoubleBE = DoubleBE;
exports.Sequence = Sequence;
exports.Structure = Structure;
exports.UnionDiscriminator = UnionDiscriminator;
exports.UnionLayoutDiscriminator = UnionLayoutDiscriminator;
exports.Union = Union;
exports.VariantLayout = VariantLayout;
exports.BitStructure = BitStructure;
exports.BitField = BitField;
exports.Blob = Blob;
exports.CString = CString;

/** Factory for {@link OffsetLayout|OffsetLayout} */
exports.offset = function (layout, offset, property) { return new OffsetLayout(layout, offset, property); };

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

/** Factory for {@link Structure|Structure} values. */
exports.struct = function (fields, property) { return new Structure(fields, property); };

/** Factory for {@link BitStructure|BitStructure} values. */
exports.bits = function (word, msb, property) { return new BitStructure(word, msb, property); };

/** Factory for {@link Sequence|Sequence} values. */
exports.seq = function (elt_layout, count, property) { return new Sequence(elt_layout, count, property); };

/** Factory for {@link Union|Union} values. */
exports.union = function (discr, default_layout, property) { return new Union(discr, default_layout, property); };

/** Factory for {@link UnionLayoutDiscriminator|UnionLayoutDiscriminator} values. */
exports.unionLayoutDiscriminator = function (layout, offset, property) { return new UnionLayoutDiscriminator(layout, offset, property); };

/** Factory for {@link Blob|Blob} values. */
exports.blob = function (length, property) { return new Blob(length, property); };

/** Factory for {@link CString|CString} values. */
exports.cstr = function (property) { return new CString(property); };
