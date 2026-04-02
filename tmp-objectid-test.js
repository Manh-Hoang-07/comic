const { ObjectId } = require('bson');

const id1 = new ObjectId();
const id2Str = id1.toHexString();
const id2 = new ObjectId(id2Str);

console.log("id1:", id1);
console.log("id2:", id2);

console.log("id1 === id2 :", id1 === id2); // false (different object references)
console.log("id1.equals(id2) :", id1.equals(id2)); // true
console.log("String(id1) === String(id2) :", String(id1) === String(id2)); // true
console.log("String(id1) :", String(id1));
