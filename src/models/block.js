export const geometry = new Float32Array([
    // Bottom
    0, 0, 0,
    1, 0, 0,
    0, 0, 1,
    1, 0, 0,
    1, 0, 1,
    0, 0, 1,

    // Top
    0, 1, 0,
    0, 1, 1,
    1, 1, 0,
    1, 1, 0,
    0, 1, 1,
    1, 1, 1,

    // Front
    0, 0, 0,
    0, 0, 1,
    0, 1, 0,
    0, 1, 0,
    0, 0, 1,
    0, 1, 1,

    // Back
    1, 0, 0,
    1, 1, 0,
    1, 0, 1,
    1, 1, 0,
    1, 1, 1,
    1, 0, 1,

    // Left
    0, 0, 0,
    0, 1, 0,
    1, 0, 0,
    1, 0, 0,
    0, 1, 0,
    1, 1, 0,

    // Right
    0, 0, 1,
    1, 0, 1,
    0, 1, 1,
    1, 0, 1,
    1, 1, 1,
    0, 1, 1 ])


export const colors = new Uint8Array([
    // left column front
    200,  70, 120,
    200,  70, 120,
    200,  70, 120,
    200,  70, 120,
    200,  70, 120,
    200,  70, 120,

    // left column back
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,

    // top
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,

    // top rung right
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,

    // under top rung
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,

    // between top rung and middle
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,

    // top of middle rung
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,

    // right of middle rung
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,

    // bottom of middle rung.
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,

    // right of bottom
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,

    // bottom
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,

    // left side
    160, 160, 220,
    160, 160, 220,
    160, 160, 220,
    160, 160, 220,
    160, 160, 220,
    160, 160, 220 ])
