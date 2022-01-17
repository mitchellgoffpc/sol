import * as Three from 'three'
import { v4 as uuid } from 'uuid'

import Blocks from 'blocks'
import Directions from 'util/directions'
import { getVerticesForSide } from 'util/geometry'
import { getBlockIndexForPosition,
         getPositionForBlockIndex,
         positionIsWithinChunk } from 'util/coordinates'


// Chunk class

// To optimize space, `Chunk` maintains five arrays that track the relationships
// between blocks and their faces:
//
//  -- blockIndicesForFaces maps each faceIndex to a block position.
//
//  -- blockFaceBuffer is a memory heap that contains the face indices of every
//     visible block in this chunk. Since most blocks will be completely obscured
//     by their neighbors, this saves memory by letting us allocate space only for
//     blocks that have at least once visible face.
//
//  -- bfbOffsetsForBlocks maps each block position to a position in
//     blockFaceBuffer that contains all the face indices for that block,
//     or -1 if the block has no visible faces.
//
//  -- bfbIndicesForFaces maps each faceIndex to an index in that face's block data
//     in `blockFaceBuffer`. This is convenient for tracking which direction the face
//     is pointing, and for quickly updating the buffer data when we need to rearrange
//     the vertex buffer.
//
//  -- blockIndicesForBfbOffsets maps each offset in blockFaceBuffer to a block index.
//     This is useful anytime we have to deallocate the space in the BFB for a block
//     that isn't visible anymore.

export default class Chunk {
    neighbors = new Array (Directions.All.length)
    loadedNeighbors = 0
    lights = {}

    constructor (world, position, blocks, blockGroups, sides, sidesAreSolid) {
        this.world = world
        this.position = position
        this.blocks = blocks
        this.blockGroups = blockGroups
        this.sides = sides
        this.sidesAreSolid = sidesAreSolid }


    // Methods for creating objects

    placeBlock (position, block) {
        this.blocks[getBlockIndexForPosition (position)] = block.ID

        Directions.getAdjacentPositions (position) .forEach (({ direction, adjacentPosition }) => {
            if (positionIsWithinChunk (adjacentPosition)) {
                if (this.blocks[getBlockIndexForPosition (adjacentPosition)])
                     this.removeBlockFace (adjacentPosition, direction.opposite)
                else this.createBlockFace (position, direction, true) }

            else { // If the neighboring block is in a different chunk, we need to ask `this.world` to deal with it for us
                const adjacentWorldPos = this.getWorldPosFromChunkPos (adjacentPosition)
                if (this.world.getBlockAtPosition (adjacentWorldPos))
                     this.world.removeBlockFace (adjacentWorldPos, direction.opposite)
                else this.createBlockFace (position, direction, true) }})

        this.refreshGeometry () }

    placeLight (position, intensity = 1.0) {
        const { x: wx, y: wy, z: wz } = this.getWorldPosFromChunkPos (position)
        const light = new Three.PointLight (0xFFFFFF, intensity)
        light.position.set (wx, wy, wz)
        this.lights[light.uuid] = light
        this.world.scene.add (light)
        return light }


    // Methods for destroying objects

    destroyBlock (position) {
        Directions.getAdjacentPositions (position) .forEach (({ direction, adjacentPosition }) => {
            if (positionIsWithinChunk (adjacentPosition)) {
                if (this.blocks[getBlockIndexForPosition (adjacentPosition)])
                     this.createBlockFace (adjacentPosition, direction.opposite)
                else this.removeBlockFace (position, direction) }

            else { // If the neighboring block is in a different chunk, we need to ask `this.world` to deal with it for us
                const adjacentWorldPos = this.getWorldPosFromChunkPos (adjacentPosition)
                if (this.world.getBlockAtPosition (adjacentWorldPos))
                     this.world.createBlockFace (adjacentWorldPos, direction.opposite)
                else this.removeBlockFace (position, direction) }})

        this.blocks[getBlockIndexForPosition (position)] = 0
        this.refreshGeometry () }


    // Methods for adding and removing block faces

