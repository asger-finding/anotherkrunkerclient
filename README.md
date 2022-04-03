<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <img src="https://github.com/asger-finding/anotherkrunkerclient/blob/6e52bf3789895c3ca4b76356fdf43828b9da304a/app/assets/akc.svg?raw=true" alt="anotherkrunkerclient" width="50%"/>
</p>

<h1 align="center">anotherkrunkerclient</h1>
<!-- markdownlint-enable MD033 MD041 -->
<!-- necessary evil to have a cool header -->

The be-all and end-all Krunker client.  
All good features from other clients crammed into one neat, fast package.

## Things to do

- Everything in the feature tracking [issue](https://github.com/asger-finding/anotherkrunkerclient/issues/1#issue-1167443624).

## Supported operating systems

- [x] Windows 10
- [x] Windows 11

## Contributing

Note: Use node &lt; 17, or electron-acrylic-window won't compile with electron-builder. This is an oversight on the their end, and is being adressed in an issue [here](https://github.com/Seo-Rii/electron-acrylic-window/issues/85).  

### Getting Started

- Install [yarn](https://yarnpkg.com/) package manager
- Run `yarn install` to install the dependencies
- To start the app, run `yarn start`

To compile the app, run `yarn deploy`  
To lint the Typescript, run `yarn lint`  
To lint the CSS, run `yarn lintcss`

### Notes for Developing

Always use camelCase and PascalCase in variables. Use kebab-case for file names and put them in their appropiate folders (main, renderer, window, config)

&nbsp;  

[![Latest version](https://img.shields.io/github/v/release/asger-finding/anotherkrunkerclient?style=for-the-badge&display_name=tag&labelColor=202225&color=006699&label=Latest%20Release)](https://github.com/asger-finding/anotherkrunkerclient/releases/latest)
[![Discord server](https://img.shields.io/discord/GUILD_ID_HERE.svg?style=for-the-badge&label=&logo=discord&logoColor=ffffff&color=202225&labelColor=006699)](https://discord.gg/INVITE_LINK)
