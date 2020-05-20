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
	document.body.appendChild(renderer.domElement);

	const geometry = new THREE.Geometry();

	const box_vertices = [
		[-1, -1, -1],
		[-1, -1, 1],
		[-1, 1, -1],
		[1, -1, -1],
		[-1, 1, 1],
		[1, -1, 1],
		[1, 1, -1],
		[1, 1, 1]
	].map(v => new THREE.Vector3().fromArray(v));
	geometry.vertices.push(...box_vertices);

	const faces = [
		[0, 1, 2],
		[0, 2, 3],
		[0, 3, 1],
		[3, 2, 6],
		[1, 3, 5],
		[2, 1, 4],
		[6, 5, 3],
		[4, 6, 2],
		[5, 4, 1],
		[4, 5, 7],
		[5, 6, 7],
		[6, 4, 7]
	].map(f => {
		const face = new THREE.Face3(...f);
		face.color = new THREE.Color(1, 0, 0);
		return face;
	});
	geometry.faces.push(...faces);

	const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
	material.vertexColors = THREE.FaceColors;

	geometry.computeFaceNormals();
	material.side = THREE.FrontSide;
	const cube = new THREE.Mesh(geometry, material);
	scene.add(cube);

	const light = new THREE.PointLight(0xffffff);
	light.position.set(2, 2, 2);
	scene.add(light);

	loop();

	function loop() {
		requestAnimationFrame(loop);
		cube.rotation.x += 0.001;
		cube.rotation.y += 0.001;
		renderer.render(scene, camera);
	}
}
