import { type SwitchChat } from '@typings/krunker';
type ChatSwitch = InstanceType<typeof ChatManager>['chatSwitch'];
type BuiltInChat = InstanceType<typeof ChatManager>['builtInChat'];
type ChatClone = InstanceType<typeof ChatManager>['chatClone'];

interface ChatMessageStruct {
	username?: string;
	message: string;
	isMasked: boolean;
	chatItemNode?: HTMLDivElement;
	readonly usernameColor: string;
	readonly uuid: string;
}

export default class ChatManager<Key extends string, Value extends ChatMessageStruct> extends Map<Key, Value> {

	// Promise to determine when the in-game chat has loaded fully
	public static chatLoaded = new Promise<SwitchChat>(resolve => {
		Reflect.defineProperty(window, 'switchChat', {
			configurable: true,

			/**
			 * Resolve switchChat when it's set, which assumes that the chat has initialized
			 * 
			 * @param value SwitchChat function
			 */
			set: (value: SwitchChat) => {
				// eslint-disable-next-line no-undefined
				Reflect.defineProperty(window, 'switchChat', { set: undefined, get: undefined });
				Reflect.defineProperty(window, 'switchChat', { value });
				resolve(value);
			},

			/**
			 * Irrelevant getter since getter is reset anyhow when switchChat is set
			 * 
			 * @returns undefined
			 */
			// eslint-disable-next-line no-undefined
			get: () => undefined
		});
	});

	private materialIcon = '';

	private identifier = '';

	private maxCapacity = 200;

	private totalSize = 0;

	private chatSwitch: HTMLDivElement;

	private submitCallbackBound = false;

	private builtInChat: {
		list: HTMLDivElement
		input: HTMLInputElement
	};

	private chatClone: {
		list: HTMLDivElement
		input: HTMLInputElement
	};

	/**
	 * Construct the manager. Save necessary elements to class, and set global variables.
	 * 
	 * @param identifier Unique identifier for the chat instance
	 * @param materialIcon Icon to visualize the chat with
	 * @param maxCapacity Maximum amount of messages to render at once
	 */
	constructor(identifier: string, materialIcon: string, maxCapacity: number) {
		super();

		this.identifier = identifier;
		this.materialIcon = materialIcon;
		this.maxCapacity = maxCapacity;

		ChatManager.chatLoaded.then(nativeSwitch => {
			const nativeSwitchChat = nativeSwitch as SwitchChat & {
				customStates: Map<string, InstanceType<typeof ChatManager>>
			};
			const isSwitchChatHookSet = Boolean(nativeSwitchChat.customStates);
			const customStates = nativeSwitchChat.customStates
				?? (nativeSwitchChat.customStates = new Map());

			if (customStates.has(this.identifier)) throw new Error('Identifier must be unique. Anoter chat manager occupies this identifier.');

			customStates.set(this.identifier, this);

			return {
				customStates,
				nativeSwitchChat,
				isSwitchChatHookSet
			};
		}).then(({ customStates, nativeSwitchChat, isSwitchChatHookSet }) => {
			this.builtInChat = {
				list: document.getElementById('chatList') as BuiltInChat['list'],
				input: document.getElementById('chatInput') as BuiltInChat['input']
			};

			this.chatClone = {
				// Don't clone descendants of the chat list (chat messages)
				list: this.builtInChat.list?.cloneNode(false) as ChatClone['list'],
				input: this.builtInChat.input?.cloneNode(true) as ChatClone['input']
			};

			// Apply modifications to the cloned chat list
			this.chatClone.list.id = `chatList_${ this.identifier }`;
			this.chatClone.list.classList.add('clonedChatList');
			this.chatClone.list.style.display = 'none';

			// Apply modifications to the cloned chat input
			this.chatClone.input.id = `chatInput_${ this.identifier }`;
			this.chatClone.input.classList.add('clonedChatInput');
			this.chatClone.input.setAttribute('maxlength', '300');
			this.chatClone.input.removeAttribute('onfocus');
			this.chatClone.input.removeAttribute('onblur');
			this.chatClone.input.style.display = 'none';

			// Append the cloned items to their respective parents
			this.builtInChat.list.parentElement?.insertBefore(this.chatClone.list, document.getElementById('chatInputHolder'));
			this.builtInChat.input.parentElement?.append(this.chatClone.input);

			this.chatSwitch = document.getElementById('chatSwitch') as ChatSwitch;

			// Only apply the switchChat hook for the first manager
			if (isSwitchChatHookSet) return;

			let customStatesIterator = customStates.values();

			/**
			 * A hook for the switchChat krunker function which handles the user gesture to navigate to the chat tab
			 *
			 * @param targetElement Element for the native switchChat function to apply the "data-tab" attribute to
			 */
			const switchChatHook: SwitchChat = targetElement => {
				const dummy: ChatSwitch = document.createElement('div');
				const initialTab = 'public';
				const currentTab = this.chatSwitch?.getAttribute('data-tab') ?? initialTab;

				dummy.setAttribute('data-tab', currentTab);
				nativeSwitchChat(dummy);

				// If the tab rolls back to its initial state, we know we've reached the end
				if (dummy.getAttribute('data-tab') === initialTab) {
					// Switch in for the cloned chat
					const nextManagerIterated = customStatesIterator.next();

					if (nextManagerIterated.done) {
						const lastState = Array.from(customStates.values()).pop();
						if (lastState) {
							lastState.chatClone.input.style.display = 'none';
							lastState.chatClone.list.style.display = 'none';
						}

						this.builtInChat.input.style.display = 'inline';
						this.builtInChat.list.style.display = 'block';

						nativeSwitchChat(targetElement);
						customStatesIterator = customStates.values();
						return;
					}

					const managerToSet = nextManagerIterated.value;
					managerToSet.enableThisChatManager();
				} else {
					nativeSwitchChat(targetElement);
				}
			};

			// 
			Reflect.defineProperty(switchChatHook, 'customStates', { value: customStates });
			Reflect.defineProperty(window, 'switchChat', { value: switchChatHook });
		});
	}

