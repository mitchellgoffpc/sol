import * as Three from 'three'
import Entity from 'entities'
import Shapes from 'util/shapes'


export default class Villager extends Entity {
    needsGameTick = true

    constructor () {
        super ({ shape: Shapes.CYLINDER, radius: 0.5, height: 2 }) }

    step () {
        // this.move (new Three.Vector3 (-0.01, 0, 0))
    }
}
