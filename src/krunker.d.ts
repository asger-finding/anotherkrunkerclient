/**
 * @typedef {(string | number)} Hexadecimal
 * @description A representation of hexadecimal as a string ('#...') or hex number (0x...)
 */
type Hexadecimal = (string | number);

/**
 * @typedef {(0 | 1 | boolean)} SlimBoolean
 * @description A representation of a minified boolean value as 0 or 1 or boolean
 */
type SlimBoolean = (0 | 1 | boolean);

export interface MapExport {

	/**
	 * @type {string}
	 * @default 'map-dependent'
	 * @example 'Burg'
	 * @description The name of the map.
	 */
	name: string;

	/**
	 * @type {number}
	 * @default 'map-dependent'
	 * @description Unused property. All public match maps, which have this property, have a value of 170.
	 */
	shadScale: number;

	/**
	 * @type {Array<Hexadecimal>}
	 * @description Array containing the map colors.  
	 * Referenced in {@link MapExport.objects.ci} and {@link MapExport.objects.ei}
	 */
	colors: Array<Hexadecimal>;

	/**
	 * @type {Array<number>}
	 * @example
	 * map.xyz = [ 1, 2, 3, 6, 7, 8 ];
	 * // foo.si = 0;  ->  foo has dimensions [ 1, 2, 3 ];
	 * // bar.si = 1;  ->  bar has dimensions [ 6, 7, 8 ];
	 * @description Array relating to {@link MapExport.objects} containing the 3 axis scale values for all objects.  
	 * An object with the {@link MapExport.objects.si} property of `x` will have the value at `x*3` and the next two in this array to indicate its scale.
	 */
	xyz: Array<number>;

