import { times } from 'lodash'

const STACK_SIZE = 64

// Helper functions

function createElement (tag, classNames, attributes = {}) {
    let element = document.createElement(tag)
    for (let className of classNames.split(' '))
        element.classList.add(className)
    for (let attribute in attributes)
        element.setAttribute(attribute, attributes[attribute])
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
    let left = 25 + 50 * (slotId % 10) + (slotId < 10 ? 0 : 10)
    let top = slotId < 10 ? 25 : 10 + 25 + 50 * Math.floor(slotId / 10 - 1)
    return createIcon (item, left, top, slotId) }


// Player inventory class

export default class PlayerInventory {
    slots = times (10 * 5, _ => null)
    activeQuickbarSlot = 0
    grabbed = null

    constructor () {
        for (let i = 10; i < 20; i += 2)
            this.slots[i] = { id: 2, count: 16 }
        for (let i = 11; i < 20; i += 2)
            this.slots[i] = { id: 1, count: 16 }

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
            this.quickbar.addEventListener ("mousedown", this.handleClickWindow)
            window.addEventListener ("mousemove", this.handleMouseMove)
            this.window.style.display = 'block' }
        else {
            this.window.style.display = 'none'
            this.window.removeEventListener ("mousedown", this.handleClickWindow)
            this.quickbar.removeEventListener ("mousedown", this.handleClickWindow)
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

        if (!this.grabbed) { // Grab from the slot
            this.setGrabbedItem (this.slots[slotId], event.pageX, event.pageY, slotId)
            this.setSlot (slotId, null) }
        else if (!this.slots[slotId]) { // Place in the slot
            this.setSlot (slotId, this.grabbed.item)
            this.setGrabbedItem (null) }
        else if (this.grabbed.item.id !== this.slots[slotId].id) { // Swap with the slot
            let grabbedItem = this.grabbed.item
            this.setGrabbedItem (this.slots[slotId], event.pageX, event.pageY, this.grabbed.slotId)
            this.setSlot (slotId, grabbedItem) }
        else { // Place as many as possible into slot
            let placeCount = Math.min(STACK_SIZE - this.slots[slotId].count, this.grabbed.item.count)
            let newCurrentItem = { ...this.grabbed.item, count: this.grabbed.item.count - placeCount }
            let newSlotItem = { ...this.slots[slotId], count: this.slots[slotId].count + placeCount }
            this.setGrabbedItem (newCurrentItem.count > 0 ? newCurrentItem : null, event.pageX, event.pageY, this.grabbed.slotId)
            this.setSlot (slotId, newSlotItem) }}

    handleMouseMove = event => {
        if (this.grabbed) {
            this.grabbed.icon.style.left = `${event.pageX}px`
            this.grabbed.icon.style.top = `${event.pageY}px` }}

    handleSetQuickbarSlot = event => {
        this.setActiveQuickbarSlot (event.which - 49 + (event.which < 49 ? 10 : 0)) }


    // Helper functions

    getActiveItem = () => this.slots[this.activeQuickbarSlot]

    setGrabbedItem = (item, x, y, slotId) => {
        if (this.grabbed) {
            document.body.removeChild (this.grabbed.icon)
            this.grabbed = null }
        if (item) {
            this.grabbed = { item, slotId, icon: createIcon (item, x, y) }
            document.body.appendChild (this.grabbed.icon) }}

    setSlot = (slotId, item) => {
        this.slots[slotId] = item
        this.drawSlot (slotId) }

    setSlotCount = (slotId, count) => {
        if (count > 0)
             this.slots[slotId].count = count
        else this.slots[slotId] = null
        this.drawSlot (slotId) }

    setActiveQuickbarSlot = slotId => {
        this.activeQuickbarSlot = slotId
        for (let child of this.quickbar.children)
            child.classList.remove ('active')
        this.quickbar.children[slotId].classList.add ('active') }


    // Drawing functions

    drawInventoryWindow = () => {
        for (let i = 0; i < 4; i++) {
            let row = createElement ('div', 'row')
            for (let j = 0; j < 10; j++) {
                row.appendChild (createElement ('div', 'column', { 'slot-id': i*10 + j + 10 })) }
            this.window.appendChild (row) }

        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i]) {
                this.window.appendChild (createIconInSlot (i, this.slots[i])) }}}

    clearInventoryWindow = () => {
        if (this.grabbed) {
            this.setSlot (this.grabbed.slotId, this.grabbed.item)
            this.setGrabbedItem (null) }
        while (this.window.firstChild) {
            this.window.removeChild (this.window.firstChild) }}

    drawInventoryQuickbar = () => {
        for (let i = 0; i < 10; i++) {
            let className = i === this.activeQuickbarSlot ? 'column active' : 'column'
            this.quickbar.appendChild (createElement ('div', className, { 'slot-id': i })) }}

    drawSlot = slotId => {
        let container = slotId < 10 ? this.quickbar : this.window
        let currentSlotIcon = container.querySelector (`.icon[slot-id="${slotId}"]`)
        if (currentSlotIcon)
            container.removeChild (currentSlotIcon)
        if (this.slots[slotId])
            container.appendChild (createIconInSlot (slotId, this.slots[slotId])) }}
