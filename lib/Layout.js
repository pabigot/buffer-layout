/** Buffer Layout module
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

function Layout(span, property) {
    if ((! Number.isInteger(span)) || (0 >= span)) {
        throw new TypeError("span must be positive integer");
    }
    this.span = span;
    this.property = property;
}

exports.Layout = Layout;
