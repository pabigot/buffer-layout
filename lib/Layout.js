/** Support for translating between Buffer instances and Objects.
 *
 * {@link module:Layout~Layout|Layout} is the basis of a class
 * hierarchy that associates property names with sequences of encoded
 * bytes.
 *
 * @local Layout
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

/** Decode from a Buffer into an Object.
 *
 * @param {Buffer} b - the buffer from which encoded data is read.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred.
 *
 * @param {Object} [dest] - an optional object to which the layout
 * properties are assigned.  If absent, the properties are assigned to
 * an empty object.
 *
 * @returns {Object} - the object into which properties were stored. */
Layout.prototype.decode = function () {
    throw new Error('Layout is abstract');
};

/** Encode an Object into a Buffer.
 *
 * @param {Object} src - the object from which layout properties are read.
 *
 * @param {Buffer} b - the buffer into which encoded data will be written.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred. */
Layout.prototype.encode = function () {
    throw new Error('Layout is abstract');
};

exports.Layout = Layout;
