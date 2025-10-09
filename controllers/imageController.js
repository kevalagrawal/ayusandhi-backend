const fs = require("fs");
const path = require("path");
const { addCodesToImage } = require("../utils/cloudinaryService.js");

async function regenerateImage(req, res) {
	try {
		const { imagePath, namasteCode, icdCode } = req.body || {};
		if (!imagePath) {
			return res.status(400).json({ success: false, error: "imagePath is required" });
		}

		// Ensure file exists locally
		const absPath = path.isAbsolute(imagePath) ? imagePath : path.resolve(imagePath);
		if (!fs.existsSync(absPath)) {
			return res.status(400).json({ success: false, error: `File not found at ${absPath}` });
		}

		const { original, transformed } = await addCodesToImage(absPath, namasteCode, icdCode);

		return res.json({
			success: true,
			originalFile: path.basename(absPath),
			namasteCode: namasteCode || null,
			icdCode: icdCode || null,
			updatedImageUrl: transformed,
			downloadUrl: transformed,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ success: false, error: err.message || "Failed to regenerate image" });
	}
}

module.exports = {
	regenerateImage,
};