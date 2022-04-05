/**
 * --- Useful asset: https://api.sys32.dev/v3/source.pretty ---
 * ---               Last updated: 2022/03/25               ---
 *
 * ambInd: (number) - Ambient sound. Default: 1
 * ambIndC: (number) - Custom ambient sound. Default: 0
 * skyDome: (boolean) - 0-1, destructured to ['Solid', 'Gradient'] converted to a boolean with !!. The sky dome type. Default: 'map-dependent'
 * skyDomeCol0: (hexadecimal) - Color of the top of the sky dome. Only applicable with gradient skydome type. Default: '#74a4b9'
 * skyDomeCol1: (hexadecimal) - Color of the middle of the sky dome. Only applicable with gradient skydome type. Default: '#dce8ed'
 * skyDomeCol2: (hexadecimal) - Color of the bottom of the sky dome. Only applicable with gradient skydome type. Default: '#dce8ed'
 * skyDomeEmis: (hexadecimal) - Emissive color of the sky dome. Default: '#000000'
 * skyDomeEmisTex: (number) - Texture of the sky dome emissive. Default: 0
 * skyDomeTex: (number) - Whether to use default cloud texture or not? Default: 'map-dependent'
 * skyDomeTexA: (number) - Asset ID of the sky dome texture. Default: 0
 * skyDomeMovD: (number) - texture move axis? Default: 0
 * skyDomeMovT: (number) - The speed of the sky dome rotation. Default: 0
 * shadowR: (number) - The resolution of the shadow map. Default: 1024
 * shadowD: (number) - The distance of the shadow map. Default: 1200
 * ambient: (hexadecimal) - The ambinet color of the map. Default: '#97a0a8'
 * ambientI: (number) - The intensity of the ambient color. Default: 1
 * light: (hexadecimal) - The light color (also called lightC). Default: '#f2f8fc'
 * lightD: (number) - The distance of the light. Default: 500
 * lightI: (number) - The intensity of the light. Default: 1.3
 * sunAngX: (number) - The angle of the sun in the X axis. Default: 90
 * sunAngY: (number) - The angle of the sun in the Y axis. Default: 54
 * sky: (hexadecimal) - The color of the sky. Only applicable with solid skydome type. Default: '#dce8ed'
 * fog: (hexadecimal) - The fog color. Default: '#8d9aa0'
 * fogD: (number) - The distance of the fog. Default: 2000
 * correctLights: (boolean) - Physically Correct Lights (https://threejs.org/docs/#api/en/renderers/WebGLRenderer.physicallyCorrectLights). Default: 'map-dependent'
 * toneMapping: (number) - The tone mapping method OR whether to enable it. Default: 0 /  NoToneMapping
 * toneMappingExposure: (number) - The exposure of the tone mapping. Default: 1
 * outputEncoding: (number) - 0-1 destructured to ['LinearEncoding', 'sRGBEncoding']. The color encoding of the map. Default: 0 / THREE.LinearEncoding
 * gammaFactor: (number) - Deprecated in three.js? The gamma factor of the map. Default: 2
 */

/**
 * Skydome types:
 * skyDomeCol0,
 * skyDomeCol1,
 * skyDomeCol2,
 * skyDomeEmis,
 * skyDomeEmisTex,
 * skyDomeTex,
 * skyDomeMovD,
 * skyDomeMovT,
 * skyDomeTexA
 */

type Hexadecimal = string | number;
export interface MapExport {

	/**
	 * The name of the map.
	 * @default: 'map-dependent'
	 */
	name: string;

	/**
	 * Unknown property. All public match maps, which have this property, have a value of 170.
	 * @default: 'map-dependent'
	 */
	shadScale: number;

	colors: Array<Hexadecimal>;
	xyz: Array<number>;

	// TODO: Specify number range. Some numbers are treated as booleans and have a range of 0-1.
	objects: Array<{
		// Visible
		v?: 0 | 1;

		// Collidable
		l?: 0 | 1;

		// Complex Collisions
		cpx?: 0 | 1;
		tris?: Array<number>;

		// Penetrable
		pe?: 0 | 1;

		// Wall Jumpable
		wj?: 0 | 1;

		// Can Grapple
		gp?: 0 | 1;

		// Border
		bo?: 0 | 1;

		/**
		 * Step Sound
		 * Default: undefined
		 * Wood: 1
		 * Water: 2
		 * Sand: 3
		 * Snow: 4
		 */
		sat?: undefined | 1 | 2 | 3 | 4;

		// Transform: Position (x, y, z)
		p: Array<number>;

		// Transform: Rotation (x, y, z)
		r?: Array<number>;

		// Transform: Size (x, y, z)
		xyz?: Array<number>;

		/**
		 * Texture: Type
		 * stone: undefined
		 * 1: Dirt
		 * 2: Wood
		 * 3: Grid
		 * 4: Grey
		 * 5: Solid
		 * 6: Roof
		 * 7: Flag
		 * 8: Grass
		 * 9: Check
		 * 10: Lines
		 * 11: Brick
		 * 12: Link
		 * 13: Liquid
		 * 14: Grain
		 * 15: Fabric
		 * 16: Tile
		 */
		t?: undefined | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

		// Texture: Asset ID
		at?: number;

		// Texture: Stretch
		tsr?: 0 | 1;

		// Texture: Scale
		tsm?: number;

		// Texture: Force Transparency
		ft?: 0 | 1;

		// Texture: Rotation
		tro?: number;

		/**
		 * Texture: Encoding
		 * LinearEncoding: 0 | undefined
		 * sRGBEncoding: 1
		 */
		ten?: undefined | 0 | 1;

		// Texture: Color
		ci?: unknown;

		// Texture: Emissive
		ei?: 0 | 1;

		// Texture: Opacity
		o?: number;

		// Texture: Shading
		ab?: 0 | 1;

		// Texture: Subdivision
		ba?: number;

		// Texture: Fog TODO: Is this a valid property?
		fog?: 0 | 1;

		// Technical & Logic: Destructible
		cdy?: 0 | 1;
		nf?: 0 | 1;

		// Technical & Logic: Health
		h?: number;

		// Interface: ID
		in?: number;

		/**
		 * Render Faces
		 * right: 1f
		 * left: 2f
		 * top: 37
		 * bottom: 3b
		 * back: 3d
		 * front: 3e
		 */
		// TODO: See what the string is when multiple faces are hidden.
		f?: string;

		// TODO: What are these?
		e?: number;
		si?: number;
		// Item type?
		i?: number;
		tv?: number;
		d?: number;
		ec?: number;
	}>;
	config: Record<string, unknown>;
	camPos: Array<number | boolean>;
	spawns: Array<Array<unknown>>;

