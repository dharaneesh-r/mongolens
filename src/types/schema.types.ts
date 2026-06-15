export interface SchemaField {
  name: string;
  type: string; // "String" | "Number" | "Date" | "ObjectId" | "Boolean" | "Array" | "Mixed"
  ref?: string; // populated if type is ObjectId with ref
  required?: boolean;
  isArray?: boolean;
  unique?: boolean;
  default?: string;
  enum?: string[];
}

export interface SchemaIndex {
  fields: Record<string, 1 | -1>;
  options?: { unique?: boolean; sparse?: boolean; name?: string };
}

export interface ParsedCollection {
  name: string;           // e.g. "User"
  variableName: string;   // e.g. "UserSchema"
  fields: SchemaField[];
  indexes: SchemaIndex[];
  fileName: string;
}

export interface SchemaRelation {
  from: string;   // collection name
  to: string;     // referenced collection name
  field: string;  // field name that holds the ref
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface SchemaGraph {
  collections: ParsedCollection[];
  relations: SchemaRelation[];
  deadCollections: string[]; // collections never referenced
}

export interface IndexWarning {
  collection: string;
  field: string;
  refTarget: string;
  message: string;
}
