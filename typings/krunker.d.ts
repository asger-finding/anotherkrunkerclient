/** A representation of hexadecimal as a string ('#...') or hex number (0x...) */
type Hexadecimal = (string | number);

/** A representation of a minified boolean value as 0 or 1 or boolean */
type SlimBoolean = (0 | 1 | boolean);

/** RGB array type */
export type Color = [number, number, number];

export interface KrunkerWindow extends Window {
	windows: [
		{
			applyAllWeps: (...args: unknown[]) => void;
			changeTab: (...args: unknown[]) => void;
			changeWep: (...args: unknown[]) => void;
			collapseFolder: (...args: unknown[]) => void;
			currWep: number;
			dark: boolean;
			gen: () => string;
			genList: (...args: unknown[]) => string;
			getSettings: (...args: unknown[]) => string;
			getTabs: (...args: unknown[]) => string;
			header: string;
			html: string;
			label: string;
			maxH: string;
			popup: boolean;
			resetAllWeps: (...args: unknown[]) => void;
			searchList: () => void;
			searchMatches: (...args: unknown[]) => boolean;
			settingSearch: string | null;
			settingType: string;
			sticky: boolean;
			tabIndex: number;
			tabs: {
				basic: Record<string, unknown>[];
				advanced: Record<string, unknown>[];
			}
			toggleType: (evt: Event) => void;
			width: number;
		},
		...Record<string, unknown>[]
	];
}

export interface MapExport {

	/**
	 * The name of the map.
	 * 
	 * @default 'map-dependent'
	 * @example 'Burg'
	 */
	name: string;

	/**
	 * Unused property. All public match maps, which have this property, have a value of 170.
	 * 
	 * @default 'map-dependent'
	 */
	shadScale: number;

	/**
	 * Array containing the map colors.
	 * 
	 * Referenced in {@link MapExport.objects.ci} and {@link MapExport.objects.ei}
	 */
	colors: Hexadecimal[];

	/**
	 * Array relating to {@link MapExport.objects} containing the 3 axis scale values for all objects.  
	 * An object with the {@link MapExport.objects.si} property of `x` will have the value at `x*3` and the next two in this array to indicate its scale.
	 * 
	 * @example
	 * map.xyz = [1, 2, 3, 6, 7, 8];
	 * // foo.si = 0;  ->  foo has dimensions [1, 2, 3];
	 * // bar.si = 1;  ->  bar has dimensions [6, 7, 8];
	 */
	xyz: number[];

