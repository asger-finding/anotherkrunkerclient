[![Commit rate](https://img.shields.io/github/commit-activity/m/asger-finding/anotherkrunkerclient?label=Commits)](https://github.com/asger-finding/anotherkrunkerclient/commits/main)
[![Issues](https://img.shields.io/github/issues/asger-finding/anotherkrunkerclient?label=Issues)](https://github.com/asger-finding/anotherkrunkerclient/issues)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://github.com/asger-finding/anotherkrunkerclient/blob/main/LICENSE)
[![Latest release](https://img.shields.io/github/v/release/asger-finding/anotherkrunkerclient?label=Latest%20Release)](https://github.com/asger-finding/anotherkrunkerclient/releases/latest)
[![Discord server](https://img.shields.io/discord/971394904821485608.svg?label=Connect%20on%20Discord)](https://discord.gg/etxNkUuTru)

---

<div align="center">
  <img width="50%" src="https://github.com/asger-finding/anotherkrunkerclient/raw/main/.github/banner-light.svg#gh-light-mode-only">
  <img width="50%" src="https://github.com/asger-finding/anotherkrunkerclient/raw/main/.github/banner-dark.svg#gh-dark-mode-only">

  <h1>anotherkrunkerclient</h1>
</div>

The be-all and end-all of Krunker client.  
All good features from other clients are combined into one neat and fast package. This project is designed with boilerplate in mind, allowing you to fork it and create your own client.

---

## Work in Progress

A full release (v1.xx) will be considered once all the items in this feature tracking [issue](https://github.com/asger-finding/anotherkrunkerclient/issues/1#issue-1167443624) have been addressed.

## Supported Operating Systems

- [x] Windows 10
- [x] Windows 11
- [x] Linux
- [ ] MacOS (untested)

## Contributing

### Getting Started

To get started, follow these steps:

- Install the [yarn](https://yarnpkg.com/) package manager.
- Run `yarn install` to install the project dependencies.
- To start the application, run `yarn start`.

For linting, execute `yarn lint`. For a detailed description of the project compilation process, refer to the [pipeline](#pipeline).

### Project File System

The project file system follows the kebab-case convention for file names.

Please adhere to the project folder system outlined below:

- common: Contains modules shared between the main and renderer processes.
- main: Includes code for the main process.
- preload: Consists of code for the preload/renderer.
- renderer: Houses assets used in the renderer process.
- static: Contains assets for the main process.

### Module Aliasing

For module aliasing in Electron, anotherkrunkerclient employs a custom solution. The package.json file includes the "_moduleAliases" field, which is used to define aliases and their respective targets.

During the gulp build process, TypeScript files are first converted to JavaScript. Afterward, a homemade module aliasing function is applied. This function searches for "require" calls, extracts the first string parameter (only works with literal strings), looks it up in "_moduleAliases", and replaces it with a relative path to the module if a match is found.

### Pipeline

anotherkrunkerclient follows a pipeline similar to that of VSCode. It utilizes gulp and swc to compile TypeScript source code into machine-readable JavaScript. This pipeline handles all other necessary operations as well. The compilation occurs recursively and dynamically, meaning that when adding or modifying files, you only need to update the "tsconfig" and "moduleAliases" fields.

To build the project, execute the command "yarn build," which triggers the build script. If you wish to minify the code, provide the "--minify" parameter or "--no-minify" to skip minification. If no parameter is provided, you will be prompted for your preference. If you want to suppress the output of the build script, include the "--suppress-output" argument.
