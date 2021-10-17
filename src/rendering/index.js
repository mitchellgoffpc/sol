import { mat4 } from 'gl-matrix'
import { loadProgram } from 'rendering/shaders'


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


export class PerspectiveCamera {
    constructor (fieldOfView, aspect, near, far) {
        this.position = new Vector3 (0, 0, 0)
        this.fieldOfView = fieldOfView * Math.PI / 180
        this.aspect = aspect
        this.near = near
        this.far = far
        this.updateProjectionMatrix () }

    updateProjectionMatrix () {
        this.projectionMatrix = mat4.create ()
        mat4.perspective (this.projectionMatrix, this.fieldOfView, this.aspect, this.near, this.far) }

    lookAt (position) {
        // TODO: Implement this
    }}


export class WebGLRenderer {
    constructor (options) {
        this.canvas = document.createElement('canvas')
        this.gl = this.canvas.getContext("webgl")

        if (this.gl === null) {
            alert ("Unable to initialize WebGL. Your browser or machine may not support it.") }

        const gl = this.gl
        const shaderProgram = loadProgram (gl)

        gl.clearColor (0.0, 0.0, 0.0, 1.0)
        gl.clear (gl.COLOR_BUFFER_BIT)

        this.buffers = initBuffers(gl)
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')},
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix') }}}

    setSize (width, height) {
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px` }

    render (scene, camera) {
        // Nothing for now
        drawScene(this.gl, this.programInfo, this.buffers, camera)}}



const positions = [
  // Front face
  -1.0, -1.0,  1.0,
   1.0, -1.0,  1.0,
   1.0,  1.0,  1.0,
  -1.0,  1.0,  1.0,

  // Back face
  -1.0, -1.0, -1.0,
  -1.0,  1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0, -1.0, -1.0,

  // Top face
  -1.0,  1.0, -1.0,
  -1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0, -1.0,

  // Bottom face
  -1.0, -1.0, -1.0,
   1.0, -1.0, -1.0,
   1.0, -1.0,  1.0,
  -1.0, -1.0,  1.0,

  // Right face
   1.0, -1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0,  1.0,  1.0,
   1.0, -1.0,  1.0,

  // Left face
  -1.0, -1.0, -1.0,
  -1.0, -1.0,  1.0,
  -1.0,  1.0,  1.0,
  -1.0,  1.0, -1.0,
]

const faceColors = [
    [1.0,  1.0,  1.0,  1.0],    // Front face: white
    [1.0,  0.0,  0.0,  1.0],    // Back face: red
    [0.0,  1.0,  0.0,  1.0],    // Top face: green
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
    [1.0,  0.0,  1.0,  1.0],    // Left face: purple
]

const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
]

var squareRotation = 0.0

// Demo stuff

function initBuffers (gl) {
    const positionBuffer = gl.createBuffer ()
    gl.bindBuffer (gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (positions), gl.STATIC_DRAW)

    let colors = []
    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j]
        colors = colors.concat (c, c, c, c) }

    const colorBuffer = gl.createBuffer ()
    gl.bindBuffer (gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (colors), gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer ()
    gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array (indices), gl.STATIC_DRAW)

    return { position: positionBuffer, color: colorBuffer, indices: indexBuffer }}

function drawScene (gl, programInfo, buffers, camera) {
    gl.clearColor (0.8, 0.8, 1.0, 1.0)
    gl.clearDepth (1.0)
    gl.enable (gl.DEPTH_TEST)
    // gl.enable (gl.SAMPLE_COVERAGE)
    // gl.sampleCoverage (0.5, false)
    gl.depthFunc (gl.LEQUAL)
    gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Set the drawing position to the "identity" point, which is the center of the scene.
    const modelViewMatrix = mat4.create ()
    mat4.translate (modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0])
    mat4.rotate (modelViewMatrix, modelViewMatrix, squareRotation, [0, 0, 1])
    mat4.rotate (modelViewMatrix, modelViewMatrix, squareRotation * .7, [0, 1, 0])
    squareRotation += 1/60

    gl.bindBuffer (gl.ARRAY_BUFFER, buffers.position)
    gl.vertexAttribPointer (programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray (programInfo.attribLocations.vertexPosition)

    gl.bindBuffer (gl.ARRAY_BUFFER, buffers.color)
    gl.vertexAttribPointer (programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray (programInfo.attribLocations.vertexColor)

    gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    gl.useProgram (programInfo.program)
    gl.uniformMatrix4fv (programInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix)
    gl.uniformMatrix4fv (programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)

    // gl.drawArrays (gl.TRIANGLE_STRIP, 0, 4)
    gl.drawElements (gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
}
