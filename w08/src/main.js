function main() {
	const volume = new KVS.LobsterData();
	const screen = new KVS.THREEScreen();

	screen.init(volume, {
		width: window.innerWidth,
		height: window.innerHeight,
		enableAutoResize: false
	});

	const bounds = Bounds(volume);
	screen.scene.add(bounds);

	const isovalue = 128;
	const surfaces = Isosurfaces(volume, isovalue, screen.light);

	screen.scene.add(surfaces);

	document.addEventListener('mousemove', function () {
		screen.light.position.copy(screen.camera.position);
	});

	window.addEventListener('resize', function () {
		screen.resize([window.innerWidth, window.innerHeight]);
	});

	screen.loop();
}