	// https://docs.krunker.io/#/./files/scene?id=adding-3d-objects
	/**
	 * @type {Array.<Object>}
	 * @description Objects in the map.
	 */
	objects: Array<{

		/**
		 * @type {number}
		 * @description Object index used to define the object's size.  
		 * The index is repeated for objects of the same size.
		 */
		si: number;

		/**
		 * @type {[ number, number, number ]}
		 * @description Object position in x, y, z space.
		 */
		p: [ number, number, number ];


		/**
		 * @type {(undefined | [ number, number, number ])}
		 * @default undefined No rotation is applied.
		 * @description Object rotation in x, y, z space in radians.  
		 * float, -Infinity - Infinity
		 */
		r?: [ number, number, number ];

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default true
		 * @description Is object visible?
		 */
		v?: SlimBoolean;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default true
		 * @description Is object collidable?
		 */
		l?: SlimBoolean;


		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Object penetration damage multiplier.  
		 * float, 2 decimal places, 0 - 1.
		 */
		pe?: number;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default false
		 * @description Does object have complex collisions?
		 */
		cpx?: SlimBoolean;

		/**
		 * @type {(undefined | Array<number>)}
		 * @description Object geometry.
		 */
		tris?: Array<number>;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default true
		 * @description Is object wall jumpable?
		 */
		wj?: SlimBoolean;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default true
		 * @description Is object grapple-able?
		 */
		gp?: SlimBoolean;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default false
		 * @description Is object border?
		 */
		bo?: SlimBoolean;

		/**
		 * @type {(undefined | 1 | 2 | 3 | 4)}
		 * @default undefined Default sound is applied.
		 * @description Step sound.  
		 * * 1: `wood`
		 * * 2: `water`
		 * * 3: `sand`
		 * * 4: `snow`
		 */
		sat?: 1 | 2 | 3 | 4;

		/**
		 * @type {(undefined | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16)}
		 * @default 0 Stone texture is applied.
		 * @description Texture type.  
		 * * 0: `stone` - `Default`, `Classic`, `Light` - used when `t` is undefined
		 * * 1: `dirt` - `Default`, `Classic`
		 * * 2: `wood` - `Default`, `Classic`
		 * * 3: `grid`
		 * * 4: `grey`
		 * * 5: `default`
		 * * 6: `roof` - `Default`, `Classic`
		 * * 7: `flag` - `Default`, `Classic`, `Classic Alt`
		 * * 8: `grass`
		 * * 9: `check`
		 * * 10: `lines` - `Default`, thick
		 * * 11: `brick` - `Default`, `Classic`, `Classic Alt`
		 * * 12: `link`
		 * * 13: `liquid`
		 * * 14: `grain`
		 * * 15: `fabric`
		 * * 16: `tile`
		 */
		t?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Texture variant. Refer to {@link MapExport.objects.t} for texture variants.
		 */
		tv?: number;

		/**
		 * @type {(undefined | number)}
		 * @default 0 No custom image texture is applied.
		 * @description Texture asset to use
		 */
		at?: number;

		/**
		 * @type {(undefined | number)}
		 * @default false
		 * @description Should the texture repeat (false) or stretch (true) to fill the object?
		 */
		tsr?: SlimBoolean;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Texture scale.  
		 * float, 1 decimal place, 0 - 10.  
		 * Larger values result in a smaller texture. Exactly 0 is the same as 1.
		 */
		tsm?: number;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default false
		 * @description Should transparency be forced on the texture?
		 */
		ft?: SlimBoolean;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Texture rotation.  
		 * integer, 0 - 360.  
		 * Rotation is applied in degrees and is relative to the individual texture faces.
		 */
		tro?: number;


		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description How much to offset the texture on the x-axis (relative to individual texture faces)
		 */
		tox?: number;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description How much to offset the texture on the y-axis (relative to individual texture faces)
		 */
		toy?: number;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Texture speed along the axis determined by {@link MapExport.objects.td}.
		 */
		ts?: number;

		/**
		 * @type {(undefined | 0 | 1)}
		 * @default 0
		 * @description Texture direction. 0 for x-axis, 1 for y-axis.
		 */
		td?: number;

		/**
		 * @type {(undefined | number)}
		 * @default 1
		 * @description Frame count of an animated texture.
		 */
		fct?: number;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Frame speed of an animated texture.
		 */
		fs?: number;

		/**
		 * @type {(undefined | 0 | 1)}
		 * @default 0 Linear Encoding
		 * @description The texture encoding.  
		 * * 0: `Linear Encoding` - used when `ten` is undefined
		 * * 1: `sRGB Encoding`
		 * * 2: `Gamma Encoding`
		 * * 3: `RGBE Encoding`
		 * * 4: `Log Luv Encoding`
		 * * 5: `RGBM7 Encoding`
		 * * 6: `RGBM16 Encoding`
		 * * 7: `RGBD Encoding`
		 * * 8: `Basic Depth Packing`
		 * * 9: `RGBA Depth Packing`
		 */
		ten?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

		/**
		 * @type {(undefined | number)}
		 * @description The texture coloring.  
		 * Value is index of color in the {@link MapExport.colors} array.
		 */
		ci?: number;

		/**
		 * @type {(undefined | number)}
		 * @description The texture emissive coloring.  
		 * Value is index of color in the {@link MapExport.colors} array.
		 */
		ei?: number;

		/**
		 * @type {(undefined | number)}
		 * @default 1
		 * @description The texture/object opacity.  
		 * float, 1 decimal place, 0 - 1.  
		 * Larger values result in a more opaque texture.
		 */
		o?: number;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default 0
		 * @description Should the texture be shaded?  
		 * If false, enable shading. If true, disable shading.
		 */
		ab?: SlimBoolean;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description The object subdivision count for baking lighting and rendering.  
		 * More subdivisions result in lower performance.  
		 * integer, 0 - 50.
		 */
		ba?: number;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default true
		 * @description Should the object fade out with the fog?
		 */
		nf?: SlimBoolean;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default false
		 * @description Is object destructible?
		 */
		cdy?: SlimBoolean;

		// Technical & Logic: Health
		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Object health. Damage it takes to destroy the object.  
		 * integer, 0 - 50000.
		 */
		h?: number;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default false
		 * @description Should the object start destroyed?
		 */
		sd?: SlimBoolean;

		/**
		 * @type {(undefined | number)}
		 * @default 0 Never
		 * @description Respawn time.  
		 * The time it takes for the object to spawn again after being destroyed.
		 */
		rt?: number;

		/**
		 * @type {(undefined | [ number, number, number ])}
		 * @description In the event that {@link MapExport.objects.si} is not defined, this array can be used to determine the object's size.
		 */
		s?: [ number, number, number ];

		/**
		 * @type {(undefined | Hexadecimal)}
		 * @description In the event that {@link MapExport.objects.ci} is not defined, this hex color can be used to determine the object's color.
		 */
		c?: Hexadecimal;

		/**
		 * @type {(undefined | Hexadecimal)}
		 * @description In the event that {@link MapExport.objects.ei} is not defined, this hex color can be used to determine the object's emissive color.
		 */
		e?: Hexadecimal;

		/**
		 * @type {(undefined | SlimBoolean)}
		 * @default false
		 * @description Random Respawn. If true, respawn the object at a random time.
		 */
		rr?: SlimBoolean;

		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description The interface ID in the scene. Used with triggers.  
		 * integer, 0 - 2000.
		 */
		in?: number;

		/**
		 * @type {(undefined | string)}
		 * @default '3f' 63 in decimal; all faces shown.
		 * @description Toggle rendering from selected object faces.  
		 * Add together the values from the following table, and convert to a hexadecimal string, to determine what faces to in- and exclude from rendering.
		 * * Front: `1`
		 * * Back: `2`
		 * * Left: `4`
		 * * Right: `8`
		 * * Top: `16`
		 * * Bottom: `32`
		 */
		f?: string;

		// Only relevant for special objects
		/**
		 * @type {(undefined | number)}
		 * @default 0
		 * @description Defines the objects type, be it not a cube.  
		 * Associated with this type are numerous properties that are not applicable to all objects.
		 */
		i?: number;
	}>;

