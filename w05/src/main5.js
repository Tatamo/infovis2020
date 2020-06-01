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

	const light = new THREE.PointLight();
	light.position.set(5, 5, 5);
	scene.add(light);

	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	document.getElementById("container").appendChild(renderer.domElement);

	const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 20);
	const material = new THREE.ShaderMaterial({
		vertexColors: THREE.VertexColors,
		vertexShader: document.getElementById('shader.vert').text,
		fragmentShader: document.getElementById('shader.frag').text,
		uniforms: {
			light_position: { type: 'v3', value: light.position },
			edge: { type: 'i', value: false }
		}
	});
	const material_edge = new THREE.ShaderMaterial({
		vertexColors: THREE.VertexColors,
		vertexShader: document.getElementById('shader.vert').text,
		fragmentShader: document.getElementById('shader.frag').text,
		uniforms: {
			light_position: { type: 'v3', value: light.position },
			edge: { type: 'i', value: true }
		}
	});

	const torus_knot = new THREE.Mesh(geometry, material);
	const torus_knot_edge = new THREE.Mesh(geometry, material_edge);
	torus_knot.material.side = THREE.FrontSide;
	torus_knot_edge.material.side = THREE.BackSide;
	scene.add(torus_knot);
	scene.add(torus_knot_edge);

	loop();

	function loop() {
		requestAnimationFrame(loop);
		torus_knot.rotation.x += 0.01;
		torus_knot.rotation.y += 0.01;
		torus_knot_edge.rotation.x += 0.01;
		torus_knot_edge.rotation.y += 0.01;

		renderer.render(scene, camera);
	}
}
