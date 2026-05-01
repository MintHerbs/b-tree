// Builds the prompt engineering string for LLM to generate ERD JSON

/**
 * Builds a prompt for an LLM to generate an ER Diagram in JSON format
 * @param {string} userQuestion - The user's description of their ER scenario
 * @returns {string} - The complete prompt string
 */
export function buildERDPrompt(userQuestion) {
  return `You are an expert database designer. Based on the scenario described below, generate an Entity-Relationship Diagram in JSON format following Chen notation.

CRITICAL INSTRUCTIONS:
- Return ONLY a raw JSON object
- Do NOT include any explanation, markdown, or code fences
- Do NOT wrap the JSON in \`\`\`json or \`\`\` blocks
- Return the JSON object directly with no additional text

The JSON must follow this exact schema:

{
  "entities": [
    {
      "id": "string (unique identifier, no spaces, lowercase, e.g. 'student')",
      "name": "string (display name, e.g. 'Student')",
      "attributes": [
        {
          "id": "string (unique identifier)",
          "name": "string (display name)",
          "type": "simple | multiValued | derived | key | partialKey",
          "composedOf": ["attr_id_1", "attr_id_2"]
        }
      ],
      "isWeak": false
    }
  ],
  "relationships": [
    {
      "id": "string (unique identifier)",
      "name": "string (verb phrase, e.g. 'Enrolls In')",
      "isIdentifying": false,
      "participants": [
        {
          "entityId": "string (references entities[].id)",
          "cardinality": "1 | N | M",
          "participation": "total | partial"
        }
      ],
      "attributes": []
    }
  ],
  "isA": [
    {
      "id": "string (unique identifier)",
      "parent": "string (entity id)",
      "children": ["entity_id_1", "entity_id_2"],
      "constraint": "disjoint | overlapping",
      "participation": "total | partial"
    }
  ]
}

SCHEMA FIELD EXPLANATIONS:

Entities:
- id: unique lowercase identifier with no spaces
- name: human-readable display name
- attributes: array of attribute objects
- isWeak: true if this is a weak entity (depends on another entity for identification)

Attributes:
- id: unique identifier
- name: display name
- type: 
  * "simple" - regular single-valued attribute
  * "multiValued" - can have multiple values (e.g., phone numbers)
  * "derived" - computed from other attributes (e.g., age from birthdate)
  * "key" - primary key attribute
  * "partialKey" - discriminator for weak entities
- composedOf: array of attribute ids if this is a composite attribute (omit if not composite)

Relationships:
- id: unique identifier
- name: verb phrase describing the relationship
- isIdentifying: true if this relationship identifies a weak entity
- participants: array of entities participating in this relationship
  * entityId: references an entity's id
  * cardinality: "1" (one), "N" (many), or "M" (many, used for second participant)
  * participation: "total" (every entity must participate) or "partial" (optional)
- attributes: relationship attributes (same structure as entity attributes)

IS-A Hierarchies:
- id: unique identifier for this hierarchy
- parent: entity id of the superclass
- children: array of entity ids for subclasses
- constraint: "disjoint" (subclasses are mutually exclusive) or "overlapping" (can belong to multiple)
- participation: "total" (every parent must be in a subclass) or "partial" (optional)

IMPORTANT RULES:
1. Every entity must have at least one key attribute
2. Weak entities must have a partialKey attribute and participate in an identifying relationship
3. All entityId references must point to valid entity ids
4. Relationship participants must have exactly 2 or more entities
5. Use clear, descriptive names for all elements
6. If no IS-A hierarchies exist, use an empty array: "isA": []

USER SCENARIO:
${userQuestion}

Remember: Return ONLY the raw JSON object with no markdown formatting, code fences, or explanatory text.`
}
