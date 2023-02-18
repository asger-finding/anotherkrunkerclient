import { EventListener } from '@typings/client';
import PatchedStore from '@store';

export enum StoreConstants {
	PREFIX = 'settings'
}
export enum Saveables {
	INTEGRATE_WITH_TWITCH = 'twitchIntegration',
	RESOURCE_SWAPPER_PATH = 'resourceSwapperPath',
	RESET_FILTER_LISTS_CACHE = 'resetFilterListsCache',
	USER_FILTER_LISTS = 'userFilterLists',
	GAME_FRONTEND = 'gameFrontend',
	ALLOW_TWITCH_LINK_COMMAND = 'twitchLink',
	MAP_ATTRIBUTES = 'mapAttributes',
	SKY_TOP_COLOR = 'skyTopColor',
	SKY_MIDDLE_COLOR = 'skyMiddleColor',
	SKY_BOTTOM_COLOR = 'skyBottomColor',
	GAME_CHAT_STATE = 'gameChatState'
}
export enum EventListenerTypes {
	ON_READ_SETTING,
	ON_WRITE_SETTING
}
type SettingsObject = Partial<Record<Saveables, unknown>>;

export default class SettingsBackend {

	// settings store prefix
	private static readonly prefix = StoreConstants.PREFIX;

	public static readonly saveables = Saveables;

	public savedCache: SettingsObject = {};

	private store = new PatchedStore();

	private eventListeners: {
		type: EventListenerTypes,
		eventListener: EventListener
	}[] = [];

	/**
	 * Get a setting property by its key. Look in cache and fallback to the store.
	 * 
	 * @param key Key to look up
	 * @param defaultValue Value fallback
	 * @returns Saved data or fallback value
	 */
	public getSetting(key: Saveables, defaultValue: unknown): SettingsObject[Saveables] {
		const saved = this.store.get(`${ SettingsBackend.prefix }.${ key }`, defaultValue);

		this.emitEvent(EventListenerTypes.ON_READ_SETTING, key, saved);

		return saved;
	}

	/**
	 * Write a setting to the cache and optionally the file
	 * 
	 * @param key Key to write to
	 * @param value Value to write to key
	 */
	public writeSetting(key: Saveables, value: SettingsObject[Saveables]): void {
		this.store.set(`${ SettingsBackend.prefix }.${ key }`, value);

		this.emitEvent(EventListenerTypes.ON_WRITE_SETTING, key);
	}

	/**
	 * Add an event listener to a storage event
	 * 
	 * @param type Type of event to make the callback on
	 * @param eventListener Event listener to call on
	 */
	public addEventListener(type: EventListenerTypes, eventListener: EventListener): void {
		this.eventListeners.push({ type, eventListener });
	}

	/**
	 * Remove an event listener, and thereby stop it from being called.
	 * 
	 * @param eventListener Event listener to remove
	 */
	public removeEventListener(eventListener: EventListener): void {
		this.eventListeners = this.eventListeners.filter(item => item.eventListener !== eventListener);
	}

	/**
	 * Iterate over event listeners and call those relevant.
	 * 
	 * @param eventType Event type to only call relevant event listeners
	 * @param eventId Event ID to distinguish the event
	 * @param data Optional data for the event
	 */
	private emitEvent(eventType: EventListenerTypes, eventId: string, data?: unknown) {
		for (const { type, eventListener } of this.eventListeners) if (type === eventType) eventListener(eventId, data);
	}

}
