// TranslationService.js
// On-the-fly translation for dynamic content (e.g., drug interaction descriptions)
// Uses MyMemory Translation API (free tier: 5000 words/day)

const TRANSLATION_CACHE = {};

const LANGUAGE_CODES = {
    en: 'en',
    te: 'te',
    hi: 'hi',
};

/**
 * Translate a text string from English to the target language.
 * Uses a cache to avoid redundant API calls.
 * @param {string} text - The English text to translate.
 * @param {string} targetLang - The target language code ('te', 'hi', 'en').
 * @returns {Promise<string>} - The translated text, or original text on failure.
 */
export const translateText = async (text, targetLang) => {
    // No translation needed for English
    if (!text || targetLang === 'en') {
        return text;
    }

    const langCode = LANGUAGE_CODES[targetLang] || targetLang;
    const cacheKey = `${langCode}:${text}`;

    // Check cache first
    if (TRANSLATION_CACHE[cacheKey]) {
        return TRANSLATION_CACHE[cacheKey];
    }

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`;

        // Robust timeout mechanism using Promise.race
        const fetchPromise = fetch(url);

        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Translation request timed out')), 5000);
        });

        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        const data = await response.json();

        if (data && data.responseData && data.responseData.translatedText) {
            const translated = data.responseData.translatedText;

            // MyMemory sometimes returns the original text in uppercase when it can't translate
            if (translated.toUpperCase() === text.toUpperCase()) {
                // Translation failed silently, return original
                TRANSLATION_CACHE[cacheKey] = text;
                return text;
            }

            TRANSLATION_CACHE[cacheKey] = translated;
            return translated;
        }

        return text;
    } catch (error) {
        console.warn('⚠️ Translation failed, using original text:', error.message);
        return text;
    }
};

/**
 * Translate multiple strings at once (batch).
 * @param {string[]} texts - Array of English strings to translate.
 * @param {string} targetLang - Target language code.
 * @returns {Promise<string[]>} - Array of translated strings.
 */
export const translateBatch = async (texts, targetLang) => {
    if (!texts || texts.length === 0 || targetLang === 'en') {
        return texts;
    }

    const results = await Promise.all(
        texts.map(text => translateText(text, targetLang))
    );
    return results;
};
