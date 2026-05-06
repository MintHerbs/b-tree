// Builds prompt engineering strings for logic tool LLM calls

/**
 * Builds a prompt for translating English to formal logic
 * @param {string} englishSentence - The English sentence to translate
 * @returns {string} - The complete prompt string
 */
export function buildTranslatePrompt(englishSentence) {
  return `You are an expert in formal logic. Translate the following English sentence into formal propositional or predicate logic notation.

CRITICAL INSTRUCTIONS:
- Return ONLY a raw JSON object
- Do NOT include any explanation, markdown, or code fences
- Do NOT wrap the JSON in \`\`\`json or \`\`\` blocks
- Return the JSON object directly with no additional text

The JSON must follow this exact schema:

{
  "english": "string (the original English sentence)",
  "formal": "string (the formal logic translation using symbols: ¬ ∧ ∨ → ↔)",
  "breakdown": [
    {
      "symbol": "string (a propositional variable or connective)",
      "meaning": "string (what this symbol represents)"
    }
  ]
}

SCHEMA FIELD EXPLANATIONS:

- english: The original English sentence (copy it exactly)
- formal: The formal logic translation using these symbols:
  * ¬ for negation (NOT)
  * ∧ for conjunction (AND)
  * ∨ for disjunction (OR)
  * → for implication (IF...THEN)
  * ↔ for biconditional (IF AND ONLY IF)
  * Use uppercase letters (P, Q, R, S, etc.) for propositional variables
  * Use parentheses for grouping when needed
- breakdown: An array explaining each symbol used:
  * For propositional variables (P, Q, R, etc.), explain what they represent
  * For logical connectives (¬, ∧, ∨, →, ↔), explain their meaning
  * Include all symbols that appear in the formal translation

EXAMPLE:

Input: "If it rains then the ground is wet"
Output:
{
  "english": "If it rains then the ground is wet",
  "formal": "R → W",
  "breakdown": [
    { "symbol": "R", "meaning": "It rains" },
    { "symbol": "W", "meaning": "The ground is wet" },
    { "symbol": "→", "meaning": "If...then (material implication)" }
  ]
}

ENGLISH SENTENCE TO TRANSLATE:
${englishSentence}

Remember: Return ONLY the raw JSON object with no markdown formatting, code fences, or explanatory text.`
}

/**
 * Builds a prompt for generating a natural deduction proof
 * @param {string} premises - Comma-separated premises
 * @param {string} conclusion - The conclusion to prove
 * @returns {string} - The complete prompt string
 */
export function buildProofPrompt(premises, conclusion) {
  return `You are an expert in formal logic and natural deduction. Given the premises and conclusion below, construct a formal proof using natural deduction inference rules.

CRITICAL INSTRUCTIONS:
- Return ONLY a raw JSON object
- Do NOT include any explanation, markdown, or code fences
- Do NOT wrap the JSON in \`\`\`json or \`\`\` blocks
- Return the JSON object directly with no additional text

The JSON must follow this exact schema:

{
  "premises": ["string (premise 1)", "string (premise 2)", ...],
  "conclusion": "string (the conclusion to prove)",
  "steps": [
    {
      "id": "string (unique identifier, e.g., 'step1', 'step2')",
      "formula": "string (the formula derived at this step)",
      "justification": "string (the inference rule used, e.g., 'M.P.', 'Simp', 'Add')",
      "from": ["string (step id or premise)", ...]
    }
  ]
}

SCHEMA FIELD EXPLANATIONS:

- premises: Array of premise formulas (copy them exactly as provided)
- conclusion: The conclusion formula (copy it exactly as provided)
- steps: Array of proof steps in order, where each step:
  * id: Unique identifier for this step (step1, step2, step3, etc.)
  * formula: The formula derived at this step
  * justification: The inference rule abbreviation used:
    - M.P. (Modus Ponens)
    - M.T. (Modus Tollens)
    - H.S. (Hypothetical Syllogism)
    - D.S. (Disjunctive Syllogism)
    - Simp (Simplification)
    - Conj (Conjunction)
    - Add (Addition)
    - D.M. (De Morgan's Laws)
    - Dist (Distribution)
    - Assoc (Association)
    - Comm (Commutativity)
    - Impl (Material Implication)
    - Equiv (Material Equivalence)
    - Exp (Exportation)
    - Taut (Tautology)
    - Abs (Absorption)
    - DN (Double Negation)
  * from: Array of step IDs or premise references that this step depends on
    - Use the premise formula itself to reference a premise
    - Use step IDs (step1, step2, etc.) to reference previous steps

EXAMPLE:

Input:
Premises: "¬S∧C, ¬S→¬W, ¬W→A, A→E"
Conclusion: "E"

Output:
{
  "premises": ["¬S∧C", "¬S→¬W", "¬W→A", "A→E"],
  "conclusion": "E",
  "steps": [
    {
      "id": "step1",
      "formula": "¬S",
      "justification": "Simp",
      "from": ["¬S∧C"]
    },
    {
      "id": "step2",
      "formula": "¬W",
      "justification": "M.P.",
      "from": ["step1", "¬S→¬W"]
    },
    {
      "id": "step3",
      "formula": "A",
      "justification": "M.P.",
      "from": ["step2", "¬W→A"]
    },
    {
      "id": "step4",
      "formula": "E",
      "justification": "M.P.",
      "from": ["step3", "A→E"]
    }
  ]
}

PROOF PROBLEM:
Premises: ${premises}
Conclusion: ${conclusion}

Remember: Return ONLY the raw JSON object with no markdown formatting, code fences, or explanatory text.`
}
