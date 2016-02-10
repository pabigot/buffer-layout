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
 * * 64-bit integral values that decode to an exact (if magnitude is
 *   less than 2^53) or nearby integral Number in {@link
 *   module:Layout.nu64|unsigned little-endian}, {@link
 *   module:Layout.nu64be|unsigned big-endian}, {@link
 *   module:Layout.ns64|signed little-endian}, and {@link
 *   module:Layout.ns64be|unsigned big-endian} encodings;
 * * 32-bit floating point values with {@link
 *   module:Layout.f32|little-endian} and {@link
 *   module:Layout.f32be|big-endian} representations;
 * * 64-bit floating point values with {@link
 *   module:Layout.f64|little-endian} and {@link
 *   module:Layout.f64be|big-endian} representations;
 * * {@link module:Layout.const|Constants} that take no space in the
 *   encoded expression.
 *
 * and for these aggregate types:
 * * {@link module:Layout.seq|Sequence}s of instances of a {@link
 *   module:Layout~Layout|Layout}, with JavaScript representation as
 *   an Array and constant or data-dependent {@link
 *   module:Layout~Sequence#count|length};
 * * {@link module:Layout.struct|Structure}s that aggregate a
 *   heterogeneous sequence of {@link module:Layout~Layout|Layout}
 *   instances, with JavaScript representation as an Object;
 * * {@link module:Layout.union|Union}s that support multiple {@link
 *   module:Layout~VariantLayout|variant layouts} over a fixed
 *   (padded) or variable (not padded) span of bytes, using an
 *   unsigned integer at the start of the data or a separate {@link
 *   module:Layout.unionLayoutDiscriminator|layout element} to
 *   determine which layout to use when interpreting the buffer
 *   contents;
 * * {@link module:Layout.bits|BitStructure}s that contain a sequence
 *   of individual {@link
 *   module:Layout~BitStructure#addField|BitField}s packed into an 8,
 *   16, 24, or 32-bit unsigned integer starting at the least- or
 *   most-significant bit;
 * * {@link module:Layout.cstr|C strings} of varying length;
 * * {@link module:Layout.blob|Blobs} of fixed- or variable-{@link
 *   module:Layout~Blob#length|length} raw data.
 *
 * All {@link module:Layout~Layout|Layout} instances are immutable
 * after construction, to prevent internal state from becoming
 * inconsistent.
 *
 * @local Layout
 * @local ExternalLayout
 * @local GreedyCount
 * @local OffsetLayout
 * @local UInt
 * @local UIntBE
 * @local Int
 * @local IntBE
 * @local NearUInt64
 * @local NearUInt64BE
 * @local NearInt64
 * @local NearInt64BE
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
 * @local Boolean
 * @local Blob
 * @local CString
 * @local Constant
 * @module Layout
 * @license MIT
 * @author Peter A. Bigot
 * @see {@link https://github.com/pabigot/buffer-layout|buffer-layout on GitHub}
 */

/*jslint
    bitwise:true, this:true, white:true
 */
/*jshint -W034 */ // don't whine about explicit "use strict"
'use strict';

var assert = require('assert');

require('./patchIssue3992');

/* jscs:disable */
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
/* jscs:enable */

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
 * @param {Number} span - Initializer for {@link Layout#span|span}.  The
 * parameter must be an integer; a negative value signifies that the
 * span is {@link Layout#getSpan|value-specific}.
 *
 * @param {string} [property] - Initializer for {@link
 * Layout#property|property}.
 *
 * @param {string} [objectPrototype] - Initializer for {@link
 * Layout#objectPrototype|objectPrototype}.
 *
 * @constructor */
function Layout(span, property, objectPrototype) {
  if (!Number.isInteger(span)) {
    throw new TypeError('span must be an integer');
  }
  if (undefined === objectPrototype) {
    objectPrototype = Object.prototype;
  }
  if ('object' !== typeof objectPrototype) {
    throw new TypeError('Layout object prototype must be object');
  }

  /** The span of the layout in bytes.
   *
   * Positive values are generally expected.
   *
   * Zero will only appear in {@link Constant|Constant}s and in
   * {@link Sequence|Sequence}s where the {@link
   * Sequence#count|count} is zero.
   *
   * A negative value indicates that the span is value-specific, and
   * must be obtained using {@link Layout#getSpan|getSpan}. */
  this.span = span;

  /** The property name used when this layout is represented in an
   * Object.
   *
   * Used only for layouts that {@link Layout#decode|decode} to Object
   * instances.  If left undefined the span of the unnamed layout will
   * be treated as padding: it will not be mutated by {@link
   * Layout#encode|encode} nor represented as a property in the
   * decoded Object. */
  this.property = property;

  /** Prototype used when the layout is represented as an Object.
   *
   * Used only for layouts that {@link Layout#decode|decode} to Object
   * instances, which means:
   * * {@link Structure|Structure}
   * * {@link Union|Union}
   * * {@link VariantLayout|VariantLayout}
   * * {@link BitStructure|BitStructure}
   *
   * If left undefined the JavaScript representation of these layouts
   * will be Object instances. */
  this.objectPrototype = objectPrototype;
}

/** Decode from a Buffer into an JavaScript value.
 *
 * @param {Buffer} b - the buffer from which encoded data is read.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred.
 *
 * @returns {(Number|Array|Object)} - the value of the decoded data. */
Layout.prototype.decode = function() {
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
 * starts.  If absent a zero offset is inferred.
 *
 * @returns {Number} - the number of bytes encoded, including the
 * space skipped for internal padding, but excluding data such as
 * {@link Sequence#count|lengths} when stored {@link
 * ExternalLayout|externally}. */
Layout.prototype.encode = function() {
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
Layout.prototype.getSpan = function(b, offset) {
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
Layout.prototype.replicate = function(property) {
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
Layout.prototype.fromArray = function() {
  return undefined;
};

/** Store state in the class allowing it to encode/decode with a given
 * layout.
 *
 * Calling this function modifies `clazz` in three ways:
 *
 * * `clazz._layout` becomes a static member equal to `layout`;
 * * `clazz.decode(b, offset)` becomes a static member function equal
 *   to {@link Layout#decode|layout.decode};
 * * `clazz.prototype.encode(b, offset)` becomes an instance member
 *   function that invokes {@link Layout#encode|layout.encode}
 *   with `src` set to the instance through which it is called.
 *
 * @param {class} clazz - the constructor for a JavaScript class.
 *
 * @param {Layout} layout - the {@link Layout|Layout} instance used to
 * encode instances of `clazz`. */
exports.setClassLayout = function(clazz, layout) {
  clazz._layout = layout;
  clazz.prototype.encode = function(b, offset) {
    return layout.encode(this, b, offset);
  };
  clazz.decode = function(b, offset) {
    return layout.decode(b, offset);
  };
};

/** An object that behaves like a layout but does not consume space
 * within its containing layout.
 *
 * This is primarily used to obtain metadata about a member, such as a
 * {@link OffsetLayout} that can provide data about a {@link
 * Layout#getSpan|value-specific span}.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support {@link
 * ExternalLayout#isCount|isCount} or other {@link Layout|Layout}
 * functions.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout}
 */
function ExternalLayout(span, property) {
  Layout.call(this, span, property);
}
ExternalLayout.prototype = Object.create(Layout.prototype);
ExternalLayout.prototype.constructor = ExternalLayout;
/** Return `true` iff the external layout decodes to an unsigned
 * integer layout.
 *
 * In that case it can be used as the source of {@link
 * Sequence#count|Sequence counts}, {@link Blob#length|Blob lengths},
 * or as {@link UnionLayoutDiscriminator#layout|external union
 * discriminators}. */
ExternalLayout.prototype.isCount = function() {
  throw new Error('ExternalLayout is abstract');
};

/** An {@link ExternalLayout|ExternalLayout} that determines its
 * {@link Layout#decode|value} based on offset into and length of the
 * buffer on which it is invoked.
 *
 * *Factory*: {@link module:Layout.greedy|greedy}
 *
 * @param {Number} [elementSpan] - initializer for {@link
 * GreedyCount#elementSpan|elementSpan}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {ExternalLayout} */
function GreedyCount(elementSpan, property) {
  if (undefined === elementSpan) {
    elementSpan = 1;
  }
  if ((!Number.isInteger(elementSpan)) || (0 >= elementSpan)) {
    throw new TypeError('elementSpan must be a (positive) integer');
  }
  ExternalLayout.call(this, -1, property);

  /** The layout for individual elements of the sequence.  The value
   * must be a positive integer.  If not provided, the value will be
   * 1. */
  this.elementSpan = elementSpan;

  Object.freeze(this);
}
GreedyCount.prototype = Object.create(ExternalLayout.prototype);
GreedyCount.prototype.constructor = GreedyCount;
/** Implement {@link ExternalLayout#isCount|isCount} for {@link
 * GreedyCount|GreedyCount}. */
GreedyCount.prototype.isCount = function() {
  return true;
};
/** Implement {@link Layout#decode|decode} for {@link GreedyCount|GreedyCount}. */
GreedyCount.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var rem = b.length - offset;
  return Math.floor(rem / this.elementSpan);
};
/** Implement {@link Layout#encode|encode} for {@link GreedyCount|GreedyCount}. */
GreedyCount.prototype.encode = function(src, b, offset) {
  return 0;
};

/** An {@link ExternalLayout|ExternalLayout} that supports accessing a
 * {@link Layout|Layout} at a fixed offset from the start of another
 * Layout.  The offset may be before, within, or after the base
 * layout.
 *
 * *Factory*: {@link module:Layout.offset|offset}
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
function OffsetLayout(layout, offset, property) {
  if (!(layout instanceof Layout)) {
    throw new TypeError('layout must be a Layout');
  }

  if (undefined === offset) {
    offset = 0;
  } else if (!Number.isInteger(offset)) {
    throw new TypeError('offset must be integer or undefined');
  }

  ExternalLayout.call(this, layout.span, property || layout.property);

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
OffsetLayout.prototype = Object.create(ExternalLayout.prototype);
OffsetLayout.prototype.constructor = OffsetLayout;
/** Implement{@link ExternalLayout#isCount|isCount} for {@link
 * OffsetLayout|OffsetLayout}. */
OffsetLayout.prototype.isCount = function() {
  return ((this.layout instanceof UInt)
          || (this.layout instanceof UIntBE));
};
/** Implement {@link Layout#decode|decode} for {@link OffsetLayout|OffsetLayout}. */
OffsetLayout.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return this.layout.decode(b, offset + this.offset);
};
/** Implement {@link Layout#encode|encode} for {@link OffsetLayout|OffsetLayout}. */
OffsetLayout.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return this.layout.encode(src, b, offset + this.offset);
};

/** Represent an unsigned integer in little-endian format.
 *
 * *Factory*: {@link module:Layout.u8|u8}, {@link
 *  module:Layout.u16|u16}, {@link module:Layout.u24|u24}, {@link
 *  module:Layout.u32|u32}, {@link module:Layout.u40|u40}, {@link
 *  module:Layout.u48|u48}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function UInt(span, property) {
  Layout.call(this, span, property);
  if (6 < this.span) {
    throw new RangeError('span must not exceed 6 bytes');
  }
  Object.freeze(this);
}
UInt.prototype = Object.create(Layout.prototype);
UInt.prototype.constructor = UInt;
/** Implement {@link Layout#decode|decode} for {@link UInt|UInt}. */
UInt.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readUIntLE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link UInt|UInt}. */
UInt.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeUIntLE(src, offset, this.span);
  return this.span;
};

/** Represent an unsigned integer in big-endian format.
 *
 * *Factory*: {@link module:Layout.u8be|u8be}, {@link
 * module:Layout.u16be|u16be}, {@link module:Layout.u24be|u24be},
 * {@link module:Layout.u32be|u32be}, {@link
 * module:Layout.u40be|u40be}, {@link module:Layout.u48be|u48be}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function UIntBE(span, property) {
  Layout.call(this, span, property);
  if (6 < this.span) {
    throw new RangeError('span must not exceed 6 bytes');
  }
  Object.freeze(this);
}
UIntBE.prototype = Object.create(Layout.prototype);
UIntBE.prototype.constructor = UIntBE;
/** Implement {@link Layout#decode|decode} for {@link UIntBE|UIntBE}. */
UIntBE.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readUIntBE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link UIntBE|UIntBE}. */
UIntBE.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeUIntBE(src, offset, this.span);
  return this.span;
};

/** Represent a signed integer in little-endian format.
 *
 * *Factory*: {@link module:Layout.s8|s8}, {@link
 *  module:Layout.s16|s16}, {@link module:Layout.s24|s24}, {@link
 *  module:Layout.s32|s32}, {@link module:Layout.s40|s40}, {@link
 *  module:Layout.s48|s48}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Int(span, property) {
  Layout.call(this, span, property);
  if (6 < this.span) {
    throw new RangeError('span must not exceed 6 bytes');
  }
  Object.freeze(this);
}
Int.prototype = Object.create(Layout.prototype);
Int.prototype.constructor = Int;
/** Implement {@link Layout#decode|decode} for {@link Int|Int}. */
Int.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readIntLE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link Int|Int}. */
Int.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeIntLE(src, offset, this.span);
  return this.span;
};

/** Represent a signed integer in big-endian format.
 *
 * *Factory*: {@link module:Layout.s8be|s8be}, {@link
 * module:Layout.s16be|s16be}, {@link module:Layout.s24be|s24be},
 * {@link module:Layout.s32be|s32be}, {@link
 * module:Layout.s40be|s40be}, {@link module:Layout.s48be|s48be}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function IntBE(span, property) {
  Layout.call(this, span, property);
  if (6 < this.span) {
    throw new RangeError('span must not exceed 6 bytes');
  }
  Object.freeze(this);
}
IntBE.prototype = Object.create(Layout.prototype);
IntBE.prototype.constructor = IntBE;
/** Implement {@link Layout#decode|decode} for {@link IntBE|IntBE}. */
IntBE.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readIntBE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link IntBE|IntBE}. */
IntBE.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeIntBE(src, offset, this.span);
  return this.span;
};

var V2E32 = Math.pow(2, 32);
/* True modulus high and low 32-bit words, where low word is always
 * non-negative. */
function divmodInt64(src) {
  var hi32 = Math.floor(src / V2E32);
  var lo32 = src - (hi32 * V2E32);
  //assert.equal(roundedInt64(hi32, lo32), src);
  //assert(0 <= lo32);
  return {hi32: hi32,
           lo32: lo32};
}
/* Reconstruct Number from quotient and non-negative remainder */
function roundedInt64(hi32, lo32) {
  return hi32 * V2E32 + lo32;
}

/** Represent an unsigned 64-bit integer in little-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.nu64|nu64}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @constructor
 * @augments {Layout} */
function NearUInt64(property) {
  Layout.call(this, 8, property);
  Object.freeze(this);
}
NearUInt64.prototype = Object.create(Layout.prototype);
NearUInt64.prototype.constructor = NearUInt64;
/** Implement {@link Layout#decode|decode} for {@link NearUInt64|NearUInt64}. */
NearUInt64.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var lo32 = b.readUInt32LE(offset);
  var hi32 = b.readUInt32LE(offset + 4);
  return roundedInt64(hi32, lo32);
};
/** Implement {@link Layout#encode|encode} for {@link NearUInt64|NearUInt64}. */
NearUInt64.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var split = divmodInt64(src);
  b.writeUInt32LE(split.lo32, offset);
  b.writeUInt32LE(split.hi32, offset + 4);
  return 8;
};

