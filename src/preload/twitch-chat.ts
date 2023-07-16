import { MESSAGES, TWITCH_GET_CHANNEL_STATE_INTERVAL } from '@constants';
import SettingsBackend, { Savable } from '@settings-backend';
import ChatManager from '@chat-manager';
import { ChatUserstate } from 'tmi.js';
import { ipcRenderer } from 'electron';

type ViewerRoles = 'subscriber' | 'vip' | 'moderator' | 'broadcaster';
type TwitchMessageItem = {
	chatUserstate: ChatUserstate;
	message: string;
};

/**
 * Interface for Twitch message conditions.
 * 
 * @example
 * const condition = {
 *     // Does message start with '!hello'
 *     regexCondition: /^!ping$/i,
 * 
 *     mustBeLive: true,
 *     onlyOwnChannel: false,
 *     // Callback to execute if the regex condition is met
 *     call: (chatUserstate: ChatUserstate, message: string) => {
 *         TwitchChat.sendTwitchMessage(`Pong, ${chatUserstate.username}!`);
 *     }
 * }
 */
interface Condition {

	/** RegExp to match the message. */
	regexCondition: RegExp;

	/**
	 * Command can only be triggered on the authenticated user's own channel.
	 * 
	 * @default true
	 */
	onlyOwnChannel?: boolean;

	/**
	 * The target channel must be live.
	 * 
	 * @default true
	 */
	mustBeLive?: boolean;

	/** Who can trigger the condition? Unspecified (the default) means everyone. */
	whoCanTrigger?: ViewerRoles[];

	/** The call to make if all conditions are met. */
	call: (ctxt: TwitchChat, userState: ChatUserstate, message: string) => void;
}

export default class TwitchChat {

	private channelState: {
		username: string;
		isLive: boolean;
		channel: string;
	} = {
			username: '',
			isLive: false,
			channel: ''
		};

	private chatManager = new ChatManager('twitch', 'live_tv', 200);

	private settingsBackend = new SettingsBackend();

	private static conditions: Condition[] = [
		{
			regexCondition: /^!link(?: (?:.*))?$/ui,
			onlyOwnChannel: true,
			mustBeLive: true,
			call(ctxt, userState) {
				if (!ctxt.settingsBackend.getSetting(Savable.ALLOW_TWITCH_LINK_COMMAND, false)) return;
				const { search } = new URL(location.href);

				if (search.startsWith('?game=')) ipcRenderer.send(MESSAGES.TWITCH_MESSAGE_SEND, `@${ userState.username } — ${ location.href }`);
			}
		},
		{
			regexCondition: /^!ping$/ui,
			onlyOwnChannel: true,
			mustBeLive: false,
			whoCanTrigger: ['moderator', 'broadcaster'],
			call(_ctxt, userState) {
				ipcRenderer.send(MESSAGES.TWITCH_MESSAGE_SEND, `@${ userState.username }, pong!`);
			}
		}
	];

	/**
	 * Initialize the Twitch chat and ipc message handlers.
	 */
	constructor() {
		this.chatManager.bindSubmitCallback(message => ipcRenderer.send(MESSAGES.TWITCH_MESSAGE_SEND, message));

		ipcRenderer.once(MESSAGES.TWITCH_READY, () => this.periodicallyRefreshTwitchChannelInfo());
		ipcRenderer.on(MESSAGES.TWITCH_MESSAGE_RECEIVE, (_evt, item: TwitchMessageItem) => {
			const uuid = item.chatUserstate.id;
			if (uuid) {
				this.iterateOverConditions(item);

				this.chatManager.set(uuid, {
					username: item.chatUserstate.username ?? '',
					message: item.message,
					isMasked: false,
					usernameColor: item.chatUserstate.color ?? '#ffffff',
					uuid
				});
			}
		});
		ipcRenderer.on(MESSAGES.TWITCH_MESSAGE_DELETE, (_evt, deletedMessageUuid: string) => this.chatManager.delete(deletedMessageUuid));
	}

	/**
	 * Iterate over the Twitch command conditions and call the callbacks if the condition is met.
	 *
	 * @param item The Twitch message context
	 */
	// eslint-disable-next-line complexity
	private iterateOverConditions(item: TwitchMessageItem) {
		for (const condition of TwitchChat.conditions) {
			if (
				(condition.mustBeLive && !this.channelState.isLive)
				|| (condition.onlyOwnChannel && this.channelState.channel !== `#${this.channelState.username}`)
			) continue;

			if (condition.whoCanTrigger instanceof Array && condition.whoCanTrigger.length) {
				const userBadges = Object.keys(item.chatUserstate.badges ?? {}) as ViewerRoles[];
				const allowed = condition.whoCanTrigger;
				if (!userBadges.some(badge => allowed.includes(badge))) continue;
			}

			if (condition.regexCondition.test(item.message)) condition.call(this, item.chatUserstate, item.message);
		}
	}

	/**
	 * Get Twitch channel info and refresh it periodically
	 */
	private periodicallyRefreshTwitchChannelInfo() {
		/**
		 * Call ipcMain to get Twitch Channel info
		 * 
		 * @returns void
		 */
		const invoke = () => ipcRenderer.invoke(MESSAGES.TWITCH_GET_INFO).then(result => {
			this.channelState = result;
		});
		invoke();

		setInterval(invoke, TWITCH_GET_CHANNEL_STATE_INTERVAL);
	}

}
