// Content filter for prohibited language

const BLOCKED_TERMS = [
  // Hate speech / historical figures used hatefully
  "nazi", "nazis", "hitler", "heil", "kkk", "ku klux",
  // Racial slurs (including common misspellings)
  "nigger", "nigga", "niggas", "chink", "spic", "wetback", "kike", "gook",
  "raghead", "towelhead", "redskin", "beaner", "coon", "sandnigger", "hymie",
  "wop", "dago", "greaseball", "cracker", "jigaboo", "porch monkey", "jungle bunny",
  "niga", "niga", "nigg", "chink",
  // Common swear words (include common misspellings)
  "fuck", "fucker", "fucking", "fucked", "fck", "fuk", "f u c k",
  "shit", "shitting", "shitty", "sht", "sh1t",
  "bitch", "bitches", "bitching",
  "asshole", "assholes", "ass hole",
  "cunt", "cunts",
  "cock", "cocks",
  "dick", "dicks",
  "pussy", "pussies",
  "bastard", "bastards",
  "whore", "whores",
  "slut", "sluts",
  "piss", "pissing",
  "motherfucker", "motherfucking",
  "faggot", "faggots", "fag", "dyke",
  "retard", "retarded",
  "prick", "pricks",
  "twat", "twats",
  "wanker", "wankers",
  "bollocks",
  "arse", "arsehole",
  // Threatening
  "kill yourself", "kys", "go die", "i will kill", "gonna kill",
  // Sexual / explicit
  "dildo", "masturbate", "masturbation", "ejaculate", "sex",
  "cumshot", "blowjob", "handjob", "anal sex", "rape", "raping", "rapist",
  "homo", "gay",
];

const BLOCKED_REGEX = new RegExp(
  BLOCKED_TERMS
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "i"
);

/**
 * Strips all non-alphanumeric characters (except spaces).
 * Used for real-time input filtering.
 */
export function sanitizeInput(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/[^a-zA-Z0-9\s]/g, "");
}

/**
 * Returns true if the text contains prohibited content.
 */
export function containsInappropriateContent(text) {
  if (!text || typeof text !== "string") return false;
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return BLOCKED_REGEX.test(normalized);
}

/**
 * Checks multiple fields. Returns error message string or null if clean.
 * @param {Object} fields - { "field label": value }
 */
export function validateContentFields(fields) {
  for (const [label, value] of Object.entries(fields)) {
    if (value && containsInappropriateContent(String(value))) {
      return `Your ${label} contains inappropriate or offensive content. Please remove it before saving.`;
    }
  }
  return null;
}