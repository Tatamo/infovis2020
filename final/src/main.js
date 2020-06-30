function BoundingBoxGeometry(volume) {
	const { x: minx, y: miny, z: minz } = volume.min_coord;
	const { x: maxx, y: maxy, z: maxz } = volume.max_coord

	const vertices = [
		[minx, miny, minz], // 0
		[maxx, miny, minz], // 1
		[maxx, miny, maxz], // 2
		[minx, miny, maxz], // 3
		[minx, maxy, minz], // 4
		[maxx, maxy, minz], // 5
		[maxx, maxy, maxz], // 6
		[minx, maxy, maxz] // 7
	].map(v => new THREE.Vector3().fromArray(v));

	const faces = [
		[0, 1, 2], // f0
		[0, 2, 3], // f1
		[7, 6, 5], // f2
		[7, 5, 4], // f3
		[0, 4, 1], // f4
		[1, 4, 5], // f5
		[1, 5, 6], // f6
		[1, 6, 2], // f7
		[2, 6, 3], // f8
		[3, 6, 7], // f9
		[0, 3, 7], // f10
		[0, 7, 4], // f11
	].map(f => new THREE.Face3(...f));

	const geometry = new THREE.Geometry();
	geometry.vertices.push(...vertices);
	geometry.faces.push(...faces);
	geometry.doubleSided = true;
	return geometry;
}

function VolumeTexture(volume) {
	const width = volume.resolution.x * volume.resolution.z;
	const height = volume.resolution.y;
	const data = new Uint8Array(width * height);
	for (let z = 0, index = 0; z < volume.resolution.z; z++) {
		for (let y = 0; y < volume.resolution.y; y++) {
			for (let x = 0; x < volume.resolution.x; x++ , index++) {
				const u = volume.resolution.x * z + x;
				const v = y;
				data[width * v + u] = volume.values[index][0];
			}
		}
	}

	var format = THREE.AlphaFormat;
	var type = THREE.UnsignedByteType;

	var texture = new THREE.DataTexture(data, width, height, format, type);
	texture.generateMipmaps = false;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.needsUpdate = true;
	return texture;
}

function TransferFunctionTexture(cmap_generator) {
	var resolution = 256;
	var width = resolution;
	var height = 1;
	var data = new Float32Array(width * height * 4);
	var cmap = cmap_generator(256);
	for (var i = 0; i < resolution; i++) {
		var color = cmap[i][1];
		var alpha = i / 255.0;
		data[4 * i + 0] = color.r;
		data[4 * i + 1] = color.g;
		data[4 * i + 2] = color.b;
		data[4 * i + 3] = alpha;
	}

	var format = THREE.RGBAFormat;
	var type = THREE.FloatType;

	var texture = new THREE.DataTexture(data, width, height, format, type);
	texture.generateMipmaps = false;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.needsUpdate = true;
	return texture;
}

class DatProperties {
	first_hit_threshold = 0.65;
	linear_interpolation = true;
	blinn_phong_reflection_enable = true;
	dt = 0.5;
	mode = 3;
	getUniformsObject() {
		return {
			first_hit_threshold: {
				type: "float",
				value: this.first_hit_threshold
			},
			linear_interpolation: {
				type: "bool",
				value: this.linear_interpolation
			},
			blinn_phong_reflection_enable: {
				type: "bool",
				value: this.blinn_phong_reflection_enable
			},
			dt: {
				type: "float",
				value: this.dt
			},
			mode: {
				type: "int",
				value: this.mode
			}
		}
	}
}

class ColorMapManager {
	static DivergingBlueRed = 0;
	static DivergingGreenPurple = 1;
	static WhiteRed = 2;
	static Rainbow = 3;
	static ColorMapLength = 256;
	static ColorMapGenerators = {
		[ColorMapManager.DivergingBlueRed]: createDivergingColorMapBlueRed,
		[ColorMapManager.DivergingGreenPurple]: createDivergingColorMapGreenPurple,
		[ColorMapManager.WhiteRed]: createColorMapWhiteRed,
		[ColorMapManager.Rainbow]: createColorMapRainbow
	}

	constructor() {
		this._transfer_function_data = ColorMapManager.DivergingBlueRed;
		this.lut = new THREE.Lut('rainbow', ColorMapManager.ColorMapLength);
		for (const [key, gen] of Object.entries(ColorMapManager.ColorMapGenerators)) {
			this.lut.addColorMap(key, gen(ColorMapManager.ColorMapLength).map(([s, c]) => [s, `0x${c.getHexString()}`]))
		}
		this.lut.changeColorMap(ColorMapManager.DivergingBlueRed);
		this.legend = null;
	}
	get transfer_function_data() {
		return this._transfer_function_data;
	}
	set transfer_function_data(value) {
		this._transfer_function_data = value;
		this.lut.changeColorMap(value);
	}
	updateLegend(scene) {
		if (this.legend !== null) {
			scene.remove(this.legend);
		}
		this.legend = this.lut.setLegendOn({
			'layout': 'horizontal',
			'position': { 'x': 100, 'y': -10, 'z': 0 },
			'dimensions': { 'width': 4, 'height': 20 }
		});
		scene.add(this.legend);
	}
	getUniformsObject() {
		return {
			transfer_function_data: {
				type: "t",
				value: TransferFunctionTexture(ColorMapManager.ColorMapGenerators[this.transfer_function_data])
			}
		}
	}
}

