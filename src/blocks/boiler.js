import Block from 'blocks'
import GeometryBuilder from 'util/geometry-builder'


export default class Boiler extends Block {
    constructor () {
        super (0, [], [])
        this.mesh = this.createMesh () }

    createMesh () {
        const builder = new GeometryBuilder ()
        builder.addCylinder ({ r: .5, h: 2, y: 1.5, rx: Math.PI / 2, color: 0xDDAA33 })
        return builder.getMesh () }}
