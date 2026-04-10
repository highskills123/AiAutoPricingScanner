const axios = require('axios');

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const GOOGLE_VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Analyze an image using Google Vision API.
 * Returns identified labels, text, objects, and web entities.
 */
async function analyzeImage(imageBase64) {
  if (!GOOGLE_VISION_API_KEY) {
    console.warn('[ImageAnalysis] No Google Vision API key - using demo mode');
    return demoAnalysis();
  }

  const requestBody = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 15 },
          { type: 'TEXT_DETECTION' },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'WEB_DETECTION', maxResults: 10 },
          { type: 'LOGO_DETECTION', maxResults: 5 },
        ],
      },
    ],
  };

  const response = await axios.post(
    `${GOOGLE_VISION_URL}?key=${GOOGLE_VISION_API_KEY}`,
    requestBody,
    { timeout: 15000 }
  );

  const result = response.data.responses[0];
  return parseVisionResponse(result);
}

/**
 * Parse the raw Vision API response into a structured object.
 */
function parseVisionResponse(result) {
  const labels = (result.labelAnnotations || []).map((l) => ({
    description: l.description,
    score: l.score,
  }));

  const rawText = result.textAnnotations?.[0]?.description || '';
  const textBlocks = rawText
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  const objects = (result.localizedObjectAnnotations || []).map((o) => ({
    name: o.name,
    score: o.score,
  }));

  const webEntities = (result.webDetection?.webEntities || [])
    .filter((e) => e.description && e.score > 0.5)
    .map((e) => ({ description: e.description, score: e.score }));

  const bestGuessLabels = (result.webDetection?.bestGuessLabels || []).map(
    (b) => b.label
  );

  const logos = (result.logoAnnotations || []).map((l) => l.description);

  // Determine category based on labels and text
  const category = detectCategory(labels, textBlocks, webEntities, logos);

  // Extract specifics (year, player name, card number, brand, etc.)
  const specifics = extractSpecifics(textBlocks, labels, category);

  // Build a comprehensive item name
  const itemName = buildItemName(
    bestGuessLabels,
    webEntities,
    specifics,
    labels,
    category
  );

  const confidence = calculateConfidence(labels, webEntities, textBlocks);

  return {
    itemName,
    category,
    specifics,
    labels,
    textBlocks,
    objects,
    webEntities,
    logos,
    confidence,
    rawText,
  };
}

/**
 * Detect the category of the item.
 */
function detectCategory(labels, textBlocks, webEntities, logos) {
  const allText = [
    ...labels.map((l) => l.description.toLowerCase()),
    ...textBlocks.map((t) => t.toLowerCase()),
    ...webEntities.map((e) => e.description.toLowerCase()),
    ...logos.map((l) => l.toLowerCase()),
  ].join(' ');

  if (
    /\b(pokemon|magic|mtg|yu-gi-oh|yugioh|trading card|sports card|baseball card|football card|basketball card|hockey card|topps|panini|upper deck|bowman|fleer|donruss|score|leaf|prizm|optic|select|mosaic|national treasures|holofoil|refractor|psa|bgs|sgc|graded)\b/.test(
      allText
    )
  ) {
    return 'cards';
  }

  if (
    /\b(vintage|antique|collectible|retro|rare|limited edition|signed|autograph|memorabilia|coin|stamp|comic|action figure|funko|pop|figurine|toy|diecast|model)\b/.test(
      allText
    )
  ) {
    return 'collectibles';
  }

  if (
    /\b(jersey|equipment|signed|autograph|bat|glove|helmet|ball|trophy|award|championship|ring|medal|sports memorabilia)\b/.test(
      allText
    ) &&
    !/\bcard\b/.test(allText)
  ) {
    return 'sports';
  }

  if (
    /\b(1900|1910|1920|1930|1940|1950|1960|1970s|1980s|antique|victorian|art deco|mid century)\b/.test(
      allText
    )
  ) {
    return 'vintage';
  }

  if (
    /\b(card|pokemon|magic|topps|panini|upper deck)\b/.test(allText)
  ) {
    return 'cards';
  }

  return 'collectibles';
}

/**
 * Extract specific details from text and labels.
 */
