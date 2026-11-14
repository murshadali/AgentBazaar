/**
 * Response Parser
 * Cleans and safely parses LLM output into validated action payload.
 */

export const parseGeminiResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or non-string response received from AI model');
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if model enclosed JSON
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Attempt standard JSON parse
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Attempt regex extraction if model added surrounding prose
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error(`Failed to parse AI JSON response: ${innerErr.message}`);
      }
    } else {
      throw new Error(`No JSON structure found in AI response: ${err.message}`);
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response is not a valid JSON object');
  }

  const action = parsed.action ? String(parsed.action).toUpperCase().trim() : null;
  const price = parsed.price !== undefined && parsed.price !== null ? Number(parsed.price) : null;
  const message = parsed.message ? String(parsed.message).trim() : '';

  return {
    action,
    price: isNaN(price) ? null : price,
    message
  };
};
