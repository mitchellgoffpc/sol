import { sumBy } from 'lodash-es'
import Block from 'blocks'


export default class Machine extends Block {
    basePosition = 0
    baseVelocity = 0

    getEffectiveMass () { return 1 }

    getAcceleration (connection) {
        return this.getBaseForce (this.basePosition, this.baseVelocity) +
               sumBy (this.connections.filter (x => x !== connection),
                      x => x.getAcceleration (this)) }

    checkPosition (connection, position) {
        return this.checkBasePosition (position) &&
               this.connections.filter (x => x !== connection)
                               .every  (x => x.checkPosition (this, position)) }

    updatePosition (connection, position, velocity) {
        this.updateBasePosition (position, velocity)
        this.connections.filter  (x => x !== connection)
                        .forEach (x => x.updatePosition (this, position, velocity)) }

    // Stub methods to modify the behavior of the base node
    getBaseForce () { return 0 }
    checkBasePosition () { return true }
    updateBasePosition (position, velocity) {
        this.basePosition = position
        this.baseVelocity = velocity }}