	// https://docs.krunker.io/#/./files/scene?id=adding-3d-objects
	/** Objects in the map. */
	objects: {

		/**
		 * Object index used to define the object's size.  
		 * The index is repeated for objects of the same size.
		 */
		si: number;

		/** Object position in x, y, z space. */
		p: [number, number, number];


		/**
		 * Object rotation in x, y, z space in radians.  
		 * float, -Infinity - Infinity
		 * 
		 * @default undefined No rotation is applied.
		 */
		r?: [number, number, number];

		/**
		 * Is object visible?
		 * 
		 * @default true
		 */
		v?: SlimBoolean;

		/**
		 * Is object collidable?
		 * 
		 * @default true
		 */
		l?: SlimBoolean;


		/**
		 * Object penetration damage multiplier.  
		 * float, 2 decimal places, 0 - 1.
		 * 
		 * @default 0
		 */
		pe?: number;

		/**
		 * Does object have complex collisions?
		 * 
		 * @default false
		 */
		cpx?: SlimBoolean;

		/** Object geometry. */
		tris?: number[];

		/**
		 * Is object wall jumpable?
		 * 
		 * @default true
		 */
		wj?: SlimBoolean;

		/**
		 * Is object grapple-able?
		 * 
		 * @default true
		 */
		gp?: SlimBoolean;

		/**
		 * Is object border?
		 * 
		 * @default false
		 */
		bo?: SlimBoolean;

		/**
		 * Step sound.  
		 * 1: `wood`
		 * 2: `water`
		 * 3: `sand`
		 * 4: `snow`
		 * 
		 * @default undefined Default sound is applied.
		 */
		sat?: 1 | 2 | 3 | 4;

		/**
		 * Texture type.  
		 * 0: `stone` - `Default`, `Classic`, `Light` - used when `t` is undefined  
		 * 1: `dirt` - `Default`, `Classic`  
		 * 2: `wood` - `Default`, `Classic`  
		 * 3: `grid`  
		 * 4: `grey`  
		 * 5: `default`  
		 * 6: `roof` - `Default`, `Classic`  
		 * 7: `flag` - `Default`, `Classic`, `Classic Alt`  
		 * 8: `grass`  
		 * 9: `check`  
		 * 10: `lines` - `Default`, thick  
		 * 11: `brick` - `Default`, `Classic`, `Classic Alt`  
		 * 12: `link`  
		 * 13: `liquid`  
		 * 14: `grain`  
		 * 15: `fabric`  
		 * 16: `tile`
		 * 
		 * @default 0 Stone texture is applied.
		 */
		t?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

		/**
		 * Texture variant. Refer to {@link MapExport.objects.t} for texture variants.
		 * 
		 * @default 0
		 */
		tv?: number;

		/**
		 * Texture asset to use
		 * 
		 * @default 0 No custom image texture is applied.
		 */
		at?: number;

		/**
		 * Should the texture repeat (false) or stretch (true) to fill the object?
		 * 
		 * @default false
		 */
		tsr?: SlimBoolean;

		/**
		 * Texture scale.  
		 * float, 1 decimal place, 0 - 10.  
		 * Larger values result in a smaller texture. Exactly 0 is the same as 1.
		 * 
		 * @default 0
		 */
		tsm?: number;

		/**
		 * Should transparency be forced on the texture?
		 * 
		 * @default false
		 */
		ft?: SlimBoolean;

		/**
		 * Texture rotation.  
		 * integer, 0 - 360.  
		 * Rotation is applied in degrees and is relative to the individual texture faces.
		 * 
		 * @default 0
		 */
		tro?: number;


		/**
		 * How much to offset the texture on the x-axis (relative to individual texture faces)
		 * 
		 * @default 0
		 */
		tox?: number;

		/**
		 * How much to offset the texture on the y-axis (relative to individual texture faces)
		 * 
		 * @default 0
		 */
		toy?: number;

		// TODO: Link to reference in array
		/**
		 * Texture speed along the axis determined by {@link MapExport.objects.td}.
		 * 
		 * @default 0
		 */
		ts?: number;

		/**
		 * Texture direction. 0 for x-axis, 1 for y-axis.
		 * 
		 * @default 0
		 */
		td?: number;

		/**
		 * Frame count of an animated texture.
		 * 
		 * @default 1
		 */
		fct?: number;

		/**
		 * Frame speed of an animated texture.
		 * 
		 * @default 0
		 */
		fs?: number;

		/**
		 * The texture encoding.  
		 * 0: `Linear Encoding` - used when `ten` is undefined
		 * 1: `sRGB Encoding`
		 * 2: `Gamma Encoding`
		 * 3: `RGBE Encoding`
		 * 4: `Log Luv Encoding`
		 * 5: `RGBM7 Encoding`
		 * 6: `RGBM16 Encoding`
		 * 7: `RGBD Encoding`
		 * 8: `Basic Depth Packing`
		 * 9: `RGBA Depth Packing`
		 * 
		 * @default 0 Linear Encoding
		 */
		ten?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

		/**
		 * The texture coloring.  
		 * Value is index of color in the {@link MapExport.colors} array.
		 */
		ci?: number;

		/**
		 * The texture emissive coloring.  
		 * Value is index of color in the {@link MapExport.colors} array.
		 */
		ei?: number;

		/**
		 * The texture/object opacity.  
		 * float, 1 decimal place, 0 - 1.  
		 * Larger values result in a more opaque texture.
		 * 
		 * @default 1
		 */
		o?: number;

		/**
		 * Should the texture be shaded?  
		 * If false, enable shading. If true, disable shading.
		 * 
		 * @default 0
		 */
		ab?: SlimBoolean;

		/**
		 * The object subdivision count for baking lighting and rendering.  
		 * More subdivisions result in lower performance.  
		 * integer, 0 - 50.
		 * 
		 * @default 0
		 */
		ba?: number;

		/**
		 * Should the object fade out with the fog?
		 * 
		 * @default true
		 */
		nf?: SlimBoolean;

		/**
		 * Is object destructible?
		 * 
		 * @default false
		 */
		cdy?: SlimBoolean;

		// Technical & Logic: Health
		/**
		 * Object health. Damage it takes to destroy the object.  
		 * integer, 0 - 50000.
		 * 
		 * @default 0
		 */
		h?: number;

		/**
		 * Should the object start destroyed?
		 * 
		 * @default false
		 */
		sd?: SlimBoolean;

		/**
		 * Respawn time.  
		 * The time it takes for the object to spawn again after being destroyed.
		 * 
		 * @default 0 Never
		 */
		rt?: number;

		/** In the event that {@link MapExport.objects.si} is not defined, this array can be used to determine the object's size. */
		s?: [number, number, number];

		/** In the event that {@link MapExport.objects.ci} is not defined, this hex color can be used to determine the object's color. */
		c?: Hexadecimal;

		/** In the event that {@link MapExport.objects.ei} is not defined, this hex color can be used to determine the object's emissive color. */
		e?: Hexadecimal;

		/**
		 * Random Respawn. If true, respawn the object at a random time.
		 * 
		 * @default false
		 */
		rr?: SlimBoolean;

		/**
		 * The interface ID in the scene. Used with triggers.  
		 * integer, 0 - 2000.
		 * 
		 * @default 0
		 */
		in?: number;

		/**
		 * Toggle rendering from selected object faces.  
		 * Add together the values from the following table, and convert to a hexadecimal string, to determine what faces to in- and exclude from rendering.  
		 * Front: `1`  
		 * Back: `2`  
		 * Left: `4`  
		 * Right: `8`  
		 * Top: `16`  
		 * Bottom: `32`
		 * 
		 * @default '3f' 63 in decimal; all faces shown.
		 */
		f?: string;

		// Only relevant for special objects
		/**
		 * Defines the objects type, be it not a cube.  
		 * Associated with this type are numerous properties that are not applicable to all objects.
		 * 
		 * @default 0
		 */
		i?: number;
	}[];

