import { hexToRgb } from 'util/colors'
import { map, chunk, times, flatten, fromPairs, pickBy } from 'lodash'

// Helper functions
const hexToFloats = hexCode => {
    return Float32Array.from (flatten (times (3, _ => hexToRgb (hexCode)))) }


// Block base class
class Block {
    constructor (ID, colors, highlightColors) {
        this.ID = ID
        this.colorData = map (colors, hexToFloats)
        this.highlightColorData = map (highlightColors, hexToFloats) }}


// Block types
export default class Blocks {
    static Dirt  = new Block (1, times (12, _ => '#D68653'), times (12, _ => '#E3A066'))
    static Grass = new Block (2, ['#369940', '#369940', ...times (10, _ => '#D68653')],
                                 ['#43B353', '#43B353', ...times (10, _ => '#E3A066')])

    static All = pickBy (Blocks, value => value instanceof Block)
    static ByID = fromPairs (map (Blocks.All, block => [block.ID, block]))

    static fromBlockID (ID) {
        return Blocks.ByID[ID] }}
