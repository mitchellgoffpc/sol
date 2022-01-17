import { times } from 'lodash'
import Chunk from 'world/chunk'
import Blocks from 'blocks'
import Directions from 'util/directions'
import { createChunkGeometry } from 'world/geometry.worker'
import { getVerticesForSide } from 'util/geometry'
import { getBlockIndexForPosition } from 'util/coordinates'

let chunk
let geometry

// Setup

for (let TypedArray of [Int32Array, Float32Array]) {
    TypedArray.prototype.count = function (f) {
        return this.reduce((acc, x) => f(x) ? acc + 1 : acc, 0) }
    TypedArray.prototype.equals = function (other) {
        return this.length == other.length && this.every((x, i) => x == other[i]) }}

beforeEach (() => {
    const world = { scene: { add: () => null }}
    const position = { x: 0, y: 0, z: 0 }
    const blocks = new Int32Array (16 * 16 * 16)
    const sides = times (6, _ => new Int32Array (16 * 16))
    const sidesAreSolid = times (6, _ => false)
    const blockGroups = []
    blocks.fill (Blocks.Dirt.ID, 0, 16*16*8)

    geometry = createChunkGeometry ({ position, blocks, neighborSides: sides })
    chunk = new Chunk (world, position, blocks, blockGroups, sides, sidesAreSolid)
    chunk.createBufferGeometry (geometry.buffers, geometry.vertexBufferSize, geometry.blockFaceBufferSize) })


// Tests

function checkBufferConsistency (expect) {
    for (let i = 0; i < geometry.blockFaceBufferSize / 12; i++) {
        expect (geometry.buffers.BFBOffsetsForBlocks[geometry.buffers.blockIndicesForBFBOffsets[i]]) .toBe (i * 12) }

    for (let i = 0; i < chunk.blocks.length; i++) {
        let offset = geometry.buffers.BFBOffsetsForBlocks[i]
        if (offset > -1) {
            expect (geometry.buffers.blockIndicesForBFBOffsets[offset / 12]) .toBe (i) }}}

test ('vertexBuffer is the right size', () => {
    expect (geometry.vertexBufferSize) .toBe (18 * (2*16*16 + 4*16*8))
    expect (geometry.buffers.vertexBuffer.slice (geometry.vertexBufferSize) .every (x => x == 0)) .toBe (true)
    expect (geometry.buffers.colorBuffer.slice (0, geometry.vertexBufferSize) .every (x => x > 0)) .toBe (true)
    expect (geometry.buffers.colorBuffer.slice (geometry.vertexBufferSize) .every (x => x == 0)) .toBe (true) })

test ('blockFaceBuffer is the right size', () => {
    expect (geometry.blockFaceBufferSize) .toBe (12 * (2*16*16 + 4*16*8 - 8*16 - 4*8 + 8))
    expect (geometry.buffers.blockFaceBuffer.slice (geometry.blockFaceBufferSize) .every (x => x == -1)) .toBe (true)
    expect (geometry.buffers.blockFaceBuffer.slice (0, geometry.blockFaceBuffer) .count (x => x > -1)) .toBe (2 * (2*16*16 + 4*16*8)) })

test ('blockIndicesForBFBOffsets matches BFBOffsetsForBlocks', () => {
    checkBufferConsistency (expect) })

test ('getBlockAtPosition', () => {
    expect (chunk.getBlockAtPosition ({ x: 7, y: 0, z: 0 })) .toBe (Blocks.Dirt.ID)
    expect (chunk.getBlockAtPosition ({ x: 8, y: 0, z: 0 })) .toBe (0) })


