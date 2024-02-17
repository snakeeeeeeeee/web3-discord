import Puppet from "../puppet"
import {sayFaucetLog} from "../utils/promots"
import {readFile} from "fs/promises"
import PuppetOptions from "../utils/PuppetOptions";

interface FaucetOptions {
	token: string,
	account: string,
	headless?: boolean
}

export const runFaucet = async (project: string, options: FaucetOptions) => {
	sayFaucetLog()
	if (!options.token) throw new Error("Discord token not set!")
	if (!options.account) throw new Error("Faucet target address not set!")
	const str = await readFile("./faucets.json", "utf-8")
	const faucets = JSON.parse(str) as Record<string, {
		serverId: string,
		channelId: string,
		type: string,
		cycle: number,
		arg1: string,
		args: string[]
	}>
	const faucetInfo = faucets[project]
	if (!faucetInfo) {
		throw new Error(`Faucet attempt failed: 'project' ${project} is not found in faucets.json.`)
	}
	const {serverId, channelId, type, cycle, arg1, args} = faucetInfo
	const {token, account, headless} = options
	const puppet = new Puppet(PuppetOptions(token, headless))
	await puppet.start()
	await puppet.goToChannel(serverId, channelId)
	if (type === 'msg') {
		puppet.sendMessage(arg1 + ' ' + account)
		setInterval(() => {
			puppet.sendMessage(arg1 + ' ' + account)
		}, cycle * 1000)
	} else {
		if (arg1 != null) {
			puppet.sendCommand(arg1, account);
			setInterval(() => {
				puppet.sendCommand(arg1, account);
			}, cycle * 1000);
		} else if (Array.isArray(args)) {
			let delay = 0;
			args.forEach(arg => {
				setTimeout(() => {
					puppet.sendCommand(arg, account);
				}, delay);
				delay += 10000;
			});
			setInterval(() => {
				let delay = 0;
				args.forEach(arg => {
					setTimeout(() => {
						puppet.sendCommand(arg, account);
					}, delay);
					delay += 10000;
				});
			}, cycle * 1000);
		} else {
			throw new Error(`${project} args or arg1 not found.`);
		}
	}
}
