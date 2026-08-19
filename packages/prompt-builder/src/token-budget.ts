import type { LoadedDocument, OpenSpecContext } from './types.js';

export function estimateTokens(text: string) {
  // Conservative heuristic only. It is not a tokenizer.
  return Math.ceil(text.length / 3.6);
}

export function enforceBudget(input: {
  documents: LoadedDocument[];
  openspec: OpenSpecContext;
  template: string;
  budget: number;
}) {
  const requiredText = input.documents
    .filter((d) => d.required)
    .map((d) => d.content)
    .join('\n');
  const optional = input.documents.filter((d) => !d.required);
  const openspecText = Object.values(input.openspec).join('\n');
  let total = estimateTokens(requiredText + openspecText + input.template);

  if (total > input.budget) {
    throw new Error(`Required context exceeds token budget: ${total} > ${input.budget}`);
  }

  const kept = [...input.documents.filter((d) => d.required)];
  for (const doc of optional) {
    const cost = estimateTokens(doc.content);
    if (total + cost <= input.budget) {
      kept.push(doc);
      total += cost;
    }
  }
  return { documents: kept, estimatedTokens: total };
}
