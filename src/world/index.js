import * as Three from 'three'
import { first, range, filter, negate, sortBy } from 'lodash'

import Chunk from 'world/chunk'
import TerrainWorker from 'world/terrain.worker'
import GeometryWorker from 'world/geometry.worker'
import MachineryEngine from 'physics/machinery/engine'
import Directions from 'util/directions'

import Boiler from 'blocks/boiler'
import Piston from 'blocks/machines/piston'
import Counterweight from 'blocks/machines/counterweight'
import Joint from 'physics/machinery/joints'

const RENDER_DISTANCE = 20


// Helper functions

const coords = (x, y, z) =>
    `${x},${y},${z}`


// World class

export default class World {
    scene = new Three.Scene ()
    raycaster = new Three.Raycaster ()
    machinery = new MachineryEngine ()
    terrainWorker = new TerrainWorker ()
    geometryWorker = new GeometryWorker ()

    chunks = {}
    entities = {}
    chunksLoaded = 0

    constructor () {
        this.scene.background = new Three.Color (0xADCCFF)
        this.scene.fog = new Three.Fog (0xADCCFF, (RENDER_DISTANCE - 8) * 16, (RENDER_DISTANCE - 1) * 16)
        this.scene.add (new Three.AmbientLight (0x404040))

        const northLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        const southLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        northLight.position.set (100, 100, 50)
        southLight.position.set (-100, 100, -50)
        this.scene.add (northLight)
        this.scene.add (southLight)

        // // Machinery
        // let piston = new Piston (.001)
        // let beam = new Counterweight ()
        // let boiler = new Boiler ()
        // this.machinery.connect(piston.connections.head, beam.connections.beam)
        //
        // boiler.mesh.position.set (2, 46, 14)
        // this.scene.add (boiler.mesh)
        // this.placeMachine (new Three.Vector3 (5, 46, 14), piston)
        // this.placeMachine (new Three.Vector3 (8, 46, 14), beam)

        // Add event handlers
        this.terrainWorker.addEventListener ("message", this.handleTerrainWorkerMessage)
        this.geometryWorker.addEventListener ("message", this.handleGeometryWorkerMessage)
        // this.physics.onStep (this.handleEntityUpdate)

        // Generate chunks for the spawn area
        for (let x = -RENDER_DISTANCE - 1; x <= RENDER_DISTANCE + 1; x++) {
            for (let z = -RENDER_DISTANCE - 1; z <= RENDER_DISTANCE + 1; z++) {
                this.createChunkTerrain (range (-RENDER_DISTANCE - 1, RENDER_DISTANCE + 2) .map (y => ({ x, y, z }))) }}}


    // Methods for creating blocks and entities

    placeBlock (position, block) {
        this.withChunk (position, (chunk, chunkPos) => chunk.placeBlock (chunkPos, block)) }

    placeMachine (position, machine) {
        // this.placeBlock (position, machine)
        machine.mesh.position.set (position.x, position.y, position.z)
        this.scene.add (machine.mesh)
        this.machinery.addMachine (machine) }

    spawnEntity (position, entity) {
        entity.mesh.position.set (position.x, position.y, position.z)
        this.scene.add (entity.mesh)
        this.entities[entity.uuid] = entity

        if (entity.needsGameTick) { /* tick */ }
        if (entity.needsPhysicsBody) {
            // this.physics.addEntity (entity.uuid, position, entity.properties)
        }
    }


    // Methods for destroying blocks and entities

    destroyBlock (position) {
        this.withChunk (position, (chunk, chunkPos) => chunk.destroyBlock (chunkPos)) }

    destroyEntity (entity) {
        this.scene.remove (entity.mesh)
        // this.physics.removeEntity (entity.uuid)
        delete this.entities[entity.uuid] }


    // Methods for adding and removing block faces

    createBlockFace (position, direction) {
        this.withChunk (position, (chunk, chunkPos) => chunk.createBlockFace (chunkPos, direction)) }

    removeBlockFace (position, direction) {
        this.withChunk (position, (chunk, chunkPos) => chunk.removeBlockFace (chunkPos, direction)) }


    // Methods for loading and unloading chunks

    loadChunks (positions) {
        this.createChunkTerrain (positions.filter (negate (this.getChunkAtCoords))) }

    unloadChunks (positions) {
        filter (positions.map (this.getChunkAtCoords)) .forEach (chunk => {
            Directions.All.forEach (direction => {
                const neighbor = this.getChunkAtCoords (direction.getAdjacentPosition (chunk.position))
                if (neighbor) {
                    neighbor.loadedNeighbors -= 1
                    if (neighbor.mesh) { this.unloadChunkGeometry (neighbor) }}})

            delete this.chunks[coords (chunk.position.x, chunk.position.y, chunk.position.z)] }) }

    unloadChunkGeometry (chunk) {
        chunk.mesh.geometry.dispose ()
        chunk.mesh.material.dispose ()
        this.scene.remove (chunk.mesh) }


