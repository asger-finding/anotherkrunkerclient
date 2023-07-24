import { type RequiredFieldsOnly, type UnrequiredFieldsOnly } from '@typings/client';

declare type NumBool = 0 | 1;
declare type NumBoolNull = NumBool | null;
declare type StringMap = Record<string, string>;
declare type StringList = string[];
declare type VMScriptRunAt = 'document-start' | 'document-end' | 'document-idle';
declare type VMScriptInjectInto = 'page' | 'content' | 'auto';

export type ImmutableValue<Target extends string | boolean | StringList | StringMap> = {
	default: () => Target extends StringMap | StringList | boolean ? Target :
		Target extends string ? Target | null : null;

	transform: (
		result: Target extends StringMap | StringList ? Target :
			Target extends string ? Target | null :
				Target extends boolean ? undefined : null,

		value: Target extends boolean ? undefined : string
	) => Exclude<Target, null>

};

export interface UserScript {
	Config: {
		enabled: NumBool;
		removed: NumBool;
		shouldUpdate: NumBool;
		notifyUpdates?: NumBoolNull;
	};
	Custom: {
		name?: string;
		downloadURL?: string;
		homepageURL?: string;
		lastInstallURL?: string;
		updateURL?: string;
		injectInto?: VMScriptInjectInto;
		noframes?: NumBoolNull;
		exclude?: StringList;
		excludeMatch?: StringList;
		include?: StringList;
		match?: StringList;
		origExclude: boolean;
		origExcludeMatch: boolean;
		origInclude: boolean;
		origMatch: boolean;
		pathMap?: StringMap;
		runAt?: VMScriptRunAt;
	};
	Meta: {
		description?: string;
		downloadURL?: string;
		exclude: StringList;
		excludeMatch: StringList;
		grant: StringList;
		homepageURL?: string;
		icon?: string;
		include: StringList;
		injectInto?: VMScriptInjectInto;
		match: StringList;
		namespace?: string;
		name: string;
		noframes?: boolean;
		require: StringList;
		resources: StringMap;
		runAt?: VMScriptRunAt;
		supportURL?: string;
		unwrap?: boolean;
		version?: string;
	};
	Props: {
		id: number;
		lastModified: number;
		lastUpdated: number;
		position: number;
		uri: string;
		uuid: string;
	};
}

export namespace Userscript {
	export type Meta = {
		description?: string;
		downloadURL?: string;
		exclude: StringList;
		excludeMatch: StringList;
		grant: StringList;
		homepageURL?: string;
		icon?: string;
		include: StringList;
		injectInto?: VMScriptInjectInto;
		match: StringList;
		namespace?: string;
		name: string;
		noframes?: boolean;
		require: StringList;
		resources: StringMap;
		runAt?: VMScriptRunAt;
		supportURL?: string;
		unwrap?: boolean;
		version?: string;
	};
	export type RawMeta = Partial<Userscript.Meta & {
		resource: ImmutableValue<Record<string, string>>
	}>;
	export type ParsedUserscript = {
		meta: Userscript.Meta;
		metablock: string;
		content: string;
	};
}

export namespace MetaValueTypes {
	export type RequiredValues = {
		[K in keyof RequiredFieldsOnly<Userscript.Meta>]:
		K extends 'exclude' | 'excludeMatch' | 'match' | 'grant' | 'include' | 'require'
			? ImmutableValue<StringList>
			: K extends 'name'
				? ImmutableValue<string>
				: K extends 'resources'
					? ImmutableValue<StringMap>
					: never;
	};
	export type OptionalValues = Required<{
		[K in keyof UnrequiredFieldsOnly<Userscript.Meta>]:
		K extends 'description' | 'downloadURL' | 'homepageURL' | 'icon' | 'injectInto' | 'namespace' | 'runAt' | 'supportURL' | 'version'
			? ImmutableValue<string>
			: K extends 'noframes' | 'unwrap'
				? ImmutableValue<boolean>
				: never;
	}>;
}
