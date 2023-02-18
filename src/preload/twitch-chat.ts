import { MESSAGES, TWITCH, TWITCH_GET_CHANNELINFO_INTERVAL } from '@constants';
import SettingsBackend, { Saveables } from '@settings-backend';
import { ChatUserstate } from 'tmi.js';
import { SimplifiedTwitchMessage } from '@typings/client';
import { ipcRenderer } from 'electron';

type ViewerStates = 'subscriber' | 'vip' | 'moderator' | 'broadcaster';
type AvailableStates = 'public' | 'groups' | typeof TWITCH.MATERIAL_ICON;
type SwitchChat = (element: HTMLDivElement) => void;
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
interface ConditionFields {

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
	whoCanTrigger?: ViewerStates[];

	/** The call to make if all conditions are met. */
	call: (ctxt: TwitchChat, userState: ChatUserstate, message: string) => void;
}

export default class TwitchChat {

	private twitchInfo: {
		username: string;
		isLive: boolean;
		channel: string;
	};

	private chatList: HTMLDivElement;

	private chatListClone: HTMLDivElement;

	private chatInput: HTMLInputElement;

	private chatInputClone: HTMLInputElement;

	private twitchMessageCount = 0;

	private enqueuedTwitchMessages: SimplifiedTwitchMessage[] = [];

	private chatStates: AvailableStates[];

	private chatState: AvailableStates = 'public';

	private nativeSwitchChat: SwitchChat;

	private settingsBackend = new SettingsBackend();

	/**
	 * RegExes to test incoming messages against to trigger a chat action.
	 */
	private static conditions: ConditionFields[] = [
		{
			regexCondition: /^!link(?: (?:.*))?$/ui,
			onlyOwnChannel: true,
			mustBeLive: true,
			call(ctxt, userState) {
				if (!ctxt.settingsBackend.getSetting(Saveables.ALLOW_TWITCH_LINK_COMMAND, false)) return;
				const { search } = new URL(location.href);

				if (search.startsWith('?game=')) TwitchChat.sendTwitchMessage(`@${ userState.username } — ${ location.href }`);
			}
		},
		{
			regexCondition: /^!ping$/ui,
			onlyOwnChannel: true,
			mustBeLive: false,
			whoCanTrigger: ['moderator', 'broadcaster'],
			call(_ctxt, userState) {
				TwitchChat.sendTwitchMessage(`@${ userState.username }, pong!`);
			}
		}
	];

	/** Set up the event listener for the Twitch chat. */
	constructor() {
		ipcRenderer.on(MESSAGES.TWITCH_MESSAGE_RECEIVE, (_evt, item: TwitchMessageItem) => this.filterTwitchMessage(item));
	}

