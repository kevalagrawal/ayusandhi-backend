const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { handleScanReport }= require("../controllers/ocrController.js");

const router = express.Router();

// Basic API key verification middleware
function verifyClientApiKey(req, res, next) {
	const providedKey = process.env.OCR_API_KEY1;
	if (!providedKey) {
		return res.status(401).json({ success: false, error: "Unauthorized: invalid API key" });
	}
	return next();
}

// Multer storage and validation
const storage = multer.diskStorage({
	destination: function (_req, _file, cb) {
		const uploadsDir = path.resolve("uploads");
		if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
		cb(null, uploadsDir);
	},
	filename: function (_req, file, cb) {
		const timestamp = Date.now();
		const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
		cb(null, `${timestamp}_${safeOriginal}`);
	},
});

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".pdf"]);

function fileFilter(_req, file, cb) {
	const ext = path.extname(file.originalname).toLowerCase();
	if (!allowedExtensions.has(ext)) {
		return cb(new Error("Invalid file type. Allowed: .png, .jpg, .jpeg, .pdf"));
	}
	cb(null, true);
}

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 20 * 1024 * 1024, // 20 MB
	},
});

// Route: POST /scan-report
router.post("/report", verifyClientApiKey, upload.single("file"), handleScanReport);

module.exports = router;