	config: {
		weps: Record<string, {

			/**
			 * @type {string}
			 * @example 'Assault Rifle'
			 * @description The name of the weapon.
			 */
			name: string;

			/**
			 * @type {number}
			 * @description Beapon base damage
			 */
			dmg: number;

			/**
			 * @type {number}
			 * @description Weapon headshot multiplier
			 */
			hsMlt: number;

			/**
			 * @type {number}
			 * @description Weapon legshot multiplier
			 */
			lsMlt: number;

			/**
			 * @type {number}
			 * @description Weapon ammo count
			 */
			ammo: number;

			/**
			 * @type {number}
			 * @description Weapon shoot rate
			 */
			rate: number;

			/**
			 * @type {boolean}
			 * @description Is weapon burst?
			 */
			burst: boolean;

			/**
			 * @type {number}
			 * @description Weapon burst count per shot
			 */
			burstC: number;

			/**
			 * @type {number}
			 * @description Weapon reload time (in ms)
			 */
			reload: number;

			/**
			 * @type {number}
			 * @description Weapon move factor on Y-axis when reloading
			 */
			reloY: number;

			/**
			 * @type {number}
			 * @description Time it takes to swap to weapon
			 */
			swapTime: number;

			/**
			 * @type {number}
			 * @description Time it takes to aim the weapon
			 */
			aimSpd: number;

			/**
			 * @type {boolean}
			 * @description Should the weapon aim cancel after overcharge time?
			 */
			ovrChrg: boolean;

			/**
			 * @type {number}
			 * @description Time it takes to overcharge the weapon
			 */
			chrgTime: number;

			/**
			 * @type {number}
			 * @description Player speed multiplier when weapon is held
			 */
			spdMlt: number;

			/**
			 * @type {number}
			 * @description Bullet pierce multiplier
			 */
			pierce: number;

			/**
			 * @type {number}
			 * @description Bullet spread when aiming
			 */
			adSpread: number;

			/**
			 * @type {number}
			 * @description Bullet spread when not aiming
			 */
			spread: number;

			/**
			 * @type {number}
			 * @description Minimum bullet spread when not aiming
			 */
			minSpread: number;

			/**
			 * @type {number}
			 * @description Zoom factor when aiming
			 */
			zoom: number;

			/**
			 * @type {number}
			 * @description Weapon recoil when firing
			 */
			recoil: number;

			/**
			 * @type {number}
			 * @descritpion Recoil on the Y-axis
			 */
			recoilYM: number;

			/**
			 * @type {number}
			 * @descritpion Recoil on the Z-axis
			 */
			recoilZ: number;

			/**
			 * @type {number}
			 * @description Weapon recoil on the Z-axis when aiming
			 */
			recoilZM: number;

			/**
			 * @type {number}
			 * @description Jump power when weapon is held
			 */
			jumpYM: number;

			/**
			 * @type {boolean}
			 * @description Is weapon a secondary?
			 */
			secondary: boolean;

			/**
			 * @type {boolean}
			 * @description Is weapon mirrored for both hands? (Akimbo Uzi)
			 */
			akimbo: boolean;

			/**
			 * @type {boolean}
			 * @description Should a click trigger shooting once (true) or should it be held? (false)
			 */
			nAuto: boolean;

			/**
			 * @type {boolean}
			 * @description Should spread be disabled?
			 */
			noSpread: boolean;

			/**
			 * @type {boolean}
			 * @description Should aim be disabled?
			 */
			noAim: boolean;

			/**
			 * @type {string}
			 * @description Custom Icon ID
			 */
			assetIcon: string;

			/**
			 * @type {number}
			 * @description Impulse range
			 */
			physRange: number;

			/**
			 * @type {number}
			 * @description Impulse power
			 */
			physPow: number;
		}>
	};
	camPos: Array<number | boolean>;
	spawns: Array<Array<unknown>>;

	/**
	 * @type {number}
	 * @default 1
	 * @description The ambient sound of the map.
	 */
	ambInd: number;

	/**
	 * @type {number}
	 * @default 0
	 * @description Custom ambient sound.
	 */
	ambIndC: number;

	/**
	 * @type {boolean}
	 * @default 'map-dependent'
	 * @description The sky dome type. Set as a number, 0 for solid, 1 for gradient.  
	 * Converted twice to a boolean with !!.
	 */
	skyDome: boolean;

