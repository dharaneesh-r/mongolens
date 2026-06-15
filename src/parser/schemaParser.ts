import type { ParsedCollection, SchemaField, SchemaIndex } from '../types/schema.types';

// Normalize type string to canonical form
function normalizeType(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower === 'string') return 'String';
  if (lower === 'number') return 'Number';
  if (lower === 'boolean') return 'Boolean';
  if (lower === 'date') return 'Date';
  if (lower === 'buffer') return 'Buffer';
  if (lower === 'mixed') return 'Mixed';
  if (lower === 'map') return 'Map';
  if (
    lower === 'objectid' ||
    lower === 'mongoose.schema.types.objectid' ||
    lower === 'schema.types.objectid' ||
    lower === 'types.objectid' ||
    lower === 'mongoose.types.objectid'
  ) return 'ObjectId';
  return raw.trim();
}

// Extract ref from a field definition string
function extractRef(fieldDef: string): string | undefined {
  const refMatch = fieldDef.match(/ref\s*:\s*['"`]([^'"`]+)['"`]/);
  return refMatch ? refMatch[1] : undefined;
}

// Extract required flag
function extractRequired(fieldDef: string): boolean {
  return /required\s*:\s*true/.test(fieldDef);
}

// Extract unique flag
function extractUnique(fieldDef: string): boolean {
  return /unique\s*:\s*true/.test(fieldDef);
}

// Extract the type string from a field definition object
function extractTypeFromDef(fieldDef: string): string {
  // type: SomeType  or  type: "String" etc
  const typeMatch = fieldDef.match(/type\s*:\s*([A-Za-z.[\]'"` ]+?)(?:,|\}|$)/);
  if (typeMatch) {
    return normalizeType(typeMatch[1].trim().replace(/['"` ]/g, ''));
  }
  return 'Mixed';
}

// Parse a single field line into SchemaField
function parseFieldDefinition(name: string, definition: string, isArray: boolean): SchemaField {
  const trimmed = definition.trim();

  // Simple type shorthand: field: String
  const simpleTypeMatch = trimmed.match(/^(String|Number|Boolean|Date|Buffer|Mixed|Map)$/);
  if (simpleTypeMatch) {
    return { name, type: simpleTypeMatch[1], isArray };
  }

  // Array shorthand: [String] or [ObjectId]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    return parseFieldDefinition(name, inner, true);
  }

  // Object definition with type key
  if (trimmed.includes('type')) {
    const type = extractTypeFromDef(trimmed);
    const ref = extractRef(trimmed);
    const required = extractRequired(trimmed);
    const unique = extractUnique(trimmed);
    return { name, type, ref, required, unique, isArray };
  }

  // ObjectId shorthand
  if (
    /ObjectId|Schema\.Types\.ObjectId|mongoose\.Schema\.Types\.ObjectId/i.test(trimmed)
  ) {
    const ref = extractRef(trimmed);
    return { name, type: 'ObjectId', ref, isArray };
  }

  return { name, type: 'Mixed', isArray };
}

// Parse schema body text (content between new Schema({ ... }))
function parseSchemaBody(body: string): SchemaField[] {
  const fields: SchemaField[] = [];

  // Remove comments
  const cleaned = body
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // Tokenize field definitions - match top-level key: value pairs
  // We'll use a simple brace-counting approach
  let i = 0;
  const len = cleaned.length;

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(cleaned[i])) i++;
    if (i >= len) break;

    // Try to match a field name (identifier or quoted string)
    const fieldNameMatch = cleaned.slice(i).match(/^(?:['"`]?([a-zA-Z_$][a-zA-Z0-9_$]*)['"`]?\s*:)/);
    if (!fieldNameMatch) {
      i++;
      continue;
    }

    const fieldName = fieldNameMatch[1];
    i += fieldNameMatch[0].length;

    // Skip whitespace after colon
    while (i < len && /[ \t]/.test(cleaned[i])) i++;

    // Now collect the value until we hit a comma at depth 0 or end
    let depth = 0;
    let valueStart = i;
    let inString = false;
    let stringChar = '';

    while (i < len) {
      const ch = cleaned[i];
      if (inString) {
        if (ch === stringChar && cleaned[i - 1] !== '\\') inString = false;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          inString = true;
          stringChar = ch;
        } else if (ch === '{' || ch === '[' || ch === '(') {
          depth++;
        } else if (ch === '}' || ch === ']' || ch === ')') {
          if (depth === 0) break;
          depth--;
        } else if (ch === ',' && depth === 0) {
          break;
        }
      }
      i++;
    }

    const valuePart = cleaned.slice(valueStart, i).trim();
    if (i < len && cleaned[i] === ',') i++;

    if (fieldName && valuePart) {
      // Skip Mongoose virtual/method/statics keys
      if (['methods', 'statics', 'virtuals', 'timestamps'].includes(fieldName)) continue;

      // Check if it's an array definition
      const isArrayDef = valuePart.startsWith('[');
      let defToProcess = valuePart;

      if (isArrayDef) {
        // Unwrap the array
        const inner = valuePart.slice(1, -1).trim();
        defToProcess = inner;
        if (!defToProcess) {
          fields.push({ name: fieldName, type: 'Mixed', isArray: true });
          continue;
        }
      }

      const field = parseFieldDefinition(fieldName, defToProcess, isArrayDef);
      fields.push(field);
    }
  }

  return fields;
}

// Extract index() calls from file content
function extractIndexes(content: string, varName: string): SchemaIndex[] {
  const indexes: SchemaIndex[] = [];
  // Match schemaVar.index({ ... }, { ... })
  const indexRegex = new RegExp(
    `${varName}\\.index\\s*\\(\\s*(\\{[^}]+\\})\\s*(?:,\\s*(\\{[^}]+\\}))?\\s*\\)`,
    'g'
  );

  let match;
  while ((match = indexRegex.exec(content)) !== null) {
    try {
      // Parse field spec
      const fieldStr = match[1].replace(/(\w+)\s*:/g, '"$1":');
      const fields: Record<string, 1 | -1> = JSON.parse(fieldStr);

      let options: { unique?: boolean; sparse?: boolean } | undefined;
      if (match[2]) {
        const optStr = match[2].replace(/(\w+)\s*:/g, '"$1":');
        options = JSON.parse(optStr);
      }

      indexes.push({ fields, options });
    } catch {
      // Skip malformed index definitions
    }
  }

  return indexes;
}

// Find the schema variable name and body
interface SchemaMatch {
  varName: string;
  body: string;
}

function findSchemaDefinitions(content: string): SchemaMatch[] {
  const results: SchemaMatch[] = [];

  // Pattern: const XSchema = new Schema({ ... }) or new mongoose.Schema({ ... })
  const schemaStartRegex = /(?:const|let|var)\s+(\w+)\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(/g;

  let match;
  while ((match = schemaStartRegex.exec(content)) !== null) {
    const varName = match[1];
    const openParenIdx = match.index + match[0].length - 1; // position of '('

    // Count parens to find the matching closing paren
    let depth = 1;
    let i = openParenIdx + 1;
    let inString = false;
    let stringChar = '';

    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (inString) {
        if (ch === stringChar && content[i - 1] !== '\\') inString = false;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          inString = true;
          stringChar = ch;
        } else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      i++;
    }

    const fullArgs = content.slice(openParenIdx + 1, i - 1);

    // The first argument to Schema() is the definition object
    // Find the first { ... } block
    const firstBraceIdx = fullArgs.indexOf('{');
    if (firstBraceIdx === -1) continue;

    let bDepth = 1;
    let j = firstBraceIdx + 1;
    inString = false;
    stringChar = '';

    while (j < fullArgs.length && bDepth > 0) {
      const ch = fullArgs[j];
      if (inString) {
        if (ch === stringChar && fullArgs[j - 1] !== '\\') inString = false;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          inString = true;
          stringChar = ch;
        } else if (ch === '{') bDepth++;
        else if (ch === '}') bDepth--;
      }
      j++;
    }

    const body = fullArgs.slice(firstBraceIdx + 1, j - 1);
    results.push({ varName, body });
  }

  return results;
}

