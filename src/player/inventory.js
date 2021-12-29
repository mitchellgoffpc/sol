import { times } from 'lodash'

// Helper functions

function createElement (tag, className, attributes = {}) {
    let element = document.createElement(tag)
    element.classList.add(className)
    for (let attribute in attributes) {
        element.setAttribute(attribute, attributes[attribute]) }
    return element }

function createIcon (item, x, y, slotId = -1) {
    let icon = slotId > -1 ? createElement ('div', 'icon', { 'slot-id': slotId }) : createElement ('div', 'active-icon')
    icon.style.left = `${x}px`
    icon.style.top = `${y}px`
    if (item.count > 1) {
        let count = createElement ('div', 'count')
        count.innerHTML = item.count
        icon.appendChild (count) }
    return icon }

function createIconInSlot (slotId, item) {
    let left = 10 + 25 + 50 * (slotId % 10)
    let top = 10 + 25 + 50 * Math.floor(slotId / 10)
    return createIcon (item, left, top, slotId) }


// Player inventory class

export default class PlayerInventory {
    slots = times (10 * 4, _ => null)
    current = null

    constructor () {
        for (let i = 0; i < 10; i++) {
            this.slots[i] = { id: 'grass', count: 16 }}

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

        if (!this.current) { // Grab from the slot
            this.setCurrentItem (this.slots[slotId], event.pageX, event.pageY, slotId)
            this.setSlot (slotId, null) }
        else if (!this.slots[slotId]) { // Place in the slot
            this.setSlot (slotId, this.current.item)
            this.setCurrentItem (null) }
        else if (this.current.item.id !== this.slots[slotId].id) { // Swap with the slot
            let currentItem = this.current.item
            this.setCurrentItem (this.slots[slotId], event.pageX, event.pageY, slotId)
            this.setSlot (slotId, currentItem) }
        else { // Grab and merge from slot

        }}

    handleMouseMove = event => {
        if (this.current) {
            this.current.icon.style.left = `${event.pageX}px`
            this.current.icon.style.top = `${event.pageY}px` }}


    // Helper functions

    setCurrentItem = (item, x, y, slotId) => {
        if (this.current) {
            document.body.removeChild (this.current.icon)
            this.current = null }
        if (item) {
            this.current = { item, slotId, icon: createIcon (item, x, y) }
            document.body.appendChild (this.current.icon) }}

    setSlot = (slotId, item) => {
        this.slots[slotId] = item
        let currentSlotIcon = this.window.querySelector (`.icon[slot-id="${slotId}"]`)
        if (currentSlotIcon)
            this.window.removeChild (currentSlotIcon)
        if (item)
            this.window.appendChild (createIconInSlot (slotId, item)) }


    // Drawing functions

    drawInventoryWindow = () => {
        for (let i = 0; i < 4; i++) {
            let row = createElement ('div', 'row')
            for (let j = 0; j < 10; j++) {
                row.appendChild (createElement ('div', 'column', { 'slot-id': i*10 + j })) }
            this.window.appendChild (row) }

        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i]) {
                this.window.appendChild (createIconInSlot (i, this.slots[i])) }}}

    clearInventoryWindow = () => {
        if (this.current) {
            this.setSlot (this.current.slotId, this.current.item)
            this.setCurrentItem (null) }
        while (this.window.firstChild) {
            this.window.removeChild (this.window.firstChild) }}

    drawInventoryQuickbar = () => {
        for (let j = 0; j < 10; j++) {
            this.quickbar.appendChild (createElement ('div', 'column', { 'slot-id': j })) }}}
