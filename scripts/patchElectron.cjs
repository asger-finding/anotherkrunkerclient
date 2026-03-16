"use strict";

if (process.platform !== "linux") {
	console.log("Electron binary patch is Linux-only, skipping.");
	process.exit(0);
}

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const electronDir = path.dirname(require.resolve("electron/package.json"));
const electronBinary = path.join(electronDir, "dist", "electron");

// Ensure the electron binary is downloaded
if (!fs.existsSync(electronBinary)) {
	console.log("Electron binary not found, running install script...");
	execFileSync("node", [path.join(electronDir, "install.js")], {
		stdio: "inherit",
	});
}

if (!fs.existsSync(electronBinary)) {
	console.error("Electron binary still not found after install");
	process.exit(1);
}

const patchScript = path.resolve(__dirname, "../patch_electron.py");
console.log(`Patching ${electronBinary}`);
execFileSync("python3", [patchScript, electronBinary], { stdio: "inherit" });
