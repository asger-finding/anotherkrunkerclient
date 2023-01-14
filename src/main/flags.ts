import { Flags, PartialGPU } from '@client';
import { app } from 'electron';
import { warn } from '@logger';

export enum GPUVendors {
	nvidia = 0x10DE,
	amd = 0x1002,
	intel = 0x8086
}

// https://gist.github.com/dodying/34ea4760a699b47825a766051f47d43b
const ELECTRON_FLAGS: Flags = [

	// Unlock the frame rate
	['disable-frame-rate-limit'],
	['disable-gpu-vsync'],

	// Don't require user gesture for autoplay
	['autoplay-policy', 'no-user-gesture-required'],

	// Performance optimization flags.
	// TODO: client setting for these
	['enable-highres-timer'],
	['enable-quic'],
	['enable-webgl'],
	['enable-gpu-rasterization'],
	['enable-zero-copy'],
	['enable-javascript-harmony'],
	['enable-future-v8-vm-features'],
	['enable-webgl2-compute-context'],
	['enable-accelerated-video-decode'],
	['enable-native-gpu-memory-buffers'],
	['enable-oop-rasterization'],
	['disable-low-end-device-mode'],
	['disable-dev-shm-usage'],
	['disable-hang-monitor'],
	['disable-bundled-ppapi-flash'],
	['ignore-gpu-blocklist'],
	['canvas-oop-rasterization'],
	['no-zygote'],
	['disable-background-timer-throttling'],
	['disable-renderer-backgrounding'],
	['disable-ipc-flooding-protection'],
	['no-first-run'],
	['disable-setuid-sandbox'],
	['disable-background-networking'],
	['disable-sync'],
	['metrics-recording-only'],
	['disable-default-apps'],
	['canvas-msaa-sample-count', '0'],
	['gpu-rasterization-msaa-sample-count', '0'],
	['ppapi-antialiased-text-enabled', 'false'],
	['disable-canvas-aa'],
	['disable-2d-canvas-clip-aa'],
	['enable-gpu-async-worker-context'],
	['enable-gpu-memory-buffer-video-frames']
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
	if (isUnix) {
		if (isWaylandNative) OSFlags.push(['enable-features', 'UseOzonePlatform,WebRTCPipeWireCapturer,WaylandWindowDecorations']);
		else if (isWayland) OSFlags.push(['enable-features', 'WebRTCPipeWireCapturer']);
	}

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

