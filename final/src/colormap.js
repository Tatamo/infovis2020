function Lab2Msh(l, a, b) {
	const m = Math.sqrt(l * l + a * a + b * b);
	const s = m !== 0 ? Math.acos(l / m) : 0;
	const h = Math.atan2(b, a);
	return [m, s, h];
}

function Msh2Lab(m, s, h) {
	const l = m * Math.cos(s);
	const a = m * Math.sin(s) * Math.cos(h);
	const b = m * Math.sin(s) * Math.sin(h);
	return [l, a, b];
}

function RGB2Msh(r, g, b) {
	return Lab2Msh(...rgb2lab([r, g, b].map(v => Math.round(v * 255))));
}

function Msh2RGB(m, s, h) {
	return lab2rgb(Msh2Lab(m, s, h)).map(v => v / 255);
}

// https://www.kennethmoreland.com/color-maps/ColorMapsExpanded.pdf
function interpolateMshColor(msh1, msh2, interp) {
	const adjustHue = ([m_sat, s_sat, h_sat], m_unsat) => {
		if (m_sat >= m_unsat) return h_sat;
		const h_spin = s_sat * Math.sqrt(m_unsat * m_unsat - m_sat * m_sat) / (m_sat * Math.sin(s_sat));
		return h_sat + (h_sat > -Math.PI / 3 ? 1 : -1) * h_spin;
	};
	let [m1, s1, h1] = msh1;
	let [m2, s2, h2] = msh2;
	if (s1 > 0.05 && s2 > 0.05 && Math.abs(h1 - h2) > Math.PI / 3) {
		const m_mid = Math.max(m1, m2, 88);
		if (interp < 0.5) {
			m2 = m_mid;
			s2 = 0;
			h2 = 0;
			interp = interp * 2;
		} else {
			m1 = m_mid;
			s1 = 0;
			h1 = 0;
			interp = interp * 2 - 1;
		}
	}
	if (s1 < 0.05 && s2 > 0.05) {
		h1 = adjustHue([m2, s2, h2], m1);
	}
	else if (s2 < 0.05 && s1 > 0.05) {
		h2 = adjustHue([m1, s1, h1], m2);
	}
	const m_mid = (1 - interp) * m1 + interp * m2;
	const s_mid = (1 - interp) * s1 + interp * s2;
	const h_mid = (1 - interp) * h1 + interp * h2;
	return [m_mid, s_mid, h_mid];
}

function createDivergingColorMapBlueRed(length) {
	const start = RGB2Msh(0.230, 0.299, 0.754); // blue in msh
	const end = RGB2Msh(0.706, 0.016, 0.150); // red in msh
	return new Array(length).fill(null)
		.map((_, index) => index / (length - 1))
		.map(s => {
			const msh = interpolateMshColor(start, end, s);
			return [s, new THREE.Color(...Msh2RGB(...msh))];
		})
}

function createDivergingColorMapGreenPurple(length) {
	const start = RGB2Msh(0.085, 0.532, 0.201); // green in msh
	const end = RGB2Msh(0.436, 0.308, 0.631); // purple in msh
	return new Array(length).fill(null)
		.map((_, index) => index / (length - 1))
		.map(s => {
			const msh = interpolateMshColor(start, end, s);
			return [s, new THREE.Color(...Msh2RGB(...msh))];
		})
}

function createColorMapWhiteRed(length) {
	return new Array(length).fill(null)
		.map((_, index) => index / (length - 1))
		.map(s => {
			const color = new THREE.Color(1, 1 - s, 1 - s);
			return [s, color];
		});
}
function createColorMapRainbow(length) {
	return new Array(length).fill(null)
		.map((_, index) => index / (length - 1))
		.map(s => {
			const [R, G, B] = [-1, -0.5, 0].map(d => Math.max(Math.cos((s + d) * Math.PI), 0.0));
			const color = new THREE.Color(R, G, B);
			return [s, color];
		});
}
