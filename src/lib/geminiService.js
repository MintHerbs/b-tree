// Pure async function module for calling Gemini API
// No React imports - this is a service layer module

import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseERD } from './erdParser.js';

/**
 * Generic Gemini API caller with custom parser
 * @param {string} prompt - The full prompt string
 * @param {Function} parser - Parser function that takes jsonString and returns {valid, data, error}
 * @returns {Promise<{success: true, data: Object} | {success: false, error: string}>}
 */
export async function callGeminiWithParser(prompt, parser) {
  try {
    // Initialize Gemini API
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured'
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Log 1: Before API call
    console.log('[Gemini] Calling with prompt length:', prompt.length);

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Log 2: Raw response
    console.log('[Gemini] Raw response:', text);

    if (!text) {
      return {
        success: false,
        error: 'Empty response from Gemini API'
      };
    }

    // Strip markdown code fences if present
    // Remove ```json at the start
    text = text.replace(/^```json\s*/i, '');
    // Remove ``` at the end
    text = text.replace(/\s*```\s*$/, '');
    // Remove any remaining ``` blocks
    text = text.replace(/```/g, '');
    // Trim whitespace
    text = text.trim();

    // Log 3: After stripping fences
    console.log('[Gemini] After stripping fences:', text);

    // Parse and validate using provided parser
    const parseResult = parser(text);

    // Log 4: Parse result
    console.log('[Gemini] Parse result:', parseResult);

    if (!parseResult.valid) {
      return {
        success: false,
        error: `Invalid format: ${parseResult.error}`
      };
    }

    // Success!
    return {
      success: true,
      data: parseResult.data
    };

  } catch (error) {
    // Catch any errors (network, API, parsing, etc.)
    console.error('[Gemini] Exception caught:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate response'
    };
  }
}

/**
 * Calls Gemini API to generate ERD JSON from a prompt
 * @param {string} prompt - The full prompt string from erdPromptBuilder
 * @returns {Promise<{success: true, data: Object} | {success: false, error: string}>}
 */
export async function callGemini(prompt) {
  return callGeminiWithParser(prompt, parseERD);
}
