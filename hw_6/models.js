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

  const texCoords = new Float32Array(faceNormals.flatMap(() => [0, 0, 1, 0, 1, 1, 0, 1]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, texCoords, indices };
}

function createSphere(latBands = 20, lonBands = 20) {
  const positions = [], normals = [], texCoords = [], indices = [];

  for (let i = 0; i <= latBands; i++) {
    const theta = i * Math.PI / latBands;

    for (let j = 0; j <= lonBands; j++) {
      const phi = j * 2 * Math.PI / lonBands;

      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.cos(theta);
      const z = Math.sin(theta) * Math.sin(phi);

      positions.push(x, y, z);
      normals.push(x, y, z);
      texCoords.push(j / lonBands, i / latBands);
    }
  }

  for (let i = 0; i < latBands; i++) {
    for (let j = 0; j < lonBands; j++) {
      const a = i * (lonBands + 1) + j;
      const b = a + lonBands + 1;

      indices.push(a, a + 1, b);
      indices.push(a + 1, b + 1, b);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}
function createCylinder(segments = 24) {
  const positions = [], normals = [], texCoords = [], indices = [];

  // Curved surface
  for (let i = 0; i <= segments; i++) {
    const angle = i * 2 * Math.PI / segments;
    const x = Math.cos(angle);
    const z = Math.sin(angle);

    positions.push(x, -1, z, x, 1, z);
    normals.push(x, 0, z, x, 0, z);
    texCoords.push(i / segments, 0, i / segments, 1);
  }

  for (let i = 0; i < segments; i++) {
    const a = 2 * i;
    indices.push(a, a + 1, a + 2);
    indices.push(a + 1, a + 3, a + 2);
  }

  // Top and bottom caps
  for (const y of [-1, 1]) {
    const center = positions.length / 3;

    positions.push(0, y, 0);
    normals.push(0, y, 0);
    texCoords.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
      const angle = i * 2 * Math.PI / segments;
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      positions.push(x, y, z);
      normals.push(0, y, 0);
      texCoords.push((x + 1) / 2, (z + 1) / 2);
    }

    for (let i = 0; i < segments; i++) {
      if (y === 1) {
        indices.push(center, center + i + 2, center + i + 1);
      } else {
        indices.push(center, center + i + 1, center + i + 2);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}
function createCone(segments = 24) {
  const positions = [], normals = [], texCoords = [], indices = [];

  // Curved surface
  for (let i = 0; i <= segments; i++) {
    const angle = i * 2 * Math.PI / segments;
    const x = Math.cos(angle);
    const z = Math.sin(angle);

    const length = Math.sqrt(5);
    const nx = 2 * x / length;
    const ny = 1 / length;
    const nz = 2 * z / length;

    positions.push(x, -1, z, 0, 1, 0);
    normals.push(nx, ny, nz, nx, ny, nz);
    texCoords.push(i / segments, 0, i / segments, 1);
  }

  for (let i = 0; i < segments; i++) {
    const a = 2 * i;
    indices.push(a, a + 1, a + 2);
  }

  // Bottom cap
  const center = positions.length / 3;

  positions.push(0, -1, 0);
  normals.push(0, -1, 0);
  texCoords.push(0.5, 0.5);

  for (let i = 0; i <= segments; i++) {
    const angle = i * 2 * Math.PI / segments;
    const x = Math.cos(angle);
    const z = Math.sin(angle);

    positions.push(x, -1, z);
    normals.push(0, -1, 0);
    texCoords.push((x + 1) / 2, (z + 1) / 2);
  }

  for (let i = 0; i < segments; i++) {
    indices.push(center, center + i + 1, center + i + 2);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}