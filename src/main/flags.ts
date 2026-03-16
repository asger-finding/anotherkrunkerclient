import { type Flags, type PartialGPU } from '@typings/client';
import { app } from 'electron';
import { warn } from '@logger';

export enum GPUVendors {
	nvidia = 0x10DE,
	amd = 0x1002,
	intel = 0x8086
}

// https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/chrome_switches.cc
const ELECTRON_FLAGS: Flags = [

	// Uncap frame rate
	['disable-frame-rate-limit'],

	// Enable hardware acceleration
	['ignore-gpu-blocklist'],
	
	// Disable some antialiasing for better performance
	//['disable-composited-antialiasing'],

	['disable-breakpad'],
	['disable-component-update'],
	['disable-2d-canvas-clip-aa'],
	['disable-hang-monitor'],
	['webrtc-max-cpu-consumption-percentage', '100'],
	['autoplay-policy', 'no-user-gesture-required'],
	['enable-quic'],
	['quic-max-packet-length', '1460'],
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
	if (isUnix && isWaylandNative) OSFlags.push(['ozone-platform', 'wayland']);

	return OSFlags;
};

/**
 * Get recommended GPU flags for the environment based on the GPU vendor.
 */
// eslint-disable-next-line complexity
const getRecommendedGPUFlags = async(): Promise<Flags> => {
	const GPUFlags: Flags = [];

	const gpuInfo = await getGPU();

	if (gpuInfo) {
		loop: for (const device of gpuInfo.gpuDevice) {
			if (device.active) {
				switch (device.vendorId) {
					case GPUVendors.intel:
					case GPUVendors.amd:
					case GPUVendors.nvidia:
						GPUFlags.push(
							['enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder'],
							['disable-features', 'UseChromeOSDirectVideoDecoder']);

						break loop;
					default:
						break;
				}
			}
		}
	}

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
