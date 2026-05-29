// Import the official OpenAI Node.js SDK
const OpenAI = require('openai');

// Create an OpenAI client instance.
// It automatically reads OPENAI_API_KEY from process.env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes a text message for toxicity using OpenAI's Moderation API.
 * @param {string} text - The message to analyze
 * @returns {object} - Result with isToxic, score, categories, flaggedAt
 */
async function checkToxicity(text) {
  // Call OpenAI moderation endpoint
  const response = await openai.moderations.create({
    model: 'omni-moderation-latest', // Latest and most accurate model
    input: text,
  });

  // The API returns an array of results (one per input string).
  // We only sent one string, so we grab index [0].
  const result = response.results[0];

  // Find the highest score across all categories.
  // This gives us a single number representing overall toxicity.
  const scores = Object.values(result.category_scores);
  const maxScore = Math.max(...scores);

  // Return a clean, structured object for easy use elsewhere
  return {
    isToxic: result.flagged,          // true/false from OpenAI
    toxicityScore: maxScore,          // highest category score (0–1)
    moderationCategories: result.categories, // per-category boolean flags
    categoryScores: result.category_scores,  // per-category scores
    flaggedAt: result.flagged ? new Date() : null,
  };
}

module.exports = { checkToxicity };
