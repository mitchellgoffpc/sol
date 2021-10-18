import { mat4 } from 'gl-matrix'
import { Vector3 } from 'rendering/vectors'


export default class PerspectiveCamera {
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
        /* TODO: Implement this */ }}
