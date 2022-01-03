import 'assets/index.css'
import 'util/extensions'

import * as Three from 'three'
import Player from 'player'
import World from 'world'
import Directions from 'util/directions'
import { range } from 'lodash'


// Constants

const ZERO = new Three.Vector3 (0, 0, 0)

const KEY_JUMP = 32
const KEY_INVENTORY = 69
const KEY_QUICKBAR = range (48, 58)
const KEY_DIRECTIONS = {
    16: Directions.DOWN.vector,
    32: Directions.UP.vector,
    65: Directions.EAST.vector,
    68: Directions.WEST.vector,
    83: Directions.NORTH.vector,
    87: Directions.SOUTH.vector }


// Helper functions

const getMovementVector = activeKeys =>
    Array.from (activeKeys) .reduce ((total, keyCode) => total.add (KEY_DIRECTIONS[keyCode]), ZERO.clone ())


// Application entry point

window.addEventListener("load", () => {
    const renderer = new Three.WebGLRenderer ({ antialias: true })
    const world = new World ()
    const player = new Player (world)

    let activeKeys = new Set ()
    let controlsAreEnabled = false
    let lastRenderTimestamp = null
    let drawCount = 0, totalTime = 0

    const setPointerLock = lock => {
        if (lock && !controlsAreEnabled)
            document.body.requestPointerLock () .catch (_ => {})
        else if (!lock && controlsAreEnabled)
            document.exitPointerLock () }

    // A little housekeeping

    player.handleResizeCamera (window.innerWidth, window.innerHeight)
    renderer.setSize (window.innerWidth, window.innerHeight)
    document.body.appendChild (renderer.domElement)

    // Attach the event handlers

    window.addEventListener ("resize", () => {
        renderer.setSize (window.innerWidth, window.innerHeight)
        player.handleResizeCamera (window.innerWidth, window.innerHeight) })

    document.addEventListener ("pointerlockchange", () => {
        controlsAreEnabled = document.pointerLockElement === document.body
        if (!controlsAreEnabled) { activeKeys.clear () }})

    document.addEventListener ("mousedown", event => {
        if (!controlsAreEnabled) {
            setPointerLock (true)
            player.handleShowInventory (false) }
        else if (event.which === 1)
            player.handlePlaceBlock ()
        else if (event.which === 3)
            player.handleDestroyBlock () })

    document.addEventListener ("mousemove", event => {
        if (controlsAreEnabled) {
            player.handleUpdateRotation (event.movementX, event.movementY) }})

    document.addEventListener ("keydown", event => {
        if (event.which in KEY_DIRECTIONS && controlsAreEnabled)
            activeKeys.add (event.which)
        else if (KEY_QUICKBAR.includes(event.which))
            player.handleSetQuickbarSlot (event)
        else if (event.which === KEY_INVENTORY) {
            setPointerLock (!controlsAreEnabled)
            player.handleShowInventory (controlsAreEnabled) }})

    document.addEventListener ("keyup", event => {
        if (event.which in KEY_DIRECTIONS && controlsAreEnabled) {
            activeKeys.delete (event.which) }})

    // Render loop

    function draw (timestamp) {
        requestAnimationFrame (draw)
        const dt = lastRenderTimestamp ? timestamp - lastRenderTimestamp : 16
        lastRenderTimestamp = timestamp
        totalTime += dt
        drawCount += 1

        world.step (dt)
        player.step (dt, getMovementVector (activeKeys), ZERO.clone ())
        renderer.render (world.scene, player.camera)

        if (totalTime > 1000) {
            const fps = drawCount / totalTime * 1000
            const draws = renderer.info.render.calls
            totalTime = 0, drawCount = 0
            document.querySelector ("#frame-rate") .innerHTML = `${fps.toFixed(2)}fps | ${draws} draw calls` }}

    draw () })
