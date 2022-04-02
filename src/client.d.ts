interface SettingsGenerator {
	createCheckbox(onclick: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): HTMLLabelElement;
	createSlider(oninput: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): [ HTMLInputElement, HTMLDivElement ];
	createSelect(onchange: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLSelectElement>, options: { [key: string]: string }): HTMLSelectElement;
	createColor(onchange: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): HTMLInputElement;
	createText(oninput: (this: GlobalEventHandlers, evt: Event) => unknown, inputNodeAttributes: Partial<HTMLInputElement>): HTMLInputElement;
}

declare global {
	export interface Window {
		OffCliV: boolean;
		SettingsGenerator: SettingsGenerator;
		clientAPI: {
			clientName: string;

			send(channel: string, data: unknown): void;
			recieve(channel: string, callback: (data: unknown) => void): void;
			requestFromStore(key: string, fallback: unknown): unknown;
			setToStore(key: string, value: unknown): void;
			storeHas(key: string): boolean;
			onNotWhiteListed(key: string): void;
		};
		openSettings: () => null;
		closeClient: () => null;
	}
}

export interface EventListener {
	id: number;
	message: string;
	callback: () => unknown;
}

export interface ReleaseData {
	clientVersion: string;
	releaseVersion: string,
	releaseUrl: string;
}

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
export interface KrunkerMap {
	// Types to distinguish map from other JSON parsed objects.
	name: string;
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
	 * TODO: Check if this is only applicable for a specific skydome type.
	 * @default '#000000'
	 */
	skyDomeEmis: Hexadecimal;

	/**
	 * The asset ID of the sky dome emissive.
	 * @default 0
	 */
	skyDomeEmisTex: number;

	/**
	 * Whether to use default cloud texture or not?
	 * TODO: Might not be correct.
	 * @default 'map-dependent'
	 */
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