describe ('createBlockFace', () => {
    test ('works for a new block', () => {
        const position = { x: 8, y: 0, z: 0 }
        const vertexBuffer = chunk.mesh.geometry.attributes.position.array
        const colorBuffer = chunk.mesh.geometry.attributes.color.array
        const vertexBufferSize = chunk.mesh.geometry.drawRange.count * 3
        const vertices = vertexBuffer.slice (0, vertexBufferSize)
        const colors = colorBuffer.slice (0, vertexBufferSize)
        const blockIndex = getBlockIndexForPosition (position)
        const bfbSize = chunk.blockFaceBufferSize
        expect (chunk.BFBOffsetsForBlocks[blockIndex]) .toBe (-1)

        chunk.createBlockFace (position, Directions.WEST, Blocks.Log)

        // Check vertex and color buffers
        expect (chunk.mesh.geometry.drawRange.count) .toBe (vertexBufferSize / 3 + 6)
        expect (vertexBuffer.slice (0, vertexBufferSize) .equals (vertices)) .toBe (true)
        expect (vertexBuffer.slice (vertexBufferSize, vertexBufferSize + 18) .equals (getVerticesForSide (position, Directions.WEST))) .toBe (true)
        expect (colorBuffer.slice (0, vertexBufferSize) .equals (colors)) .toBe (true)
        expect (colorBuffer.slice (vertexBufferSize, vertexBufferSize + 9) .equals (Blocks.Log.colorData [Directions.WEST.index])) .toBe (true)
        expect (colorBuffer.slice (vertexBufferSize + 9, vertexBufferSize + 18) .equals (Blocks.Log.colorData [Directions.WEST.index])) .toBe (true)

        // Check block face buffer
        const bfbOffset = chunk.BFBOffsetsForBlocks[blockIndex]
        expect (bfbOffset) .not.toBe (-1)
        expect (chunk.blockIndicesForBFBOffsets[bfbOffset / 12]) .toBe (blockIndex)
        expect (chunk.blockFaceBufferSize) .toBe (bfbSize + 12)

        // Check buffer consistency
        for (let i = 0; i < 2; i++) {
            expect (chunk.BFBIndicesForFaces[vertexBufferSize / 9 + i]) .toBe (Directions.WEST.index * 2 + i)
            expect (chunk.blockIndicesForFaces[vertexBufferSize / 9 + i]) .toBe (blockIndex)
            expect (chunk.blockFaceBuffer[bfbOffset + Directions.WEST.index * 2 + i]) .toBe (vertexBufferSize / 9 + i) }})

    test ('createBlockFace for an existing block', () => {
        const position = { x: 0, y: 0, z: 0 }
        const vertexBuffer = chunk.mesh.geometry.attributes.position.array
        const colorBuffer = chunk.mesh.geometry.attributes.color.array
        const vertexBufferSize = chunk.mesh.geometry.drawRange.count * 3
        const vertices = vertexBuffer.slice (0, vertexBufferSize)
        const colors = colorBuffer.slice (0, vertexBufferSize)
        const blockIndex = getBlockIndexForPosition (position)
        const bfbSize = chunk.blockFaceBufferSize
        const bfbOffset = chunk.BFBOffsetsForBlocks[blockIndex]
        expect (bfbOffset) .not.toBe (-1)

        chunk.createBlockFace (position, Directions.WEST, Blocks.Log)

        // Check vertex buffer
        expect (chunk.mesh.geometry.drawRange.count) .toBe (vertexBufferSize / 3 + 6)
        expect (vertexBuffer.slice (0, vertexBufferSize) .equals (vertices)) .toBe (true)
        expect (vertexBuffer.slice (vertexBufferSize, vertexBufferSize + 18) .equals (getVerticesForSide (position, Directions.WEST))) .toBe (true)
        expect (colorBuffer.slice (0, vertexBufferSize) .equals (colors)) .toBe (true)
        expect (colorBuffer.slice (vertexBufferSize, vertexBufferSize + 9) .equals (Blocks.Log.colorData [Directions.WEST.index])) .toBe (true)
        expect (colorBuffer.slice (vertexBufferSize + 9, vertexBufferSize + 18) .equals (Blocks.Log.colorData [Directions.WEST.index])) .toBe (true)

        // Check block face buffer
        expect (chunk.blockFaceBufferSize) .toBe (bfbSize)
        expect (chunk.BFBOffsetsForBlocks[blockIndex]) .toBe (bfbOffset)
        expect (chunk.blockIndicesForBFBOffsets[bfbOffset / 12]) .toBe (blockIndex)

        // Check buffer consistency
        for (let i = 0; i < 2; i++) {
            expect (chunk.BFBIndicesForFaces[vertexBufferSize / 9 + i]) .toBe (Directions.WEST.index * 2 + i)
            expect (chunk.blockIndicesForFaces[vertexBufferSize / 9 + i]) .toBe (blockIndex)
            expect (chunk.blockFaceBuffer[bfbOffset + Directions.WEST.index * 2 + i]) .toBe (vertexBufferSize / 9 + i) }}) })