	// Config is sent to the client via a webhook (api.krunker.io/webhooks/general/maps/config?mn=<MAP_NAME>)
	config: {
		weps: Record<string, {

			/**
			 * The name of the weapon.
			 * 
			 * @example 'Assault Rifle'
			 */
			name: string;

			/** Beapon base damage */
			dmg: number;

			/** Weapon headshot multiplier */
			hsMlt: number;

			/** Weapon legshot multiplier */
			lsMlt: number;

			/** Weapon ammo count */
			ammo: number;

			/** Weapon shoot rate */
			rate: number;

			/** Is weapon burst? */
			burst: boolean;

			/** Weapon burst count per shot */
			burstC: number;

			/** Weapon reload time (in ms) */
			reload: number;

			/** Weapon move factor on Y-axis when reloading */
			reloY: number;

			/** Time it takes to swap to weapon */
			swapTime: number;

			/** Time it takes to aim the weapon */
			aimSpd: number;

			/** Should the weapon aim cancel after overcharge time? */
			ovrChrg: boolean;

			/** Time it takes to overcharge the weapon */
			chrgTime: number;

			/** Player speed multiplier when weapon is held */
			spdMlt: number;

			/** Bullet pierce multiplier */
			pierce: number;

			/** Bullet spread when aiming */
			adSpread: number;

			/** Bullet spread when not aiming */
			spread: number;

			/** Minimum bullet spread when not aiming */
			minSpread: number;

			/** Zoom factor when aiming */
			zoom: number;

			/** Weapon recoil when firing */
			recoil: number;

			/** Recoil on the Y-axis */
			recoilYM: number;

			/** Recoil on the Z-axis */
			recoilZ: number;

			/** Weapon recoil on the Z-axis when aiming */
			recoilZM: number;

			/** Jump power when weapon is held */
			jumpYM: number;

			/** Is weapon a secondary? */
			secondary: boolean;

			/** Is weapon mirrored for both hands? (Akimbo Uzi) */
			akimbo: boolean;

			/** Should a click trigger shooting once (true) or should it be held? (false) */
			nAuto: boolean;

			/** Should spread be disabled? */
			noSpread: boolean;

			/** Should aim be disabled? */
			noAim: boolean;

			/** Custom Icon ID */
			assetIcon: string;

			/** Impulse range */
			physRange: number;

			/** Impulse power */
			physPow: number;
		}>
	};
	camPos: (number | boolean)[];
	spawns: unknown[][];

	/**
	 * The ambient sound of the map.
	 * 
	 * @default 1
	 */
	ambInd: number;

