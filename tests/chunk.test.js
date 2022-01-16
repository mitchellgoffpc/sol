import { times } from 'lodash'
import Chunk from 'world/chunk'
import Blocks from 'blocks'

let chunk

beforeEach(() => {
    const blocks = new Int32Array (16 * 16 * 16)
    const sides = times (6, _ => new Int32Array (16 * 16))
    const sidesAreSolid = times (6, _ => false)

    blocks.fill (Blocks.Dirt.ID, 0, 16*16*8)
    chunk = new Chunk (null, { x: 0, y: 0, z: 0 }, blocks, sides, sidesAreSolid)
})

test('getBlockAtPosition', () => {
    expect(chunk.getBlockAtPosition ({ x: 7, y: 0, z: 0 })) .toBe (Blocks.Dirt.ID)
    expect(chunk.getBlockAtPosition ({ x: 8, y: 0, z: 0 })) .toBe (0)
})
