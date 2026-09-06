import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Phase } from './types.js';

export type DecisionStatus = 'OPEN' | 'ANSWERED';

export type DecisionQuestion = {
  id: string;
  title: string;
  status: DecisionStatus;
  blocks: string[];
};

export type DecisionReadiness = {
  source: string | null;
  required: boolean;
  ready: boolean;
  questions: DecisionQuestion[];
  blockers: DecisionQuestion[];
};

const QUESTION_HEADING = /^##\s+(Q-[A-Z0-9.-]+)(?:\s+[—-]\s*(.*))?\s*$/i;
const STATUS = /^\s*-\s*(?:Estado|Status)\s*:\s*(OPEN|ANSWERED)\s*$/i;
const BLOCKS = /^\s*-\s*(?:Bloquea|Blocks)\s*:\s*(.*)$/i;
const NEXT_FIELD =
  /^\s*-\s*(?:Estado|Status|Por qué requiere decisión humana|Why|Opciones|Options|Recomendación|Recommendation|Decisión|Decision|Owners\/documentos[^:]*|Owners[^:]*|Respondida por|Answered by|Fecha de respuesta|Answer date)\s*:/i;

function isMissing(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function extractPackIds(value: string) {
  const normalized = value
    .replaceAll('`', '')
    .replace(/^\s*-\s*/, '')
    .trim();
  if (!normalized || /^(?:none|ninguno|n\/a|pending|<.*>)$/i.test(normalized)) return [];
  if (normalized === '*') return ['*'];
  return (
    normalized.match(/[a-z0-9]+(?:[.-][a-z0-9]+)+|\*/gi)?.map((item) => item.toLowerCase()) ?? []
  );
}

function parseQuestion(lines: string[], source: string): DecisionQuestion {
  const heading = QUESTION_HEADING.exec(lines[0] ?? '');
  if (!heading?.[1]) throw new Error(`Invalid decision question heading in ${source}`);
  const id = heading[1].toUpperCase();
  const title = heading[2]?.trim() ?? '';
  const statusLine = lines.find((line) => STATUS.test(line));
  const statusMatch = statusLine ? STATUS.exec(statusLine) : null;
  if (!statusMatch?.[1]) {
    throw new Error(`DECISION_REGISTER_INVALID: ${id} has no OPEN/ANSWERED status in ${source}`);
  }

  const blocks: string[] = [];
  const marker = lines.findIndex((line) => BLOCKS.test(line));
  if (marker < 0) {
    throw new Error(`DECISION_REGISTER_INVALID: ${id} has no Bloquea/Blocks field in ${source}`);
  }
  const inline = BLOCKS.exec(lines[marker] ?? '')?.[1] ?? '';
  blocks.push(...extractPackIds(inline));
  for (let index = marker + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (QUESTION_HEADING.test(line) || NEXT_FIELD.test(line)) break;
    blocks.push(...extractPackIds(line));
  }

  return {
    id,
    title,
    status: statusMatch[1].toUpperCase() as DecisionStatus,
    blocks: unique(blocks),
  };
}

export function parseDecisionRegister(content: string, source = 'docs/rules/answers.md') {
  const lines = content.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const questions: DecisionQuestion[] = [];
  let current: string[] | undefined;
  for (const line of lines) {
    if (QUESTION_HEADING.test(line)) {
      if (current) questions.push(parseQuestion(current, source));
      current = [line];
      continue;
    }
    current?.push(line);
  }
  if (current) questions.push(parseQuestion(current, source));

  const seen = new Set<string>();
  for (const question of questions) {
    if (seen.has(question.id)) {
      throw new Error(`DECISION_REGISTER_INVALID: duplicate ${question.id} in ${source}`);
    }
    seen.add(question.id);
  }
  return questions;
}

export function requiresDecisionClosure(phases: Phase[]) {
  return phases.some((phase) => phase === 'apply' || phase === 'review' || phase === 'fix');
}

function affectsScope(question: DecisionQuestion, packIds: Set<string>) {
  return (
    packIds.has('*') ||
    question.blocks.length === 0 ||
    question.blocks.includes('*') ||
    question.blocks.some((pack) => packIds.has(pack))
  );
}

export async function evaluateDecisionReadiness(input: {
  projectRoot: string;
  packIds: string[];
  phases: Phase[];
  requireRegister?: boolean | undefined;
}): Promise<DecisionReadiness> {
  const required = input.requireRegister ?? requiresDecisionClosure(input.phases);
  const source = path.resolve(input.projectRoot, 'docs/rules/answers.md');
  try {
    await access(source);
  } catch (error) {
    if (!isMissing(error)) throw error;
    if (required) {
      return { source: null, required, ready: false, questions: [], blockers: [] };
    }
    return { source: null, required, ready: true, questions: [], blockers: [] };
  }

  const questions = parseDecisionRegister(await readFile(source, 'utf8'), source);
  if (!requiresDecisionClosure(input.phases)) {
    return { source, required, ready: true, questions, blockers: [] };
  }
  const packIds = new Set(input.packIds);
  const blockers = questions.filter(
    (question) => question.status === 'OPEN' && affectsScope(question, packIds),
  );
  return { source, required, ready: blockers.length === 0, questions, blockers };
}

export function assertDecisionReadiness(readiness: DecisionReadiness) {
  if (readiness.ready) return;
  if (!readiness.source) {
    throw new Error(
      'BLOCKED_BEFORE_PUBLICATION: docs/rules/answers.md is required before APPLY/REVIEW/FIX prompts can be generated',
    );
  }
  throw new Error(
    `BLOCKED_BEFORE_PUBLICATION: unresolved human decisions ${readiness.blockers
      .map((question) => question.id)
      .join(', ')}`,
  );
}