/** Represent an unsigned 64-bit integer in big-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.nu64be|nu64be}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @constructor
 * @augments {Layout} */
function NearUInt64BE(property) {
  Layout.call(this, 8, property);
  Object.freeze(this);
}
NearUInt64BE.prototype = Object.create(Layout.prototype);
NearUInt64BE.prototype.constructor = NearUInt64BE;
/** Implement {@link Layout#decode|decode} for {@link NearUInt64BE|NearUInt64BE}. */
NearUInt64BE.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var hi32 = b.readUInt32BE(offset);
  var lo32 = b.readUInt32BE(offset + 4);
  return roundedInt64(hi32, lo32);
};
/** Implement {@link Layout#encode|encode} for {@link NearUInt64BE|NearUInt64BE}. */
NearUInt64BE.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var split = divmodInt64(src);
  b.writeUInt32BE(split.hi32, offset);
  b.writeUInt32BE(split.lo32, offset + 4);
  return 8;
};

/** Represent a signed 64-bit integer in little-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.ns64|ns64}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @constructor
 * @augments {Layout} */
function NearInt64(property) {
  Layout.call(this, 8, property);
  Object.freeze(this);
}
NearInt64.prototype = Object.create(Layout.prototype);
NearInt64.prototype.constructor = NearInt64;
/** Implement {@link Layout#decode|decode} for {@link NearInt64|NearInt64}. */
NearInt64.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var lo32 = b.readUInt32LE(offset);
  var hi32 = b.readInt32LE(offset + 4);
  return roundedInt64(hi32, lo32);
};
/** Implement {@link Layout#encode|encode} for {@link NearInt64|NearInt64}. */
NearInt64.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var split = divmodInt64(src);
  b.writeUInt32LE(split.lo32, offset);
  b.writeInt32LE(split.hi32, offset + 4);
  return 8;
};

