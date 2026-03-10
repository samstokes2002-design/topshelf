// Content filter for prohibited language

const BLOCKED_TERMS = [
  // Hate speech / historical figures used hatefully
  "nazi", "nazis", "hitler", "heil", "kkk", "ku klux",
  // Racial slurs
  "nigger", "nigga", "niggas", "chink", "spic", "wetback", "kike", "gook",
  "raghead", "towelhead", "redskin", "beaner", "coon", "sandnigger", "hymie",
  "wop", "dago", "greaseball", "cracker", "jigaboo", "porch monkey", "jungle bunny",
  // Common swear words
  "fuck", "fucker", "fucking", "fucked",
  "shit", "shitting", "shitty",
  "bitch", "bitches", "bitching",
  "asshole", "assholes",
  "cunt", "cunts",
  "cock", "cocks",
  "dick", "dicks",
  "pussy", "pussies",
  "bastard", "bastards",
  "whore", "whores",
  "slut", "sluts",
  "piss", "pissing",
  "motherfucker", "motherfucking",
  "faggot", "faggots", "dyke",
  "retard", "retarded",
  "prick", "pricks",
  "twat", "twats",
  "wanker", "wankers",
  "bollocks",
  "arse", "arsehole",
  // Threatening
  "kill yourself", "kys", "go die", "i will kill", "gonna kill",
  // Sexual
  "dildo", "masturbate", "masturbation", "ejaculate",
  "cumshot", "blowjob", "handjob", "anal sex", "rape", "raping", "rapist",
];

const BLOCKED_REGEX = new RegExp(
  BLOCKED_TERMS
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "i"
);

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