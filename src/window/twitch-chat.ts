import {
	TWITCH_GET_INFO,
	TWITCH_MATERIAL_ICON,
	TWITCH_MESSAGE_RECEIVE,
	TWITCH_MESSAGE_SEND,
	preferences
} from '@constants';
import { ChatUserstate } from 'tmi.js';
import { SimplifiedTwitchMessage } from '@client';
import { ipcRenderer } from 'electron';

type ViewerStates = 'subscriber' | 'vip' | 'moderator' | 'broadcaster';
type AvailableStates = 'public' | 'groups' | typeof TWITCH_MATERIAL_ICON;
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
 *     condition: /^!ping$/i,
 * 
 *     mustBeLive: true,
 *     onlyOwnChannel: false,
 *     // Callback to execute if the condition is met
 *     call: (chatUserstate: ChatUserstate, message: string) => {
 *         TwitchChat.sendTwitchMessage(`Pong, ${chatUserstate.username}!`);
 *     }
 * }
 */
interface ConditionFields {

	/** RegExp to match the message. */
	condition: RegExp;

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
	whoCanTrigger?: Array<ViewerStates>;

	/** The call to make if all conditions are met. */
	call: (userState: ChatUserstate, message: string) => void;
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

	/**
	 * RegExes to test incoming messages against to trigger a chat action.
	 * 
	 * @example
	 * const condition = {
	 *     // Does message start with '!hello'
	 *     condition: /^!ping$/i,
	 *     // Callback to execute if the condition is met
	 *     call: (chatUserstate: ChatUserstate, message: string) => {
	 *         TwitchChat.sendTwitchMessage(`Pong, ${chatUserstate.username}!`);
	 *     }
	 * }
	 */
	private static conditions: Array<ConditionFields> = [
		{
			condition: /^!link(?: (?:.*))?$/ui,
			onlyOwnChannel: true,
			mustBeLive: true,
			call(userState) {
				const { search } = new URL(location.href);

				if (search.startsWith('?game=')) TwitchChat.sendTwitchMessage(`@${ userState.username } — ${ location.href }`);
			}
		},
		{
			condition: /^!ping$/ui,
			onlyOwnChannel: false,
			mustBeLive: true,
			whoCanTrigger: ['moderator', 'broadcaster'],
			call(userState) {
				TwitchChat.sendTwitchMessage(`@${ userState.username }, pong!`);
			}
		}
	];

	/** Set up the event listener for the Twitch chat. */
	constructor() {
		ipcRenderer.on(TWITCH_MESSAGE_RECEIVE, (_evt, item: TwitchMessageItem) => this.filterTwitchMessage(item));
	}

	/** Initialize the Twitch chat. */
	public init() {
		/** @param chatSwitchElement - The element that triggered the chat tab switch. */
		const switchChatHook: SwitchChat = chatSwitchElement => {
			this.switchChat(chatSwitchElement);
		};

		Reflect.defineProperty(window, 'switchChat', {
			configurable: true,

			/**
			 * Save the native switchChat function and replace it with a custom one. Save the chat elements to the class.
			 * 
			 * @param nativeSwitchChat - The native switchChat function.
			 */
			set: async(nativeSwitchChat: SwitchChat) => {
				// At this point, the chat has been initialized
				this.saveElements();
				this.nativeSwitchChat = nativeSwitchChat;

				Reflect.defineProperty(window, 'switchChat', <{ value: SwitchChat }>{ value: switchChatHook });

				// Navigate to the correct chat tab
				this.twitchInfo = await ipcRenderer.invoke(TWITCH_GET_INFO);
				this.navigateToChatTab();
			},
			get() {
				return switchChatHook;
			}
		});
	}

	/**
	 * Iterate through conditions and call the callbacks if the condition is met.
	 * Append the message to the chat list.
	 * 
	 * @param item - The Twitch message context
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
	 * @param item - The Twitch message context
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

			if (condition.condition.test(item.message)) condition.call(item.chatUserstate, item.message);
		}
	}

	/**
	 * Toggle the chat tab
	 * 
	 * @param chatSwitchElement - The element that triggered the chat tab switch.
	 */
	private switchChat(chatSwitchElement: HTMLDivElement) {
		this.setOrder();

		const currentTab = (chatSwitchElement.getAttribute('data-tab') ?? 'public') as AvailableStates;
		this.chatState = this.chatStates[(this.chatStates.indexOf(currentTab) + 1) % this.chatStates.length];

		if (this.chatState === TWITCH_MATERIAL_ICON) {
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
	 * @param message - The Twitch message and username.
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
		chatUsername.style.color = /*message.color ?? */'#ffffff';
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
	private setOrder() {
		const testElement = document.createElement('div');
		testElement.setAttribute('data-tab', 'public');
		this.nativeSwitchChat(testElement);

		// If the data-tab is toggled to groups by the game, then teams are enabled
		this.chatStates = testElement.getAttribute('data-tab') === 'groups'
			? ['public', 'groups', TWITCH_MATERIAL_ICON]
			: ['public', TWITCH_MATERIAL_ICON];
	}

	/** Save the game chat state to preferences and set it upon load. */
	private navigateToChatTab() {
		window.addEventListener('beforeunload', () => {
			preferences.set('gameChatState', this.chatState);
		});

		const chatSwitchElement = document.getElementById('chatSwitch') as HTMLDivElement;
		const savedState = preferences.get('gameChatState') ?? 'public';

		if (savedState === TWITCH_MATERIAL_ICON) {
			let iterations = 0;
			while (chatSwitchElement.getAttribute('data-tab') !== TWITCH_MATERIAL_ICON && iterations < 10) {
				this.switchChat(chatSwitchElement);
				iterations++;
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
	 * @param message - The message to send.
	 */
	private static async sendTwitchMessage(message: string) {
		ipcRenderer.send(TWITCH_MESSAGE_SEND, message);
	}

}
