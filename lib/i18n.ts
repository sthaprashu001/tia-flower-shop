import { leadTimeLabel } from "./time";

/**
 * English / Nepali text for the customer-facing pages.
 *
 * To translate more: add a key here with both languages, then use
 * <T k="your.key" /> in a page (or t("your.key") inside a client component).
 * Missing Nepali falls back to English, so a gap never shows a blank.
 * Numbers such as prices stay in Latin digits on purpose (matches the
 * catalog and the order numbers).
 */
export type Lang = "en" | "ne";

type Entry = { en: string; ne: string };

export const dictionary: Record<string, Entry> = {
  // ---- navigation
  "nav.order": { en: "Order", ne: "अर्डर" },
  "nav.track": { en: "Track Order", ne: "अर्डर ट्र्याक" },
  "nav.faq": { en: "FAQ", ne: "सोधिने प्रश्न" },
  "nav.contact": { en: "Contact", ne: "सम्पर्क" },
  "nav.orderNow": { en: "Order now", ne: "अहिले अर्डर गर्नुहोस्" },
  "nav.products": { en: "Products", ne: "उत्पादनहरू" },
  "nav.bouquets": { en: "Bouquets", ne: "गुलदस्ता" },
  "sticky.viewCart": { en: "View cart", ne: "कार्ट हेर्नुहोस्" },
  "sticky.items": { en: "{n} in cart", ne: "कार्टमा {n}" },

  // ---- catalog
  "cat.allProducts": { en: "All Products", ne: "सबै उत्पादनहरू" },
  "cat.all": { en: "All", ne: "सबै" },
  "cat.intro": {
    en: "What's available today, prepared fresh near TIA. Prices are in Nepali Rupees. Tap a product to customize it or add it to your order.",
    ne: "आज उपलब्ध के छ — TIA नजिकै ताजा तयार गरिएको। मूल्य नेपाली रुपैयाँमा छ। उत्पादन छानेर आफ्नो रुचिअनुसार बनाउनुहोस् वा अर्डरमा थप्नुहोस्।",
  },
  "cat.search": { en: "Search products…", ne: "उत्पादन खोज्नुहोस्…" },
  "cat.price": { en: "Price", ne: "मूल्य" },
  "cat.priceAny": { en: "Any price", ne: "जुनसुकै मूल्य" },
  "cat.priceU500": { en: "Under Rs. 500", ne: "रु. 500 भन्दा कम" },
  "cat.price500": { en: "Rs. 500 – 1,000", ne: "रु. 500 – 1,000" },
  "cat.priceO1000": { en: "Over Rs. 1,000", ne: "रु. 1,000 भन्दा बढी" },
  "cat.sort": { en: "Sort", ne: "क्रमबद्ध" },
  "cat.sortDefault": { en: "Recommended", ne: "सिफारिस गरिएको" },
  "cat.sortLow": { en: "Price: low to high", ne: "मूल्य: कम देखि बढी" },
  "cat.sortHigh": { en: "Price: high to low", ne: "मूल्य: बढी देखि कम" },
  "cat.popular": { en: "Popular right now", ne: "अहिले लोकप्रिय" },
  "cat.noResults": { en: "No products match your search.", ne: "तपाईंको खोजीसँग मिल्ने उत्पादन भेटिएन।" },
  "cat.unavailable": { en: "Currently unavailable", ne: "अहिले उपलब्ध छैन" },
  "card.soldOut": { en: "Sold out today", ne: "आज सकियो" },
  "card.customizable": { en: "Customizable", ne: "आफ्नै रुचिअनुसार" },
  "card.leadTime": { en: "Order {time} ahead", ne: "{time} अघि अर्डर" },
  "btn.add": { en: "Add to cart", ne: "कार्टमा थप्नुहोस्" },
  "btn.added": { en: "Added ✓", ne: "थपियो ✓" },
  "btn.soldOut": { en: "Sold out", ne: "सकियो" },
  "btn.unavailable": { en: "Currently unavailable", ne: "अहिले उपलब्ध छैन" },

  // ---- product page
  "detail.back": { en: "← Back to bouquets", ne: "← गुलदस्ता तर्फ फर्कनुहोस्" },
  "detail.notAvailable": {
    en: "Not available today — check back or ask us on WhatsApp",
    ne: "आज उपलब्ध छैन — पछि हेर्नुहोस् वा WhatsApp मा सोध्नुहोस्",
  },
  "detail.customizable": {
    en: "This bouquet can be customized — flower choice, wrapping color, ribbon, or a personal note. You can describe what you want in the order form.",
    ne: "यो गुलदस्ता आफ्नो रुचिअनुसार बनाउन सकिन्छ — फूलको छनोट, र्‍यापिङको रङ, रिबन, वा व्यक्तिगत सन्देश। अर्डर फारममा आफूले चाहेको लेख्नुहोस्।",
  },
  "detail.addedTo": { en: "Added to cart —", ne: "कार्टमा थपेपछि —" },
  "detail.viewCart": { en: "view cart", ne: "कार्ट हेर्नुहोस्" },
  "detail.whenReady": { en: "when ready to order.", ne: "अर्डर गर्न तयार भएपछि।" },
  "detail.leadNotice": {
    en: "Order at least {time} before pickup.",
    ne: "पिकअपभन्दा कम्तीमा {time} अघि अर्डर गर्नुहोस्।",
  },

  // ---- cart
  "cart.title": { en: "Your cart", ne: "तपाईंको कार्ट" },
  "cart.loading": { en: "Loading…", ne: "लोड हुँदैछ…" },
  "cart.empty": { en: "Your cart is empty.", ne: "तपाईंको कार्ट खाली छ।" },
  "cart.browse": { en: "Browse bouquets", ne: "गुलदस्ता हेर्नुहोस्" },
  "cart.continue": { en: "Continue to order details", ne: "अर्डर विवरणमा जानुहोस्" },

  // ---- order form
  "order.title": { en: "Place an order", ne: "अर्डर गर्नुहोस्" },
  "order.intro": {
    en: "Fill in the details below. We'll confirm your order on WhatsApp shortly after you submit it.",
    ne: "तलको विवरण भर्नुहोस्। तपाईंले पेश गरेको केही समयपछि हामी WhatsApp मा अर्डर पक्का गर्नेछौं।",
  },
  "order.statusClosed": {
    en: "The shop is marked closed right now, so we may take longer to confirm your order.",
    ne: "पसल अहिले बन्द छ, त्यसैले तपाईंको अर्डर पक्का गर्न ढिलो हुन सक्छ।",
  },
  "order.statusBusy": {
    en: "We're very busy right now — please allow extra time.",
    ne: "हामी अहिले धेरै व्यस्त छौं — कृपया थप समय दिनुहोस्।",
  },
  "order.loadingCart": { en: "Loading your cart…", ne: "तपाईंको कार्ट लोड हुँदैछ…" },
  "order.loadError": {
    en: "Could not load bouquets. Please refresh the page.",
    ne: "गुलदस्ता लोड गर्न सकिएन। कृपया पेज रिफ्रेश गर्नुहोस्।",
  },
  "order.yourBouquets": { en: "Your bouquets", ne: "तपाईंका गुलदस्ता" },
  "order.quantityFor": { en: "Quantity for", ne: "परिमाण:" },
  "order.remove": { en: "Remove", ne: "हटाउनुहोस्" },
  "order.itemUnavailable": {
    en: "This item is not available today — please remove it to continue.",
    ne: "यो सामान आज उपलब्ध छैन — अगाडि बढ्न कृपया हटाउनुहोस्।",
  },
  "order.addMore": { en: "+ Add more bouquets", ne: "+ अरू गुलदस्ता थप्नुहोस्" },
  "order.yourDetails": { en: "Your details", ne: "तपाईंको विवरण" },
  "order.savedDetails": {
    en: "We filled in your details from last time.",
    ne: "पछिल्लो पटकको तपाईंको विवरण भरिएको छ।",
  },
  "order.clearSaved": { en: "Not you? Clear", ne: "तपाईं होइन? हटाउनुहोस्" },
  "order.fullName": { en: "Full name", ne: "पूरा नाम" },
  "order.phone": { en: "Phone / WhatsApp number", ne: "फोन / WhatsApp नम्बर" },
  "order.whenWhere": { en: "When & where", ne: "कहिले र कहाँ" },
  "order.leadCartNotice": {
    en: "“{product}” must be ordered at least {time} before pickup. Earliest pickup for this cart: {earliest}.",
    ne: "“{product}” पिकअपभन्दा कम्तीमा {time} अघि अर्डर गर्नुपर्छ। यो कार्टको सबैभन्दा चाँडो पिकअप: {earliest}।",
  },
  "order.date": { en: "Pickup date", ne: "पिकअप मिति" },
  "order.time": { en: "Pickup time", ne: "पिकअप समय" },
  "order.pickDateFirst": {
    en: "Choose a date to see available times.",
    ne: "उपलब्ध समय हेर्न मिति छान्नुहोस्।",
  },
  "order.slotFull": { en: "Full", ne: "भरिएको" },
  "order.slotTooSoon": { en: "Too soon", ne: "धेरै चाँडो" },
  "order.loadingTimes": { en: "Checking availability…", ne: "उपलब्धता जाँच हुँदैछ…" },
  "order.noSlots": {
    en: "No pickup times are free on this date. Please choose another date.",
    ne: "यो मितिमा कुनै पिकअप समय खाली छैन। कृपया अर्को मिति छान्नुहोस्।",
  },
  "order.timeHint": {
    en: "Greyed-out times are full or too soon. We need at least 30 minutes to prepare your order.",
    ne: "खैरो देखिएका समय भरिएका वा धेरै चाँडो हुन्। तपाईंको अर्डर तयार गर्न हामीलाई कम्तीमा 30 मिनेट चाहिन्छ।",
  },
  "order.meetingPoint": { en: "Meeting point near TIA", ne: "TIA नजिकको भेटघाट स्थान" },
  "order.meetingPlaceholder": {
    en: "e.g. golden gate, bus stop, new terminal building",
    ne: "जस्तै: गोल्डेन गेट, बस स्टप, नयाँ टर्मिनल भवन",
  },
  "order.meetingHint": {
    en: "We'll confirm the exact spot with you on WhatsApp.",
    ne: "सही ठाउँ हामी WhatsApp मा तपाईंसँग पक्का गर्नेछौं।",
  },
  "order.customize": {
    en: "Special requests (optional)",
    ne: "विशेष अनुरोध (ऐच्छिक)",
  },
  "order.hide": { en: "Hide", ne: "लुकाउनुहोस्" },
  "order.show": { en: "Add", ne: "थप्नुहोस्" },
  "order.specialRequests": { en: "Special requests", ne: "विशेष अनुरोध" },
  "order.total": { en: "Total", ne: "जम्मा" },
  "order.paymentNote": {
    en: "Payment is arranged with you on WhatsApp after we confirm — cash or online payment, no gateway needed right now.",
    ne: "हामीले पक्का गरेपछि WhatsApp मा भुक्तानी मिलाइन्छ — नगद वा अनलाइन भुक्तानी, अहिले कुनै पेमेन्ट गेटवे चाहिँदैन।",
  },
  "order.remember": {
    en: "Remember my name, phone and meeting point on this device for next time",
    ne: "अर्को पटकका लागि मेरो नाम, फोन र भेटघाट स्थान यो उपकरणमा सम्झनुहोस्",
  },
  "order.useTime": { en: "Use {time}", ne: "{time} प्रयोग गर्नुहोस्" },
  "order.submitting": { en: "Submitting...", ne: "पेश गर्दैछ..." },
  "order.submit": { en: "Submit order", ne: "अर्डर पेश गर्नुहोस्" },
  "order.emptyCartError": {
    en: "Your cart is empty — add a bouquet first.",
    ne: "तपाईंको कार्ट खाली छ — पहिले गुलदस्ता थप्नुहोस्।",
  },
  "order.unavailableError": {
    en: "Please remove the unavailable items from your cart first.",
    ne: "कृपया पहिले कार्टबाट उपलब्ध नभएका सामान हटाउनुहोस्।",
  },
  "order.pickTimeError": { en: "Please choose a pickup time.", ne: "कृपया पिकअप समय छान्नुहोस्।" },
  "order.genericError": {
    en: "Something went wrong. Please try again.",
    ne: "केही गडबड भयो। कृपया फेरि प्रयास गर्नुहोस्।",
  },
  "order.networkError": {
    en: "Could not reach the server. Please check your connection and try again.",
    ne: "सर्भरसँग जोडिन सकिएन। कृपया इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्।",
  },
  "order.orderAgain": { en: "Order the same as last time", ne: "पछिल्लो पटकको जस्तै अर्डर गर्नुहोस्" },

  // ---- confirmation
  "conf.noOrder": { en: "No recent order found", ne: "हालैको कुनै अर्डर भेटिएन" },
  "conf.noOrderHint": {
    en: "If you just placed an order, try going back. Otherwise, start a new one below.",
    ne: "यदि तपाईंले अहिले अर्डर गर्नुभएको हो भने पछाडि जानुहोस्। होइन भने तल नयाँ सुरु गर्नुहोस्।",
  },
  "conf.placeOrder": { en: "Place an order", ne: "अर्डर गर्नुहोस्" },
  "conf.received": { en: "Order received", ne: "अर्डर प्राप्त भयो" },
  "conf.copy": { en: "Copy number", ne: "नम्बर कपी गर्नुहोस्" },
  "conf.copied": { en: "Copied ✓", ne: "कपी भयो ✓" },
  "conf.keepNumber": {
    en: "Save this order number — you'll need it, with your phone number, to track your order.",
    ne: "यो अर्डर नम्बर सुरक्षित राख्नुहोस् — अर्डर ट्र्याक गर्न फोन नम्बरसँग यो चाहिन्छ।",
  },
  "conf.pickup": { en: "Pickup", ne: "पिकअप" },
  "conf.meetingPoint": { en: "Meeting point", ne: "भेटघाट स्थान" },
  "conf.status": { en: "Status", ne: "स्थिति" },
  "conf.willReach": { en: "We'll reach out to you on WhatsApp at", ne: "हामी WhatsApp मार्फत" },
  "conf.toConfirm": {
    en: "to confirm the details and meeting point.",
    ne: "नम्बरमा सम्पर्क गरेर विवरण र भेटघाट स्थान पक्का गर्नेछौं।",
  },
  "conf.track": { en: "Track this order", ne: "यो अर्डर ट्र्याक गर्नुहोस्" },
  "conf.whatsapp": { en: "Message us about this order", ne: "यो अर्डरबारे सन्देश पठाउनुहोस्" },
  "conf.orderMore": { en: "← Order something else", ne: "← अरू केही अर्डर गर्नुहोस्" },

  // ---- FAQ
  "faq.title": { en: "Frequently asked questions", ne: "प्रायः सोधिने प्रश्नहरू" },
  "faq.intro": {
    en: "Quick answers about ordering, pickup and payment. Still stuck? Message us on WhatsApp.",
    ne: "अर्डर, पिकअप र भुक्तानीबारे छिटो जवाफ। अझै अलमल छ भने WhatsApp मा सन्देश पठाउनुहोस्।",
  },
  "faq.q1": { en: "Where do I collect my order?", ne: "मैले अर्डर कहाँबाट लिने?" },
  "faq.a1": {
    en: "Bouquets are prepared about 2 minutes' walk from Tribhuvan International Airport. We meet you near the terminal — never inside restricted airport areas. We confirm the exact spot with you on WhatsApp for every order.",
    ne: "गुलदस्ता त्रिभुवन अन्तर्राष्ट्रिय विमानस्थलबाट करिब 2 मिनेटको पैदल दूरीमा तयार गरिन्छ। हामी टर्मिनल नजिकै भेट्छौं — विमानस्थलको प्रतिबन्धित क्षेत्रभित्र कहिल्यै होइन। हरेक अर्डरको सही ठाउँ WhatsApp मा पक्का गरिन्छ।",
  },
  "faq.q2": { en: "How do I place an order?", ne: "अर्डर कसरी गर्ने?" },
  "faq.a2": {
    en: "Add products to your cart, choose a pickup date and time, enter your name, phone and meeting point, and submit. You'll get an order number straight away, and we confirm on WhatsApp.",
    ne: "उत्पादन कार्टमा थप्नुहोस्, पिकअप मिति र समय छान्नुहोस्, आफ्नो नाम, फोन र भेटघाट स्थान भरेर पेश गर्नुहोस्। तुरुन्तै अर्डर नम्बर पाउनुहुन्छ, र हामी WhatsApp मा पक्का गर्छौं।",
  },
  "faq.q3": { en: "How far ahead do I need to order?", ne: "कति अघि अर्डर गर्नुपर्छ?" },
  "faq.a3": {
    en: "Most items need at least 30 minutes to prepare. Some products need more notice — for example 12 hours or 1 day ahead. That is shown on the product and in your cart, and the time buttons only let you pick times that work.",
    ne: "धेरैजसो सामान तयार गर्न कम्तीमा 30 मिनेट चाहिन्छ। केही उत्पादनलाई बढी समय चाहिन्छ — जस्तै 12 घण्टा वा 1 दिन अघि। त्यो उत्पादन र कार्टमा देखिन्छ, र समयका बटनले मिल्ने समय मात्र छान्न दिन्छन्।",
  },
  "faq.q4": { en: "Why is a time slot greyed out or marked Full?", ne: "समय किन खैरो वा “भरिएको” देखिन्छ?" },
  "faq.a4": {
    en: "We take a limited number of orders each hour so everything is prepared fresh. Full times can't be chosen — pick a nearby time instead.",
    ne: "सबै कुरा ताजा तयार गर्न हामी प्रत्येक घण्टा सीमित अर्डर मात्र लिन्छौं। भरिएको समय छान्न मिल्दैन — नजिकको अर्को समय छान्नुहोस्।",
  },
  "faq.q5": { en: "Can I customize a bouquet?", ne: "गुलदस्ता आफ्नो रुचिअनुसार बनाउन मिल्छ?" },
  "faq.a5": {
    en: "Yes — products marked “Customizable” can be personalised: flower choice, wrapping colour, ribbon, or a card message. Describe what you want under “special requests” in the order form.",
    ne: "मिल्छ — “आफ्नै रुचिअनुसार” लेखिएका उत्पादन फूलको छनोट, र्‍यापिङको रङ, रिबन वा कार्डको सन्देशसहित बनाउन सकिन्छ। अर्डर फारमको “विशेष अनुरोध” मा आफूले चाहेको लेख्नुहोस्।",
  },
  "faq.q6": { en: "How do I pay?", ne: "भुक्तानी कसरी गर्ने?" },
  "faq.a6": {
    en: "Payment is arranged with you on WhatsApp after we confirm your order — cash or online payment.",
    ne: "तपाईंको अर्डर पक्का भएपछि WhatsApp मा भुक्तानी मिलाइन्छ — नगद वा अनलाइन भुक्तानी।",
  },
  "faq.q7": { en: "How can I check my order?", ne: "मेरो अर्डरको अवस्था कसरी हेर्ने?" },
  "faq.a7": {
    en: "Open “Track Order” and enter your order number and the phone number you ordered with.",
    ne: "“अर्डर ट्र्याक” खोल्नुहोस् र आफ्नो अर्डर नम्बर र अर्डर गर्दा प्रयोग गरेको फोन नम्बर हाल्नुहोस्।",
  },
  "faq.q8": { en: "Can I change or cancel an order?", ne: "अर्डर बदल्न वा रद्द गर्न मिल्छ?" },
  "faq.a8": {
    en: "Message us on WhatsApp as soon as possible with your order number and we'll do our best to help.",
    ne: "तपाईंको अर्डर नम्बरसहित सकेसम्म चाँडो WhatsApp मा सन्देश पठाउनुहोस्, हामी सकेको मद्दत गर्नेछौं।",
  },
  "faq.q9": { en: "A product says it is sold out — what now?", ne: "उत्पादन “सकियो” भनेको छ — अब के गर्ने?" },
  "faq.a9": {
    en: "Sold-out products can't be ordered today. Check back later, or ask us on WhatsApp and we'll suggest an alternative.",
    ne: "सकिएका उत्पादन आज अर्डर गर्न मिल्दैन। पछि फेरि हेर्नुहोस्, वा WhatsApp मा सोध्नुहोस् — हामी विकल्प सुझाउँछौं।",
  },
};

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = dictionary[key];
  let text = entry ? entry[lang] || entry.en : key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

/** "12 hours" / "1 day" — or "12 घण्टा" / "1 दिन" — for a product's minimum notice. */
export function leadTimeText(lang: Lang, hours: number): string {
  if (lang === "ne") {
    if (hours <= 0) return "";
    return hours % 24 === 0 ? `${hours / 24} दिन` : `${hours} घण्टा`;
  }
  return leadTimeLabel(hours);
}
