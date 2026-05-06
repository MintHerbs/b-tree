// Validates and parses logic tool JSON responses from LLM

/**
 * Parses and validates translation JSON
 * @param {string} jsonString - The JSON string to parse
 * @returns {Object} - { valid: true, data: {...} } or { valid: false, error: '...' }
 */
export function parseTranslation(jsonString) {
  try {
    // Step 1: Parse JSON
    let data
    try {
      data = JSON.parse(jsonString)
    } catch (err) {
      return { valid: false, error: 'Invalid JSON syntax' }
    }

    // Step 2: Validate top-level structure
    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'JSON must be an object' }
    }

    // Step 3: Validate required fields
    if (!data.english || typeof data.english !== 'string') {
      return { valid: false, error: 'Missing or invalid "english" field' }
    }

    if (!data.formal || typeof data.formal !== 'string') {
      return { valid: false, error: 'Missing or invalid "formal" field' }
    }

    if (!data.breakdown || !Array.isArray(data.breakdown)) {
      return { valid: false, error: 'Missing or invalid "breakdown" array' }
    }

    // Step 4: Validate breakdown entries
    for (let i = 0; i < data.breakdown.length; i++) {
      const entry = data.breakdown[i]

      if (!entry.symbol || typeof entry.symbol !== 'string') {
        return { valid: false, error: `Breakdown entry at index ${i} missing "symbol"` }
      }

      if (!entry.meaning || typeof entry.meaning !== 'string') {
        return { valid: false, error: `Breakdown entry at index ${i} missing "meaning"` }
      }
    }

    // All validation passed
    return { valid: true, data }

  } catch (err) {
    return { valid: false, error: `Unexpected error: ${err.message}` }
  }
}

/**
 * Parses and validates proof JSON
 * @param {string} jsonString - The JSON string to parse
 * @returns {Object} - { valid: true, data: {...} } or { valid: false, error: '...' }
 */
export function parseProof(jsonString) {
  try {
    // Step 1: Parse JSON
    let data
    try {
      data = JSON.parse(jsonString)
    } catch (err) {
      return { valid: false, error: 'Invalid JSON syntax' }
    }

    // Step 2: Validate top-level structure
    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'JSON must be an object' }
    }

    // Step 3: Validate premises array
    if (!data.premises || !Array.isArray(data.premises)) {
      return { valid: false, error: 'Missing or invalid "premises" array' }
    }

    if (data.premises.length === 0) {
      return { valid: false, error: 'At least one premise is required' }
    }

    for (let i = 0; i < data.premises.length; i++) {
      if (typeof data.premises[i] !== 'string') {
        return { valid: false, error: `Premise at index ${i} must be a string` }
      }
    }

    // Step 4: Validate conclusion
    if (!data.conclusion || typeof data.conclusion !== 'string') {
      return { valid: false, error: 'Missing or invalid "conclusion" field' }
    }

    // Step 5: Validate steps array
    if (!data.steps || !Array.isArray(data.steps)) {
      return { valid: false, error: 'Missing or invalid "steps" array' }
    }

    if (data.steps.length === 0) {
      return { valid: false, error: 'At least one proof step is required' }
    }

    // Build step ID set for reference validation
    const stepIds = new Set()

    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i]

      if (!step.id || typeof step.id !== 'string') {
        return { valid: false, error: `Step at index ${i} missing "id"` }
      }

      if (!step.formula || typeof step.formula !== 'string') {
        return { valid: false, error: `Step "${step.id}" missing "formula"` }
      }

      if (!step.justification || typeof step.justification !== 'string') {
        return { valid: false, error: `Step "${step.id}" missing "justification"` }
      }

      if (!step.from || !Array.isArray(step.from)) {
        return { valid: false, error: `Step "${step.id}" missing "from" array` }
      }

      // Validate that "from" references are either premises or previous step IDs
      for (let j = 0; j < step.from.length; j++) {
        const ref = step.from[j]
        if (typeof ref !== 'string') {
          return { valid: false, error: `Step "${step.id}" has invalid reference at index ${j}` }
        }

        // Check if it's a step ID reference
        if (ref.startsWith('step')) {
          // Verify it references a previous step
          if (!stepIds.has(ref)) {
            return { valid: false, error: `Step "${step.id}" references non-existent step "${ref}"` }
          }
        }
        // Otherwise assume it's a premise reference (we don't validate the exact match)
      }

      stepIds.add(step.id)
    }

    // All validation passed
    return { valid: true, data }

  } catch (err) {
    return { valid: false, error: `Unexpected error: ${err.message}` }
  }
}