    // API methods for workers

    createChunkTerrain = positions =>
        this.terrainWorker.postMessage ({ message: 'createChunkTerrain', positions })

    createChunkGeometry = chunks =>
        this.geometryWorker.postMessage ({ message: 'createChunkGeometry', chunks })


    // Event listeners for worker messages

    handleTerrainWorkerMessage = ({ data }) => {
        let chunksToRender = []

        // Create chunk objects with the buffer data from the worker
        data.chunks.forEach (({ position, blocks, sides, sidesAreSolid }) => {
            if (!this.getChunkAtCoords (position)) {
                const chunk = new Chunk (this, position, blocks, sides, sidesAreSolid)
                this.setChunkAtCoords (position, chunk)

                // Update the neighbor references and counts for all adjacent chunks
                for (let i = 0; i < Directions.All.length; i++) {
                    const direction = Directions.All[i]
                    const adjacentChunk = this.getChunkAtCoords (direction.getAdjacentPosition (position))

                    if (adjacentChunk) {
                        chunk.loadedNeighbors += 1
                        adjacentChunk.loadedNeighbors += 1
                        chunk.neighbors[i] = adjacentChunk
                        adjacentChunk.neighbors[direction.opposite.index] = chunk

                        if (this.shouldCreateGeometryForChunk (adjacentChunk))
                            chunksToRender.push (adjacentChunk) }}}})

        // Create geometry for any chunks that need to be rendered
        if (chunksToRender.length) {
            const chunks = new Array (chunksToRender.length)
            for (let i = 0; i < chunksToRender.length; i++) {
                const { position, blocks, neighbors } = chunksToRender[i]
                const neighborSides = new Array (Directions.All.length)
                for (let j = 0; j < Directions.All.length; j++) {
                    if (neighbors[j].blocks) {
                        neighborSides[j] = neighbors[j].sides[Directions.All[j].opposite.index] }}

                chunks[i] = { position, blocks, neighborSides }}

            this.createChunkGeometry (chunks) }}

    handleGeometryWorkerMessage = ({ data }) => {
        if (data.message === 'createChunkGeometry') {
            this.chunksLoaded += data.chunks.length

            data.chunks.forEach (({ position, buffers, vertexBufferSize, blockFaceBufferSize }) => {
                const chunk = this.chunks[coords (position.x, position.y, position.z)]
                chunk.createBufferGeometry (buffers, vertexBufferSize, blockFaceBufferSize)

                // if (this.shouldCreatePhysicsBodyForChunk (position))
                //     this.physics.addChunk (position, buffers.vertexBuffer, vertexBufferSize)
            }) }}

    handleEntityUpdate = (uuid, position) => {
        this.entities[uuid].mesh.position.copy (position) }


    // Update method

    step (_) {
        // this.physics.step (dt)
        this.machinery.step ()
    }


    // Miscellaneous helper methods

    getChunkAtCoords = ({ x, y, z }) =>
        this.chunks[coords (x, y, z)]

    getChunkAtPosition = ({ x, y, z }) =>
        this.chunks[coords (Math.floor (x / 16), Math.floor (y / 16), Math.floor (z / 16))]

    getBlockAtPosition = position =>
        this.withChunk (position, (chunk, chunkPos) => chunk.getBlockAtPosition (chunkPos)) || 0

    getPositionForFaceIndex = (position, faceIndex) =>
        this.withChunk (position, chunk => chunk.getWorldPosFromChunkPos (chunk.getPositionForFaceIndex (faceIndex)))

    getPositionAndDirectionForFaceIndex = (position, faceIndex) =>
        this.withChunk (position, chunk => ({
            position: chunk.getWorldPosFromChunkPos (chunk.getPositionForFaceIndex (faceIndex)),
            direction: chunk.getDirectionForFaceIndex (faceIndex) }))

    getIntersections = (position, direction) => {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
         first (sortBy (this.getIntersections (position, direction), 'distance'))

    setChunkAtCoords = ({ x, y, z }, chunk) => {
        this.chunks[coords (x, y, z)] = chunk }

    setBlockHighlight = (position, highlight) => {
        this.withChunk (position, (chunk, chunkPos) => chunk.setBlockHighlight (chunkPos, highlight)) }

    shouldCreateGeometryForChunk = chunk =>
        chunk.blocks && chunk.loadedNeighbors === 6 &&
        Directions.All.some (direction => !chunk.neighbors[direction.index].blocks || !chunk.neighbors[direction.index].sidesAreSolid[direction.opposite.index])

    shouldCreatePhysicsBodyForChunk = ({ x, y, z }) =>
        x >= -1 && x <= 1 && z >= -1 && z <= 1 && y >= 1 && y <= 3

    withChunk (position, callback) {
        const chunk = this.getChunkAtPosition (position)
        if (chunk) { return callback (chunk, chunk.getChunkPosFromWorldPos (position)) }}}