/** Represent a signed 64-bit integer in big-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.ns64be|ns64be}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @constructor
 * @augments {Layout} */
function NearInt64BE(property) {
  Layout.call(this, 8, property);
  Object.freeze(this);
}
NearInt64BE.prototype = Object.create(Layout.prototype);
NearInt64BE.prototype.constructor = NearInt64BE;
/** Implement {@link Layout#decode|decode} for {@link NearInt64BE|NearInt64BE}. */
NearInt64BE.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var hi32 = b.readInt32BE(offset);
  var lo32 = b.readUInt32BE(offset + 4);
  return roundedInt64(hi32, lo32);
};
/** Implement {@link Layout#encode|encode} for {@link NearInt64BE|NearInt64BE}. */
NearInt64BE.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var split = divmodInt64(src);
  b.writeInt32BE(split.hi32, offset);
  b.writeUInt32BE(split.lo32, offset + 4);
  return 8;
};

/** Represent a 32-bit floating point number in little-endian format.
 *
 * *Factory*: {@link module:Layout.f32|f32}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Float(property) {
  Layout.call(this, 4, property);
  Object.freeze(this);
}
Float.prototype = Object.create(Layout.prototype);
Float.prototype.constructor = Float;
/** Implement {@link Layout#decode|decode} for {@link Float|Float}. */
Float.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readFloatLE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link Float|Float}. */
Float.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeFloatLE(src, offset);
  return 4;
};

/** Represent a 32-bit floating point number in big-endian format.
 *
 * *Factory*: {@link module:Layout.f32be|f32be}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function FloatBE(property) {
  Layout.call(this, 4, property);
  Object.freeze(this);
}
FloatBE.prototype = Object.create(Layout.prototype);
FloatBE.prototype.constructor = FloatBE;
/** Implement {@link Layout#decode|decode} for {@link FloatBE|FloatBE}. */
FloatBE.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readFloatBE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link FloatBE|FloatBE}. */
FloatBE.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeFloatBE(src, offset);
  return 4;
};

/** Represent a 64-bit floating point number in little-endian format.
 *
 * *Factory*: {@link module:Layout.f64|f64}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Double(property) {
  Layout.call(this, 8, property);
  Object.freeze(this);
}
Double.prototype = Object.create(Layout.prototype);
Double.prototype.constructor = Double;
/** Implement {@link Layout#decode|decode} for {@link Double|Double}. */
Double.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readDoubleLE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link Double|Double}. */
Double.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeDoubleLE(src, offset);
  return 8;
};

/** Represent a 64-bit floating point number in big-endian format.
 *
 * *Factory*: {@link module:Layout.f64be|f64be}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function DoubleBE(property) {
  Layout.call(this, 8, property);
  Object.freeze(this);
}
DoubleBE.prototype = Object.create(Layout.prototype);
DoubleBE.prototype.constructor = DoubleBE;
/** Implement {@link Layout#decode|decode} for {@link DoubleBE|DoubleBE}. */
DoubleBE.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  return b.readDoubleBE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link DoubleBE|DoubleBE}. */
DoubleBE.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  b.writeDoubleBE(src, offset);
  return 8;
};

/** Represent a contiguous sequence of a specific layout as an Array.
 *
 * *Factory*: {@link module:Layout.seq|seq}
 *
 * @param {Layout} elementLayout - initializer for {@link
 * Sequence#elementLayout|elementLayout}.
 *
 * @param {(Number|ExternalLayout)} count - initializer for {@link
 * Sequence#count|count}.  The parameter must be either a positive
 * integer or an instance of {@link ExternalLayout}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Sequence(elementLayout, count, property) {
  if (!(elementLayout instanceof Layout)) {
    throw new TypeError('elementLayout must be a Layout');
  }
  if (!(((count instanceof ExternalLayout) && count.isCount())
         || (Number.isInteger(count) && (0 <= count)))) {
    throw new TypeError('count must be non-negative integer '
                        + 'or an unsigned integer ExternalLayout');
  }
  var span = -1;
  if ((!(count instanceof ExternalLayout))
      && (0 < elementLayout.span)) {
    span = count * elementLayout.span;
  }

  Layout.call(this, span, property);

  /** The layout for individual elements of the sequence. */
  this.elementLayout = elementLayout;

  /** The number of elements in the sequence.
   *
   * This will be either a non-negative integer or an instance of
   * {@link ExternalLayout|ExternalLayout} for which {@link
   * ExternalLayout#isCount|isCount()} is `true`. */
  this.count = count;

  Object.freeze(this);
}
Sequence.prototype = Object.create(Layout.prototype);
Sequence.prototype.constructor = Sequence;
/** Implement {@link Layout#getSpan|getSpan} for {@link Sequence|Sequence}. */
Sequence.prototype.getSpan = function(b, offset) {
  if (0 <= this.span) {
    return this.span;
  }
  if (undefined === offset) {
    offset = 0;
  }
  var span = 0;
  var count = this.count;
  if (count instanceof ExternalLayout) {
    count = count.decode(b, offset);
  }
  if (0 < this.elementLayout.span) {
    span = count * this.elementLayout.span;
  } else {
    var idx = 0;
    while (idx < count) {
      var esp = this.elementLayout.getSpan(b, offset + span);
      span += esp;
      ++idx;
    }
  }
  return span;
};
/** Implement {@link Layout#decode|decode} for {@link Sequence|Sequence}. */
Sequence.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var rv = [];
  var i = 0;
  var count = this.count;
  if (count instanceof ExternalLayout) {
    count = count.decode(b, offset);
  }
  while (i < count) {
    rv.push(this.elementLayout.decode(b, offset));
    offset += this.elementLayout.getSpan(b, offset);
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
 * ExternalLayout|ExternalLayout} then the length of `src` will be
 * encoded as the count after `src` is encoded. */