describe ('removeBlockFace', () => {
    test ('works on blocks with other faces', () => {
        const position = { x: 0, y: 0, z: 0 }
        const vertexBuffer = chunk.mesh.geometry.attributes.position.array
        const vertexBufferSize = chunk.mesh.geometry.drawRange.count * 3
        const vertices = vertexBuffer.slice (0, vertexBufferSize)
        const blockIndex = getBlockIndexForPosition (position)
        const bfbSize = chunk.blockFaceBufferSize
        const bfbOffset = chunk.BFBOffsetsForBlocks[blockIndex]
        const bfbIndex = bfbOffset + Directions.EAST.index * 2
        const faceIndex = chunk.blockFaceBuffer[bfbIndex]
        const blockIndexOfFaceToMove = chunk.blockIndicesForFaces[vertexBufferSize / 9 - 2]
        const bfbOffsetOfFaceToMove = chunk.BFBOffsetsForBlocks[blockIndexOfFaceToMove]
        const bfbIndexOfFaceToMove = chunk.BFBIndicesForFaces[vertexBufferSize / 9 - 2]
        expect (bfbOffset) .not.toBe (-1)
        expect (chunk.blockFaceBuffer.slice (bfbIndex, bfbIndex + 2) .every (x => x != -1)) .toBe (true)

        chunk.removeBlockFace (position, Directions.EAST)

        // Check vertex buffer
        expect (chunk.mesh.geometry.drawRange.count) .toBe (vertexBufferSize / 3 - 6)
        expect (vertexBuffer.slice (0, faceIndex * 9)
            .equals (vertices.slice (0, faceIndex * 9))) .toBe (true)
        expect (vertexBuffer.slice (faceIndex * 9, faceIndex * 9 + 9)
            .equals (vertices.slice (vertexBufferSize - 9, vertexBufferSize))) .toBe (true)
        expect (vertexBuffer.slice (faceIndex * 9 + 9, faceIndex * 9 + 18)
            .equals (vertices.slice (vertexBufferSize - 18, vertexBufferSize - 9))) .toBe (true)
        expect (vertexBuffer.slice (faceIndex * 9 + 18, vertexBufferSize - 9)
            .equals (vertices.slice (faceIndex * 9 + 18, vertexBufferSize - 9))) .toBe (true)

        // Check block face buffer
        expect (chunk.blockFaceBufferSize) .toBe (bfbSize)
        expect (chunk.BFBOffsetsForBlocks[blockIndex]) .toBe (bfbOffset)
        expect (chunk.blockIndicesForBFBOffsets[bfbOffset / 12]) .toBe (blockIndex)
        expect (chunk.blockFaceBuffer.slice (bfbIndex, bfbIndex + 2) .every (x => x == -1)) .toBe (true)

        // Check buffer consistency
        for (let i = 0; i < 2; i++) {
            expect (chunk.BFBIndicesForFaces[faceIndex + 1 - i]) .toBe (bfbIndexOfFaceToMove + i)
            expect (chunk.blockIndicesForFaces[faceIndex + 1 - i]) .toBe (blockIndexOfFaceToMove)
            expect (chunk.blockFaceBuffer[bfbOffsetOfFaceToMove + bfbIndexOfFaceToMove + 1 - i]) .toBe (faceIndex + i) }})

    test ('works on blocks without other faces', () => {
        const position = { x: 0, y: 8, z: 8 }
        const vertexBuffer = chunk.mesh.geometry.attributes.position.array
        const vertexBufferSize = chunk.mesh.geometry.drawRange.count * 3
        const vertices = vertexBuffer.slice (0, vertexBufferSize)
        const blockIndex = getBlockIndexForPosition (position)
        const bfbSize = chunk.blockFaceBufferSize
        const bfbOffset = chunk.BFBOffsetsForBlocks[blockIndex]
        const bfbIndex = bfbOffset + Directions.EAST.index * 2
        const faceIndex = chunk.blockFaceBuffer[bfbIndex]
        const blockIndexOfFaceToMove = chunk.blockIndicesForFaces[vertexBufferSize / 9 - 2]
        const bfbOffsetOfFaceToMove = chunk.BFBOffsetsForBlocks[blockIndexOfFaceToMove]
        const bfbIndexOfFaceToMove = chunk.BFBIndicesForFaces[vertexBufferSize / 9 - 2]
        const blockIndexOfBFBDataToMove = chunk.blockIndicesForBFBOffsets[bfbSize / 12 - 1]
        expect (bfbOffset) .not.toBe (-1)
        expect (chunk.blockFaceBuffer.slice (bfbIndex, bfbIndex + 2) .every (x => x != -1)) .toBe (true)

        chunk.removeBlockFace (position, Directions.EAST)

        // Check vertex buffer
        expect (chunk.mesh.geometry.drawRange.count) .toBe (vertexBufferSize / 3 - 6)
        expect (vertexBuffer.slice (0, faceIndex * 9)
            .equals (vertices.slice (0, faceIndex * 9))) .toBe (true)
        expect (vertexBuffer.slice (faceIndex * 9, faceIndex * 9 + 9)
            .equals (vertices.slice (vertexBufferSize - 9, vertexBufferSize))) .toBe (true)
        expect (vertexBuffer.slice (faceIndex * 9 + 9, faceIndex * 9 + 18)
            .equals (vertices.slice (vertexBufferSize - 18, vertexBufferSize - 9))) .toBe (true)
        expect (vertexBuffer.slice (faceIndex * 9 + 18, vertexBufferSize - 9)
            .equals (vertices.slice (faceIndex * 9 + 18, vertexBufferSize - 9))) .toBe (true)

        // Check block face buffer
        expect (chunk.blockFaceBufferSize) .toBe (bfbSize - 12)
        expect (chunk.BFBOffsetsForBlocks[blockIndex]) .toBe (-1)
        expect (chunk.BFBOffsetsForBlocks[blockIndexOfBFBDataToMove]) .toBe (bfbOffset)
        expect (chunk.blockIndicesForBFBOffsets[bfbOffset / 12]) .toBe (blockIndexOfBFBDataToMove)

        // Check buffer consistency
        for (let i = 0; i < 2; i++) {
            expect (chunk.BFBIndicesForFaces[faceIndex + 1 - i]) .toBe (bfbIndexOfFaceToMove + i)
            expect (chunk.blockIndicesForFaces[faceIndex + 1 - i]) .toBe (blockIndexOfFaceToMove)
            expect (chunk.blockFaceBuffer[bfbOffsetOfFaceToMove + bfbIndexOfFaceToMove + 1 - i]) .toBe (faceIndex + i) }})
})


// test ('placeBlock in center', () => {
//     const position = { x: 8, y: 8, z: 8 }
//     const adjacentBlockIndex = getBlockIndexForPosition ({ x: 7, y: 8, z: 8 })
//     const adjacentBFBOffset = chunk.BFBOffsetsForBlocks[adjacentBlockIndex]
//     const adjacentFaceIndices = chunk.blockFaceBuffer.slice (adjacentBFBOffset + 2, adjacentBFBOffset + 4)
//
//     chunk.placeBlock (position, Blocks.Log)
//     expect (chunk.getBlockAtPosition (position)) .toBe (Blocks.Log.ID)
//     expect (chunk.blockFaceBuffer.slice (adjacentBFBOffset, adjacentBFBOffset + 12) .every (x => x == -1)) .toBe (true)
//     checkBufferConsistency (expect)
// })
