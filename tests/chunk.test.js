import { times } from 'lodash'
import Chunk from 'world/chunk'
import Blocks from 'blocks'
import { createChunkGeometry } from 'world/geometry.worker'

let chunk
let geometry

// Setup

Int32Array.prototype.count = function (f) {
    return this.reduce((acc, x) => f(x) ? acc + 1 : acc, 0) }

beforeEach (() => {
    const world = { scene: { add: () => null }}
    const position = { x: 0, y: 0, z: 0 }
    const blocks = new Int32Array (16 * 16 * 16)
    const sides = times (6, _ => new Int32Array (16 * 16))
    const sidesAreSolid = times (6, _ => false)
    blocks.fill (Blocks.Dirt.ID, 0, 16*16*8)

    geometry = createChunkGeometry ({ position, blocks, neighborSides: sides })
    chunk = new Chunk (world, position, blocks, sides, sidesAreSolid)
    chunk.createBufferGeometry (geometry.buffers, geometry.vertexBufferSize, geometry.blockFaceBufferSize) })


// Tests

test ('getBlockAtPosition', () => {
    expect (chunk.getBlockAtPosition ({ x: 7, y: 0, z: 0 })) .toBe (Blocks.Dirt.ID)
    expect (chunk.getBlockAtPosition ({ x: 8, y: 0, z: 0 })) .toBe (0) })

test ('vertexBuffer is the right size', () => {
    expect (geometry.vertexBufferSize) .toBe (3*6 * (2*16*16 + 4*16*8))
    expect (geometry.buffers.vertexBuffer.slice (geometry.vertexBufferSize) .every (x => x == 0)) .toBe (true)
    expect (geometry.buffers.colorBuffer.slice (0, geometry.vertexBufferSize) .every (x => x > 0)) .toBe (true)
    expect (geometry.buffers.colorBuffer.slice (geometry.vertexBufferSize) .every (x => x == 0)) .toBe (true) })

test ('blockFaceBuffer is the right size', () => {
    expect (geometry.blockFaceBufferSize) .toBe (12 * (2*16*16 + 4*16*8 - 8*16 - 4*8 + 8))
    expect (geometry.buffers.blockFaceBuffer.slice (geometry.blockFaceBufferSize) .every (x => x == -1)) .toBe (true)
    expect (geometry.buffers.blockFaceBuffer.slice (0, geometry.blockFaceBuffer) .count (x => x > -1)) .toBe (2 * (2*16*16 + 4*16*8)) })

test ('blockIndicesForBFBOffsets matches BFBOffsetsForBlocks', () => {
    for (let i = 0; i < geometry.blockFaceBufferSize / 12; i++) {
        expect (geometry.buffers.BFBOffsetsForBlocks[geometry.buffers.blockIndicesForBFBOffsets[i]]) .toBe (i * 12) }

    for (let i = 0; i < chunk.blocks.length; i++) {
        let offset = geometry.buffers.BFBOffsetsForBlocks[i]
        if (offset > -1) {
            expect (geometry.buffers.blockIndicesForBFBOffsets[offset / 12]) .toBe (i) }}})
