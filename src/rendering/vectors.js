export class Vector3 {
    constructor (x, y, z) {
        this.x = x
        this.y = y
        this.z = z }

    clone () {
        return new Vector3 (this.x, this.y, this.z) }

    set (x, y, z) {
        this.x = x
        this.y = y
        this.z = z }

    add (vector) {
        this.x += vector.x
        this.y += vector.y
        this.z += vector.z
        return this }

    normalize () {
        let magnitude = Math.sqrt (this.x*this.x + this.y*this.y + this.z*this.z)
        this.x /= magnitude
        this.y /= magnitude
        this.z /= magnitude
        return this }

    applyAxisAngle () {
        return this }}


// Constants

export const UP = new Vector3 (0, 1, 0)
export const DOWN = new Vector3 (0, -1, 0)
export const ZERO = new Vector3 (0, 0, 0)
