const moduleAlias = require('module-alias');
const path = require('path');

interface Aliases {
	[key: string]: string;
}

const aliases: Aliases = { '@constants': path.resolve(__dirname, './constants') };

// Iterate over aliases and register them
for (const alias in aliases) moduleAlias.addAlias(alias, aliases[alias]);
