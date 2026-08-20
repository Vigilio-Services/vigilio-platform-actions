#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { configuredOrDiscoveredProjectPath, loadNodeNestToolingConfig } from '../config.js';

const config = loadNodeNestToolingConfig();
const currentFile = configuredOrDiscoveredProjectPath(
  config.openapi?.currentFile,
  'OPENAPI_CURRENT_FILE',
  ['docs/openapi/openapi.json', 'docs/openapi.json', 'openapi.json'],
  'docs/openapi/openapi.json',
);
const baseFile = configuredOrDiscoveredProjectPath(
  config.openapi?.baseFile,
  'OPENAPI_BASE_FILE',
  ['docs/openapi/openapi.base.json', 'docs/openapi.base.json', 'openapi.base.json'],
  'docs/openapi/openapi.base.json',
);
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
type JsonObject = Record<string, unknown>;

if (!existsSync(currentFile)) {
  console.error(`${currentFile} does not exist. Run pnpm openapi:export first.`);
  process.exit(1);
}

if (!existsSync(baseFile)) {
  const message = `OpenAPI base file not found at ${baseFile}.`;
  if (process.env['OPENAPI_DIFF_REQUIRE_BASE'] === 'true') {
    console.error(`${message} Strict OpenAPI diff requires a baseline.`);
    process.exit(1);
  }

  console.log(`OpenAPI diff skipped: ${message}`);
  process.exit(0);
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getObject(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getPaths(document: unknown): JsonObject {
  return getObject(getObject(document)['paths']);
}

function getOperations(pathItem: unknown): [string, unknown][] {
  return Object.entries(getObject(pathItem)).filter(([key]) => httpMethods.has(key));
}

function getParameters(operation: unknown): JsonObject[] {
  return getArray(getObject(operation)['parameters']).filter(isObject);
}

function getRequiredParameters(operation: unknown): JsonObject[] {
  return getParameters(operation).filter((parameter) => parameter['required'] === true);
}

function parameterKey(parameter: JsonObject): string {
  return `${String(parameter['in'])}:${String(parameter['name'])}`;
}

function getResponses(operation: unknown): JsonObject {
  return getObject(getObject(operation)['responses']);
}

function getRequestBody(operation: unknown): JsonObject {
  return getObject(getObject(operation)['requestBody']);
}

function getContent(value: unknown): JsonObject {
  return getObject(getObject(value)['content']);
}

const base = readJson(baseFile);
const current = readJson(currentFile);
const failures: string[] = [];
const basePaths = getPaths(base);
const currentPaths = getPaths(current);

for (const [path, basePathItem] of Object.entries(basePaths)) {
  const currentPathItem = currentPaths[path];

  if (!currentPathItem) {
    failures.push(`Removed path: ${path}`);
    continue;
  }

  for (const [method, baseOperation] of getOperations(basePathItem)) {
    const currentOperation = getObject(currentPathItem)[method];

    if (!currentOperation) {
      failures.push(`Removed operation: ${method.toUpperCase()} ${path}`);
      continue;
    }

    const baseResponses = getResponses(baseOperation);
    const currentResponses = getResponses(currentOperation);
    for (const status of Object.keys(baseResponses).filter((statusCode) =>
      statusCode.startsWith('2'),
    )) {
      if (!currentResponses[status]) {
        failures.push(`Removed success response ${status}: ${method.toUpperCase()} ${path}`);
      }
    }

    const baseRequestBody = getRequestBody(baseOperation);
    const currentRequestBody = getRequestBody(currentOperation);
    if (baseRequestBody['required'] !== true && currentRequestBody['required'] === true) {
      failures.push(`Request body became required: ${method.toUpperCase()} ${path}`);
    }

    const currentRequiredParameters = new Map(
      getRequiredParameters(currentOperation).map((parameter) => [
        parameterKey(parameter),
        parameter,
      ]),
    );
    const baseRequiredParameterKeys = new Set(
      getRequiredParameters(baseOperation).map((parameter) => parameterKey(parameter)),
    );
    for (const key of currentRequiredParameters.keys()) {
      if (!baseRequiredParameterKeys.has(key)) {
        failures.push(`Added required parameter ${key}: ${method.toUpperCase()} ${path}`);
      }
    }

    const baseContentTypes = Object.keys(getContent(baseRequestBody));
    const currentContent = getContent(currentRequestBody);
    for (const contentType of baseContentTypes) {
      if (!currentContent[contentType]) {
        failures.push(`Removed request media type ${contentType}: ${method.toUpperCase()} ${path}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('OpenAPI breaking changes detected:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('OpenAPI diff gate passed: no breaking changes detected.');
