export default class Scene {
    constructor () {
        this.meshes = [] }

    add (mesh) {
        this.meshes.push (mesh) }

    draw (gl, programInfo, camera) {
        gl.clearColor (0.8, 0.8, 1.0, 1.0)
        gl.clearDepth (1.0)
        gl.enable (gl.DEPTH_TEST)
        gl.depthFunc (gl.LEQUAL)
        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        for (let i = 0; i < this.meshes.length; i++) {
            this.meshes[i].draw (gl, programInfo, camera) }}}
