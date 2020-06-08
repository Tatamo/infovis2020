function createColorMapWhiteRed(length) {
	// Create color map
	return new Array(length).fill(null)
		.map((_, index) => index / (length - 1))
		.map(s => {
			const color = new THREE.Color(1, 1 - s, 1 - s);
			return [s, `0x${color.getHexString()}`];
		});
}

function Isosurfaces(volume, isovalue, light) {
	const geometry = new THREE.Geometry();
	const material = new THREE.ShaderMaterial({
		vertexColors: THREE.VertexColors,
		vertexShader: document.getElementById('shader.vert').text,
		fragmentShader: document.getElementById('shader.frag').text,
		uniforms: {
			light_position: { type: 'v3', value: light.position }
		}
	});

	const smin = volume.min_value;
	const smax = volume.max_value;
	isovalue = KVS.Clamp(isovalue, smin, smax);

	const lut = new KVS.MarchingCubesTable();
	const cmap = createColorMapWhiteRed(256);
	let cell_index = 0;
	let counter = 0;
	for (let z = 0; z < volume.resolution.z - 1; z++) {
		for (let y = 0; y < volume.resolution.y - 1; y++) {
			for (let x = 0; x < volume.resolution.x - 1; x++) {
				const indices = cell_node_indices(cell_index++);
				const index = table_index(indices);
				if (index == 0) { continue; }
				if (index == 255) { continue; }

				for (let j = 0; lut.edgeID[index][j] != -1; j += 3) {
					const eid0 = lut.edgeID[index][j];
					const eid1 = lut.edgeID[index][j + 2];
					const eid2 = lut.edgeID[index][j + 1];

					const vid0 = lut.vertexID[eid0][0];
					const vid1 = lut.vertexID[eid0][1];
					const vid2 = lut.vertexID[eid1][0];
					const vid3 = lut.vertexID[eid1][1];
					const vid4 = lut.vertexID[eid2][0];
					const vid5 = lut.vertexID[eid2][1];

					const v0 = new THREE.Vector3(x + vid0[0], y + vid0[1], z + vid0[2]);
					const v1 = new THREE.Vector3(x + vid1[0], y + vid1[1], z + vid1[2]);
					const v2 = new THREE.Vector3(x + vid2[0], y + vid2[1], z + vid2[2]);
					const v3 = new THREE.Vector3(x + vid3[0], y + vid3[1], z + vid3[2]);
					const v4 = new THREE.Vector3(x + vid4[0], y + vid4[1], z + vid4[2]);
					const v5 = new THREE.Vector3(x + vid5[0], y + vid5[1], z + vid5[2]);

					const v01 = interpolated_vertex(v0, v1, isovalue);
					const v23 = interpolated_vertex(v2, v3, isovalue);
					const v45 = interpolated_vertex(v4, v5, isovalue);

					const [s0, s1, s2, s3, s4, s5] = [v0, v1, v2, v3, v4, v5].map(v=>volume.values[vector_to_volume_index(v)][0]);
					const s01 = Math.round((s0 * s0  + s1 * s1) / (s0 + s1));
					const s23 = Math.round((s2 * s2  + s3 * s3) / (s2 + s3));
					const s45 = Math.round((s4 * s4  + s5 * s5) / (s4 + s5));

					geometry.vertices.push(v01);
					geometry.vertices.push(v23);
					geometry.vertices.push(v45);

					const id0 = counter++;
					const id1 = counter++;
					const id2 = counter++;
					const face = new THREE.Face3(id0, id1, id2);
					face.vertexColors.push(...[s01, s23, s45].map(s => new THREE.Color().setHex(cmap[s][1])));
					geometry.faces.push(face);
				}
			}
			cell_index++;
		}
		cell_index += volume.resolution.x;
	}


	geometry.computeVertexNormals();

	// material.color = new THREE.Color("white");

	return new THREE.Mesh(geometry, material);


	function cell_node_indices(cell_index) {
		const lines = volume.resolution.x;
		const slices = volume.resolution.x * volume.resolution.y;

		const id0 = cell_index;
		const id1 = id0 + 1;
		const id2 = id1 + lines;
		const id3 = id0 + lines;
		const id4 = id0 + slices;
		const id5 = id1 + slices;
		const id6 = id2 + slices;
		const id7 = id3 + slices;

		return [id0, id1, id2, id3, id4, id5, id6, id7];
	}

	function vector_to_volume_index(vector) {
		return vector.x + vector.y * volume.resolution.x + vector.z * volume.resolution.x * volume.resolution.y;
	}

	function table_index(indices) {
		const s0 = volume.values[indices[0]][0];
		const s1 = volume.values[indices[1]][0];
		const s2 = volume.values[indices[2]][0];
		const s3 = volume.values[indices[3]][0];
		const s4 = volume.values[indices[4]][0];
		const s5 = volume.values[indices[5]][0];
		const s6 = volume.values[indices[6]][0];
		const s7 = volume.values[indices[7]][0];

		let index = 0;
		if (s0 > isovalue) { index |= 1; }
		if (s1 > isovalue) { index |= 2; }
		if (s2 > isovalue) { index |= 4; }
		if (s3 > isovalue) { index |= 8; }
		if (s4 > isovalue) { index |= 16; }
		if (s5 > isovalue) { index |= 32; }
		if (s6 > isovalue) { index |= 64; }
		if (s7 > isovalue) { index |= 128; }

		return index;
	}

	function interpolated_vertex(v0, v1, s) {
		const s0 = volume.values[vector_to_volume_index(v0)][0];
		const s1 = volume.values[vector_to_volume_index(v1)][0];
		const k = s1 / (s0 + s1);
		return v0.clone().add(v1.clone().addScaledVector(v0, -1).multiplyScalar(k));

	}
}
