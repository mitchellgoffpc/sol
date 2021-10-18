import { mat4 } from 'gl-matrix'
import { ZERO } from 'rendering/vectors'


export class BufferAttribute {
    constructor (data, stride) {
        this.data = data
        this.stride = stride
        this.initialized = false }

    initialize (gl) {
        this.initialized = true
        this.buffer = gl.createBuffer ()
        gl.bindBuffer (gl.ARRAY_BUFFER, this.buffer)
        gl.bufferData (gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW) }

    getNumElements () {
        return Math.floor (this.data.length / this.stride) }}


export class BufferGeometry {
    constructor () {
        this.attributes = {}}

    setAttribute (name, attribute) {
        this.attributes[name] = attribute }

    getNumVertices () {
        return this.attributes.position.getNumElements () }}


export class Mesh {
    constructor (geometry, material) {
        this.geometry = geometry
        this.material = material
        this.transformMatrix = mat4.create () }

    setPosition (x, y, z) {
        mat4.translate (this.transformMatrix, this.transformMatrix, [x, y, z]) }

    draw (gl, programInfo, camera) {
        for (let key in this.geometry.attributes) {
            let attribute = this.geometry.attributes[key]
            if (!attribute.initialized) {
                attribute.initialize (gl) }

            gl.bindBuffer (gl.ARRAY_BUFFER, attribute.buffer)
            gl.vertexAttribPointer (programInfo.attribLocations[key], attribute.stride, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray (programInfo.attribLocations[key]) }

        gl.useProgram (programInfo.program)
        gl.uniformMatrix4fv (programInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix)
        gl.uniformMatrix4fv (programInfo.uniformLocations.modelViewMatrix, false, this.transformMatrix)

        gl.drawArrays (gl.TRIANGLE_STRIP, 0, this.geometry.getNumVertices ())
    }}
