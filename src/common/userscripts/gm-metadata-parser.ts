import { type ImmutableValue, type MetaValueTypes, type Userscript } from '@typings/userscripts';

/** Class that handles parsing of the metadata block of a userscript */
export default class MetadataParser {

	/**
	 * Parse a userscript with a code block to an object
	 * 
	 * @param rawUserscript Userscript code to parse
	 * @returns Parsed metadata block as object
	 */
	public static parse(rawUserscript: string): Userscript.ParsedUserscript {
		const metadata: Userscript.RawMeta = {};

		// Initialize meta data using default values
		for (const key of Object.keys(this.metaTypes) as (keyof MetaValueTypes.RequiredValues)[]) {
			const defaultValue = this.metaTypes[key].default();
			Object.assign(metadata, { [key]: defaultValue });
		}

		// Extract meta block from the code
		const matched = rawUserscript.match(this.metadataRegex);
		if (!matched || !matched.groups) {
			return {
				meta: metadata as Userscript.Meta,
				metablock: '',
				content: rawUserscript
			};
		}
		const { metablock } = matched.groups;

		// Parse meta data and update the meta object
		metablock.replace(/(?:^|\n)\s*\/\/\x20(?<key>@\S+)(?<value>.*)/gu, (_match, rawKey: string, rawValue: string) => {
			const [keyName, locale] = rawKey.slice(1).split(':');

			// Transform bad key values such as run-at into runAt
			const camelCaseKey = keyName.replace(/[-_](?<_>\w)/gu, (_m, after) => after.toUpperCase());

			const key = (locale ? `${camelCaseKey}:${locale.toLowerCase()}` : camelCaseKey) as keyof Userscript.Meta;
			const value = rawValue.trim();
			const metaType = {
				...this.metaTypes,
				...this.metaOptionalTypes
			}[key] || this.stringType;
			const oldValue = typeof metadata[key] === 'undefined'
				? metaType.default()
				: metadata[key];

			Object.assign(metadata, { [key]: metaType.transform(<never>oldValue, <never>value) });

			return '';
		});

		// Rename 'resource' key to 'resources'
		const transformed = {
			...metadata,
			resources: metadata.resource
		};
		delete transformed.resource;

		return {
			meta: transformed as unknown as Userscript.Meta,
			metablock,
			content: rawUserscript.slice(metablock.length)
		};
	}

	/**
	 * Regex expression that parses the metadata block in a code snippet
	 */
	private static readonly metadataRegex = /(?:(?:^|\n)\s*\/\/\x20==UserScript==)(?<metablock>[\s\S]*?\n)\s*\/\/\x20==\/UserScript==|$/u;

	/* eslint-disable jsdoc/require-jsdoc */
	/**
	 * Any value type that's immutable after being set
	 */
	static readonly stringType: ImmutableValue<string> = {
		default: () => null,
		transform: (result, value) => (result === null ? value : result)
	};

	/** Simple boolean type that defaults to false, and can transform to true */
	static readonly booleanType: ImmutableValue<boolean> = {
		default: () => false,
		transform: () => true
	};

	/** Array type with an empty array as default */
	static readonly arrayType: ImmutableValue<string[]> = {
		default: () => [],
		transform: (result, value) => {
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
	static readonly objectType: ImmutableValue<Record<string, string>> = {
		default: () => ({}),
		transform: (result, value) => {
			const { propKey, propValue } = value.match(/^(?<propKey>\w\S*)\s+(?<propValue>.*)/u)?.groups ?? {};
			if (propKey && propValue) result[propKey] = propValue;

			return result;
		}
	};
	/* eslint-enable jsdoc/require-jsdoc */

	private static readonly metaTypes: MetaValueTypes.RequiredValues = {
		exclude: this.arrayType,
		excludeMatch: this.arrayType,
		grant: this.arrayType,
		include: this.arrayType,
		match: this.arrayType,
		name: this.stringType,
		require: this.arrayType,
		resources: this.objectType
	};

	private static readonly metaOptionalTypes: MetaValueTypes.OptionalValues = {
		description: this.stringType,
		downloadURL: this.stringType,
		homepageURL: this.stringType,
		icon: this.stringType,
		injectInto: this.stringType,
		namespace: this.stringType,
		noframes: this.booleanType,
		supportURL: this.stringType,
		unwrap: this.booleanType,
		version: this.stringType,
		runAt: this.stringType
	};

}