	/**
	 * The ambient sound of the map.
	 * @default 1
	 */
	ambInd: number;

	/**
	 * Custom ambient sound.
	 * @default 0
	 */
	ambIndC: number;

	/**
	 * The sky dome type. Set as a number, 0 for solid, 1 for gradient.  
	 * Converted twice to a boolean with !!.
	 * @default 'map-dependent'
	 */
	skyDome: boolean;

	/**
	 * The top color of the sky dome. Only applicable with gradient skydome type.
	 * @default '#74a4b9'
	 */
	skyDomeCol0: Hexadecimal;

	/**
	 * The middle color of the sky dome. Only applicable with gradient skydome type.
	 * @default '#dce8ed'
	 */
	skyDomeCol1: Hexadecimal;

	/**
	 * The bottom color of the sky dome. Only applicable with gradient skydome type.
	 * @default '#dce8ed'
	 */
	skyDomeCol2: Hexadecimal;

	/**
	 * The emissive color of the sky dome.
	 * @default '#000000'
	 */
	// TODO: Check if this is only applicable for a specific skydome type.
	skyDomeEmis: Hexadecimal;

	/**
	 * The asset ID of the sky dome emissive.
	 * @default 0
	 */
	skyDomeEmisTex: number;

	/**
	 * Whether to use default cloud texture or not?
	 * @default 'map-dependent'
	 */
	// TODO: Might not be correct.
	skyDomeTex: boolean;

	/**
	 * The asset ID of the sky dome texture.
	 * @default 0
	 */
	skyDomeTexA: number;

	/**
	 * texture move axis?
	 * @default 0
	 */
	skyDomeMovD: number;

	/**
	 * The speed of the sky dome rotation.
	 * @default 0
	 */
	skyDomeMovT: number;

	/**
	 * The resolution of the shadow map.
	 * @default 1024
	 */
	shadowR: number;

	/**
	 * The distance of the shadow map.
	 * @default 1200
	 */
	shadowD: number;

	/**
	 * The ambient color of the map.
	 * @default '#97a0a8'
	 */
	ambient: Hexadecimal;

	/**
	 * The intensity of the ambient color. The lower the number, the darker the shade.
	 * @default 1
	 */
	ambientI: number;

	/**
	 * The light color (also called lightC).
	 * @default '#f2f8fc'
	 */
	light: Hexadecimal;

	/**
	 * The distance of the light.
	 * @default 500
	 */
	lightD: number;

	/**
	 * The intensity of the light.
	 * @default 1.3
	 */
	lightI: number;

	/**
	 * The angle of the sun in the X axis.
	 * @default 90
	 */
	sunAngX: number;

	/**
	 * The angle of the sun in the Y axis. 90 degrees is straight up.
	 * @default 54
	 */
	sunAngY: number;

	/**
	 * The sky color. Only applicable with solid skydome type.
	 * @default '#dce8ed'
	 */
	sky: Hexadecimal;

	/**
	 * The fog color.
	 * @default '#8d9aa0'
	 */
	fog: Hexadecimal;

	/**
	 * The fog distance.
	 * @default 2000
	 */
	fogD: number;

	/** 
	 * https://threejs.org/docs/#api/en/renderers/WebGLRenderer.physicallyCorrectLights
	 * @default 'map-dependent'
	 */
	correctLights: boolean;

	/**
	 * https://threejs.org/docs/#api/en/renderers/WebGLRenderer.toneMapping
	 * @default 0 (THREE.NoToneMapping)
	 */
	toneMapping: 0 | 1 | 2 | 3 | 4;

	/**
	 * https://threejs.org/docs/#api/en/renderers/WebGLRenderer.toneMappingExposure
	 * @default 1
	 */
	toneMappingExposure: number;

	/**
	 * https://threejs.org/docs/#api/en/constants/Textures (Encoding)  
	 * Options: 'LinearEncoding' | 'sRGBEncoding'
	 * @default 0 (THREE.LinearEncoding)
	 */
	outputEncoding: 0 | 1;

	/**
	 * Possibly deprecated, doesn't seem to have any visual effect.
	 * @default 2
	 */
	gammaFactor: number;
}
