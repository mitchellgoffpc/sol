import * as Three from 'three'
import Blocks from 'blocks'
import Entity from 'entities'
import Shapes from 'util/shapes'
import PlayerInventory from 'player/inventory'


// Constants

const UP               = new Three.Vector3 (0, 1, 0)
const GRAVITY          = new Three.Vector3 (0, -9.81/50, 0)
const INITIAL_POSITION = new Three.Vector3 (8, 45, 12)
const INITIAL_VELOCITY = new Three.Vector3 (0, 0, 0)
const INITIAL_ROTATION = new Three.Vector2 (0, 0)

const RENDER_DISTANCE = 20
const AXES = [
    { a: 'x', b: 'z', c: 'y' },
    { a: 'z', b: 'x', c: 'y' },
    { a: 'y', b: 'x', c: 'z' }]

const getDirectionVector = rotation =>
    new Three.Vector3 (-Math.sin (rotation.x) * Math.cos (rotation.y),
                       -Math.sin (rotation.y),
                       -Math.cos (rotation.x) * Math.cos (rotation.y))

const getRotatedMovementVector = (movement, rotation) =>
    movement.clone () .applyAxisAngle (UP, rotation.x) .normalize ()


// Helper functions

const eq = (a, b) =>
    a.x === b.x && a.y === b.y && a.z === b.z

const getChunkPosition = ({ x, y, z }) =>
    ({ x: Math.floor (x / 16), y: Math.floor (y / 16), z: Math.floor (z / 16) })



// Player entity class

class PlayerEntity extends Entity {
    constructor (player) {
        super ({ shape: Shapes.CYLINDER, radius: 0.5, height: 2 })
        this.player = player }}


// Player class

export default class Player {
    position = INITIAL_POSITION.clone ()
    velocity = INITIAL_VELOCITY.clone ()
    rotation = INITIAL_ROTATION.clone ()
    gaze = getDirectionVector (INITIAL_ROTATION)
    currentChunkPosition = getChunkPosition (INITIAL_POSITION)
    currentCrosshairTarget = null
    flying = false

    playerEntity = new PlayerEntity ()
    inventory = new PlayerInventory ()
    camera = new Three.PerspectiveCamera (45, 1, 0.1, 1000)

    constructor (world) {
        this.world = world
        this.world.spawnEntity (this.position.clone () .addY (1), this.playerEntity) }


    // Event handlers

    handleShowInventory = this.inventory.handleShowWindow
    handleSetQuickbarSlot = this.inventory.handleSetQuickbarSlot

    handleJump = () => {
        if (!this.flying && this.world.getBlockAtPosition (this.position.clone () .addY (-.01) .floor ())) {
            this.velocity.addY (.07) }}

    handleToggleFlying = () => {
        this.velocity.multiplyScalar (0)
        this.flying = !this.flying }

    handleUpdateRotation = (movementX, movementY) => {
        let rx = this.rotation.x - movementX / 500
        let ry = this.rotation.y + movementY / 500
        this.rotation.x = (rx + (rx < 0 ? Math.PI * 2 : 0)) % (Math.PI * 2)
        this.rotation.y = Math.clamp (ry, -Math.PI / 2 + 0.0001, Math.PI / 2 - 0.0001)
        this.gaze = getDirectionVector (this.rotation) }

    handleResizeCamera = (width, height) => {
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix () }

    handleHighlightCrosshairTarget = (previous, next) => {
        if (next && (!previous || !eq (next.position, previous.position))) {
            this.world.setBlockHighlight (next.position, true) }
        if (previous && (!next || !eq (next.position, previous.position))) {
            this.world.setBlockHighlight (previous.position, false) }}

    handlePlaceBlock = () => {
        const target = this.currentCrosshairTarget
        const activeItem = this.inventory.getActiveItem ()
        if (target && activeItem) {
            this.world.placeBlock (target.direction.getAdjacentPosition (target.position), Blocks.fromBlockID(activeItem.id))
            this.inventory.setSlotCount (this.inventory.activeQuickbarSlot, activeItem.count - 1) }}

