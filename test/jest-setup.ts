
// Add BigInt serialization support for Jest reports
if (!BigInt.prototype.hasOwnProperty('toJSON')) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}