	/**
	 * Toggles this chat manager on visually, and hides the previous one
	 */
	private enableThisChatManager() {
		if (this.chatSwitch
			&& this.chatClone.input
			&& this.chatClone.list) {
			const previousInput = this.chatClone.input.previousElementSibling as HTMLInputElement;
			const previousList = this.chatClone.list.previousElementSibling as HTMLDivElement;

			previousInput.style.display = 'none';
			previousList.style.display = 'none';

			this.chatClone.input.style.display = 'inline';
			this.chatClone.list.style.display = 'block';

			this.chatSwitch.setAttribute('data-tab', this.materialIcon);
		}
	}

	/**
	 * 
	 * @param cb -
	 */
	bindSubmitCallback(cb: (message: string) => void): void {
		if (this.submitCallbackBound) throw new Error('Cannot bind the submit callback more than once for the same chat manager');

		// Register event listener on document for keydown
		document.addEventListener('keydown', (evt: KeyboardEvent) => {
			const isEnter = evt.key === 'Enter';
			const isChatInputFocused = document.activeElement === this.chatClone.input;

			if (isEnter && this.chatClone.input) {
				if (isChatInputFocused) {
					const { value } = this.chatClone.input;

					// Clear the input
					this.chatClone.input.value = '';
					this.chatClone.input.blur();

					evt.preventDefault();
					evt.stopPropagation();

					return cb(value);
				} else if (this.chatClone.input.style.display === 'inline') {
					this.chatClone.input.focus();
				}
			}

			return null;
		});

		this.submitCallbackBound = true;
	}

	/**
	 * Method to add a message to the chat instance.
	 * 
	 * @param uuid A unique string to identify the message
	 * @param chatMessage A message object
	 * @returns The Map object
	 */
	set(uuid: Key, chatMessage: Value): this {
		if (this.has(uuid)) throw new Error('UUID is already registered in chat instance map');

		const messageWrapper = document.createElement('div');
		messageWrapper.setAttribute('data-tab', '-1');
		messageWrapper.setAttribute('id', `chatMsg_${ this.totalSize }`);

		const chatItem = document.createElement('div');
		chatItem.setAttribute('class', 'chatItem');
		chatItem.setAttribute('style', 'background-color: rgba(0, 0, 0, 0.3)');

		const usernameElement = document.createElement('span');
		usernameElement.style.color = chatMessage.usernameColor;

		const messageElement = document.createElement('span');
		messageElement.setAttribute('class', 'chatMsg');

		chatItem.append(usernameElement, messageElement);
		messageWrapper.append(chatItem);

		const messageHandler = <Value & {
			_username: Value['username'];
			_message: Value['message'];
			_isMasked: Value['isMasked'];
		}><unknown>{
			chatItemNode: chatItem,
			usernameColor: chatMessage.usernameColor,
			uuid,
			set username(username: ChatMessageStruct['username']) {
				usernameElement.innerText = `\u200e${username ?? '<unknown>'}\u200e: `;
				usernameElement.style.display = username ? 'inline' : 'none';
				messageHandler._username = username;
			},
			get username() {
				return messageHandler._username;
			},
			set message(message: ChatMessageStruct['message']) {
				messageElement.innerText = `\u200e${message}\u200e`;
				messageHandler._message = message;
			},
			get message() {
				return messageHandler._message;
			},
			set isMasked(isMasked: ChatMessageStruct['isMasked']) {
				if (isMasked) {
					chatItem.classList.add('chatItemDeleted');
					messageHandler.message = 'message deleted';
				}
				messageHandler._isMasked = isMasked;
			},
			get isMasked() {
				return messageHandler._isMasked;
			}
		};

		messageHandler.username = chatMessage.username;
		messageHandler.message = chatMessage.message;
		messageHandler.isMasked = chatMessage.isMasked;

		super.set(uuid, messageHandler);
		this.totalSize += 1;
		if (this.size > this.maxCapacity) this.deleteOldestInsertion();

		this.chatClone.list.append(messageWrapper);
		this.chatClone.list.scrollTop = this.chatClone.list.scrollHeight;

		return this;
	}

	/**
	 * Delete a message from the chat by its uuid
	 * 
	 * @param uuid The target message identified by its unique identifier
	 * @returns Success
	 */
	delete(uuid: Key): boolean {
		const value = this.get(uuid);

		if (value && value.chatItemNode) {
			super.delete(uuid);

			value.chatItemNode
				.parentNode
				?.removeChild(value.chatItemNode);

			return true;
		}
		return false;
	}

	/**
	 * Delete the oldest message in the chat instance history
	 * 
	 * @returns Success
	 */
	deleteOldestInsertion(): boolean {
		const oldest = this.keys().next().value;
		return this.delete(oldest);
	}

	/**
	 * Clear the entire message history of the chat instance
	 */
	clear(): void {
		for (const [, value] of this) {
			if (!value.chatItemNode) continue;

			value.chatItemNode
				.parentNode
				?.removeChild(value.chatItemNode);
		}

		super.clear();
	}

}