// Find model registration: mongoose.model("Name", Schema) or model("Name", Schema)
function findModelRegistrations(content: string): Record<string, string> {
  const map: Record<string, string> = {};

  // Pattern: mongoose.model("ModelName", SchemaVar) or model("ModelName", SchemaVar)
  const modelRegex = /(?:mongoose\.)?model\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)\s*\)/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    map[match[2]] = match[1]; // schemaVar -> modelName
  }

  return map;
}

// Main parser entry point
export function parseMongooseFile(content: string, fileName: string): ParsedCollection[] {
  const collections: ParsedCollection[] = [];

  const schemaDefs = findSchemaDefinitions(content);
  const modelMap = findModelRegistrations(content);

  for (const { varName, body } of schemaDefs) {
    const fields = parseSchemaBody(body);
    const indexes = extractIndexes(content, varName);
    const modelName = modelMap[varName] || varName.replace(/Schema$/i, '');

    // Always add _id if not present
    if (!fields.find((f) => f.name === '_id')) {
      fields.unshift({ name: '_id', type: 'ObjectId' });
    }

    collections.push({
      name: modelName,
      variableName: varName,
      fields,
      indexes,
      fileName,
    });
  }

  return collections;
}

// Parse multiple files
export function parseFiles(
  files: Array<{ name: string; content: string }>
): ParsedCollection[] {
  const all: ParsedCollection[] = [];
  for (const file of files) {
    try {
      const parsed = parseMongooseFile(file.content, file.name);
      all.push(...parsed);
    } catch (err) {
      console.error(`Failed to parse ${file.name}:`, err);
    }
  }
  return all;
}
