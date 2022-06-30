// This script compiles for all major platforms, but to build for mac, you need to be in a darwin environment.
if (process.platform !== 'darwin') throw new Error('This script must be run on macOS');

import { mkdir, readFile, readdir, writeFile, rename, rm } from 'fs/promises';
import packageJson from '../package.json' assert { type: 'json' };
import { exec } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);
const distFolder = 'dist';
const binaryFolder = 'binaries';

const ELECTRON_BUILDER = './electron-builder.yml';
const CLIENT_NAME = packageJson.productName;
const ELECTRON_VERSION = packageJson.devDependencies['electron'];

await asyncExec('yarn && yarn add -D js-yaml modclean minify-all node-prune');
await rm(binaryFolder, { force: true, recursive: true });

const { dump, load } = await import('js-yaml');
const electronBuilder = await readFile(ELECTRON_BUILDER, 'utf8');

function createArtifactNames(state) {
    return {
        linux: `${ CLIENT_NAME }-linux-${ state ? state + '-' : '' }\${arch}.\${ext}`,
        win: `${ CLIENT_NAME }-win-${ state ? state + '-' : '' }\${arch}.\${ext}`,
        macOS: `${ CLIENT_NAME }-macOS-${ state ? state + '-' : '' }\${arch}.\${ext}`
    }
}

async function changeForStable() {
    const doc = load(electronBuilder);
    const stableArtifactNames = createArtifactNames('stable');

    doc.appImage.artifactName = stableArtifactNames.linux;
    doc.nsis.artifactName = stableArtifactNames.win;
    doc.dmg.artifactName = stableArtifactNames.macOS;

    return writeFile(ELECTRON_BUILDER, dump(doc));
}

async function changeForLatest() {
    const doc = load(electronBuilder);
    const latestArtifactNames = createArtifactNames('latest');

    doc.appImage.artifactName = latestArtifactNames.linux;
    doc.nsis.artifactName = latestArtifactNames.win;
    doc.dmg.artifactName = latestArtifactNames.macOS;

    await writeFile(ELECTRON_BUILDER, dump(doc));

    // Bump electron version
    return asyncExec('yarn add -D electron@^12');
}

async function buildBinary() {
    await asyncExec('yarn prebundle');
    await asyncExec('yarn electron-builder -mwl');
    return asyncExec('yarn postinstall');
}

async function moveToBinaries() {
    const files = await readdir(distFolder);

    // Ensure folder exists
    await mkdir(binaryFolder, { recursive: true });

    for (const file of files) {
        if (/\.(exe|appimage|dmg)$/.test(file.toLowerCase())) rename(`${ distFolder }/${ file }`, `${ binaryFolder }/${ file }`);
    }
}

async function bundleStable() {
    await changeForStable();
    await buildBinary();
    await moveToBinaries();
}

async function bundleLatest() {
    await changeForLatest();
    await buildBinary();
    await moveToBinaries();
}

async function postbuild() {
    // Return package.json packages
    await asyncExec(`yarn add -D electron@${ ELECTRON_VERSION }`);
    await asyncExec('yarn remove modclean minify-all node-prune js-yaml');

    // Return electron-builder.yml to its original state
    await writeFile(ELECTRON_BUILDER, electronBuilder);
}

bundleStable()
.then(bundleLatest)
//.then(postbuild);