    handleDestroyBlock = () => {
        const target = this.currentCrosshairTarget
        if (target)
            this.world.destroyBlock (target.position) }

    handleRefreshChunks = (previous, next) => {
        if (previous && !eq (previous, next)) {
            AXES.forEach (({ a, b }) => {
                const dir = next[a] - previous[a] > 0 ? 1 : -1
                const prevA = previous[a], prevB = previous[b]

                Promise.resolved().then(() => {
                    for (let i = prevA, limit = next[a]; dir > 0 ? i < limit : i > limit; i += dir) {
                        for (let j = prevB - RENDER_DISTANCE; j <= prevB + RENDER_DISTANCE; j++) {
                            // const positionsInBatch = range (-RENDER_DISTANCE - 1, RENDER_DISTANCE + 2)
                            // this.world.loadChunks (positionsInBatch.map (k => ({ [a]: i + (RENDER_DISTANCE + 1) * dir, [b]: j, [c]: k })))
                            // this.world.unloadChunks (positionsInBatch.map (k => ({ [a]: i - (RENDER_DISTANCE + 1) * dir, [b]: j, [c]: k })))
                        }}})

                previous[a] = next[a] }) }}


    // Update handler method

    step (dt, desiredMovement) {
        let currentChunk = this.world.getChunkAtPosition (this.position)
        let chunkIsLoaded = currentChunk && currentChunk.isLoaded ()
        if (!this.flying) desiredMovement.setY (0)

        // Update our velocity
        this.velocity = this.getValidMovement (this.velocity.clone () .addScaledVector (GRAVITY, this.flying || !chunkIsLoaded ? 0 : 1/120))

        // Update our position
        this.position.add (this.getValidMovement
            (getRotatedMovementVector (desiredMovement, this.rotation)
                .multiplyScalar (dt / 120)
                .add (this.velocity)))

        // Update the camera's position and rotation
        this.camera.position.set (this.position.x, this.position.y + 1.8, this.position.z)
        this.camera.lookAt (this.camera.position.clone () .add (this.gaze))

        // // Update the crosshair target
        const newCrosshairTarget = this.getCrosshairTarget ()
        this.handleHighlightCrosshairTarget (this.currentCrosshairTarget, newCrosshairTarget)
        this.currentCrosshairTarget = newCrosshairTarget

        // // Update the surrounding chunks
        // const newChunkPosition = getChunkPosition (this.position)
        // this.handleRefreshChunks (this.currentChunkPosition, newChunkPosition)
        // this.currentChunkPosition = newChunkPosition
    }


    // Helper methods

    getBlockPositionAtOffset = (x, y, z) =>
        new Three.Vector3 (x, y, z) .add (this.position) .floor ()

    getCrosshairTarget = () => {
        const target = this.world.getClosestIntersection (this.camera.position, this.gaze)
        if (target && target.distance < 10 && target.object.name === "CHUNK")
             return this.world.getPositionAndDirectionForFaceIndex (target.object.position, target.faceIndex)
        else return null }

    getValidMovement = movement => {
        // Floor collision check
        for (let x = -.5; x < 1; x++) {
            for (let z = -.5; z < 1; z++) {
                if (this.world.getBlockAtPosition (this.getBlockPositionAtOffset (x, movement.y, z))) {
                    movement.y = Math.max (0, movement.y) }}}

        // X collision check
        if (movement.x !== 0) {
            for (let y = 0; y < 3; y += 0.95) {
                for (let z = -.5; z < 1; z++) {
                    if (this.world.getBlockAtPosition (this.getBlockPositionAtOffset (0.5 * Math.sign (movement.x) + movement.x, y, z))) {
                        movement.x = 0 }}}}

        // Z collision check
        if (movement.z !== 0) {
            for (let y = 0; y < 2; y += 0.95) {
                for (let x = -.5; x < 1; x++) {
                    if (this.world.getBlockAtPosition (this.getBlockPositionAtOffset (x, y, 0.5 * Math.sign (movement.z) + movement.z))) {
                        movement.z = 0 }}}}

        return movement }}
