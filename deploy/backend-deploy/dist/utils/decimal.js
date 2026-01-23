"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalToNumber = decimalToNumber;
exports.decimalToString = decimalToString;
function decimalToNumber(value) {
    if (value === null || value === undefined)
        return 0;
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string')
        return Number(value);
    if (typeof value === 'object') {
        const maybeDecimal = value;
        if (typeof maybeDecimal.toNumber === 'function')
            return maybeDecimal.toNumber();
        return Number(maybeDecimal.toString());
    }
    return Number(value);
}
function decimalToString(value) {
    if (value === null || value === undefined)
        return '0';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number')
        return value.toString();
    if (typeof value === 'object')
        return value.toString();
    return String(value);
}
//# sourceMappingURL=decimal.js.map