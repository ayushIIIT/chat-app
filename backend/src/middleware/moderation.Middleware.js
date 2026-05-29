export const moderationMiddleware = async (req, res, next) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim() === "") {
    req.moderationResult = {
      isToxic: false,
      toxicityScore: 0,
      moderationCategories: {},
      flaggedAt: null,
    };
    return next();
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/unitary/toxic-bert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const data = await response.json();

    // Handle model still loading
    if (data.error && data.error.includes("loading")) {
      console.warn("HuggingFace model is loading, skipping moderation...");
      req.moderationResult = {
        isToxic: false,
        toxicityScore: 0,
        moderationCategories: {},
        flaggedAt: null,
      };
      return next();
    }

    const results = Array.isArray(data[0]) ? data[0] : data;
    const toxicResult = results.find(
      (r) => r.label === "toxic" || r.label === "TOXIC"
    );
    const toxicityScore = toxicResult?.score || 0;

    // ── Two-tier thresholds ──────────────────────────────
    const BLUR_THRESHOLD = 0.5;   // 0.5–0.75 → allow but blur
    const BLOCK_THRESHOLD = 0.99; // above 0.75 → hard block

    // Attach full result to req for controller to save
    req.moderationResult = {
      isToxic: toxicityScore >= BLUR_THRESHOLD,
      toxicityScore,
      moderationCategories: { toxic: toxicityScore >= BLUR_THRESHOLD },
      flaggedAt: toxicityScore >= BLUR_THRESHOLD ? new Date() : null,
    };

    // Tier 1 — HARD BLOCK (score > 0.75)
    if (toxicityScore >= BLOCK_THRESHOLD) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your message was blocked — severe content detected.",
        flaggedCategories: ["toxic content"],
      });
    }

    // Tier 2 — SOFT WARN (score between 0.5 and 0.75)
    // Message goes through with isToxic: true, rendered blurred in UI
    if (toxicityScore >= BLUR_THRESHOLD) {
      return next();
    }

    // Safe (score below 0.5) — pass through normally
    next();

  } catch (error) {
    console.error("Moderation API error:", error.message);
    req.moderationResult = {
      isToxic: false,
      toxicityScore: 0,
      moderationCategories: {},
      flaggedAt: null,
    };
    next();
  }
};