Sequence.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var elo = this.elementLayout;
  var span = 0;
  src.forEach(function(v) {
    elo.encode(v, b, offset + span);
    span += elo.getSpan(b, offset + span);
  });
  if (this.count instanceof ExternalLayout) {
    this.count.encode(src.length, b, offset);
  }
  return span;
};

/** Represent a contiguous sequence of arbitrary layout elements as an
 * Object.
 *
 * *Factory*: {@link module:Layout.struct|struct}
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
 * @param {string} [objectPrototype] - Initializer for {@link
 * Layout#objectPrototype|objectPrototype}.
 *
 * @throws {Error} - if `fields` contains an unnamed variable-length
 * layout.
 *
 * @constructor
 * @augments {Layout} */
function Structure(fields, property, objectPrototype) {
  function allLayouts(v, fd) {
    return v && (fd instanceof Layout);
  }
  if ((!(fields instanceof Array))
      || (!fields.reduce(allLayouts, true))) {
    throw new TypeError('fields must be array of Layout instances');
  }

  /* Verify absence of unnamed variable-length fields. */
  fields.forEach(function(fd) {
    if ((0 > fd.span)
        && (undefined === fd.property)) {
      throw new Error('fields cannot contain unnamed variable-length layout');
    }
  });

  var span = -1;
  try {
    span = fields.reduce(function(v, fd) { return v + fd.getSpan(); }, 0);
  } catch (e) {
  }
  Layout.call(this, span, property, objectPrototype);

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
Structure.prototype.getSpan = function(b, offset) {
  if (0 <= this.span) {
    return this.span;
  }
  if (undefined === offset) {
    offset = 0;
  }
  var span = 0;
  try {
    span = this.fields.reduce(function(v, fd) {
      var fsp = fd.getSpan(b, offset);
      offset += fsp;
      return v + fsp;
    }, 0);
  } catch (e) {
    throw new RangeError('indeterminate span');
  }
  return span;
};
/** Implement {@link Layout#decode|decode} for {@link Structure|Structure}. */
Structure.prototype.decode = function(b, offset) {
  var dest = Object.create(this.objectPrototype);
  if (undefined === offset) {
    offset = 0;
  }
  this.fields.map(function(fd) {
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
Structure.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }

  var lastOffset = 0;
  var lastWrote = 0;
  this.fields.forEach(function(fd) {
    var span = fd.span;
    if (undefined === fd.property) {
      /* By construction the field must be fixed-length (because
       * unnamed variable-length fields are disallowed when
       * encoding).  But check it anyway. */
      assert(0 < span);
      lastWrote = span;
    } else {
      var fv = src[fd.property];
      if (undefined !== fv) {
        lastWrote = fd.encode(fv, b, offset);
        if (0 > span) {
          /* Read the as-encoded span, which is not necessarily the
           * same as what we wrote. */
          span = fd.getSpan(b, offset);
        }
      }
    }
    lastOffset = offset;
    offset += span;
  });
  return lastOffset + lastWrote;
};
/** Implement {@link Layout#fromArray|fromArray} for {@link
 * Structure|Structure}. */
Structure.prototype.fromArray = function(values) {
  var dest = Object.create(this.objectPrototype);
  this.fields.forEach(function(fd) {
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
function UnionDiscriminator(property) {
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
UnionDiscriminator.prototype.decode = function() {
  throw new Error('UnionDiscriminator is abstract');
};
/** Analog to {@link Layout#decode|Layout encode} for union discriminators.
 *
 * The implementation of this method need not store the value if
 * variant information is maintained through other means. */
UnionDiscriminator.prototype.encode = function() {
  throw new Error('UnionDiscriminator is abstract');
};

/** An object that can provide a {@link
 * UnionDiscriminator|discriminator API} for {@link Union|Union} using
 * an unsigned integral {@link Layout|Layout} instance located either
 * inside or outside the union.
 *
 * @param {ExternalLayout} layout - initializes {@link
 * UnionLayoutDiscriminator#layout|layout}.  Must satisfy {@link
 * ExternalLayout#isCount|isCount()}.
 *
 * @param {string} [property] - Default for {@link
 * UnionDiscriminator#property|property}, superseding the property
 * from `layout`, but defaulting to `variant` if neither `property`
 * nor layout provide a property name.
 *
 * @constructor
 * @augments {UnionDiscriminator} */
function UnionLayoutDiscriminator(layout, property) {
  if (!((layout instanceof ExternalLayout)
         && layout.isCount())) {
    throw new TypeError('layout must be an unsigned integer ExternalLayout');
  }

  /** The {@link ExternalLayout|ExternalLayout} used to access the
   * discriminator value. */
  this.layout = layout;

  UnionDiscriminator.call(this, property || layout.property || 'variant');

  Object.freeze(this);
}
UnionLayoutDiscriminator.prototype
  = Object.create(UnionDiscriminator.prototype);
UnionLayoutDiscriminator.prototype.constructor = UnionLayoutDiscriminator;
/** Delegate decoding to {@link UnionLayoutDiscriminator#layout|layout}. */
UnionLayoutDiscriminator.prototype.decode = function(b, offset) {
  return this.layout.decode(b, offset);
};
/** Delegate encoding to {@link UnionLayoutDiscriminator#layout|layout}. */
UnionLayoutDiscriminator.prototype.encode = function(src, b, offset) {
  return this.layout.encode(src, b, offset);
};

/** Represent any number of span-compatible layouts.
 *
 * *Factory*: {@link module:Layout.union|union}
 *
 * If the union has a {@link Union#defaultLayout|default layout} that
 * layout must have a non-negative {@link Layout#span|span}.  The span
 * of a fixed-span union includes its {@link
 * Union#discriminator|discriminator} if the variant is a {@link
 * Union#usesPrefixDiscriminator|prefix of the union}, plus the span
 * of its {@link Union#defaultLayout|default layout}.
 *
 * If the union does not have a default layout then the encoded span
 * of the union depends on the encoded span of its variant (which may
 * be fixed or variable).
 *
 * {@link VariantLayout#layout|Variant layout}s are added through
 * {@link Union#addVariant|addVariant}.  If the union has a default
 * layout, the span of the {@link VariantLayout#layout|layout
 * contained by the variant} must not exceed the span of the {@link
 * Union#defaultLayout|default layout} (minus the span of a {@link
 * Union#usesPrefixDiscriminator|prefix disriminator}, if used).  The
 * span of the variant will equal the span of the union itself.
 *
 * The variant for a buffer can only be identified from the {@link
 * Union#discriminator|discriminator} {@link
 * UnionDiscriminator#property|property} (in the case of the {@link
 * Union#defaultLayout|default layout}), or by using {@link
 * Union#getVariant|getVariant} and examining the resulting {@link
 * VariantLayout|VariantLayout} instance.
 *
 * A variant compatible with a JavaScript object can be identified
 * using {@link Union#getSourceVariant|getSourceVariant}.
 *
 * @param {(UnionDiscriminator|ExternalLayout|Layout)} discr - How to
 * identify the layout used to interpret the union contents.  The
 * parameter must be an instance of {@link
 * UnionDiscriminator|UnionDiscriminator}, an {@link
 * ExternalLayout|ExternalLayout} that satisfies {@link
 * ExternalLayout#isCount|isCount()}, or {@link UInt|UInt} (or {@link
 * UIntBE|UIntBE}).  When a non-external layout element is passed the
 * layout appears at the start of the union.  In all cases the
 * (synthesized) {@link UnionDiscriminator|UnionDiscriminator}
 * instance is recorded as {@link Union#discriminator|discriminator}.
 *
 * @param {(Layout|null)} defaultLayout - initializer for {@link
 * Union#defaultLayout|defaultLayout}.  If absent defaults to
 * `null`.  If `null` there is no default layout: the union has
 * data-dependent length and attempts to decode or encode unrecognized
 * variants will throw an exception.  A {@link Layout|Layout} instance
 * must have a non-negative {@link Layout#span|span}, and if it lacks
 * a {@link Layout#property|property} the {@link
 * Union#defaultLayout|defaultLayout} will be a {@link
 * Layout#replicate|replica} with property `content`.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @param {string} [objectPrototype] - Initializer for {@link
 * Layout#objectPrototype|objectPrototype}.
 *
 * @constructor
 * @augments {Layout} */
function Union(discr, defaultLayout, property, objectPrototype) {
  var upv = ((discr instanceof UInt)
             || (discr instanceof UIntBE));
  if (upv) {
    discr = new UnionLayoutDiscriminator(new OffsetLayout(discr));
  } else if ((discr instanceof ExternalLayout)
             && discr.isCount()) {
    discr = new UnionLayoutDiscriminator(discr);
  } else if (!(discr instanceof UnionDiscriminator)) {
    throw new TypeError('discr must be a UnionDiscriminator '
                        + 'or an unsigned integer layout');
  }
  if (undefined === defaultLayout) {
    defaultLayout = null;
  }
  if (!((null === defaultLayout)
         || (defaultLayout instanceof Layout))) {
    throw new TypeError('defaultLayout must be null or a Layout');
  }
  if (null !== defaultLayout) {
    if (0 > defaultLayout.span) {
      throw new Error('defaultLayout must have constant span');
    }
    if (undefined === defaultLayout.property) {
      defaultLayout = defaultLayout.replicate('content');
    }
  }

  /* The union span can be estimated only if there's a default
   * layout.  The union spans its default layout, plus any prefix
   * variant layout.  By construction both layouts, if present, have
   * non-negative span. */
  var span = -1;
  if (defaultLayout) {
    span = defaultLayout.span;
    if ((0 <= span) && upv) {
      span += discr.layout.span;
    }
  }
  Layout.call(this, span, property, objectPrototype);

  /** The interface for the discriminator value in isolation.
   *
   * This a {@link UnionDiscriminator|UnionDiscriminator} either
   * passed to the constructor or synthesized from the `discr`
   * constructor argument.  {@link
   * Union#usesPrefixDiscriminator|usesPrefixDiscriminator} will be
   * `true` iff the `discr` parameter was a non-offset {@link
   * Layout|Layout} instance. */
  this.discriminator = discr;

  /** `true` if the {@link Union#discriminator|discriminator} is the
   * first field in the union.
   *
   * If `false` the discriminator is obtained from somewhere
   * else. */
  this.usesPrefixDiscriminator = upv;

  /** The layout for non-discriminator content when the value of the
   * discriminator is not recognized.
   *
   * This is the value passed to the constructor.  It is
   * structurally equivalent to the second component of {@link
   * Union#layout|layout} but may have a different property
   * name. */
  this.defaultLayout = defaultLayout;

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

  /* Private variable used when invoking getSourceVariant */
  var boundGetSourceVariant = this.defaultGetSourceVariant.bind(this);

  /** Function to infer the variant selected by a source object.
   *
   * Defaults to {@link
   * Union#defaultGetSourceVariant|defaultGetSourceVariant} but may
   * be overridden using {@link
   * Union#configGetSourceVariant|configGetSourceVariant}.
   *
   * @param {Object} src - as with {@link
   * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
   *
   * @returns {(undefined|VariantLayout)} The default variant
   * (`undefined`) or first registered variant that uses a property
   * available in `src`. */
  this.getSourceVariant = function(src) { return boundGetSourceVariant(src); };

  /** Function to override the implementation of {@link
   * Union#getSourceVariant|getSourceVariant}.
   *
   * Use this if the desired variant cannot be identified using the
   * algorithm of {@link
   * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
   *
   * **NOTE** The provided function will be invoked bound to this
   * Union instance, providing local access to {@link
   * Union#registry|registry}.
   *
   * @param {Function} gsv - a function that follows the API of
   * {@link Union#defaultGetSourceVariant|defaultGetSourceVariant}. */
  this.configGetSourceVariant = function(gsv) {
    boundGetSourceVariant = gsv.bind(this);
  };

  Object.freeze(this);
}
Union.prototype = Object.create(Layout.prototype);
Union.prototype.constructor = Union;
/** Implement {@link Layout#getSpan|getSpan} for {@link Union|Uniont}. */
Union.prototype.getSpan = function(b, offset) {
  if (0 <= this.span) {
    return this.span;
  }
  if (undefined === offset) {
    offset = 0;
  }
  /* Default layouts always have non-negative span, so we don't have
   * one and we have to recognize the variant which will in turn
   * determine the span. */
  var vlo = this.getVariant(b, offset);
  if (!vlo) {
    throw new Error('unable to determine span for unrecognized variant');
  }
  return vlo.getSpan(b, offset);
};
/** Method to infer a registered Union variant compatible with `src`.
 *
 * @param {Object} src - an object presumed to be compatible with the content of the Union.
 *
 * @return {(undefined|VariantLayout)} - If `src` has properties
 * matching the Union discriminator and default layout properties this
 * returns `undefined`.  Otherwise, if `src` has a property matching a
 * {@link VariantLayout#property|variant property} that variant is
 * returned.  Otherwise an error is thrown.
 *
 * @throws {Error} - if `src` cannot be associated with a default or
 * registered variant. */
Union.prototype.defaultGetSourceVariant = function(src) {
  if (src.hasOwnProperty(this.discriminator.property)
      && src.hasOwnProperty(this.defaultLayout.property)) {
    return undefined;
  }
  for (var k in this.registry) {
    var lo = this.registry[k];
    if (src.hasOwnProperty(lo.property)) {
      return lo;
    }
  }
  throw new Error('unable to infer src variant');
};
/** Implement {@link Layout#decode|decode} for {@link Union|Union}.
 *
 * If the variant is {@link Union#addVariant|registered} the return
 * value is an instance of that variant, with no explicit
 * discriminator.  Otherwise the {@link Union#defaultLayout|default
 * layout} is used to decode the content. */
Union.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var dest;
  var dlo = this.discriminator;
  var discr = dlo.decode(b, offset);
  var clo = this.registry[discr];
  if (undefined === clo) {
    var contentOffset = 0;
    clo = this.defaultLayout;
    if (this.usesPrefixDiscriminator) {
      contentOffset = dlo.layout.span;
    }
    dest = Object.create(this.objectPrototype);
    dest[dlo.property] = discr;
    dest[clo.property] = this.defaultLayout.decode(b, offset + contentOffset);
  } else {
    dest = clo.decode(b, offset);
  }
  return dest;
};
/** Implement {@link Layout#encode|encode} for {@link Union|Union}.
 *
 * This API assumes the `src` object is consistent with the union's
 * {@link Union#defaultLayout|default layout}.  To encode variants
 * use the appropriate variant-specific {@link VariantLayout#encode}
 * method. */
Union.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var vlo = this.getSourceVariant(src);
  if (undefined === vlo) {
    var dlo = this.discriminator;
    var clo = this.defaultLayout;
    var contentOffset = 0;
    if (this.usesPrefixDiscriminator) {
      contentOffset = dlo.layout.span;
    }
    dlo.encode(src[dlo.property], b, offset);
    return contentOffset + clo.encode(src[clo.property], b,
                                      offset + contentOffset);
  }
  return vlo.encode(src, b, offset);
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
 * @param {string} [objectPrototype] - Initializer for {@link
 * Layout#objectPrototype|objectPrototype}.
 *
 * @return {VariantLayout} */
Union.prototype.addVariant = function(variant, layout, property,
                                      objectPrototype) {
  var rv = new VariantLayout(this, variant, layout, property, objectPrototype);
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
Union.prototype.getVariant = function(vb, offset) {
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
 * @param {string} [objectPrototype] - Initializer for {@link
 * Layout#objectPrototype|objectPrototype}.
 *
 * @constructor
 * @augments {Layout} */
function VariantLayout(union, variant, layout, property, objectPrototype) {
  if (!(union instanceof Union)) {
    throw new TypeError('union must be a Union');
  }
  if ((!Number.isInteger(variant)) || (0 > variant)) {
    throw new TypeError('variant must be a (non-negative) integer');
  }
  if (!(layout instanceof Layout)) {
    throw new TypeError('layout must be a Layout');
  }
  if ((null !== union.defaultLayout)
      && (0 <= layout.span)
      && (layout.span > union.defaultLayout.span)) {
    throw new Error('variant span exceeds span of containing union');
  }
  if (typeof property != 'string') {
    throw new TypeError('variant must have a String property');
  }
  var span = union.span;
  if (0 > union.span) {
    span = layout.span;
    if ((0 <= span) && union.usesPrefixDiscriminator) {
      span += union.discriminator.layout.span;
    }
  }
  Layout.call(this, span, property, objectPrototype);

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
/** Implement {@link Layout#getSpan|getSpan} for {@link VariantLayout|VariantLayout}. */
VariantLayout.prototype.getSpan = function(b, offset) {
  if (0 <= this.span) {
    /* Will be equal to the containing union span if that is not
     * variable. */
    return this.span;
  }
  if (undefined === offset) {
    offset = 0;
  }
  var contentOffset = 0;
  if (this.union.usesPrefixDiscriminator) {
    contentOffset = this.union.discriminator.layout.span;
  }
  /* Span is defined solely by the variant (and prefix discriminator) */
  return contentOffset + this.layout.getSpan(b, offset + contentOffset);
};

/** Implement {@link Layout#decode|decode} for {@link VariantLayout|VariantLayout}. */
VariantLayout.prototype.decode = function(b, offset) {
  var dest = Object.create(this.objectPrototype);
  if (undefined === offset) {
    offset = 0;
  }
  if (this !== this.union.getVariant(b, offset)) {
    throw new Error('variant mismatch');
  }
  var contentOffset = 0;
  if (this.union.usesPrefixDiscriminator) {
    contentOffset = this.union.discriminator.layout.span;
  }
  dest[this.property] = this.layout.decode(b, offset + contentOffset);
  return dest;
};
/** Implement {@link Layout#encode|encode} for {@link VariantLayout|VariantLayout}. */
VariantLayout.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var contentOffset = 0;
  var clo = this.union.defaultLayout;
  if (this.union.usesPrefixDiscriminator) {
    contentOffset = this.union.discriminator.layout.span;
  }
  if (!src.hasOwnProperty(this.property)) {
    throw new TypeError('variant lacks property ' + this.property);
  }
  this.union.discriminator.encode(this.variant, b, offset);
  this.layout.encode(src[this.property], b, offset + contentOffset);
  var span = contentOffset + this.layout.getSpan(b, offset + contentOffset);
  if ((0 <= this.union.span)
      && (span > this.union.span)) {
    throw new Error('encoded variant overruns containing union');
  }
  return span;
};
/** Delegate {@link Layout#fromArray|fromArray} to {@link
 * VariantLayout#layout|layout}. */
VariantLayout.prototype.fromArray = function(values) {
  return this.layout.fromArray(values);
};

/** JavaScript chose to define bitwise operations as operating on
 * signed 32-bit values in 2's complement form, meaning any integer
 * with bit 31 set is going to look negative.  For right shifts that's
 * not a problem, because `>>>` is a logical shift, but for every
 * other bitwise operator we have to compensate for possible negative
 * results. */
function fixBitwiseResult(v) {
  if (0 > v) {
    v += 0x100000000;
  }
  return v;
}

/** Contain a sequence of bit fields as an unsigned integer.
 *
 * *Factory*: {@link module:Layout.bits|bits}
 *
 * This is a container element; within it there are {@link
 * BitField|BitField} instances that provide the extracted properties.
 * The container simply defines the aggregate representation and its
 * bit ordering.  The representation is an object containing
 * properties with numeric or {@link Boolean|boolean} values.
 *
 * {@link BitField|BitField}s are added with the {@link
 * BitStructure#addField|addField} and {@link
 * BitStructure#addBoolean|addBoolean} methods.

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
 * @param {string} [objectPrototype] - Initializer for {@link
 * Layout#objectPrototype|objectPrototype}.
 *
 * @constructor
 * @augments {Layout} */
function BitStructure(word, msb, property, objectPrototype) {
  if (!((word instanceof UInt)
         || (word instanceof UIntBE))) {
    throw new TypeError('word must be a UInt or UIntBE layout');
  }
  if (4 < word.span) {
    throw new RangeError('word cannot exceed 32 bits');
  }
  Layout.call(this, word.span, property, objectPrototype);

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
  this._packedSetValue = function(v) {
    value = fixBitwiseResult(v);
    return this;
  };
  this._packedGetValue = function() {
    return value;
  };

  Object.freeze(this);
}
BitStructure.prototype = Object.create(Layout.prototype);
BitStructure.prototype.constructor = BitStructure;
/** Implement {@link Layout#decode|decode} for {@link BitStructure|BitStructure}. */
BitStructure.prototype.decode = function(b, offset) {
  var dest = Object.create(this.objectPrototype);
  if (undefined === offset) {
    offset = 0;
  }
  var value = this.word.decode(b, offset);
  this._packedSetValue(value);
  this.fields.map(function(fd) {
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
BitStructure.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var value = this.word.decode(b, offset);
  this._packedSetValue(value);
  this.fields.forEach(function(fd) {
    if (undefined !== fd.property) {
      var fv = src[fd.property];
      if (undefined !== fv) {
        fd.encode(fv);
      }
    }
  });
  return this.word.encode(this._packedGetValue(), b, offset);
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
BitStructure.prototype.addField = function(bits, property) {
  var bf = new BitField(this, bits, property);
  this.fields.push(bf);
  return bf;
};
/** As with {@link BitStructure#addField|addField} for single-bit
 * fields with `boolean` value representation.
 *
 * @param {string} property - initializer for {@link
 * Layout#property|property}.
 *
 * @return {Boolean} */
BitStructure.prototype.addBoolean = function(property) {
  var bf = new Boolean(this, property);
  this.fields.push(bf);
  return bf;
};

/** Represent a sequence of bits within a {@link
 * BitStructure|BitStructure}.
 *
 * All bit field values are represented as unsigned integers.
 *
 * **NOTE** User code should not invoke this constructor directly.
 * Use the container {@link BitStructure#addField|addField} helper
 * method.
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
function BitField(container, bits, property) {
  if (!(container instanceof BitStructure)) {
    throw new TypeError('container must be a BitStructure');
  }
  if ((!Number.isInteger(bits)) || (0 >= bits)) {
    throw new TypeError('bits must be positive integer');
  }
  var totalBits = 8 * container.span;
  function bitsSum(c, fd) { return c + fd.bits; }
  var usedBits = container.fields.reduce(bitsSum, 0);
  if ((bits + usedBits) > totalBits) {
    throw new Error('bits too long for span remainder ('
                    + (totalBits - usedBits) + ' of '
                    + totalBits + ' remain)');
  }

  /** The {@link BitStructure|BitStructure} instance to which this
   * bit field belongs. */
  this.container = container;

  /** The span of this value in bits. */
  this.bits = bits;

  /** A mask of {@link BitField#bits|bits} bits isolating value bits
   * that fit within the field. */
  this.valueMask = (1 << bits) - 1;
  if (32 == bits) { // shifted value out of range
    this.valueMask = 0xFFFFFFFF;
  }

  /** The offset of the value within the containing packed unsigned
   * integer.  The least significant bit of the packed value is at
   * offset zero, regardless of bit ordering used. */
  this.start = usedBits;
  if (this.container.msb) {
    this.start = totalBits - usedBits - bits;
  }

  /** A mask of {@link BitField#bits|bits} isolating the field value
   * within the containing packed unsigned integer. */
  this.wordMask = fixBitwiseResult(this.valueMask << this.start);

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
BitField.prototype.decode = function() {
  var word = this.container._packedGetValue();
  var wordValue = fixBitwiseResult(word & this.wordMask);
  var value = wordValue >>> this.start;
  return value;
};
/** Store a value into the corresponding subsequence of the containing
 * bit field.
 *
 * **NOTE** This is not a specialization of {@link
 * Layout#encode|Layout.encode} and there is no return value. */
BitField.prototype.encode = function(value) {
  if ((!Number.isInteger(value))
      || (value != fixBitwiseResult(value & this.valueMask))) {
    throw new Error('value must be integer not exceeding ' + this.valueMask);
  }
  var word = this.container._packedGetValue();
  var wordValue = fixBitwiseResult(value << this.start);
  this.container._packedSetValue(fixBitwiseResult(word & ~this.wordMask)
                                 | wordValue);
};

/** Represent a single bit within a {@link
 * BitStructure|BitStructure} as a JavaScript boolean.
 *
 * **NOTE** User code should not invoke this constructor directly.
 * Use the container {@link BitStructure#addBoolean|addBoolean} helper
 * method.
 *
 * @param {BitStructure} container - initializer for {@link
 * BitField#container|container}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {BitField}
 */
function Boolean(container, property) {
  BitField.call(this, container, 1, property);
};
Boolean.prototype = Object.create(BitField.prototype);
Boolean.prototype.constructor = Boolean;
/** Override {@link BitField#decode|decode} for {@link Boolean|Boolean}.
 *
 * @returns {boolean} */
Boolean.prototype.decode = function(b, offset) {
  return !!BitField.prototype.decode.call(this, b, offset);
};
/* There is no override for Boolean.encode since the `src` parameter
 * is interpreted as truthy. */

/** Contain a fixed-length block of arbitrary data, represented as a
 * Buffer.
 *
 * *Factory*: {@link module:Layout.blob|blob}
 *
 * @param {(Number|ExternalLayout)} length - initializes {@link
 * Blob#length|length}.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Blob(length, property) {
  if (!(((length instanceof ExternalLayout) && length.isCount())
         || (Number.isInteger(length) && (0 <= length)))) {
    throw new TypeError('length must be positive integer '
                        + 'or an unsigned integer ExternalLayout');
  }

  /** The number of bytes in the blob.
   *
   * This may be a non-negative integer, or an instance of {@link
   * ExternalLayout|ExternalLayout} that satisfies {@link
   * ExternalLayout#isCount|isCount()}. */
  this.length = length;

  var span = -1;
  if (!(length instanceof ExternalLayout)) {
    span = length;
  }
  Layout.call(this, span, property);
  Object.freeze(this);
}
Blob.prototype = Object.create(Layout.prototype);
Blob.prototype.constructor = Blob;
/** Implement {@link Layout#getSpan|getSpan} for {@link Blob|Blob}. */
Blob.prototype.getSpan = function(b, offset) {
  var span = this.span;
  if (0 > span) {
    span = this.length.decode(b, offset);
  }
  return span;
};
/** Implement {@link Layout#decode|decode} for {@link Blob|Blob}. */
Blob.prototype.decode = function(b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  var span = this.span;
  if (0 > span) {
    span = this.length.decode(b, offset);
  }
  return b.slice(offset, offset + span);
};
/** Implement {@link Layout#encode|encode} for {@link Blob|Blob}.
 *
 * **NOTE** If {@link Layout#count|count} is an instance of {@link
 * ExternalLayout|ExternalLayout} then the length of `src` will be encoded
 * as the count after `src` is encoded. */
Blob.prototype.encode = function(src, b, offset) {
  var span = this.length;
  if (this.length instanceof ExternalLayout) {
    span = src.length;
  }
  if (!((src instanceof Buffer)
         && (span === src.length))) {
    throw new Error('Blob.encode requires (length ' + span + ') Buffer as src');
  }
  if ((offset + span) > b.length) {
    throw new RangeError('encoding overruns Buffer');
  }
  b.write(src.toString('hex'), offset, span, 'hex');
  if (this.length instanceof ExternalLayout) {
    this.length.encode(span, b, offset);
  }
  return span;
};

/** Contain a `NUL`-terminated UTF8 string.
 *
 * *Factory*: {@link module:Layout.cstr|cstr}
 *
 * **NOTE** Any UTF8 string that incorporates a zero-valued byte will
 * not be correctly decoded by this layout.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function CString(property) {
  Layout.call(this, -1, property);
  Object.freeze(this);
}
CString.prototype = Object.create(Layout.prototype);
CString.prototype.constructor = CString;
/** Implement {@link Layout#getSpan|getSpan} for {@link CString|CString}. */
CString.prototype.getSpan = function(b, offset) {
  if (!(b instanceof Buffer)) {
    throw new TypeError('b must be a Buffer');
  }
  if (undefined === offset) {
    offset = 0;
  }
  var span = 0;
  var idx = offset;
  while ((idx < b.length) && (0 !== b[idx])) {
    idx += 1;
  }
  return 1 + idx - offset;
};
/** Implement {@link Layout#decode|decode} for {@link CString|CString}. */
CString.prototype.decode = function(b, offset, dest) {
  if (undefined === offset) {
    offset = 0;
  }
  var span = this.getSpan(b, offset);
  return b.slice(offset, offset + span - 1).toString('utf-8');
};
/** Implement {@link Layout#encode|encode} for {@link CString|CString}. */
CString.prototype.encode = function(src, b, offset) {
  if (undefined === offset) {
    offset = 0;
  }
  /* Must force this to a string, lest it be a number and the
   * "utf8-encoding" below actually allocate a buffer of length
   * src */
  if ('string' !== typeof src) {
    src = src.toString();
  }
  var srcb = new Buffer(src, 'utf8');
  var span = srcb.length;
  if ((offset + span) > b.length) {
    throw new RangeError('encoding overruns Buffer');
  }
  srcb.copy(b, offset);
  b[offset + span] = 0;
  return span + 1;
};

/** Contain a constant value.
 *
 * This layout may be used in cases where a JavaScript value can be
 * inferred without an expression in the binary encoding.  An example
 * would be a {@link VariantLayout|variant layout} where the content
 * is implied by the union {@link Union#discriminator|discriminator}.
 *
 * @param value - initializer for {@link Constant#value|value}.  If
 * the value is an object (or array) and the application intends the
 * object to remain unchanged regardless of what is done to values
 * decoded by this layout, the value should be frozen prior passing it
 * to this constructor.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Constant(value, property) {
  /** The value produced by this constant when the layout is {@link
   * Constant#decode|decoded}.
   *
   * Any JavaScript value including `null` and `undefined` is
   * permitted.
   *
   * **WARNING** If `value` passed in the constructor was not
   * frozen, it is possible for users of decoded values to change
   * the content of the value. */
  this.value = value;
  Layout.call(this, 0, property);
  Object.freeze(this);
}
Constant.prototype = Object.create(Layout.prototype);
Constant.prototype.constructor = Constant;
/** Implement {@link Layout#decode|decode} for {@link Constant|Constant}. */
Constant.prototype.decode = function(b, offset, dest) {
  return this.value;
};
/** Implement {@link Layout#encode|encode} for {@link Constant|Constant}. */
Constant.prototype.encode = function(src, b, offset) {
  /* Constants take no space */
  return 0;
};

exports.Layout = Layout;
exports.ExternalLayout = ExternalLayout;
exports.GreedyCount = GreedyCount;
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
exports.Boolean = Boolean;
exports.Blob = Blob;
exports.CString = CString;
exports.Constant = Constant;

/** Factory for {@link GreedyCount|GreedyCount}. */
exports.greedy = function(elementSpan, property) {
  return new GreedyCount(elementSpan, property);
};

/** Factory for {@link OffsetLayout|OffsetLayout}. */
exports.offset = function(layout, offset, property) {
  return new OffsetLayout(layout, offset, property);
};

/** Factory for {@link UInt|unsigned int layouts} spanning one
 * byte. */
exports.u8 = function(property) {
  return new UInt(1, property);
};

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning two bytes. */
exports.u16 = function(property) {
  return new UInt(2, property);
};

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning three bytes. */
exports.u24 = function(property) {
  return new UInt(3, property);
};

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning four bytes. */
exports.u32 = function(property) {
  return new UInt(4, property);
};

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning five bytes. */
exports.u40 = function(property) {
  return new UInt(5, property);
};

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning six bytes. */
exports.u48 = function(property) {
  return new UInt(6, property);
};

/** Factory for {@link NearUInt64|little-endian unsigned int
 * layouts} interpreted as Numbers. */
exports.nu64 = function(property) {
  return new NearUInt64(property);
};

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning two bytes. */
exports.u16be = function(property) {
  return new UIntBE(2, property);
};

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning three bytes. */
exports.u24be = function(property) {
  return new UIntBE(3, property);
};

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning four bytes. */
exports.u32be = function(property) {
  return new UIntBE(4, property);
};

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning five bytes. */
exports.u40be = function(property) {
  return new UIntBE(5, property);
};

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning six bytes. */
exports.u48be = function(property) {
  return new UIntBE(6, property);
};

/** Factory for {@link NearUInt64BE|big-endian unsigned int
 * layouts} interpreted as Numbers. */
exports.nu64be = function(property) {
  return new NearUInt64BE(property);
};

/** Factory for {@link Int|signed int layouts} spanning one
 * byte. */
exports.s8 = function(property) {
  return new Int(1, property);
};

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning two bytes. */
exports.s16 = function(property) {
  return new Int(2, property);
};

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning three bytes. */
exports.s24 = function(property) {
  return new Int(3, property);
};

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning four bytes. */
exports.s32 = function(property) {
  return new Int(4, property);
};

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning five bytes. */
exports.s40 = function(property) {
  return new Int(5, property);
};

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning six bytes. */
exports.s48 = function(property) {
  return new Int(6, property);
};

/** Factory for {@link NearInt64|little-endian signed int layouts}
 * interpreted as Numbers. */
exports.ns64 = function(property) {
  return new NearInt64(property);
};

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning two bytes. */
exports.s16be = function(property) {
  return new IntBE(2, property);
};

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning three bytes. */
exports.s24be = function(property) {
  return new IntBE(3, property);
};

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning four bytes. */
exports.s32be = function(property) {
  return new IntBE(4, property);
};

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning five bytes. */
exports.s40be = function(property) {
  return new IntBE(5, property);
};

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning six bytes. */
exports.s48be = function(property) {
  return new IntBE(6, property);
};

/** Factory for {@link NearInt64BE|big-endian signed int layouts}
 * interpreted as Numbers. */
exports.ns64be = function(property) {
  return new NearInt64BE(property);
};

/** Factory for {@link Float|little-endian 32-bit floating point} values. */
exports.f32 = function(property) {
  return new Float(property);
};

/** Factory for {@link FloatBE|big-endian 32-bit floating point} values. */
exports.f32be = function(property) {
  return new FloatBE(property);
};

/** Factory for {@link Double|little-endian 64-bit floating point} values. */
exports.f64 = function(property) {
  return new Double(property);
};

/** Factory for {@link DoubleBE|big-endian 64-bit floating point} values. */
exports.f64be = function(property) {
  return new DoubleBE(property);
};

/** Factory for {@link Structure|Structure} values. */
exports.struct = function(fields, property, objectPrototype) {
  return new Structure(fields, property, objectPrototype);
};

/** Factory for {@link BitStructure|BitStructure} values. */
exports.bits = function(word, msb, property, objectPrototype) {
  return new BitStructure(word, msb, property, objectPrototype);
};

/** Factory for {@link Sequence|Sequence} values. */
exports.seq = function(elementLayout, count, property) {
  return new Sequence(elementLayout, count, property);
};

/** Factory for {@link Union|Union} values. */
exports.union = function(discr, defaultLayout, property, objectPrototype) {
  return new Union(discr, defaultLayout, property, objectPrototype);
};

/** Factory for {@link UnionLayoutDiscriminator|UnionLayoutDiscriminator} values. */
exports.unionLayoutDiscriminator = function(layout, property) {
  return new UnionLayoutDiscriminator(layout, property);
};

/** Factory for {@link Blob|Blob} values. */
exports.blob = function(length, property) {
  return new Blob(length, property);
};

/** Factory for {@link CString|CString} values. */
exports.cstr = function(property) {
  return new CString(property);
};

/** Factory for {@link Constant|Constant} values. */
exports.const = function(value, property) {
  return new Constant(value, property);
};
