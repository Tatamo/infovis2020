function createColorMapWhiteRed(length) {
	// Create color map
	return new Array(length).fill(null)
		.map((_, index) => index / (length - 1))
		.map(s => {
			const color = new THREE.Color(1, 1 - s, 1 - s);
			return [s, `0x${color.getHexString()}`];
		});
}

function main() {
	const width = 500;
	const height = 500;

	const scene = new THREE.Scene();

	const fov = 45;
	const aspect = width / height;
	const near = 1;
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 0, 5);
	scene.add(camera);

	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	document.getElementById("container").appendChild(renderer.domElement);


	const vertices = [
		[-1, 1, 0], // 0
		[-1, -1, 0], // 1
		[1, -1, 0]  // 2
	].map(v => new THREE.Vector3().fromArray(v));

	const faces = [
		[0, 1, 2], // f0
	].map(f => {
		const face = new THREE.Face3(...f);
		face.color = new THREE.Color(1, 0, 0);
		return face;
	});

	const cmap_length = 256;

	const scalars = [
		0.1,   // S0
		0.2, // S1
		0.8  // S2
	].map(v => Math.floor((v - 0.1) / (0.8 - 0.1) * (cmap_length - 1))); // [0.1, 0.8] ⊆ R -> [0, 256) ⊆ N

	const cmap = createColorMapWhiteRed(cmap_length);
	// Draw color map
	const lut = new THREE.Lut('rainbow', cmap.length);
	lut.addColorMap('mycolormap', cmap);
	lut.changeColorMap('mycolormap');
	scene.add(lut.setLegendOn({
		'layout': 'horizontal',
		'position': { 'x': 0.6, 'y': -1.1, 'z': 2 },
		'dimensions': { 'width': 0.15, 'height': 1.2 }
	}));

	const geometry = new THREE.Geometry();
	geometry.vertices.push(...vertices);
	geometry.faces.push(...faces);

	const material = new THREE.MeshBasicMaterial();
	// Assign colors for each vertex
	material.vertexColors = THREE.VertexColors;
	for (const face of geometry.faces) {
		face.vertexColors.push(...[face.a, face.b, face.c].map(v_id => scalars[v_id]).map(s => new THREE.Color().setHex(cmap[s][1])));
	}

	const triangle = new THREE.Mesh(geometry, material);
	scene.add(triangle);

	loop();

	function loop() {
		requestAnimationFrame(loop);
		renderer.render(scene, camera);
	}
}
