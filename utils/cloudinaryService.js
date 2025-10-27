const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

dotenv.config();

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;

async function addCodesToImage(localImagePath, namasteCode, icdCode) {
	if (!localImagePath) {
		throw new Error("imagePath is required");
	}
	const publicIdBase = path.parse(localImagePath).name;

	// Upload original image first
	const uploadResult = await cloudinary.uploader.upload(localImagePath, {
		folder: "ocr-api",
		public_id: `${publicIdBase}-${Date.now()}`,
		resource_type: "image",
	});

	// Apply text overlays via transformation on the uploaded asset
	const overlayText1 = `NAMASTE Code: ${namasteCode || "N/A"}`;
	const overlayText2 = `WHO ICD Code: ${icdCode || "N/A"}`;

	const transformedUrl = cloudinary.url(uploadResult.public_id, {
		secure: true,
		resource_type: "image",
		transformation: [
			// First text line
			{
				overlay: {
					font_family: "Arial",
					font_size: 24,
					font_weight: "semi_bold",
					text: overlayText1,
					font_hinting: "full",
				},
				color: "black",
				gravity: "south_east",
				y: 250,
				x: 280,
			},
			// Second text line below it
			{
				overlay: {
					font_family: "Arial",
					font_size: 24,
					font_weight: "semi_bold",
					text: overlayText2,
					font_hinting: "full",
				},
				color: "black",
				gravity: "south_east",
				y: 210,
				x: 340,
			},
		],
	});

	return { original: uploadResult.secure_url, transformed: transformedUrl };
};

module.exports = { addCodesToImage };