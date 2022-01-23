import { Vector3 } from 'three'


// Math extensions
Math.clamp = (x, a, b) => Math.max (a, Math.min (b, x))
Math.rad2deg = x => x / Math.PI * 180
Math.deg2rad = x => x / 180 * Math.PI


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
