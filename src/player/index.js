import * as Three from 'three'
import Blocks from 'blocks'
import Entity from 'entities'
import Shapes from 'util/shapes'
import PlayerInventory from 'player/inventory'


// Constants

const INITIAL_POSITION = new Three.Vector3 (8, 45, 12)
const INITIAL_ROTATION = new Three.Vector2 (0, 0)

const RENDER_DISTANCE = 20
const AXES = [
    { a: 'x', b: 'z', c: 'y' },
    { a: 'z', b: 'x', c: 'y' },
    { a: 'y', b: 'x', c: 'z' }]


// Helper functions

const eq = (a, b) =>
    a.x === b.x && a.y === b.y && a.z === b.z

const getChunkPosition = ({ x, y, z }) =>
    ({ x: Math.floor (x / 16), y: Math.floor (y / 16), z: Math.floor (z / 16) })

const getDirectionVector = rotation =>
    new Three.Vector3 (-Math.sin (rotation.x) * Math.cos (rotation.y),
                       -Math.sin (rotation.y),
                       -Math.cos (rotation.x) * Math.cos (rotation.y))



// Player entity class

class PlayerEntity extends Entity {
    constructor (player) {
        super ({ shape: Shapes.CYLINDER, radius: 0.5, height: 2 })
        this.player = player }}


// Player class

export default class Player {
    gaze = getDirectionVector (INITIAL_ROTATION)
    currentChunkPosition = getChunkPosition (INITIAL_POSITION)
    currentCrosshairTarget = null
    flying = false

    inventory = new PlayerInventory ()
    camera = new Three.PerspectiveCamera (45, 1, 0.1, 1000)

    constructor (world) {
        this.world = world
        this.entity = new PlayerEntity (this)
        this.entity.spawn (world, INITIAL_POSITION, INITIAL_ROTATION) }


    // Event handlers

    handleShowInventory = this.inventory.handleShowWindow
    handleSetQuickbarSlot = this.inventory.handleSetQuickbarSlot

    handleJump = () => {
        if (!this.flying && this.entity.isTouchingGround ()) {
            this.velocity.addY (.07) }}

    handleToggleFlying = () => {
        this.velocity.setScalar (0)
        this.flying = !this.flying
        this.entity.hasGravity = !this.flying }

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
        if (this.currentCrosshairTarget)
            this.world.destroyBlock (this.currentCrosshairTarget.position) }

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
        if (!this.flying) desiredMovement.setY (0)
        this.entity.move (desiredMovement .normalize () .multiplyScalar (dt / 120))

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

    getCrosshairTarget = () => {
        const target = this.world.getClosestIntersection (this.camera.position, this.gaze)
        if (target && target.distance < 10 && target.object.name === "CHUNK")
             return this.world.getPositionAndDirectionForFaceIndex (target.object.position, target.faceIndex)
        else return null }

    get position () {
        return this.entity.position }

    get rotation () {
        return this.entity.rotation }

    get velocity () {
        return this.entity.velocity }}
