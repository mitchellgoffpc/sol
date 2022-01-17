import Blocks from 'blocks'
import Directions from 'util/directions'
import { getVerticesForSide } from 'util/geometry'
import { getBlockIndexForPosition,
         getPositionForBlockIndex,
         positionIsWithinChunk } from 'util/coordinates'


// Constants

const CHUNK_VOLUME = 16 * 16 * 16

const vertexBuffer = new Float32Array (CHUNK_VOLUME * 108)
const colorBuffer  = new Float32Array (CHUNK_VOLUME * 108)

const blockIndicesForFaces      = new Int32Array (CHUNK_VOLUME * 12)
const blockFaceBuffer           = new Int32Array (CHUNK_VOLUME * 12)
const bfbIndicesForFaces        = new Int32Array (CHUNK_VOLUME * 12)
const bfbOffsetsForBlocks       = new Int32Array (CHUNK_VOLUME)
const blockIndicesForBfbOffsets = new Int32Array (CHUNK_VOLUME)

const faceIndices = new Int32Array (12)


// Helper functions

const nextPowerOf2 = x => {
    let power = 1
    while (power < x) {
        power <<= 1 }
    return power }

const getNeighborIndexForPosition = position => {
    if (position.x < 0 || position.x > 0xF)
         return position.y * 16 + position.z
    else if (position.y < 0 || position.y > 0xF)
         return position.x * 16 + position.z
    else return position.x * 16 + position.y }

const getAdjacentBlock = (blocks, neighborSide, adjacentPosition) => {
    if (positionIsWithinChunk (adjacentPosition))
         return blocks[getBlockIndexForPosition (adjacentPosition)]
    else if (neighborSide)
         return neighborSide[getNeighborIndexForPosition (adjacentPosition)]
    else return 0 }


// Attach the message listener

if (typeof self !== 'undefined') {
    self.addEventListener ("message", ({ data }) => {
        if (data.message === "createChunkGeometry") { createChunkGeometryForBatch (data) }}) }


// API functions

function createChunkGeometryForBatch ({ chunks }) {
    let results = new Array (chunks.length)
    let transfers = []

    for (let i = 0; i < chunks.length; i++) {
        results[i] = createChunkGeometry (chunks[i])
        transfers.push (results[i].buffers.vertexBuffer.buffer,
                        results[i].buffers.colorBuffer.buffer,
                        results[i].buffers.blockFaceBuffer.buffer,
                        results[i].buffers.bfbIndicesForFaces.buffer,
                        results[i].buffers.blockIndicesForFaces.buffer,
                        results[i].buffers.blockIndicesForBfbOffsets.buffer,
                        results[i].buffers.bfbOffsetsForBlocks.buffer) }

    self.postMessage ({ message: "createChunkGeometry", chunks: results }, transfers) }


export function createChunkGeometry ({ position, blocks, neighborSides }) {
    let vertexIndex = 0
    let bfbIndex = 0

    blockFaceBuffer.fill (-1)
    blockIndicesForFaces.fill (-1)
    blockIndicesForBfbOffsets.fill (-1)
    bfbIndicesForFaces.fill (-1)
    bfbOffsetsForBlocks.fill (-1)

    // Loop over all the blocks in this chunk
    for (let blockIndex = 0; blockIndex < CHUNK_VOLUME; blockIndex++) {
        if (blocks[blockIndex]) {
            const block = Blocks.fromBlockID (blocks[blockIndex])
            const position = getPositionForBlockIndex (blockIndex)
            let blockHasVisibleFaces = false
            faceIndices.fill (-1)

            // Loop over all adjacent positions and add faces on sides without solid neighbors
            for (let i = 0; i < Directions.All.length; i++) {
                const direction = Directions.All[i]
                const adjacentPosition = direction.getAdjacentPosition (position)
                const adjacentBlock = getAdjacentBlock (blocks, neighborSides[i], adjacentPosition)

                if (!adjacentBlock) {
                    for (let j = 0; j < 2; j++) { // Loop twice because we need two faces per side
                        const faceIndex = vertexIndex / 9 + j
                        const faceBfbIndex = i * 2 + j

                        faceIndices[faceBfbIndex] = faceIndex
                        bfbIndicesForFaces[faceIndex] = faceBfbIndex
                        blockIndicesForFaces[faceIndex] = blockIndex
                        colorBuffer.set (block.colorData[i], vertexIndex + j * 9) }

                    vertexBuffer.set (getVerticesForSide (position, direction), vertexIndex)
                    vertexIndex += 18
                    blockHasVisibleFaces = true }}

            // If this block has any visible faces, we'll add it to the BFB
            if (blockHasVisibleFaces) {
                blockFaceBuffer.set (faceIndices, bfbIndex)
                blockIndicesForBfbOffsets[bfbIndex / 12] = blockIndex
                bfbOffsetsForBlocks[blockIndex] = bfbIndex
                bfbIndex += 12 }}}

    // Copy and slice all our buffers down to the correct sizes
    const bufferSize = nextPowerOf2 (vertexIndex / 3) * 3
    const blockFaceBufferSize = nextPowerOf2 (bfbIndex / 3) * 3
    const buffers =
        { vertexBuffer:              vertexBuffer.slice (0, bufferSize),
          colorBuffer:               colorBuffer.slice (0, bufferSize),
          blockFaceBuffer:           blockFaceBuffer.slice (0, blockFaceBufferSize),
          bfbIndicesForFaces:        bfbIndicesForFaces.slice (0, bufferSize),
          blockIndicesForFaces:      blockIndicesForFaces.slice (0, bufferSize),
          blockIndicesForBfbOffsets: blockIndicesForBfbOffsets.slice (0, blockFaceBufferSize / 12),
          bfbOffsetsForBlocks:       bfbOffsetsForBlocks.slice () }

    return { position, buffers, vertexBufferSize: vertexIndex, blockFaceBufferSize: bfbIndex }}