    createBlockFace (position, direction, highlight = false, refresh = false) {
        const blockIndex = getBlockIndexForPosition (position)
        const block = Blocks.fromBlockID (this.blocks[blockIndex])
        const vertices = this.mesh.geometry.drawRange.count
        const colorData = highlight ? block.highlightColorData : block.colorData

        // If this block doesn't have any visible faces, allocate some new space in the bfb
        if (this.bfbOffsetsForBlocks[blockIndex] === -1) {
            this.bfbOffsetsForBlocks[blockIndex] = this.blockFaceBufferSize
            this.blockIndicesForBfbOffsets[this.blockFaceBufferSize / 12] = blockIndex
            this.blockFaceBufferSize += 12 }

        const blockBfbOffset = this.bfbOffsetsForBlocks[blockIndex]
        for (let i = 0; i < 2; i++) { // Loop twice because we need two faces per side
            const faceIndex = vertices / 3 + i
            const faceBfbIndex = direction.index * 2 + i

            this.blockFaceBuffer[blockBfbOffset + faceBfbIndex] = faceIndex
            this.bfbIndicesForFaces[faceIndex] = faceBfbIndex
            this.blockIndicesForFaces[faceIndex] = blockIndex
            this.mesh.geometry.attributes.color.array.set (colorData[faceBfbIndex], vertices * 3 + i * 9) }

        this.mesh.geometry.attributes.position.array.set (getVerticesForSide (position, direction), vertices * 3)
        this.mesh.geometry.setDrawRange (0, vertices + 6)

        if (refresh)
            this.refreshGeometry () }


    removeBlockFace (position, direction, refresh = false) {
        const blockIndex = getBlockIndexForPosition (position)
        const blockBfbOffset = this.bfbOffsetsForBlocks[blockIndex]

        if (blockBfbOffset !== -1) { // If this block has any visible faces...
            for (let i = 0; i < 2; i++) { // Loop over the faces pointing in this direction
                const vertices = this.mesh.geometry.drawRange.count
                const vertexBuffer = this.mesh.geometry.attributes.position.array
                const colorBuffer = this.mesh.geometry.attributes.color.array

                const faceIndex = this.blockFaceBuffer[blockBfbOffset + direction.index * 2 + i]
                const faceIndexToMove = vertices / 3 - 1

                if (faceIndex === -1)
                    continue

                // Move the data from the end of the vertex and color buffers into the empty space
                if (faceIndex !== faceIndexToMove) {
                    vertexBuffer.set (vertexBuffer.slice (faceIndexToMove * 9, faceIndexToMove * 9 + 9), faceIndex * 9)
                    colorBuffer.set  (colorBuffer.slice  (faceIndexToMove * 9, faceIndexToMove * 9 + 9), faceIndex * 9)

                    const blockIndexOfFaceToMove = this.blockIndicesForFaces[faceIndexToMove]
                    const bfbIndexOfFaceToMove = this.bfbIndicesForFaces[faceIndexToMove]
                    const bfbOffsetOfFaceToMove = this.bfbOffsetsForBlocks[blockIndexOfFaceToMove] + bfbIndexOfFaceToMove

                    this.blockFaceBuffer[bfbOffsetOfFaceToMove] = faceIndex
                    this.bfbIndicesForFaces[faceIndex] = bfbIndexOfFaceToMove
                    this.blockIndicesForFaces[faceIndex] = blockIndexOfFaceToMove }

                this.blockFaceBuffer[blockBfbOffset + direction.index * 2 + i] = -1
                this.bfbIndicesForFaces[faceIndexToMove] = -1
                this.blockIndicesForFaces[faceIndexToMove] = -1
                this.mesh.geometry.setDrawRange (0, vertices - 3) }

            // Remove the blockFaceBuffer data if this block doesn't have any faces left
            if (this.blockFaceBuffer.slice (blockBfbOffset, blockBfbOffset + 12) .every (x => x === -1)) {
                if (blockBfbOffset !== this.blockFaceBufferSize - 12) {
                    const bfbDataToMove = this.blockFaceBuffer.slice (this.blockFaceBufferSize - 12, this.blockFaceBufferSize)
                    const blockIndexOfBfbDataToMove = this.blockIndicesForBfbOffsets[this.blockFaceBufferSize / 12 - 1]

                    this.blockIndicesForBfbOffsets[blockBfbOffset / 12] = blockIndexOfBfbDataToMove
                    this.bfbOffsetsForBlocks[blockIndexOfBfbDataToMove] = blockBfbOffset
                    this.blockFaceBuffer.set (bfbDataToMove, blockBfbOffset) }

                this.blockIndicesForBfbOffsets[this.blockFaceBufferSize / 12 - 1] = -1
                this.bfbOffsetsForBlocks[blockIndex] = -1
                this.blockFaceBufferSize -= 12 }

            if (refresh)
                this.refreshGeometry () }}


