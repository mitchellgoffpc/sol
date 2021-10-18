import { loadProgram } from 'rendering/shaders'


export default class WebGLRenderer {
    constructor (options) {
        this.canvas = document.createElement('canvas')
        this.gl = this.canvas.getContext("webgl")

        if (this.gl === null) {
            alert ("Unable to initialize WebGL. Your browser or machine may not support it.") }

        const gl = this.gl
        const shaderProgram = loadProgram (gl)

        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                position: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                color: gl.getAttribLocation(shaderProgram, 'aVertexColor')},
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix') }}}

    setSize (width, height) {
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px` }

    render (scene, camera) {
        scene.draw (this.gl, this.programInfo, camera) }}
