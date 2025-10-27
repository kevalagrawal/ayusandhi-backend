function extractCondition(text) {
	if (!text || typeof text !== "string") return null;

	// 1️⃣ First, check for "Past" condition pattern (like "Past Jwara")
	const pastMatch = text.match(/Chronic\s+([A-Za-z\s()]+)/i);
	if (pastMatch && pastMatch[1]) {
		let condition = pastMatch[1]
			.split(/[,(\r?\n;]/)[0] // stop at '(' or ',' or newline
			.trim();

		condition = condition.replace(/\s+/g, " ");
		if (condition) return condition;
	}

	// 2️⃣ Fallback: check for Diagnosis/Condition/Disease labels
	const match = text.match(/(?:Diagnosis|Condition|Disease)\s*[:\-]\s*(.+)/i);
	if (match && match[1]) {
		const value = match[1].split(/\r?\n|NAMASTE Code:|WHO ICD Code:/i)[0];
		return value.trim();
	}

	// 3️⃣ If nothing found
	return null;
}

module.exports = extractCondition;