	/**
	 * Custom ambient sound.
	 * 
	 * @default 0
	 */
	ambIndC: number;

	/**
	 * The sky dome type. Set as a number, 0 for solid, 1 for gradient.  
	 * Converted twice to a boolean with !!.
	 * 
	 * @default 'map-dependent'
	 */
	skyDome: boolean;

	/**
	 * The top color of the sky dome. Only applicable with gradient skydome type.
	 * 
	 * @default '#74a4b9'
	 */
	skyDomeCol0: Hexadecimal;

	/**
	 * The middle color of the sky dome. Only applicable with gradient skydome type.
	 * 
	 * @default '#dce8ed'
	 */
	skyDomeCol1: Hexadecimal;

	/**
	 * The bottom color of the sky dome. Only applicable with gradient skydome type.
	 * 
	 * @default '#dce8ed'
	 */
	skyDomeCol2: Hexadecimal;

	/**
	 * The emissive color of the sky dome.
	 * 
	 * @default '#000000'
	 */
	// TODO: Check if this is only applicable for a specific skydome type.
	skyDomeEmis: Hexadecimal;

	/**
	 * The asset ID of the sky dome emissive.
	 * 
	 * @default 0
	 */
	skyDomeEmisTex: number;

	/**
	 * Whether to use default cloud texture or not?
	 * 
	 * @default 'map-dependent'
	 */
	// FIXME: Might not be correct.
	skyDomeTex: boolean;

	/**
	 * The asset ID of the sky dome texture.
	 * 
	 * @default 0
	 */
	skyDomeTexA: number;

	/**
	 * The axis on which the sky dome rotates.
	 * 
	 * @default 0
	 */
	skyDomeMovD: number;

	/**
	 * The speed of the sky dome rotation.
	 * 
	 * @default 0
	 */
	skyDomeMovT: number;

	/**
	 * The resolution of the shadow map.
	 * 
	 * @default 1024
	 */
	shadowR: number;

	/**
	 * The distance of the shadow map.
	 * 
	 * @default 1200
	 */
	shadowD: number;

	/**
	 * The ambient color of the map.
	 * 
	 * @default '#97a0a8'
	 */
	ambient: Hexadecimal;

	/**
	 * The intensity of the ambient color.  
	 * The lower the number, the darker the shade.
	 * 
	 * @default 1
	 */
	ambientI: number;

	/**
	 * The light color (also called lightC).
	 * 
	 * @default '#f2f8fc'
	 */
	light: Hexadecimal;

	/**
	 * The distance of the light.
	 * 
	 * @default 500
	 */
	lightD: number;

	/**
	 * The intensity of the light.
	 * 
	 * @default 1.3
	 */
	lightI: number;

	/**
	 * The angle of the sun in the X axis.
	 * 
	 * @default 90
	 */
	sunAngX: number;

	/**
	 * The angle of the sun in the Y axis. 90 degrees is straight up.
	 * 
	 * @default 54
	 */
	sunAngY: number;

	/**
	 * The sky color. Only applicable with solid skydome type.
	 * 
	 * @default '#dce8ed'
	 */
	sky: Hexadecimal;

	/**
	 * The fog color.
	 * 
	 * @default '#8d9aa0'
	 */
	fog: Hexadecimal;

	/**
	 * The fog distance.  
	 * 
	 * @default 2000
	 */
	fogD: number;

	/** 
	 * See {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer.physicallyCorrectLights THREE.js: WebGLRenderer.physicallyCorrectLights}
	 * 
	 * @default 'map-dependent'
	 */
	correctLights: boolean;

	/**
	 * See {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer.toneMapping THREE.js: WebGLRenderer.toneMapping}  
	 * 
	 * @default 0 (THREE.NoToneMapping)
	 */
	toneMapping: 0 | 1 | 2 | 3 | 4;

	/**
	 * See {@link https://threejs.org/docs/#api/en/renderers/WebGLRenderer.toneMappingExposure THREE.js: WebGLRenderer.toneMappingExposure}
	 * 
	 * @default 1
	 */
	toneMappingExposure: number;

	/**
	 * 0: `LinearEncoding`  
	 * 1: `sRGBEncoding`
	 * 
	 * See {@link https://threejs.org/docs/#api/en/constants/Textures THREE.js: Encoding}
	 *
	 * @default 0 (THREE.LinearEncoding)
	 */
	outputEncoding: 0 | 1;

}
