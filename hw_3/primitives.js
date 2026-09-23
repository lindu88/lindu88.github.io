// cube
const positions = new Float32Array([
  -1, -1, -1,  // 0
   1, -1, -1,  // 1
   1,  1, -1,  // 2
  -1,  1, -1,  // 3
  -1, -1,  1,  // 4
   1, -1,  1,  // 5
   1,  1,  1,  // 6
  -1,  1,  1   // 7
]);

const colors = new Float32Array([
  1,0,0,  0,1,0,  0,0,1, 1,1,0, 1,0,1, 0,1,1, 1,1,0, 1,0,1
]);


const indices = new Uint16Array([
  // Front
  4, 5, 6,   4, 6, 7,
  // Back
  1, 0, 3,   1, 3, 2,
  // Top
  3, 7, 6,   3, 6, 2,
  // Bottom
  0, 1, 5,   0, 5, 4,
  // Right
  1, 2, 6,   1, 6, 5,
  // Left
  0, 4, 7,   0, 7, 3,
]);
//sphere
function sphere(radius, theta_res, phi_res, x0, y0, z0) {
    const positions = [];
    const indices = [];
    const colors = []

    for (let i = 0; i <= theta_res; i++) {
        const theta = (i * Math.PI) / theta_res; 
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let j = 0; j <= phi_res; j++) {
            const phi = (j * 2 * Math.PI) / phi_res; 
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = radius * sinTheta * cosPhi;
            const y = radius * cosTheta;
            const z = radius * sinTheta * sinPhi;
            
            positions.push(x+x0, y+y0, z+z0);
        }
    }
    //detailed - dont have enough time - used ai
    for (let i = 0; i < theta_res; i++) {
        for (let j = 0; j < phi_res; j++) {
            const first = (i * (phi_res + 1)) + j;
            const second = first + phi_res + 1;

            // First triangle of the quad grid element
            indices.push(first, second, first + 1);
            // Second triangle of the quad grid element
            indices.push(second, second + 1, first + 1);
        }
    }
    //random colors
    for (let k = 0; k < indices.length; k++){
      colors.push(Math.random())
    }

    return {
        positions: new Float32Array(positions),
        indices: new Uint16Array(indices),
        colors: new Float32Array(colors)
    };
}
//cyl
function cyl(radius, theta_res, h, h_res, x0, y0, z0) {
    const positions = [];
    const indices = [];
    const colors = []

    for (let i = 0; i <= theta_res; i++) {
        const theta = (2* i * Math.PI) / theta_res; 
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let j = 0; j<= h * h_res; j++){
          const x = radius * cosTheta
          const y = radius * sinTheta
          const z = h * (j / (h * h_res))

           positions.push(x+x0, y+y0, z+z0);
        }
    }
    //detailed - dont have enough time - used copy of sphere part
    for (let i = 0; i < theta_res; i++) {
        for (let j = 0; j < h * h_res; j++) {
            const first = (i * (h * h_res + 1)) + j;
            const second = first + h* h_res + 1;

            // First triangle of the quad grid element
            indices.push(first, second, first + 1);
            // Second triangle of the quad grid element
            indices.push(second, second + 1, first + 1);
        }
    }
    //random colors
    for (let k = 0; k < indices.length; k++){
      colors.push(Math.random())
    }

    return {
        positions: new Float32Array(positions),
        indices: new Uint16Array(indices),
        colors: new Float32Array(colors)
    };
}