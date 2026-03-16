import { type GameActivity, type GetGameActivity } from '@typings/krunker';
import { MESSAGES } from '@constants';
import { type NonNullableObject } from '@typings/client';
import { type SetActivity } from '@xhayper/discord-rpc';
import { ipcRenderer } from 'electron';

export default class DiscordRPC {

	/**
	 * Initialize the Discord RPC
	 */
	constructor() {
		Reflect.defineProperty(window, 'getGameActivity', {
			// eslint-disable-next-line jsdoc/require-jsdoc
			set: (getGameActivity: GetGameActivity) => {
				// Reflect.defineProperty(window, 'getGameActivity', { value: getGameActivity });
				if (this.getGameActivity) return;

				this.getGameActivity = getGameActivity;
				this.refreshRpcActivity();
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			get: () => this.getGameActivity
		});
	}

	private currentGameActivity: GameActivity;

	private getGameActivity?: GetGameActivity;

	private rpcUpdateTime = 15_000;

	/**
	 * Send a Discord RPC activity block down the drain
	 */
	private setRpcActivity(): void {
		const gameActivity = this.getGameActivity ? this.getGameActivity() : null;
		if (!gameActivity) return;

		if (!DiscordRPC.isGameActivityReady(gameActivity)) {
			setTimeout(() => this.setRpcActivity(), 100);
			return;
		}

		const newRpcActivity = this.generateActivity(gameActivity as NonNullableObject<typeof gameActivity>);
		if (!DiscordRPC.uglyDeepEqual(this.currentGameActivity, newRpcActivity)) {
			ipcRenderer.send(MESSAGES.UPDATE_GAME_ACTIVITY, newRpcActivity);
			this.currentGameActivity = gameActivity;
		}
	}

	/**
	 * Update the rpc status at an interval
	 */
	private refreshRpcActivity(): void {
		setInterval(() => this.setRpcActivity(), this.rpcUpdateTime);
		this.setRpcActivity();
	}

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
	private generateActivity = (gameActivity: NonNullableObject<GameActivity>): SetActivity => {
		const gameTimeFormatted = `${ new Date(Math.ceil(gameActivity.time / (this.rpcUpdateTime / 1000)) * this.rpcUpdateTime)
			.toISOString()
			.slice(14, 19) } left`;
		const gameEndedText = gameActivity.time === 0 ? 'Game ended' : null;
		return {
			details: `${ gameActivity.mode } on ${ gameActivity.map }`,
			state: gameActivity.custom ? gameTimeFormatted : gameEndedText || gameTimeFormatted,
			largeImageText: gameActivity.class.name,
			largeImageKey: `icon_${ gameActivity.class.index }`
		};
	};

}
