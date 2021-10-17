import dedent from 'dedent'


// Shader source

const vertexShaderSource = dedent`
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }`

const fragmentShaderSource = dedent`
    varying lowp vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }`


// Load shaders and program

function loadShader (gl, shaderType, shaderSource) {
    const shader = gl.createShader (shaderType)
    gl.shaderSource (shader, shaderSource)
    gl.compileShader (shader)

    if (!gl.getShaderParameter (shader, gl.COMPILE_STATUS)) {
        alert ('An error occurred compiling the shaders: ' + gl.getShaderInfoLog (shader))
        gl.deleteShader (shader) }

    return shader }

export function loadProgram (gl) {
    const vertexShader = loadShader (gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = loadShader (gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    const shaderProgram = gl.createProgram ()

    gl.attachShader (shaderProgram, vertexShader)
    gl.attachShader (shaderProgram, fragmentShader)
    gl.linkProgram (shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert ('Unable to initialize the shader program: ' + gl.getProgramInfoLog (shaderProgram)) }

    return shaderProgram }
