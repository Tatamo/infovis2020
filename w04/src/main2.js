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

	const geometry = new THREE.Geometry();

	const box_vertices = [
		[-0.5, -0.5, -0.5],
		[-0.5, -0.5, 0.5],
		[-0.5, 0.5, -0.5],
		[0.5, -0.5, -0.5],
		[-0.5, 0.5, 0.5],
		[0.5, -0.5, 0.5],
		[0.5, 0.5, -0.5],
		[0.5, 0.5, 0.5]
	].map(v => new THREE.Vector3().fromArray(v));
	geometry.vertices.push(...box_vertices);

	const base_color = new THREE.Color(1, 0, 0);
	const changed_color = new THREE.Color(0, 1, 0);
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
		face.color = base_color.clone();
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

	renderer.domElement.addEventListener("click", e => {
		const view_x = e.clientX - renderer.domElement.getBoundingClientRect().x;
		const view_y = e.clientY - renderer.domElement.getBoundingClientRect().y;
		const ndc_x = (view_x / width) * 2 - 1; // leftmost: -1, rightmost: 1
		const ndc_y = ((view_y / height) * 2 - 1) * -1;
		const pos = new THREE.Vector3(ndc_x, ndc_y, 1).unproject(camera);

		const origin = camera.position;
		const direction = pos.sub(camera.position).normalize();
		const raycaster = new THREE.Raycaster(origin, direction);
		const intersects = raycaster.intersectObject(cube);
		if (intersects.length > 0) {
			const hit_color = intersects[0].face.color;
			if (hit_color.equals(base_color)) {
				hit_color.copy(changed_color);
			} else {
				hit_color.copy(base_color);
			}
			intersects[0].object.geometry.colorsNeedUpdate = true;
		}
	});

	loop();

	function loop() {
		requestAnimationFrame(loop);
		cube.rotation.x += 0.001;
		cube.rotation.y += 0.001;
		renderer.render(scene, camera);
	}
}