function main() {
	const properties = new DatProperties();
	const colormaps = new ColorMapManager();

	const volume = new KVS.LobsterData();
	const screen = new KVS.THREEScreen();

	screen.init(volume, {
		width: window.innerWidth - 32,
		height: window.innerHeight * 0.9,
		enableAutoResize: false
	});

	const exit_buffer = new THREE.Scene();
	const exit_texture = new THREE.WebGLRenderTarget(
		screen.width, screen.height,
		{
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			format: THREE.RGBFormat,
			type: THREE.FloatType,
			generateMipmaps: false
		}
	);

	const bounding_geometry = BoundingBoxGeometry(volume);
	const volume_texture = VolumeTexture(volume);

	const bounding_material = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('bounding.vert').textContent,
		fragmentShader: document.getElementById('bounding.frag').textContent,
		side: THREE.BackSide
	});

	const bounding_mesh = new THREE.Mesh(bounding_geometry, bounding_material);
	exit_buffer.add(bounding_mesh);

	const raycaster_material = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('raycaster.vert').textContent,
		fragmentShader: document.getElementById('raycaster.frag').textContent,
		side: THREE.FrontSide,
		uniforms: {
			volume_resolution: { type: "v3", value: volume.resolution },
			exit_points: { type: "t", value: exit_texture },
			volume_data: { type: "t", value: volume_texture },
			light_position: { type: "v3", value: screen.light.position },
			camera_position: { type: "v3", value: screen.camera.position },
			background_color: { type: "v3", value: new THREE.Vector3().fromArray(screen.renderer.getClearColor().toArray()) },
			...properties.getUniformsObject(),
			...colormaps.getUniformsObject()
		}
	});

	var raycaster_mesh = new THREE.Mesh(bounding_geometry, raycaster_material);
	screen.scene.add(raycaster_mesh);
	colormaps.updateLegend(screen.scene);
	document.addEventListener('mousemove', function () {
		screen.light.position.copy(screen.camera.position);
	});

	window.addEventListener('resize', function () {
		screen.resize([window.innerWidth - 32, window.innerHeight * 0.9]);
	});

	screen.loop();

	screen.draw = function () {
		if (screen.renderer == undefined) return;
		screen.scene.updateMatrixWorld();
		screen.trackball.handleResize();

		screen.renderer.render(exit_buffer, screen.camera, exit_texture, true);
		screen.renderer.render(screen.scene, screen.camera);
		screen.trackball.update();
	}

	const gui = new dat.GUI();
	gui.width = 400;
	const updateUniformProp = prop_name => () => raycaster_material.uniforms[prop_name].value = properties.getUniformsObject()[prop_name].value;
	const add = (gui, prop_name, ...params) => gui.add(properties, prop_name, ...params).onChange(updateUniformProp(prop_name));

	add(gui, "blinn_phong_reflection_enable").name("enable shader refrection");
	const folder_colormap = gui.addFolder("Colormap");
	folder_colormap.open();
	folder_colormap.add(colormaps, "transfer_function_data", {
		["diverging blue to red"]: ColorMapManager.DivergingBlueRed,
		["diverging green to purple"]: ColorMapManager.DivergingGreenPurple,
		["white to red"]: ColorMapManager.WhiteRed,
		["rainbow colormap"]: ColorMapManager.Rainbow
	}).onChange(() => {
		raycaster_material.uniforms["transfer_function_data"].value = colormaps.getUniformsObject().transfer_function_data.value;
		colormaps.updateLegend(screen.scene);
	}).name("change colormap");
	const folder_volume_rendering = gui.addFolder("Volume Rendering");
	folder_volume_rendering.open();
	add(folder_volume_rendering, "dt", 0.1, 1).name("sampling rate");
	const mode_change_option = folder_volume_rendering.add(properties, "mode", { accumulate: 0, ["raycast based isosurface"]: 1, ["X-ray"]: 2, MIP: 3 }).name("volume rendering mode")
	const folder_first_hit_params = folder_volume_rendering.addFolder("Isosurface Options");
	mode_change_option.onChange(()=>{
		updateUniformProp("mode")();
		if(+properties.getUniformsObject()["mode"].value === 1){
			folder_first_hit_params.open();
		} else{
			folder_first_hit_params.close();
		}
	});
	add(folder_first_hit_params, "first_hit_threshold", 0, 1).name("first hit threshold");
	add(folder_first_hit_params, "linear_interpolation").name("first hit linear interpolation");
}
