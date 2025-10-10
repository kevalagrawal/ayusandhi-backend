const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { performOcr } = require("../utils/ocrService.js");
const extractCondition = require("../utils/conditionExtractor.js");
const { addCodesToImage } = require("../utils/cloudinaryService.js");

async function handleScanReport(req, res) {
	const startedAt = process.hrtime.bigint();
	try {
		if (!req.file) {
			return res.status(400).json({ success: false, error: "No file uploaded. Use field name 'file'" });
		}

		const uploadedFilePath = req.file.path;
		const uploadedFileName = path.basename(uploadedFilePath);

		const { extractedText, rawText, ocrMetadata } = await performOcr(uploadedFilePath);

		// Extract condition from text
		const detectedCondition = extractCondition(extractedText || rawText || "");
		console.log("Detected condition:", detectedCondition);

		let namasteCode = null;
		let icdCode = null;
		if (detectedCondition) {
			try {
				const base = process.env.LIVE_TERMINOLOGY_API || "https://ayusandhi-backend.vercel.app";
				const url = `${base.replace(/\/$/, "")}/api/v1/terminology/search`;
				const resp = await axios.get(url, { params: { query: detectedCondition } });

				const entry = Array.isArray(resp.data) ? resp.data[0] : (resp.data?.results?.[0] || resp.data?.[0]);
				console.log("Terminology API entry:", entry);
				if (entry) {
					namasteCode = entry.namaste_code || entry.namasteCode || null;
					console.log("NAMASTE Code:", namasteCode);
					const icd = entry.icd11_mappings || entry.icdCode || entry.icd || null;
					console.log("ICD data:", icd);
					if (Array.isArray(icd)) {
						icdCode = icd[0]?.tm2_code || icd[0]?.code || icd[0] || null;
						console.log("ICD from array (tm2_code):", icdCode);
					} else if (typeof icd === "object" && icd !== null) {
						icdCode = icd.tm2_code || icd.code || null;
						console.log("ICD from object (tm2_code):", icdCode);
					} else {
						icdCode = icd || null;
					}

				}
			} catch (_err) {
				// Non-fatal: keep going without codes
				console.log("Terminology API error:", _err);
			}
		}


		// Append codes to text if available
		let updatedText = extractedText || rawText || "";
		if (namasteCode) updatedText += `\nNAMASTE Code: ${namasteCode}`;
		if (icdCode) updatedText += `\nWHO ICD Code: ${icdCode}`;

		// Auto-generate overlaid image (equivalent to calling /regenerate-image)
		let updatedImageUrl = null;
		let downloadUrl = null;
		try {
			const cloudinaryResult = await addCodesToImage(uploadedFilePath, namasteCode, icdCode);
			updatedImageUrl = cloudinaryResult?.transformed || null;
			downloadUrl = cloudinaryResult?.transformed || null;
		} catch (_e) {
			// If Cloudinary fails, still return OCR results without image URLs
			console.log("Cloudinary error:", _e.message || _e);
		}

		const endedAt = process.hrtime.bigint();
		const durationSeconds = Number(endedAt - startedAt) / 1e9;
		const processingTime = `${durationSeconds.toFixed(1)}s`;

		return res.json({
			success: true,
			fileName: uploadedFileName,
			detectedCondition: detectedCondition || null,
			namasteCode: namasteCode || null,
			icdCode: icdCode || null,
			updatedText,
			updatedImageUrl,
			downloadUrl,
			extractedText, // formatted
			rawText, // original
			processingTime,
			metadata: ocrMetadata,
		});
	} catch (err) {
		const message = err?.response?.data?.ErrorMessage || err.message || "OCR failed";
		const status = err.status || 500;
		console.error("Error in /scan-report:", message);
		return res.status(status).json({ success: false, error: message });
	} finally {
		// Cleanup uploaded file regardless of outcome
		if (req?.file?.path) {
			fs.promises.unlink(req.file.path).catch(() => { });
		}
	}
}

module.exports = {handleScanReport,};