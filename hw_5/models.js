function createCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);
  const faceNormals = [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
  const normals = new Float32Array(faceNormals.flatMap(n => [...n, ...n, ...n, ...n]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, indices };
}

//smooth normals
function createSmoothCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);

  const s = 1.0 / Math.sqrt(3);

  const v0 = [-s, -s, -s];
  const v1 = [ s, -s, -s];
  const v2 = [ s,  s, -s];
  const v3 = [-s,  s, -s];
  const v4 = [-s, -s,  s];
  const v5 = [ s, -s,  s];
  const v6 = [ s,  s,  s];
  const v7 = [-s,  s,  s];

  const normalGroups = [
    [v4, v5, v6, v7],
    [v1, v0, v3, v2],
    [v7, v6, v2, v3],
    [v0, v1, v5, v4],
    [v5, v1, v2, v6],
    [v0, v4, v7, v3]
  ];

  const normals = new Float32Array(normalGroups.flatMap(face => face.flatMap(n => n)));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,
     4,  5,  6,   4,  6,  7,
     8,  9, 10,   8, 10, 11,
    12, 13, 14,  12, 14, 15,
    16, 17, 18,  16, 18, 19,
    20, 21, 22,  20, 22, 23
  ]);

  return { positions, normals, indices };
}


function createCylinder(segments) {
  const pos = [], nrm = [], idx = [];

  // Side
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2, x = Math.cos(a), z = Math.sin(a);
    pos.push(x, -1, z, x, 1, z);
    nrm.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < segments; i++) {
    const b = i * 2;
    idx.push(b, b + 1, b + 3, b, b + 3, b + 2);
  }

  // Caps
  for (const y of [-1, 1]) {
    const center = pos.length / 3;
    pos.push(0, y, 0);
    nrm.push(0, y, 0);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pos.push(Math.cos(a), y, Math.sin(a));
      nrm.push(0, y, 0);
    }
    for (let i = 1; i <= segments; i++) {
      if (y > 0) idx.push(center, center + i + 1, center + i);
      else idx.push(center, center + i, center + i + 1);
    }
  }

  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), indices: new Uint16Array(idx) };
}
function sphere(radius, theta_res, phi_res, x0, y0, z0, r, g ,b) {
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
    for (let k = 0; k < indices.length; k+=3){
      colors.push(r,g,b)
    }

    return {
        positions: new Float32Array(positions),
        indices: new Uint16Array(indices),
        colors: new Float32Array(colors)
    };
}