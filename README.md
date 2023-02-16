[![Commit rate](https://img.shields.io/github/commit-activity/m/asger-finding/anotherkrunkerclient?label=Commits)](https://github.com/asger-finding/anotherkrunkerclient/commits/main)
[![Issues](https://img.shields.io/github/issues/asger-finding/anotherkrunkerclient)](https://github.com/asger-finding/anotherkrunkerclient/issues)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://github.com/asger-finding/anotherkrunkerclient/blob/main/LICENSE)
[![Latest release](https://img.shields.io/github/v/release/asger-finding/anotherkrunkerclient?label=Latest%20Release)](https://github.com/asger-finding/anotherkrunkerclient/releases/latest)
[![Discord server](https://img.shields.io/discord/971394904821485608.svg?label=Chat%20on%20Discord)](https://discord.gg/etxNkUuTru)

---

<div align="center">
  <img width="50%" src="https://github.com/asger-finding/anotherkrunkerclient/raw/main/.github/banner-light.svg#gh-light-mode-only">
  <img width="50%" src="https://github.com/asger-finding/anotherkrunkerclient/raw/main/.github/banner-dark.svg#gh-dark-mode-only">

  <h1>anotherkrunkerclient</h1>
</div>

The be-all and end-all of Krunker client.  
All good features from other clients crammed into one neat, fast package. Built with boilerplate in mind so you can fork this project to create your own client.

---

## Work-in-progress

A full release (v1.xx) will be considered when everything in this feature tracking [issue](https://github.com/asger-finding/anotherkrunkerclient/issues/1#issue-1167443624) has been addressed.

## Supported operating systems

- [x] Windows 10
- [x] Windows 11
- [x] Linux
- [ ] MacOS (untested)

## Contributing

### Getting started

- Install [yarn](https://yarnpkg.com/) package manager
- Run `yarn install` to install the project dependencies
- To start the app, run `yarn start`

To lint, run `yarn lint`  
Read about the [pipeline](#pipeline) for a detailed description of compiling the project.

### Project file system

kebab-case is used for file names, but module aliasing is used for imports (read below)

Respect the project folder system of `common` (modules shared between main and renderer), `main` (main process code), `preload` (preload/renderer code), `renderer` (assets used in the renderer process) and `static` (main process assets) 

### Module aliasing

anotherkrunkerclient uses a home-brew solution for module aliasing in Electron. The `_moduleAliases` field in package.json is for defining aliases and their targets.

When the source is being built in gulp, the TypeScript files are converted to JavaScript, then run through the homemade module aliasing function that finds `require` calls, takes the first string parameter (only works with literal strings), looks it up in `_moduleAliases` and if found, replaces it with a relative path to the module.

### Pipeline

anotherkrunkerclient utilizes a similar pipeline to VSCode; using gulp and swc to compile the source TypeScript down to machine-readable JavaScript — and everything else, of course. Files are compiled recursively and dynamically, so when adding files or changing files, you must only update the tsconfig and moduleAliases field.

To build the project, run `yarn build` which calls to the build script. If you provide the parameter `--minify` or `--no-minify`, the shell script will minify the code accordingly. If not, you will be queried. You can silence the build script by passing a `--supress-output` argument.
