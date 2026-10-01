/**
 * Entitlement Service — Module 7
 * Single source of truth for feature access.
 * NEVER check subscription tier strings in routes/components directly.
 * Always call canAccess(therapistId, featureKey).
 */
const User = require("../models/User");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");

// In-memory cache (5 min TTL) to avoid DB hit on every request
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getTierConfig(tier) {
  const cached = cache.get(tier);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.config;

  let config = await SubscriptionTierConfig.findOne({ tier });
  if (!config) {
    // Fallback defaults if DB not seeded yet
    config = getDefaultConfig(tier);
  }
  cache.set(tier, { config, ts: Date.now() });
  return config;
}

function getDefaultConfig(tier) {
  const defaults = {
    free:       { caps: { max_active_clients: 5,   max_sessions_month: 20,  max_notes_per_session: 1  }, features: { analytics_depth: "basic",    note_templates: ["free"],                       recurring_sessions: false, pdf_exports: false, csv_exports: false, session_packages: false, custom_branding: false, priority_support: false, client_portal: false, chat: false } },
    basic:      { caps: { max_active_clients: 20,  max_sessions_month: 80,  max_notes_per_session: 3  }, features: { analytics_depth: "basic",    note_templates: ["free","soap"],                recurring_sessions: false, pdf_exports: true,  csv_exports: true,  session_packages: false, custom_branding: false, priority_support: false, client_portal: true,  chat: false } },
    pro:        { caps: { max_active_clients: 100, max_sessions_month: 400, max_notes_per_session: 10 }, features: { analytics_depth: "advanced", note_templates: ["free","soap","dap","progress"], recurring_sessions: true,  pdf_exports: true,  csv_exports: true,  session_packages: true,  custom_branding: false, priority_support: false, client_portal: true,  chat: true  } },
    enterprise: { caps: { max_active_clients: 9999,max_sessions_month: 9999,max_notes_per_session: 99 }, features: { analytics_depth: "full",     note_templates: ["free","soap","dap","progress"], recurring_sessions: true,  pdf_exports: true,  csv_exports: true,  session_packages: true,  custom_branding: true,  priority_support: true,  client_portal: true,  chat: true  } },
  };
  return defaults[tier] || defaults.free;
}

/**
 * Check if a therapist can access a feature.
 * @param {string|ObjectId} therapistId
 * @param {string} featureKey — e.g. "pdf_exports", "recurring_sessions", "chat"
 * @param {object} context — optional: { client_count, session_count_month }
 * @returns {Promise<{ allowed: boolean, reason?: string, upgradeRequired?: string }>}
 */
async function canAccess(therapistId, featureKey, context = {}) {
  try {
    const user = await User.findById(therapistId).select("subscription");
    if (!user) return { allowed: false, reason: "User not found" };

    const tier   = user.subscription?.plan || "free";
    const config = await getTierConfig(tier);

    // Cap checks
    if (featureKey === "active_clients") {
      const max = config.caps?.max_active_clients ?? 5;
      if (context.client_count >= max) {
        return { allowed: false, reason: `Active client limit reached (${max})`, upgradeRequired: getNextTier(tier) };
      }
      return { allowed: true };
    }

    if (featureKey === "session_this_month") {
      const max = config.caps?.max_sessions_month ?? 20;
      if (context.session_count_month >= max) {
        return { allowed: false, reason: `Monthly session limit reached (${max})`, upgradeRequired: getNextTier(tier) };
      }
      return { allowed: true };
    }

    if (featureKey === "note_template") {
      const allowed = (config.features?.note_templates || ["free"]).includes(context.template);
      if (!allowed) return { allowed: false, reason: `Note template '${context.template}' not available on ${tier} plan`, upgradeRequired: getNextTier(tier) };
      return { allowed: true };
    }

    // Boolean feature flags
    const featureAllowed = config.features?.[featureKey];
    if (featureAllowed === undefined) return { allowed: true }; // unknown feature = allow
    if (!featureAllowed) {
      return { allowed: false, reason: `Feature '${featureKey}' not available on ${tier} plan`, upgradeRequired: getNextTier(tier) };
    }
    return { allowed: true };
  } catch (err) {
    console.error("EntitlementService.canAccess error:", err.message);
    return { allowed: true }; // fail open — never block on entitlement service errors
  }
}

function getNextTier(current) {
  const order = ["free", "basic", "pro", "enterprise"];
  const idx   = order.indexOf(current);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
}

/**
 * Express middleware factory.
 * Usage: router.post("/...", requireFeature("pdf_exports"), controller)
 */
function requireFeature(featureKey, contextFn = null) {
  return async (req, res, next) => {
    const context = contextFn ? await contextFn(req) : {};
    const result  = await canAccess(req.user._id, featureKey, context);
    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        message: result.reason || "Feature not available on your plan",
        upgradeRequired: result.upgradeRequired,
        code: "ENTITLEMENT_DENIED",
      });
    }
    next();
  };
}

/** Seed default tier configs into DB (call once at startup) */
async function seedTierConfigs() {
  const tiers = ["free", "basic", "pro", "enterprise"];
  const prices = { free: 0, basic: 999, pro: 2499, enterprise: 5999 };
  const displayNames = { free: "Free", basic: "Basic", pro: "Pro", enterprise: "Enterprise" };

  for (const tier of tiers) {
    const exists = await SubscriptionTierConfig.findOne({ tier });
    if (!exists) {
      const def = getDefaultConfig(tier);
      await SubscriptionTierConfig.create({
        tier,
        displayName:   displayNames[tier],
        price_monthly: prices[tier],
        caps:     def.caps,
        features: def.features,
      });
      console.log(`Seeded tier config: ${tier}`);
    }
  }
}

module.exports = { canAccess, requireFeature, seedTierConfigs, getDefaultConfig };