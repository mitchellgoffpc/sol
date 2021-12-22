import { flow, filter, every, sumBy, forEach } from 'lodash/fp'
import Block from 'blocks'


export default class Machine extends Block {
    basePosition = 0
    baseVelocity = 0

    constructor () {
        super (0, [], [])
        this.mesh = this.createMesh () }

    createMesh () { return null }
    getEffectiveMass () { return 1 }

    getAcceleration (connection) {
        return this.getBaseForce (this.basePosition, this.baseVelocity) +
               flow (filter (x => x !== connection),
                     sumBy  (x => x.getAcceleration (this))) (this.connections) }

    checkPosition (connection, position) {
        return this.checkBasePosition (position) &&
               flow (filter (x => x !== connection),
                     every  (x => x.checkPosition (this, position))) (this.connections) }

    updatePosition (connection, position, velocity) {
        this.updateBasePosition (position, velocity)
        flow (filter  (x => x !== connection),
              forEach (x => x.updatePosition (this, position, velocity))) (this.connections) }

    // Stub methods to modify the behavior of the base node
    getBaseForce () { return 0 }
    checkBasePosition () { return true }
    updateBasePosition (position, velocity) {
        this.basePosition = position
        this.baseVelocity = velocity }}
