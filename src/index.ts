import { explodeGif } from "./lib/explode-gif";
import fs from "fs-extra";
import path from "path";
// @ts-ignore
import CliFrames from "cli-frames";
// @ts-ignore
import imageToAscii from "image-to-ascii";
import axios from "axios";
import inquirer from "inquirer";

const api_url = "https://api.giphy.com/v1/gifs/search";
const api_key = "99CkiDwofPOVZFGBTNnEHU7paQ9SVCJx";

const convertImage = (frame: string): Promise<string> =>
	new Promise((resolve, reject) => {
		imageToAscii(frame, (err: any, converted: any) => {
			if (err) {
				console.log(err);
				reject(err);
			}
			resolve(converted);
		});
	});

const main = async () => {
	// @ts-ignore
	await fs.rmdir("gif", { recursive: true });
	const args = process.argv.splice(2);
	const q = args[0];
	if (!q) {
		console.log("you need to enter search");
		return;
	}
	const { data } = await axios.get(api_url, {
		params: {
			api_key,
			q,
			lang: "fr",
		},
	});
	const a = await inquirer.prompt([
		{
			type: "list",
			message: "choose a gif",
			name: "url",
			choices: data.data.map((item: any) => ({
				name: item.title.trim() !== "" ? item.title : item.slug,
				value: item.images.original.url,
			})),
		},
	]);
	await fs.ensureDir(path.join("gif", "frames"));
	await explodeGif(a.url);
	const n = (await fs.readdir("gif/frames")).length;
	const frames: string[] = [];
	for (let i = 0; i < n; i++) {
		const frame = await convertImage(`./gif/frames/frame-${i}.jpeg`);
		frames.push(frame);
	}
	var animation = new CliFrames();
	animation.load(frames);
	animation.start({
		repeat: true,
		delay: 100,
	});

	return true;
};
main();