function extractSpecifics(textBlocks, labels, category) {
  const specifics = {};

  // Look for year (4-digit number starting with 19 or 20)
  const yearMatch = textBlocks.join(' ').match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) specifics.year = yearMatch[1];

  // Look for card number (#123 or 123/456 patterns)
  const cardNumMatch = textBlocks
    .join(' ')
    .match(/#(\d+)|(\d+)\/(\d+)/);
  if (cardNumMatch) {
    specifics.cardNumber = cardNumMatch[1] || cardNumMatch[2];
    if (cardNumMatch[3]) specifics.printRun = cardNumMatch[3];
  }

  // Look for PSA/BGS/SGC grade
  const gradeMatch = textBlocks
    .join(' ')
    .match(/\b(PSA|BGS|SGC)\s*(\d+(?:\.\d+)?)\b/i);
  if (gradeMatch) {
    specifics.gradingCompany = gradeMatch[1].toUpperCase();
    specifics.grade = gradeMatch[2];
  }

  // Look for RC (Rookie Card)
  if (/\bRC\b|\bROOKIE\b/i.test(textBlocks.join(' '))) {
    specifics.isRookie = true;
  }

  // Look for serial numbering
  const serialMatch = textBlocks.join(' ').match(/\d+\s*\/\s*(\d+)/);
  if (serialMatch && !specifics.printRun) {
    specifics.printRun = serialMatch[1];
  }

  // Try to extract player/character name (capitalized words not in a list of known non-names)
  const skipWords = new Set([
    'THE', 'AND', 'FOR', 'INC', 'LLC', 'USA', 'PSA', 'BGS', 'SGC',
    'TOPPS', 'PANINI', 'UPPER', 'DECK', 'DONRUSS', 'FLEER', 'BOWMAN',
    'MINT', 'NEAR', 'GOOD', 'FAIR', 'POOR', 'GEM',
  ]);

  const capitalizedWords = textBlocks
    .filter((t) => /^[A-Z][A-Z\s.'-]+$/.test(t) && t.length > 3)
    .filter((t) => !skipWords.has(t.trim()))
    .slice(0, 3);

  if (capitalizedWords.length > 0) {
    specifics.name = capitalizedWords[0];
  }

  // Extract brand/manufacturer from labels
  const brandLabels = labels
    .filter((l) => l.score > 0.8)
    .map((l) => l.description)
    .filter((d) =>
      /topps|panini|upper deck|donruss|fleer|bowman|leaf|score|prizm|pokemon|magic/i.test(
        d
      )
    );

  if (brandLabels.length > 0) {
    specifics.brand = brandLabels[0];
  }

  return specifics;
}

/**
 * Build a comprehensive item name for searching.
 */
function buildItemName(bestGuessLabels, webEntities, specifics, labels, category) {
  // Start with the best guess label from web detection
  if (bestGuessLabels.length > 0) {
    return bestGuessLabels[0];
  }

  // Fall back to building from specifics
  const parts = [];

  if (specifics.year) parts.push(specifics.year);
  if (specifics.brand) parts.push(specifics.brand);
  if (specifics.name) parts.push(specifics.name);

  if (category === 'cards') {
    if (specifics.cardNumber) parts.push(`#${specifics.cardNumber}`);
    if (specifics.isRookie) parts.push('RC');
    if (specifics.gradingCompany && specifics.grade) {
      parts.push(`${specifics.gradingCompany} ${specifics.grade}`);
    }
  }

  if (parts.length > 0) return parts.join(' ');

  // Fall back to top web entity
  if (webEntities.length > 0) return webEntities[0].description;

  // Fall back to top label
  if (labels.length > 0) return labels[0].description;

  return 'Unknown Item';
}

/**
 * Calculate a confidence score (0-1) for the identification.
 */
function calculateConfidence(labels, webEntities, textBlocks) {
  let score = 0;

  if (labels.length > 0) score += 0.2;
  if (webEntities.length > 0) score += 0.3;
  if (textBlocks.length > 2) score += 0.2;
  if (labels.some((l) => l.score > 0.9)) score += 0.3;

  return Math.min(score, 1);
}

/**
 * Demo analysis when no API key is available.
 */
function demoAnalysis() {
  return {
    itemName: '2003 Topps Chrome LeBron James #111 Rookie Card',
    category: 'cards',
    specifics: {
      year: '2003',
      brand: 'Topps Chrome',
      name: 'LEBRON JAMES',
      cardNumber: '111',
      isRookie: true,
    },
    labels: [
      { description: 'Trading card', score: 0.98 },
      { description: 'Sports card', score: 0.95 },
      { description: 'Basketball', score: 0.92 },
    ],
    textBlocks: ['LEBRON JAMES', '2003', 'TOPPS CHROME', '#111', 'ROOKIE'],
    objects: [{ name: 'Card', score: 0.99 }],
    webEntities: [
      { description: '2003 Topps Chrome LeBron James Rookie', score: 0.95 },
    ],
    logos: ['Topps'],
    confidence: 0.92,
    rawText: 'LEBRON JAMES\n2003\nTOPPS CHROME\n#111\nROOKIE',
    demoMode: true,
  };
}

module.exports = { analyzeImage };
