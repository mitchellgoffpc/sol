import { times } from 'lodash-es'

function createElement (tag, className, attributes = {}) {
    let element = document.createElement(tag)
    element.classList.add(className)
    for (let attribute in attributes) {
        element.setAttribute(attribute, attributes[attribute]) }
    return element }

function createIconInSlot (slotId) {
    let icon = createElement ('div', 'icon', { 'slot-id': slotId })
    icon.style.top = `${10 + 25 + 50 * Math.floor(slotId / 10)}px`
    icon.style.left = `${10 + 25 + 50 * (slotId % 10)}px`
    return icon }


export default class PlayerInventory {
    slots = times (10 * 4, _ => null)
    currentItem = null

    constructor () {
        for (let i = 0; i < 10; i++) {
            this.slots[i] = { id: 'grass', count: 64 }}

        this.window = document.getElementById ('inventory-window')
        this.quickbar = document.getElementById ('inventory-quickbar')
        if (this.window.innerHTML !== '') {
            throw Error("Inventory window is already bound to an Inventory object") }

        this.drawInventoryQuickbar () }

    // Event handlers

    handleShowWindow = show => {
        if (show) {
            this.drawInventoryWindow ()
            this.window.addEventListener ("mousedown", this.handleClickWindow)
            window.addEventListener ("mousemove", this.handleMouseMove)
            this.window.style.display = 'block' }
        else {
            this.window.style.display = 'none'
            this.window.removeEventListener ("mousedown", this.handleClickWindow)
            window.removeEventListener ("mousemove", this.handleMouseMove)
            this.clearInventoryWindow () }}

    handleClickWindow = event => {
        event.stopPropagation ()

        let e = event.target
        while (!e.hasAttribute('slot-id') && e.id !== 'inventory-window')
            e = e.parentElement
        if (e.id === 'inventory-window')
            return
        let slotId = parseInt (e.getAttribute ('slot-id'))

        if (this.currentItem) {
            this.slots[slotId] = this.currentItem
            this.currentItem = null
            this.window.appendChild (createIconInSlot (slotId))
            document.body.removeChild (this.currentIcon) }
        else {
            this.currentItem = this.slots[slotId]
            this.slots[slotId] = null
            this.currentIcon = createElement ('div', 'active-icon')
            this.currentIcon.style.left = `${event.pageX}px`
            this.currentIcon.style.top = `${event.pageY}px`
            this.window.removeChild (e)
            document.body.appendChild (this.currentIcon) }}

    handleMouseMove = event => {
        if (this.currentItem) {
            this.currentIcon.style.left = `${event.pageX}px`
            this.currentIcon.style.top = `${event.pageY}px` }}

    // Helper functions

    drawInventoryWindow = () => {
        for (let i = 0; i < 4; i++) {
            let row = createElement ('div', 'row')
            for (let j = 0; j < 10; j++) {
                row.appendChild (createElement ('div', 'column', { 'slot-id': i*10 + j })) }
            this.window.appendChild (row) }

        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i]) {
                this.window.appendChild (createIconInSlot (i)) }}}

    clearInventoryWindow = () => {
        while (this.window.firstChild) {
            this.window.removeChild (this.window.firstChild) }}

    drawInventoryQuickbar = () => {
        for (let j = 0; j < 10; j++) {
            this.quickbar.appendChild (createElement ('div', 'column', { 'slot-id': j })) }}}
