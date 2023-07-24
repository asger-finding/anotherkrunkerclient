import { type GameActivity, type GetGameActivity } from '@typings/krunker';
import { MESSAGES } from '@constants';
import { type NonNullableObject } from '@typings/client';
import { type SetActivity } from '@xhayper/discord-rpc';
import { ipcRenderer } from 'electron';

class DiscordRPC {

	/**
	 * Initialize the Discord RPC
	 */
	constructor() {
		Reflect.defineProperty(window, 'getGameActivity', {
			// eslint-disable-next-line jsdoc/require-jsdoc
			set: (getGameActivity: GetGameActivity) => {
				// eslint-disable-next-line no-undefined
				Reflect.defineProperty(window, 'getGameActivity', { set: undefined, get: undefined });
				Reflect.defineProperty(window, 'getGameActivity', { value: getGameActivity });

				this.getGameActivity = getGameActivity;
				this.setRpcActivity();
			},
			// eslint-disable-next-line no-undefined
			get: undefined
		});
	}

	/**
	 * Send a Discord RPC activity block down the drain
	 */
	private setRpcActivity(): void {
		const gameActivity = this.getGameActivity();

		if (!DiscordRPC.isGameActivityReady(gameActivity)) {
			setTimeout(() => this.setRpcActivity(), 100);
			return;
		}

		const newRpcActivity = DiscordRPC.generateActivity(gameActivity as NonNullableObject<typeof gameActivity>);
		if (!DiscordRPC.uglyDeepEqual(this.currentGameActivity, newRpcActivity)) {
			ipcRenderer.send(MESSAGES.UPDATE_GAME_ACTIVITY, newRpcActivity);
			this.currentGameActivity = gameActivity;
		}
	}

	private currentGameActivity: GameActivity;

	private getGameActivity: GetGameActivity;

	/**
	 * Object comparison by stringifying.
	 * 
	 * This does not account for prototypes, element order or anything else important.
	 * This is a very poor comparison that only works since we're in control of the objects we input
	 * 
	 * @param firstObj Object to compare
	 * @param secondObj Object to compare to
	 * @returns Are the objects "identical"
	 */
	private static uglyDeepEqual(firstObj: Record<string, unknown>, secondObj: Record<string, unknown>): boolean {
		return JSON.stringify(firstObj) === JSON.stringify(secondObj);
	}

	/**
	 * Validate that the return value of getGameActivity is ready
	 * and has no null fields
	 * 
	 * @param gameActivity Game activity object
	 * @returns Is ready
	 */
	private static isGameActivityReady(gameActivity: GameActivity): boolean {
		return gameActivity.map !== null
			&& gameActivity.mode !== null
			&& gameActivity.time !== null
			&& gameActivity.custom !== null;
	}

	/**
	 * Generate a discord rpc activity object from a ready game activity object
	 *
	 * @param gameActivity Ready game activity object
	 * @returns Discord RPC object to send to ipcMain
	 */
	private static generateActivity = (gameActivity: NonNullableObject<GameActivity>): SetActivity => ({
		details: gameActivity.class.name,
		state: `${ gameActivity.mode } on ${ gameActivity.map }`,
		largeImageKey: `icon_${ gameActivity.class.index }`
	});

}


export default DiscordRPC;
