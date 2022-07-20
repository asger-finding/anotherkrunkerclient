import { TwitchMessage } from '@client';
import { ipcRenderer } from 'electron';
type AvailableStates = 'public' | 'groups' | 'live_tv';
type SwitchChat = (element: HTMLDivElement) => void;

export default class TwitchChat {

	chatList: HTMLDivElement;

	chatListClone: HTMLDivElement;

	chatInput: HTMLInputElement;

	chatInputClone: HTMLInputElement;

	twitchMessageCount = 0;

	enqueuedTwitchMessages: TwitchMessage[] = [];

	chatStates: AvailableStates[];

	chatState: AvailableStates = 'public';

	nativeSwitchChat: SwitchChat;

	/**
	 * Set up the event listener for the Twitch chat.
	 */
	constructor() {
		ipcRenderer.on('twitch-message', (_evt, message: TwitchMessage) => {
			if (!this.chatListClone) return this.enqueuedTwitchMessages.push(message);
			return this.appendTwitchMessage(message);
		});
	}

	/**
	 * Initialize the Twitch chat.
	 */
	init() {
		const self = this;

		// eslint-disable-next-line accessor-pairs
		Reflect.defineProperty(window, 'switchChat', {
			configurable: true,

			set(nativeSwitchChat: SwitchChat) {
				// At this point, the chat has been initialized
				self.saveElements();
				self.nativeSwitchChat = nativeSwitchChat;

				Reflect.defineProperty(window, 'switchChat', <{ value: SwitchChat }>{
					value(chatSwitchElement) {
						self.switchChat(chatSwitchElement);
					}
				});
			}
		});
	}

	/**
	 * Toggle the chat tab
	 * 
	 * @param chatSwitchElement - The element that triggered the chat tab switch.
	 */
	switchChat(chatSwitchElement: HTMLDivElement) {
		this.setOrder();

		const currentTab = (chatSwitchElement.getAttribute('data-tab') ?? 'public') as AvailableStates;
		this.chatState = this.chatStates[(this.chatStates.indexOf(currentTab) + 1) % this.chatStates.length];

		if (this.chatState === 'live_tv') {
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
	saveElements() {
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
	appendTwitchMessage(message: TwitchMessage): void {
		const wrapper = document.createElement('div');
		wrapper.setAttribute('data-tab', '-1');
		wrapper.setAttribute('id', `chatMsg_${this.twitchMessageCount}`);

		const chatItem = document.createElement('div');
		chatItem.setAttribute('class', 'chatItem');
		chatItem.setAttribute('style', 'background-color: rgba(0, 0, 0, 0.3)');
		chatItem.innerText = `\u200e${ message.username }\u200e: `;

		const chatMsg = document.createElement('span');
		chatMsg.setAttribute('class', 'chatMsg');
		chatMsg.innerText = `\u200e${ message.message }\u200e`;

		chatItem.append(chatMsg);
		wrapper.append(chatItem);

		this.twitchMessageCount++;
		this.chatListClone.append(wrapper);
		this.chatListClone.scrollTop = this.chatListClone.scrollHeight;
	}

	/**
	 * Resolve the order of the chat tabs depending on whether teams are enabled or not.
	 */
	setOrder() {
		const testElement = document.createElement('div');
		testElement.setAttribute('data-tab', 'public');
		this.nativeSwitchChat(testElement);

		// If the data-tab is toggled to groups by the game, then teams are enabled
		this.chatStates = testElement.getAttribute('data-tab') === 'groups'
			? ['public', 'groups', 'live_tv']
			: ['public', 'live_tv'];
	}

}
