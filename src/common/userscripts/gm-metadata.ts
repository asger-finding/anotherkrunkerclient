import { RequiredFieldsOnly, UnrequiredFieldsOnly } from '@client';

interface MetadataPrimitives {
	string: string | null;
	boolean: boolean;
	array: string[];
	object: Record<string, string>;
}

type ValueTypes =
	| typeof UserscriptParser.stringType
	| typeof UserscriptParser.booleanType
	| typeof UserscriptParser.arrayType
	| typeof UserscriptParser.objectType;

type InitialMetadata = {
	name: MetadataPrimitives['string'];
	version: MetadataPrimitives['string'];
	desc: MetadataPrimitives['string'];
	description: MetadataPrimitives['string'];
	namespace: MetadataPrimitives['string'];
	homepage: MetadataPrimitives['string'];
	runAt: MetadataPrimitives['string'];

	include: MetadataPrimitives['array'];
	exclude: MetadataPrimitives['array'];
	match: MetadataPrimitives['array'];
	excludeMatch: MetadataPrimitives['array'];
	require: MetadataPrimitives['array'];
	resource: MetadataPrimitives['object'];
	grant: MetadataPrimitives['array'];

	antifeature?: MetadataPrimitives['array'];
	compatible?: MetadataPrimitives['array'];
	connect?: MetadataPrimitives['array'];
	noframes?: MetadataPrimitives['boolean'];
	unwrap?: MetadataPrimitives['boolean'];
};

class UserscriptParser {

	/**
	 * Parse a userscript with a code block to an object
	 * 
	 * @param code Userscript code to parse
	 * @returns Parsed metadata block as object
	 */
	public static parse(code: string): Partial<InitialMetadata & {
		resources?: InitialMetadata['resource'];
	}> {
		const metadata: Partial<InitialMetadata> = {};

		// Initialize meta data using default values
		for (const key of Object.keys(this.metaTypes) as (keyof RequiredFieldsOnly<InitialMetadata>)[]) {
			const defaultValue = this.metaTypes[key].default();
			Object.assign(metadata, { [key]: defaultValue });
		}

		// Extract meta block from the code
		const matched = code.match(this.metadataRegex);
		if (!matched || !matched.groups) return metadata;

		// Parse meta data and update the meta object
		(matched.groups.body ?? '').replace(/(?:^|\n)\s*\/\/\x20(?<key>@\S+)(?<value>.*)/gu, (_match, rawKey: string, rawValue: string) => {
			const [keyName, locale] = rawKey.slice(1).split(':');

			// Transform bad key values such as run-at into runAt
			const camelCaseKey = keyName.replace(/[-_](?<_>\w)/gu, (_m, after) => after.toUpperCase());

			const key = (locale ? `${camelCaseKey}:${locale.toLowerCase()}` : camelCaseKey) as keyof InitialMetadata;
			const value = rawValue.trim();
			const metaType = {
				...this.metaTypes,
				...this.metaOptionalTypes
			}[key] || this.stringType;
			const oldValue = typeof metadata[key] === 'undefined'
				? metaType.default()
				: metadata[key];

			Object.assign(metadata, { [key]: metaType.transform(<never>oldValue, value) });

			return '';
		});

		// Rename 'resource' key to 'resources'
		const transformed = {
			...metadata,
			resources: metadata.resource
		};
		delete transformed.resource;

		return transformed;
	}

	/**
	 * Regex expression that parses the metadata block in a code snippet
	 */
	private static readonly metadataRegex = /(?:(?:^|\n)\s*\/\/\x20==UserScript==)(?<body>[\s\S]*?\n)\s*\/\/\x20==\/UserScript==|$/u;

	/* eslint-disable jsdoc/require-jsdoc */
	/**
	 * Any value type that's immutable after being set
	 */
	static readonly stringType = {
		default: (): MetadataPrimitives['string'] => null,
		transform: (result: string, value: string): Exclude<MetadataPrimitives['string'], null> => (result === null ? value : result)
	};

	/** Simple boolean type that defaults to false, and can transform to true */
	static readonly booleanType = {
		default: (): MetadataPrimitives['boolean'] => false,
		transform: (): MetadataPrimitives['boolean'] => true
	};

	/** Array type with an empty array as default */
	static readonly arrayType = {
		default: (): MetadataPrimitives['array'] => [],
		transform: (result: string[], value: string): MetadataPrimitives['array'] => {
			result.push(value);
			return result;
		}
	};

	/**
	 * Type that parses a metadata line to a key and value
	 * 
	 * @example
	 * transform({}, "someSite https://example.com")
	 * // => {
	 * //   someSite: "https://example.com"
	 * // }
	 */
	static readonly objectType = {
		default: (): MetadataPrimitives['object'] => ({}),
		transform: (result: Record<string, string>, value: string): MetadataPrimitives['object'] => {
			const { propKey, propValue } = value.match(/^(?<propKey>\w\S*)\s+(?<propValue>.*)/u)?.groups ?? {};
			if (propKey && propValue) result[propKey] = propValue;

			return result;
		}
	};
	/* eslint-enable jsdoc/require-jsdoc */

	private static readonly metaTypes: Record<keyof RequiredFieldsOnly<InitialMetadata>, ValueTypes> = {
		name: this.stringType,
		version: this.stringType,
		desc: this.stringType,
		description: this.stringType,
		namespace: this.stringType,
		homepage: this.stringType,
		runAt: this.stringType,

		include: this.arrayType,
		exclude: this.arrayType,
		match: this.arrayType,
		excludeMatch: this.arrayType,
		require: this.arrayType,
		resource: this.objectType,
		grant: this.arrayType
	};

	private static readonly metaOptionalTypes: Record<keyof UnrequiredFieldsOnly<InitialMetadata>, ValueTypes> = {
		antifeature: this.arrayType,
		compatible: this.arrayType,
		connect: this.arrayType,
		noframes: this.booleanType,
		unwrap: this.booleanType
	};

}
