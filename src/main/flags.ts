import { type Flags, type PartialGPU } from '@typings/client';
import { app } from 'electron';
import { warn } from '@logger';

export enum GPUVendors {
	nvidia = 0x10DE,
	amd = 0x1002,
	intel = 0x8086
}

// Flags source code for chromium 86.0.4234.0 (electron-nightly@12.0.0-nightly.20200914)
// https://github.com/chromium/chromium/blob/8273a33818244f231767bc6e5e073a2c1fd1bb96/chrome/common/chrome_switches.cc
const ELECTRON_FLAGS: Flags = [

	// Solve frame rate being capped to refresh rate
	['disable-frame-rate-limit'],

	// Enable hardware acceleration
	['ignore-gpu-blocklist'],

	// Krunker does a bad fps readout if this flag is not applied in chromium > 83
	// For example, setting frame cap to 60 will show 50 on the in-game fps meter
	// ['run-all-compositor-stages-before-draw'],

	// Disable some antialiasing for better performance
	['disable-composited-antialiasing'],

	['disable-accelerated-video-decode', 'false'],
	['disable-accelerated-video-encode', 'false'],
	['disable-breakpad'],
	['disable-compontent-update'],
	['disable-bundled-ppapi-flash'],
	['disable-2d-canvas-clip-aa'],
	['disable-hang-monitor'],
	['webrtc-max-cpu-consumption-percentage', '100'],
	['autoplay-policy', 'no-user-gesture-required'],
	['enable-quic'],
	['quic-max-packet-length', '1460'],
	['high-dpi-support', '1'],
	['disable-renderer-backgrounding']
];

const isUnix = process.platform !== 'win32' && process.platform !== 'darwin';

const isWayland = process.env.XDG_SESSION_TYPE === 'wayland' || typeof process.env.WAYLAND_DISPLAY !== 'undefined';

const isWaylandNative = isWayland && (
	process.argv.includes('--ozone-platform=wayland')
	|| process.argv.includes('--ozone-hint=auto')
	|| process.argv.includes('--ozone-hint=wayland')
);

/**
 * Check if the device has an active GPU and return it or null.
 * 
 * If there is a GPU, basic GPU info is expected to return an object with the gpuDevice property as an array.
 * Iterate over and verify the GPU. Return value appropriately.
 * 
 * @returns Boolean for whether or not the device has active GPU devices
 */
// eslint-disable-next-line complexity
const getGPU = async(): Promise<PartialGPU | null> => {
	const gpuInfo = await app.getGPUInfo('basic');

	if (!(gpuInfo instanceof Object)) return null;
	if (!('gpuDevice' in gpuInfo) || !Array.isArray((gpuInfo as PartialGPU).gpuDevice)) return null;

	for (const device of (gpuInfo as PartialGPU).gpuDevice) {
		if (!('active' in device) || typeof device.active !== 'boolean') return null;
		if (!('vendorId' in device) || typeof device.vendorId !== 'number') return null;
		if (!('deviceId' in device) || typeof device.deviceId !== 'number') return null;
	}

	return gpuInfo as PartialGPU;
};

/**
 * An experimental function to return information about recommended flags to
 * improve the app's integration within the OS.
 * 
 * This is currently used only for Wayland to enable screen recording and use
 * recommended flags for native Wayland if `--ozone-platform=wayland` is used
 * (see {@link getRecommendedGPUFlags} for GPU optimizations for Wayland).
 * 
 * @returns OS flags for Wayland
 */
const getRecommendedOSFlags = (): Flags => {
	const OSFlags: Flags = [];
	if (isUnix && isWaylandNative) if (isWaylandNative) OSFlags.push(['enable-features', 'UseOzonePlatform'], ['ozone-platform', 'wayland']);

	return OSFlags;
};

/**
 * Guess the best GL backend for the enviroment based on the GPU vendor.
 * 
 * It is `desktop` by default and `egl` on Wayland
 */
// eslint-disable-next-line complexity
const getRecommendedGPUFlags = async(): Promise<Flags> => {
	const GPUFlags: Flags = [];

	const desktopGl: 'desktop' | 'egl' = (isUnix && isWayland) ? 'egl' : 'desktop';
	const gpuInfo = await getGPU();

	let activeGPU = false;
	if (gpuInfo) {
		loop: for (const device of gpuInfo.gpuDevice) {
			if (device.active) {
				switch (device.vendorId) {
					case GPUVendors.intel:
					case GPUVendors.amd:
					case GPUVendors.nvidia:
						GPUFlags.push(['use-gl', desktopGl],
							['enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder'],
							['disable-features', 'UseChromeOSDirectVideoDecoder']);

						activeGPU = true;
						break loop;
					default:
						break;
				}
			}
		}
	}

	// Use OpenGL ES driver for Linux ARM devices.
	if (!activeGPU && isUnix && process.arch === 'arm64') GPUFlags.push(['use-gl', 'egl']);

	return GPUFlags;
};

/**
 * Merge some flags with the same keys to one value, and join them with a comma.
 * 
 * @param flags Flags to iterate over
 * @returns Merged flags
 */
const mergeFlags = (flags: Flags): Flags => {
	const toMerge: Record<string, string[]> = {
		'enable-features': [],
		'disable-features': []
	};

	for (let i = 0; i < flags.length; i++) {
		const flag = flags[i];
		const [key, value] = flag;

		if (key in toMerge && value) {
			flags.splice(i, 1);
			toMerge[key].push(value);

			i--;
		}
	}

	for (const key in toMerge) flags.push([key, toMerge[key].join(',')]);

	return flags;
};

/**
 * Get the best flags for the operating system and graphics card.
 */
const getFlags = async(): Promise<Flags> => {
	const flags = mergeFlags([
		...ELECTRON_FLAGS,
		...await getRecommendedGPUFlags(),
		...await getRecommendedOSFlags()
	]);
	const flat = flags.map(([flag]) => flag);
	const set = new Set(flat);

	if (flat.length > set.size) warn('Duplicate value(s) in flags');

	return flags;
};

export default getFlags;
