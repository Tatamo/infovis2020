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

	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
	const cube = new THREE.Mesh(geometry, material);
	scene.add(cube);

	const light = new THREE.PointLight(0xffffff);
	light.position.set(1, 1, 1);
	scene.add(light);

	loop();

	function loop() {
		requestAnimationFrame(loop);
		cube.rotation.x += 0.001;
		cube.rotation.y += 0.001;
		renderer.render(scene, camera);
	}
}
