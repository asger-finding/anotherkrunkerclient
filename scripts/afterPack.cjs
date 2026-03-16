// @ts-check
"use strict";

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * electron-builder afterPack hook.
 * Applies the binary patch to fix Chromium input event prioritization
 * (aim freeze bug) on Linux builds.
 *
 * @param {import("electron-builder").AfterPackContext} context
 */
exports.default = async function afterPack(context) {
	if (context.electronPlatformName !== "linux") return;

	const electronBinary = path.join(
		context.appOutDir,
		context.packager.appInfo.productFilename,
	);

	if (!fs.existsSync(electronBinary)) {
		console.warn(`afterPack: electron binary not found at ${electronBinary}`);
		return;
	}

	const patchScript = path.resolve(__dirname, "../patch_electron.py");

	console.log(`afterPack: patching ${electronBinary}`);
	execFileSync("python3", [patchScript, electronBinary], { stdio: "inherit" });
	console.log("afterPack: patch applied successfully");
};