	/** Initialize the Twitch chat. */
	public init() {
		/** @param chatSwitchElement The element that triggered the chat tab switch. */
		const switchChatHook: SwitchChat = chatSwitchElement => {
			this.switchChat(chatSwitchElement);
		};

		Reflect.defineProperty(window, 'switchChat', {
			configurable: true,

			/**
			 * Save the native switchChat function and replace it with a hook. Save the chat elements to the class.
			 * 
			 * @param nativeSwitchChat The native switchChat function.
			 */
			set: async(nativeSwitchChat: SwitchChat) => {
				// At this point, the chat has been initialized

				this.periodicallyRefreshTwitchChannelInfo();
				this.nativeSwitchChat = nativeSwitchChat;
				this.saveElements();

				// Write the hook to the native function
				Reflect.defineProperty(window, 'switchChat', { value: switchChatHook });

				// Navigate to the correct chat tab
				this.loadInitialChatTab();
			},
			get() {
				return switchChatHook;
			}
		});
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
			this.twitchInfo = result;
		});
		invoke();

		setInterval(invoke, TWITCH_GET_CHANNELINFO_INTERVAL);
	}

	/**
	 * Iterate through conditions and call the callbacks if the condition is met.
	 * Append the message to the chat list.
	 * 
	 * @param item The Twitch message context
	 */
	private filterTwitchMessage(item: TwitchMessageItem): void {
		this.iterateOverConditions(item);

		const chatMessage: SimplifiedTwitchMessage = {
			username: item.chatUserstate.username ?? '<unknown>',
			message: item.message,
			color: item.chatUserstate.color
		};

		if (!this.chatListClone) this.enqueuedTwitchMessages.push(chatMessage);
		else this.appendTwitchMessage(chatMessage);
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
				(condition.mustBeLive && !this.twitchInfo.isLive)
				|| (condition.onlyOwnChannel && this.twitchInfo.channel !== `#${this.twitchInfo.username}`)
			) continue;

			if (condition.whoCanTrigger instanceof Array && condition.whoCanTrigger.length) {
				const userBadges = Object.keys(item.chatUserstate.badges ?? {}) as ViewerStates[];
				const allowed = condition.whoCanTrigger;
				if (!userBadges.some(badge => allowed.includes(badge))) continue;
			}

			if (condition.regexCondition.test(item.message)) condition.call(this, item.chatUserstate, item.message);
		}
	}

	/**
	 * Handle the HTML and styling for changing the tab
	 * 
	 * Hook for the native switchChat function
	 * 
	 * @param chatSwitchElement The element that triggered the chat tab switch.
	 */
	private switchChat(chatSwitchElement: HTMLDivElement) {
		this.setChatTabOrder();

		const currentTab = (chatSwitchElement.getAttribute('data-tab') ?? 'public') as AvailableStates;
		this.chatState = this.chatStates[(this.chatStates.indexOf(currentTab) + 1) % this.chatStates.length];

		if (this.chatState === TWITCH.MATERIAL_ICON) {
			this.chatInputClone.style.display = 'inline';
			this.chatListClone.style.display = 'block';
			this.chatInput.style.display = 'none';
			this.chatList.style.display = 'none';

			chatSwitchElement.setAttribute('data-tab', this.chatState);
		} else {
			this.chatInputClone.style.display = 'none';
			this.chatListClone.style.display = 'none';
			this.chatInput.style.display = 'inline';
			this.chatList.style.display = 'block';

			this.nativeSwitchChat(chatSwitchElement);
		}
	}

	/**
	 * Save the chat elements to the class.
	 * This must be called after the chat has been initialized.
	 */
	private saveElements() {
		this.chatList = document.getElementById('chatList') as HTMLDivElement;
		this.chatInput = document.getElementById('chatInput') as HTMLInputElement;

		// Don't clone descendants of the chat list
		this.chatListClone = this.chatList.cloneNode(false) as HTMLDivElement;
		this.chatInputClone = this.chatInput.cloneNode(true) as HTMLInputElement;

		// Apply modifications to the cloned chat list
		this.chatListClone.setAttribute('id', 'chatListClone');
		this.chatListClone.style.display = 'none';

		// Apply modifications to the cloned chat input
		this.chatInputClone.setAttribute('id', 'chatInputClone');
		this.chatInputClone.setAttribute('maxlength', '300');
		this.chatInputClone.removeAttribute('onfocus');
		this.chatInputClone.removeAttribute('onblur');
		this.chatInputClone.style.display = 'none';
		this.initInputEventListeners();

		for (const chatMessage of this.enqueuedTwitchMessages) {
			this.appendTwitchMessage(chatMessage);
			this.enqueuedTwitchMessages.shift();
		}

		// Append the cloned items to their respective parents
		this.chatList.parentElement?.insertBefore(this.chatListClone, this.chatList);
		this.chatInput.parentElement?.insertBefore(this.chatInputClone, this.chatInput);
	}

	/**
	 * Create a new in-game chat message and append it to the cloned chat list.
	 * 
	 * @param message The Twitch message and username.
	 */
	private appendTwitchMessage(message: SimplifiedTwitchMessage): void {
		if (this.chatListClone.firstElementChild && this.chatListClone.children.length > 200) this.chatListClone.removeChild(this.chatListClone.firstElementChild);

		const wrapper = document.createElement('div');
		wrapper.setAttribute('data-tab', '-1');
		wrapper.setAttribute('id', `chatMsg_${this.twitchMessageCount}`);

		const chatItem = document.createElement('div');
		chatItem.setAttribute('class', 'chatItem');
		chatItem.setAttribute('style', 'background-color: rgba(0, 0, 0, 0.3)');

		const chatUsername = document.createElement('span');

		// TODO: Optional username color
		// chatUsername.style.color = message.color ?? '#ffffff';
		chatUsername.style.color = '#ffffff';
		chatUsername.innerText = `\u200e${ message.username }\u200e: `;

		const chatMsg = document.createElement('span');
		chatMsg.setAttribute('class', 'chatMsg');
		chatMsg.innerText = `\u200e${ message.message }\u200e`;

		chatItem.append(chatUsername, chatMsg);
		wrapper.append(chatItem);

		this.twitchMessageCount++;
		this.chatListClone.append(wrapper);
		this.chatListClone.scrollTop = this.chatListClone.scrollHeight;
	}

	/** Resolve the order of the chat tabs depending on whether teams are enabled or not. */
	private setChatTabOrder() {
		const testElement = document.createElement('div');
		testElement.setAttribute('data-tab', 'public');
		this.nativeSwitchChat(testElement);

		// If the data-tab is toggled to groups by the game, then teams are enabled
		this.chatStates = testElement.getAttribute('data-tab') === 'groups'
			? ['public', 'groups', TWITCH.MATERIAL_ICON]
			: ['public', TWITCH.MATERIAL_ICON];
	}

	/** Save the game chat state to settings and set it upon load. */
	private loadInitialChatTab() {
		addEventListener('beforeunload', () => {
			const savedState = this.settingsBackend.getSetting(Saveables.GAME_CHAT_STATE, 'public');
			if (savedState !== this.chatState) this.settingsBackend.writeSetting(Saveables.GAME_CHAT_STATE, this.chatState);
		});

		const chatSwitchElement = document.getElementById('chatSwitch') as HTMLDivElement;
		const savedState = this.settingsBackend.getSetting(Saveables.GAME_CHAT_STATE, 'public');

		if (savedState === TWITCH.MATERIAL_ICON) {
			for (let i = 0; i < 5; i++) {
				if (chatSwitchElement.getAttribute('data-tab') !== TWITCH.MATERIAL_ICON) {
					this.switchChat(chatSwitchElement);
					break;
				}
			}
		}
	}

	/** Register the event listeners for the Twitch chat input element. */
	private initInputEventListeners() {
		// Register event listener on document for keydown
		document.addEventListener('keydown', (evt: KeyboardEvent) => {
			const isEnter = evt.key === 'Enter';
			const isChatInputFocused = document.activeElement === this.chatInputClone;

			if (isEnter) {
				if (isChatInputFocused) {
					// Send the message to main
					TwitchChat.sendTwitchMessage(this.chatInputClone.value);

					// Clear the input
					this.chatInputClone.value = '';
					this.chatInputClone.blur();

					evt.preventDefault();
					evt.stopPropagation();
				} else if (this.chatInputClone.style.display === 'inline') {
					this.chatInputClone.focus();
				}
			}
		});
	}

	/**
	 * Send a Twitch message to the chat.
	 * 
	 * @param message The message to send.
	 */
	private static async sendTwitchMessage(message: string) {
		ipcRenderer.send(MESSAGES.TWITCH_MESSAGE_SEND, message);
	}

}
