// https://nodejs.org/docs/latest-v12.x/api/process.html
// https://chromium.googlesource.com/chromium/src/+/master/extensions/common/api/runtime.json

type NodeJSProcessArch = 'arm' | 'arm64' | 'ia32' | 'mips' | 'mipsel' | 'ppc' | 'ppc64' | 's390' | 's390x' | 'x32' | 'x64';
type ChromeRuntimeArch = 'arm' | 'arm64' | 'x86-32' | 'x86-64' | 'mips' | 'mips64';

type NodeJSProcessPlatform = 'aix' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32';
type ChromeRuntimeOS = 'mac' | 'win' | 'android' | 'cros' | 'linux' | 'openbsd' | 'fuchsia';

const chromeRuntimeArchitectures: ChromeRuntimeArch[] = ['arm', 'arm64', 'x86-32', 'x86-64', 'mips', 'mips64'];
const chromeRuntimeOperatingSystems: ChromeRuntimeOS[] = ['mac', 'win', 'android', 'cros', 'linux', 'openbsd', 'fuchsia'];

/**
 * Get the os architecture and attempt compatiability with Chromium's runtime.PlatformArch
 * 
 * Fallback to `x86-32`.
 * 
 * @returns Transformed process.arch with fallback
 */
export const getArch = (): string => {
	const nodeArch = process.arch as NodeJSProcessArch;
	const transformable = {
		x64: 'x86-64',
		ia32: 'x86-32'
	};
	if (nodeArch in transformable) return transformable[nodeArch as keyof typeof transformable];

	if (!chromeRuntimeArchitectures.includes(nodeArch as ChromeRuntimeArch)) {
		// Architecture is one of: `mipsel`, `ppc`, `ppc64`, `s390`, `s390x`
		// These architectures are of the 0.01%, and krunker cannot run properly on most, anyway.
		return 'x86-32';
	}

	return nodeArch;
};

/**
 * Get the operating system and attempt compatiability with Chromiium's runtime.PlatformOs
 * 
 * Fallback to `win`.
 * 
 * @returns Transformed process.platform with fallback
 */
export const getOS = (): string => {
	const nodeOS = process.platform as NodeJSProcessPlatform;
	const transformable = {
		darwin: 'mac',
		win32: 'win'
	};
	if (nodeOS in transformable) return transformable[nodeOS as keyof typeof transformable];

	if (!chromeRuntimeOperatingSystems.includes(nodeOS as ChromeRuntimeOS)) {
		// OS is one of: `aix`, `freebsd`, `sunos`. They cannot be traditionally detected, so fallback to windows.
		return 'win';
	}

	return nodeOS;
};