	/**
	 * @type {Hexadecimal}
	 * @default '#74a4b9'
	 * @description The top color of the sky dome. Only applicable with gradient skydome type.
	 */
	skyDomeCol0: Hexadecimal;

	/**
	 * @type {Hexadecimal}
	 * @default '#dce8ed'
	 * @description The middle color of the sky dome. Only applicable with gradient skydome type.
	 */
	skyDomeCol1: Hexadecimal;

	/**
	 * @type {Hexadecimal}
	 * @default '#dce8ed'
	 * @description The bottom color of the sky dome. Only applicable with gradient skydome type.
	 */
	skyDomeCol2: Hexadecimal;

	/**
	 * @type {Hexadecimal}
	 * @default '#000000'
	 * @description The emissive color of the sky dome.
	 */
	// TODO: Check if this is only applicable for a specific skydome type.
	skyDomeEmis: Hexadecimal;

	/**
	 * @type {number}
	 * @default 0
	 * @description The asset ID of the sky dome emissive.
	 */
	skyDomeEmisTex: number;

	/**
	 * @type {boolean}
	 * @default 'map-dependent'
	 * @description Whether to use default cloud texture or not?
	 */
	// TODO: Might not be correct.
	skyDomeTex: boolean;

	/**
	 * @type {number}
	 * @default 0
	 * @description The asset ID of the sky dome texture.
	 */
	skyDomeTexA: number;

	/**
	 * @type {number}
	 * @default 0
	 * @description The axis on which the sky dome rotates.
	 */
	skyDomeMovD: number;

	/**
	 * @type {number}
	 * @default 0
	 * @description The speed of the sky dome rotation.
	 */
	skyDomeMovT: number;

	/**
	 * @type {number}
	 * @default 1024
	 * @description The resolution of the shadow map.
	 */
	shadowR: number;

	/**
	 * @type {number}
	 * @default 1200
	 * @description The distance of the shadow map.
	 */
	shadowD: number;

	/**
	 * @type {Hexadecimal}
	 * @default '#97a0a8'
	 * @description The ambient color of the map.
	 */
	ambient: Hexadecimal;

	/**
	 * @type {number}
	 * @default 1
	 * @description The intensity of the ambient color.  
	 * The lower the number, the darker the shade.
	 */
	ambientI: number;

	/**
	 * @type {Hexadecimal}
	 * @default '#f2f8fc'
	 * @description The light color (also called lightC).
	 */
	light: Hexadecimal;

	/**
	 * @type {number}
	 * @default 500
	 * @description The distance of the light.
	 */
	lightD: number;

	/**
	 * @type {number}
	 * @default 1.3
	 * @description The intensity of the light.
	 */
	lightI: number;

	/**
	 * @type {number}
	 * @default 90
	 * @description The angle of the sun in the X axis.
	 */
	sunAngX: number;

	/**
	 * @type {number}
	 * @default 54
	 * @description The angle of the sun in the Y axis. 90 degrees is straight up.
	 */
	sunAngY: number;

	/**
	 * @type {Hexadecimal}
	 * @default '#dce8ed'
	 * @description The sky color. Only applicable with solid skydome type.
	 */
	sky: Hexadecimal;

	/**
	 * @type {Hexadecimal}
	 * @default '#8d9aa0'
	 * @description The fog color.
	 */
	fog: Hexadecimal;

	/**
	 * @type {number}
	 * @default 2000
	 * @description The fog distance.  
	 */
	fogD: number;

	/** 
	 * @type {boolean}
	 * @default 'map-dependent'
	 * @remarks See {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer.physicallyCorrectLights THREE.js: WebGLRenderer.physicallyCorrectLights}
	 */
	correctLights: boolean;

	/**
	 * @type {(0 | 1 | 2 | 3 | 4)}
	 * @default 0 (THREE.NoToneMapping)
	 * @remarks See {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer.toneMapping THREE.js: WebGLRenderer.toneMapping}  
	 */
	toneMapping: 0 | 1 | 2 | 3 | 4;

	/**
	 * @type {number}
	 * @default 1
	 * @remarks See {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer.toneMappingExposure THREE.js: WebGLRenderer.toneMappingExposure}
	 */
	toneMappingExposure: number;

	/**
	 * @type {(0 | 1)}
	 * @default 0 (THREE.LinearEncoding)
	 * @remarks See {@link https://threejs.org/docs/#api/en/constants/Textures THREE.js: Encoding}
	 * @description
	 * * 0: `LinearEncoding`
	 * * 1: `sRGBEncoding`
	 */
	outputEncoding: 0 | 1;

	/**
	 * @type {number}
	 * @default 2
	 * @remarks Possibly deprecated or requires a different render engine.
	 */
	gammaFactor: number;
}
