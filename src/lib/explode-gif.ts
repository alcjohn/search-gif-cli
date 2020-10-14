// @ts-ignore
import GetPixels from "get-pixels";
// @ts-ignore
import savePixels from "save-pixels";
import axios from "axios";
import pump from "pump";
import fs from "fs-extra";
import pify from "pify";
import path from "path";
const getPixels = pify(GetPixels);

export const explodeGif = async (url: string) => {
	const pathFile = path.resolve("gif/original.gif");
	const writer = fs.createWriteStream(pathFile);

	const response = await axios({
		url,
		method: "GET",
		responseType: "stream",
	});

	response.data.pipe(writer);

	await new Promise((resolve, reject) => {
		writer.on("finish", resolve);
		writer.on("error", reject);
	});

	const results = await getPixels("gif/original.gif");
	const { shape } = results;
	if (shape.length === 4) {
		// animated gif with multiple frames
		const [frames, width, height, channels] = shape;

		const numPixelsInFrame = width * height;

		for (let i = 0; i < frames; ++i) {
			if (i > 0) {
				const currIndex = results.index(i, 0, 0, 0);
				const prevIndex = results.index(i - 1, 0, 0, 0);

				for (let j = 0; j < numPixelsInFrame; ++j) {
					const curr = currIndex + j * channels;

					if (results.data[curr + channels - 1] === 0) {
						const prev = prevIndex + j * channels;

						for (let k = 0; k < channels; ++k) {
							results.data[curr + k] = results.data[prev + k];
						}
					}
				}
			}
			const stream = savePixels(results.pick(i), "jpeg");
			pump(stream, fs.createWriteStream(`gif/frames/frame-${i}.jpeg`));
		}
	}
	return results;
};