    // Helper method for updating block highlights

    setBlockHighlight (position, highlight) {
        const blockIndex = getBlockIndexForPosition (position)

        if (this.blocks[blockIndex]) {
            const block = Blocks.fromBlockID (this.blocks[blockIndex])
            const blockBfbOffset = this.bfbOffsetsForBlocks[blockIndex]
            const colorData = highlight ? block.highlightColorData : block.colorData
            const colorAttribute = this.mesh.geometry.attributes.color

            for (let i = 0; i < 12; i++) {
                if (this.blockFaceBuffer[blockBfbOffset + i] !== -1) {
                    colorAttribute.array.set (colorData[i], this.blockFaceBuffer[blockBfbOffset + i] * 9) }}

            colorAttribute.needsUpdate = true }}


    // Helper methods for doing coordinate transforms/lookups

    getBlockAtPosition (position) {
        return this.blocks ? this.blocks[getBlockIndexForPosition (position)] : 0 }

    getPositionForFaceIndex (faceIndex) {
        return getPositionForBlockIndex (this.blockIndicesForFaces[faceIndex]) }

    getDirectionForFaceIndex (faceIndex) {
        return Directions.ByIndex[Math.floor (this.bfbIndicesForFaces[faceIndex] / 2)] }

    getChunkPosFromWorldPos ({ x, y, z }) {
        return { x: x - this.position.x * 16, y: y - this.position.y * 16, z: z - this.position.z * 16 }}

    getWorldPosFromChunkPos ({ x, y, z }) {
        return { x: x + this.position.x * 16, y: y + this.position.y * 16, z: z + this.position.z * 16 }}


    // Create the vertex and color buffers for this chunk

    createBufferGeometry (buffers, vertexBufferSize, blockFaceBufferSize) {
        this.blockFaceBuffer = buffers.blockFaceBuffer
        this.bfbIndicesForFaces = buffers.bfbIndicesForFaces
        this.bfbOffsetsForBlocks = buffers.bfbOffsetsForBlocks
        this.blockIndicesForFaces = buffers.blockIndicesForFaces
        this.blockIndicesForBfbOffsets = buffers.blockIndicesForBfbOffsets
        this.blockFaceBufferSize = blockFaceBufferSize

        const geometry = new Three.BufferGeometry ()
        const material = new Three.MeshLambertMaterial ({ vertexColors: Three.VertexColors })

        geometry.setAttribute ('position', new Three.BufferAttribute (buffers.vertexBuffer, 3))
        geometry.setAttribute ('color',    new Three.BufferAttribute (buffers.colorBuffer, 3))
        geometry.setDrawRange (0, vertexBufferSize / 3)
        geometry.computeVertexNormals ()

        this.mesh = new Three.Mesh (geometry, material)
        this.mesh.name = "CHUNK"
        this.mesh.position.set (this.position.x * 16, this.position.y * 16, this.position.z * 16)
        this.world.scene.add (this.mesh) }


    // Create the Cannon physics body for this chunk

    createPhysicsBody () {
        let boxes = []
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                boxes.push ({ x, z, minY: 0, maxY: x + z }) }}

        this.world.physics.addChunk (uuid (), this.position, boxes) }


    // Helper methods

    refreshGeometry () {
        this.mesh.geometry.attributes.position.needsUpdate = true
        this.mesh.geometry.attributes.color.needsUpdate = true

        this.mesh.geometry.computeBoundingSphere ()
        this.mesh.geometry.computeVertexNormals () }

    isLoaded = () =>
        !this.blocks || this.mesh
}
