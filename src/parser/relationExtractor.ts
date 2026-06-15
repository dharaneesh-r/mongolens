import type { ParsedCollection, SchemaRelation, SchemaGraph } from '../types/schema.types';

export function extractRelations(collections: ParsedCollection[]): SchemaRelation[] {
  const relations: SchemaRelation[] = [];
  const collectionNames = new Set(collections.map((c) => c.name));

  for (const collection of collections) {
    for (const field of collection.fields) {
      if (field.ref && collectionNames.has(field.ref)) {
        // Determine relation type
        let relationType: SchemaRelation['type'] = 'one-to-one';

        if (field.isArray) {
          // Check if target also references back
          const target = collections.find((c) => c.name === field.ref);
          const backRef = target?.fields.find(
            (f) => f.ref === collection.name
          );
          relationType = backRef ? 'many-to-many' : 'one-to-many';
        }

        // Avoid duplicate relations for many-to-many
        const isDuplicate = relations.some(
          (r) =>
            r.type === 'many-to-many' &&
            ((r.from === collection.name && r.to === field.ref) ||
              (r.from === field.ref && r.to === collection.name))
        );

        if (!isDuplicate) {
          relations.push({
            from: collection.name,
            to: field.ref,
            field: field.name,
            type: relationType,
          });
        }
      }
    }
  }

  return relations;
}

export function findDeadCollections(
  collections: ParsedCollection[],
  relations: SchemaRelation[]
): string[] {
  const referencedCollections = new Set<string>();

  for (const relation of relations) {
    referencedCollections.add(relation.to);
  }

  return collections
    .filter((c) => !referencedCollections.has(c.name))
    .map((c) => c.name);
}

export function buildSchemaGraph(collections: ParsedCollection[]): SchemaGraph {
  const relations = extractRelations(collections);
  const deadCollections = findDeadCollections(collections, relations);

  return {
    collections,
    relations,
    deadCollections,
  };
}
