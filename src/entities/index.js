import * as Three from 'three'
import Shapes from 'util/shapes'

const UP               = new Three.Vector3 (0, 1, 0)
const GRAVITY          = new Three.Vector3 (0, -9.81/50, 0)
const DEFAULT_ROTATION = new Three.Vector2 (0, 0)
const DEFAULT_VELOCITY = new Three.Vector3 (0, 0, 0)

const getRotatedMovementVector = (movement, rotation) =>
    movement.clone () .applyAxisAngle (UP, rotation.x) .normalize ()


// Entity base class

export default class Entity {
    needsPhysicsBody = true
    needsGameTick = false
    hasGravity = true

    constructor (properties = {}) {
        this.mesh = this.createMesh (properties)
        this.properties = properties }

    spawn (world, position, rotation = DEFAULT_ROTATION, velocity = DEFAULT_VELOCITY) {
        this.world = world
        this.position = position.clone ()
        this.rotation = rotation.clone ()
        this.velocity = velocity.clone ()
        this.mesh.position.set (position.x, position.y, position.z)
        world.addEntity (this) }

    // Geometry helper functions

    createMesh (properties) {
        return new Three.Mesh (this.createGeometry (properties), this.createMaterial (properties)) }

    createMaterial ({ color = 0xFFFFFF }) {
        return new Three.MeshLambertMaterial ({ color }) }

    createGeometry (properties) {
        if (properties.shape === Shapes.BOX)
            return new Three.BoxGeometry (properties.x, properties.y, properties.z)
        else if (properties.shape === Shapes.SPHERE)
            return new Three.SphereGeometry (properties.radius, 16, 12)
        else if (properties.shape === Shapes.CYLINDER)
            return new Three.CylinderGeometry (properties.radius, properties.radius, properties.height, 16) }

    // Movement helper functions

    move (desiredMovement, dt) {
        let currentChunk = this.world.getChunkAtPosition (this.position)
        let chunkIsLoaded = currentChunk && currentChunk.isLoaded ()

        // Update our velocity
        this.velocity = this.getValidMovement (this.velocity.clone () .addScaledVector (GRAVITY, this.hasGravity && chunkIsLoaded ? 1/120 : 0))

        // Update our position
        this.position.add (this.getValidMovement
            (getRotatedMovementVector (desiredMovement, this.rotation)
                .multiplyScalar (dt / 120)
                .add (this.velocity))) }

    getValidMovement (movement) {
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

        return movement }

    // Game tick

    step () {}

    // Helper functions

    getBlockPositionAtOffset = (x, y, z) =>
        new Three.Vector3 (x, y, z) .add (this.position) .floor ()

    isTouchingGround = () =>
        this.world.getBlockAtPosition (this.position.clone () .addY (-.01) .floor ())

    get uuid() {
        return this.mesh.uuid }}
