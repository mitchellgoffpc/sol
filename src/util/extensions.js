import { Vector3 } from 'three'


// Math extensions
Math.clamp = (x, a, b) => Math.max (a, Math.min (b, x))


// Vector3 extensions
Vector3.prototype.addX = function (x) {
    this.x += x
    return this }

Vector3.prototype.addY = function (y) {
    this.y += y
    return this }

Vector3.prototype.addZ = function (z) {
    this.z += z
    return this }
