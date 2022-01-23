import Entity from 'entities'
import Shapes from 'util/shapes'


export default class Villager extends Entity {
    needsGameTick = true

    constructor () {
        super ({ shape: Shapes.CYLINDER, radius: 0.5, height: 2 }) }

    step () {
        
    }
}
