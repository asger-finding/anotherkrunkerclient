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

anotherkrunkerclient is a powerful and versatile Krunker client that combines the best features from various other clients into a single, fast, and streamlined package. This project is designed with flexibility in mind, enabling you to fork it and create your own customized client.

---

## Project Status

We are actively working on anotherkrunkerclient and continuously improving its features. We aim to release a stable version (v1.xx) once we have addressed all the items listed in our feature tracking [issue](https://github.com/asger-finding/anotherkrunkerclient/issues/1#issue-1167443624).

## Supported Operating Systems

- [x] Windows 10
- [x] Windows 11
- [x] Linux
- [ ] MacOS (untested)

## Contributing

### Getting Started

To start contributing to anotherkrunkerclient, follow these steps:

1. Install the [yarn](https://yarnpkg.com/) package manager.
2. Run `yarn install` to install the project dependencies.
3. Start the application by running `yarn start`.

For linting, execute `yarn lint`. If you need a detailed description of the project compilation process, refer to the [pipeline](#pipeline) section.

### File Structure

The project's file system follows the kebab-case convention for file names. Please adhere to the outlined folder structure:

- **common**: Contains shared modules between the main and renderer processes.
- **main**: Includes the main process code.
- **preload**: Consists of code for the preload/renderer.
- **renderer**: Houses assets used in the renderer process.
- **static**: Contains assets for the main process.

### Module Aliasing

For module aliasing in Electron, anotherkrunkerclient employs a custom solution. The package.json file includes a "_moduleAliases" field, which is used to define aliases and their respective targets.

During the gulp build process, TypeScript files are first converted to JavaScript. Afterward, a homemade module aliasing function is applied. This function searches for "require" calls, extracts the first string parameter (only works with literal strings), looks it up in "_moduleAliases", and replaces it with a relative path to the module if a match is found.

### Pipeline

anotherkrunkerclient utilizes a pipeline inspired by VSCode, leveraging gulp and swc to compile TypeScript source code into JavaScript that is compatible with web browsers. This comprehensive pipeline takes care of all essential operations seamlessly. The compilation process is recursive and dynamic, eliminating the need for additional updates when adding or modifying files, with the exception of aliasing new paths.

To build the project, execute the command "yarn build," which triggers the build script. If you wish to minify the code, provide the "--minify" parameter or "--no-minify" to skip minification. If no parameter is provided, you will be prompted for your preference. To suppress the output of the build script, include the "--suppress-output" argument.
