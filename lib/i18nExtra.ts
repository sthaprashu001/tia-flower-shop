import { Lang, translate as baseTranslate } from "./i18n";

/**
 * Extra / updated English + Nepali text for the product-grouping update.
 * Anything here wins over the same key in lib/i18n.ts; everything else falls
 * through to lib/i18n.ts unchanged. (LanguageProvider uses this translate().)
 *
 * Nepali is a first draft — please have a Nepali speaker read it once.
 */
type Entry = { en: string; ne: string };

export const extraDictionary: Record<string, Entry> = {
  // ---- renamed: "Bouquets" → "Products" so the menu matches the page
  "nav.bouquets": { en: "Products", ne: "उत्पादनहरू" },
  "detail.back": { en: "← Back to products", ne: "← उत्पादनमा फर्कनुहोस्" },
  "cart.browse": { en: "Browse products", ne: "उत्पादन हेर्नुहोस्" },

  // ---- product type
  "kind.title": { en: "Type", ne: "प्रकार" },
  "kind.all": { en: "All types", ne: "सबै प्रकार" },
  "kind.fresh": { en: "Fresh flowers", ne: "ताजा फूल" },
  "kind.artificial": { en: "Artificial · long-lasting", ne: "कृत्रिम · लामो समय टिक्ने" },
  "kind.other": { en: "Khata, flags & more", ne: "खादा, झन्डा र अरू" },
  "kind.artificialNote": {
    en: "Artificial flowers — they stay beautiful long after the flight.",
    ne: "कृत्रिम फूल — उडानपछि पनि धेरै समय राम्रो रहन्छ।",
  },
  "kind.freshNote": {
    en: "Real flowers, prepared fresh for your pickup time.",
    ne: "असली फूल, तपाईंको पिकअप समयका लागि ताजा तयार गरिएको।",
  },

  // ---- bouquet tabs (Bouquets section)
  "tab.natural": { en: "Natural flowers", ne: "प्राकृतिक फूल" },
  "tab.artificial": { en: "Artificial flowers", ne: "कृत्रिम फूल" },
  "tab.more": { en: "More bouquets", ne: "अरू गुलदस्ता" },
  "tab.label": { en: "Bouquet type", ne: "गुलदस्ताको प्रकार" },

  // ---- occasions
  "occ.title": { en: "Occasion", ne: "अवसर" },
  "occ.all": { en: "Any occasion", ne: "जुनसुकै अवसर" },
  "occ.welcome": { en: "Welcome home", ne: "स्वागत (आगमन)" },
  "occ.farewell": { en: "Farewell", ne: "बिदाइ" },
  "occ.birthday": { en: "Birthday & anniversary", ne: "जन्मदिन र वार्षिकोत्सव" },
  "occ.love": { en: "Love & Valentine's", ne: "माया र प्रेम" },
  "occ.blessing": { en: "Blessings & khata", ne: "आशीर्वाद र खादा" },
  "occ.national": { en: "National pride", ne: "राष्ट्रिय गौरव" },
  "occ.goodFor": { en: "Good for:", ne: "यसका लागि राम्रो:" },

  // ---- homepage
  "home.occ.title": { en: "Shop by occasion", ne: "अवसर अनुसार छान्नुहोस्" },
  "home.occ.sub": {
    en: "Start with why you're giving flowers — we'll show what fits.",
    ne: "फूल किन दिनुहुन्छ भनेर सुरु गर्नुहोस् — मिल्ने सामान हामी देखाउँछौं।",
  },
  "home.row.best": { en: "Best sellers", ne: "धेरै बिक्ने" },
  "home.row.fresh": { en: "Fresh bouquets", ne: "ताजा गुलदस्ता" },
  "home.row.long": { en: "Long-lasting (artificial)", ne: "लामो समय टिक्ने (कृत्रिम)" },
  "home.row.more": { en: "More bouquets", ne: "अरू गुलदस्ता" },
  "home.row.khata": { en: "Khata, flags & more", ne: "खादा, झन्डा र अरू" },
  "home.help.title": { en: "Not sure what to choose?", ne: "के छान्ने अलमल छ?" },
  "home.help.body": {
    en: "Tell us the occasion, your pickup time and your budget. We'll suggest something that fits.",
    ne: "अवसर, पिकअप समय र बजेट बताउनुहोस्। हामी मिल्ने सुझाव दिन्छौं।",
  },
  "home.help.cta": { en: "Ask for a suggestion", ne: "सुझाव माग्नुहोस्" },
  "home.promise.title": { en: "Our promise", ne: "हाम्रो वचन" },
  "home.promise.body": {
    en: "If your order doesn't look like the photo, message us on WhatsApp straight away and we'll make it right.",
    ne: "तपाईंको अर्डर फोटोजस्तो देखिएन भने तुरुन्तै WhatsApp मा सन्देश पठाउनुहोस्, हामी मिलाइदिन्छौं।",
  },
  "home.about.title": { en: "Who we are", ne: "हामी को हौं" },
  "home.about.body": {
    en: "TIA Flower Shop is an online-only florist for Tribhuvan International Airport. Every order is prepared for the pickup time you choose and handed to you at an agreed spot near the terminal — free, with no delivery fee.",
    ne: "TIA Flower Shop त्रिभुवन अन्तर्राष्ट्रिय विमानस्थलका लागि अनलाइन मात्र चल्ने फूल पसल हो। हरेक अर्डर तपाईंले रोजेको पिकअप समयका लागि तयार गरिन्छ र टर्मिनल नजिकको तय गरिएको ठाउँमा निःशुल्क हस्तान्तरण गरिन्छ।",
  },
  "home.reviews.title": { en: "What customers say", ne: "ग्राहकहरू के भन्छन्" },

  // ---- products page
  "cat.fromPrice": { en: "From Rs. {price}", ne: "रु. {price} देखि" },
  "cat.help": { en: "Not sure? Ask us on WhatsApp", ne: "पक्का छैन? WhatsApp मा सोध्नुहोस्" },

  // ---- cart upsell
  "cart.khata.title": { en: "Add a khata?", ne: "खादा थप्ने?" },
  "cart.khata.body": {
    en: "A khata is a traditional blessing scarf — a popular add-on for welcomes and farewells.",
    ne: "खादा आशीर्वादका लागि दिइने परम्परागत दुपट्टा हो — स्वागत र बिदाइमा धेरैले थप्ने सामान।",
  },
  "cart.khata.add": { en: "Add", ne: "थप्नुहोस्" },
};

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = extraDictionary[key];
  if (!entry) return baseTranslate(lang, key, vars);
  let text = entry[lang] || entry.en;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
