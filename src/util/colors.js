import { chunk } from 'lodash'


export const hexToRgb = hexCode =>
    chunk (hexCode.substr (1), 2) .map (x => parseInt (x.join (''), 16) / 0xFF)

export const rgbToHex = rgb =>
    `#${Array.from (rgb) .map (x => Math.floor (x * 255) .toString (16) .padStart(2, '0')) .join ('')}`
