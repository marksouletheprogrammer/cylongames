/**
 * WebGL Utilities
 * A collection of utility functions for working with WebGL
 */

const WebGLUtils = {
    /**
     * Initialize a WebGL context
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @returns {WebGLRenderingContext|null} The WebGL context or null if not supported
     */
    initWebGL: function(canvas) {
        let gl = null;
        
        try {
            // Try to grab the standard context. If it fails, fallback to experimental.
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        } catch(e) {
            console.error("Unable to initialize WebGL. Your browser may not support it.", e);
        }
        
        if (!gl) {
            console.error("WebGL not supported");
            return null;
        }
        
        return gl;
    },
    
    /**
     * Create and compile a shader
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {number} type - The type of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
     * @param {string} source - The shader source code
     * @returns {WebGLShader|null} The compiled shader or null if compilation failed
     */
    createShader: function(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        // Check if compilation was successful
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shader: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    },
    
    /**
     * Create a shader program from vertex and fragment shaders
     * @param {WebGLRenderingContext} gl - The WebGL context
     * @param {WebGLShader} vertexShader - The vertex shader
     * @param {WebGLShader} fragmentShader - The fragment shader
     * @returns {WebGLProgram|null} The shader program or null if linking failed
     */
    createProgram: function(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        // Check if linking was successful
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    },
    
    /**
     * Resize the canvas to match its display size
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @returns {boolean} True if the canvas was resized
     */
    resizeCanvasToDisplaySize: function(canvas) {
        // Look up the size the browser is displaying the canvas
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        // Check if the canvas is not the same size
        const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
        
        if (needResize) {
            // Make the canvas the same size
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        
        return needResize;
    }
}; 