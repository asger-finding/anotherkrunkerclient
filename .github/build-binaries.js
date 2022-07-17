const { mkdir, readFile, readdir, writeFile, rename, rm } = require('fs/promises');
const { exec: syncExec } = require('child_process');
const packageJson = require('../package.json');

async function exec(command) {
    const proc = syncExec(command);

    return new Promise((resolve, reject) => {
        proc.stdout.on('data', data => process.stdout.write(data));
        proc.stderr.on('data', data => process.stderr.write(data));

        proc.on('close', code => {
            if (code === 0) resolve();
            else reject(code);
        });
    });
}

(async() => {
    // This script compiles for all major platforms, but to build for mac, you need to be in a darwin environment.
    if (process.platform === 'darwin') await exec('brew install rpm');

    const distFolder = 'dist';
    const binaryFolder = 'binaries';

    const ELECTRON_BUILDER = './electron-builder.yml';
    const CLIENT_NAME = packageJson.productName;

    await exec('yarn && yarn add -D js-yaml modclean minify-all-js node-prune');
    await rm(binaryFolder, { force: true, recursive: true });

    const { dump, load } = require('js-yaml');
    const electronBuilder = await readFile(ELECTRON_BUILDER, 'utf8');

    function createArtifactNames(state) {
        return {
            linux: `${ CLIENT_NAME }-linux-${ state ? state + '-' : '' }\${arch}.\${ext}`,
            win: `${ CLIENT_NAME }-win-${ state ? state + '-' : '' }\${arch}.\${ext}`,
            macOS: `${ CLIENT_NAME }-mac-${ state ? state + '-' : '' }\${arch}.\${ext}`
        }
    }

    async function changeForStable() {
        const doc = load(electronBuilder);
        const stableArtifactNames = createArtifactNames('stable');

        doc.linux.artifactName = stableArtifactNames.linux;
        doc.win.artifactName = stableArtifactNames.win;
        doc.mac.artifactName = stableArtifactNames.macOS;

        return writeFile(ELECTRON_BUILDER, dump(doc));
    }

    async function changeForLatest() {
        const doc = load(electronBuilder);
        const latestArtifactNames = createArtifactNames('latest');

        doc.linux.artifactName = latestArtifactNames.linux;
        doc.win.artifactName = latestArtifactNames.win;
        doc.mac.artifactName = latestArtifactNames.macOS;

        await writeFile(ELECTRON_BUILDER, dump(doc));

        // Bump electron version
        return exec('yarn add -D electron@^12');
    }

    async function buildBinary() {
        await exec('yarn prebundle');
        await exec('yarn minify-all-js ./node_modules -j -M && yarn modclean -r -n default:safe && yarn node-prune');
        await exec(`yarn electron-builder --win --linux ${ process.platform === 'darwin' ? '--mac' : '' }`);
        return exec('yarn postinstall');
    }

    async function moveToBinaries() {
        const files = await readdir(distFolder);

        // Ensure folder exists
        await mkdir(binaryFolder, { recursive: true });

        for (const file of files) {
            if (/\.(exe|appimage|dmg|rpm)$/.test(file.toLowerCase())) rename(`${ distFolder }/${ file }`, `${ binaryFolder }/${ file }`);
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

    bundleStable()
    .then(bundleLatest);

})();
