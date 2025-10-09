const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";

// Function to format extracted text for better readability
function formatExtractedText(text) {
	if (!text) return "";
	
	// Split into lines and clean up
	let lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
	
	// Join lines with proper spacing
	let formatted = lines.join('\n');
	
	// Clean up multiple spaces
	formatted = formatted.replace(/\s+/g, ' ');
	
	// Add line breaks after common medical document patterns
	formatted = formatted.replace(/(Patient:|Diagnosis:|Treatment:|Medication:|Date:|Doctor:|Hospital:|Report:|Name:)/g, '\n$1');
	
	// Clean up extra line breaks
	formatted = formatted.replace(/\n\s*\n/g, '\n');
	
	// Ensure proper spacing around colons
	formatted = formatted.replace(/:\s*/g, ': ');
	
	return formatted.trim();
}

async function performOcr(filePath) {
	const apiKey = "K81871646588957";
	if (!apiKey) {
		const error = new Error("Missing OCR API key. Set OCR_API_KEY in .env");
		error.status = 500;
		console.log(error.message);
		throw error;
	}

	const form = new FormData();
	form.append("file", fs.createReadStream(filePath));
	// Enhanced OCR parameters for better formatting
	form.append("OCREngine", "2"); // Engine 2 for better accuracy
	form.append("scale", "true");
	form.append("isTable", "true"); // Enable table detection for better structure
	form.append("isOverlayRequired", "false");
	form.append("detectOrientation", "true"); // Auto-detect text orientation
	form.append("language", "eng"); // English language
	form.append("filetype", "PDF"); // Specify file type for better processing

	const headers = {
		...form.getHeaders(),
		apikey: apiKey, // sent in header per OCR.Space
	};

	const response = await axios.post(OCR_SPACE_ENDPOINT, form, { headers, maxBodyLength: Infinity });
	const data = response.data;

	if (!data || data.OCRExitCode !== 1) {
		const message = data?.ErrorMessage?.[0] || data?.ErrorMessage || "OCR service error";
		const error = new Error(message);
		error.status = 502;
		throw error;
	}

	const parsedResults = Array.isArray(data.ParsedResults) ? data.ParsedResults : [];
	
	// Process and format the extracted text
	let rawText = parsedResults.map(r => r.ParsedText || "").join("\n");
	
	// Clean up and format the text
	const formattedText = formatExtractedText(rawText);
	
	return {
		extractedText: formattedText,
		rawText: rawText, // Also return raw text for reference
		ocrMetadata: {
			isErroredOnProcessing: data.IsErroredOnProcessing,
			processingTimeInMs: data.ProcessingTimeInMilliseconds,
			ocrExitCode: data.OCRExitCode,
			parsedPages: parsedResults.length,
		},
	};
}

module.exports = {
	performOcr,
};
