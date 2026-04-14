// Add BigInt serialization support for Jest reports
if (!Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}
