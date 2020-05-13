/**
 * Vectors in three dimensions
 */
class Vec3 {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	constructor(x, y, z) {
		/**
		 * @type {[number, number, number]}
		 */
		this.components = [x, y, z];
	}

	/**
	 * ベクトルのX成分
	 * @returns {number}
	 */
	get x() {
		return this.components[0];
	}

	/**
	 * ベクトルのY成分
	 * @returns {number}
	 */
	get y() {
		return this.components[1];
	}

	/**
	 * ベクトルのZ成分
	 * @returns {number}
	 */
	get z() {
		return this.components[2];
	}

	/**
	 * ベクトルの長さ
	 * @returns {number}
	 */
	get len() {
		// |v| = √(x^2+y^2+z^2)
		return Math.sqrt(this.components.map(c => c * c).reduce((a, b) => a + b));
	}

	/**
	 * 他のベクトルの成分を加算して得られる、新しいベクトルを返します
	 * @param {Vec3} v
	 * @returns {Vec3}
	 */
	add(v) {
		return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
	}

	/**
	 * ベクトルのすべての成分に-1を乗じた新しいベクトルを返します
	 * @returns {Vec3}
	 */
	invert() {
		return new Vec3(...this.components.map(x => -x));
	}

	/**
	 * 三方向の成分のうち、最も値の小さい成分の値を返します
	 * @returns {number}
	 */
	min() {
		return Math.min(...this.components);
	}

	/**
	 * 三方向の成分のうち、値の大きさが中間のものの値を返します
	 * @returns {number}
	 */
	mid() {
		return this.components.sort((a, b) => a - b)[1];
	}

	/**
	 * 三方向の成分のうち、最も値の大きい成分の値を返します
	 * @returns {number}
	 */
	max() {
		return Math.max(...this.components);
	}

	/**
	 * 与えられたベクトルとの外積を返します
	 * @param {Vec3} v
	 * @returns {Vec3}
	 */
	prod(v) {
		// ベクトルの外積は(x1,y1,z1)×(x2,y2,z2)=(y1z2−z1y2,z1x2−x1z2,x1y2−y1x2)
		const x = this.y * v.z - this.z * v.y;
		const y = this.z * v.x - this.x * v.z;
		const z = this.x * v.y - this.y * v.x;
		return new Vec3(x, y, z);
	}

	/**
	 * 3つのベクトルからなる三角形の面積を取得します
	 * @param {Vec3} v1
	 * @param {Vec3} v2
	 * @param {Vec3} v3
	 * @returns {number}
	 */
	static AreaOfTriangle(v1, v2, v3) {
		const v1_inv = v1.invert();
		// V1→V2とV1→V3のベクトルを取得
		const v12 = v2.add(v1_inv);
		const v13 = v3.add(v1_inv);
		// ベクトルの面積は、|V12×V13|/2で得られる
		return v12.prod(v13).len / 2;
	}
}
