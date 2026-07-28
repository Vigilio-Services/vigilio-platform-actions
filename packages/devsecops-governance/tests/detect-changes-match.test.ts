import { describe, expect, it } from 'vitest';
// @ts-expect-error -- la action es JavaScript plano, sin declaraciones de tipos.
import { evaluate, globToRegExp, parseRules } from '../../../actions/detect-changes/match.mjs';

/**
 * El matcher decide que jobs de CI se saltan. Un falso negativo aqui no rompe
 * el pipeline: lo deja pasar en verde sin haber probado nada, que es el peor
 * modo de fallo posible en un gate. De ahi el detalle de estos casos.
 */
describe('globToRegExp', () => {
  it('casa un fichero suelto', () => {
    expect(globToRegExp('package.json').test('package.json')).toBe(true);
    expect(globToRegExp('package.json').test('otro.json')).toBe(false);
  });

  it('`*` no cruza separadores de directorio', () => {
    const pattern = globToRegExp('src/*.ts');

    expect(pattern.test('src/main.ts')).toBe(true);
    expect(pattern.test('src/auth/main.ts')).toBe(false);
  });

  it('`**` cubre cualquier profundidad, incluida cero', () => {
    const pattern = globToRegExp('src/**');

    expect(pattern.test('src/main.ts')).toBe(true);
    expect(pattern.test('src/auth/application/service/auth.ts')).toBe(true);
    expect(pattern.test('tests/main.ts')).toBe(false);
  });

  it('`**/` en medio salta directorios intermedios', () => {
    const pattern = globToRegExp('tests/**/*.spec.ts');

    expect(pattern.test('tests/e2e/auth.spec.ts')).toBe(true);
    expect(pattern.test('tests/a/b/c/auth.spec.ts')).toBe(true);
    expect(pattern.test('tests/auth.spec.ts')).toBe(true);
    expect(pattern.test('src/auth.spec.ts')).toBe(false);
  });

  it('escapa metacaracteres de regex en vez de interpretarlos', () => {
    const pattern = globToRegExp('vitest.config.ts');

    expect(pattern.test('vitest.config.ts')).toBe(true);
    // Sin escapar, el punto casaria cualquier caracter.
    expect(pattern.test('vitestxconfig.ts')).toBe(false);
  });

  it('rechaza un glob vacio en vez de casar con todo', () => {
    expect(() => globToRegExp('')).toThrow();
  });
});

describe('parseRules', () => {
  it('interpreta reglas, comentarios y lineas en blanco', () => {
    const rules = parseRules(
      ['# comentario', 'unit=src/**,tests/**', '', 'docs=docs/**,*.md'].join('\n'),
    );

    expect([...rules.keys()]).toEqual(['unit', 'docs']);
  });

  it('separa inclusiones de exclusiones con `!`', () => {
    const rules = parseRules('code=src/**,!src/**/*.md');
    const rule = rules.get('code');

    expect(rule.include).toHaveLength(1);
    expect(rule.exclude).toHaveLength(1);
  });

  it('falla ante una regla mal formada en vez de ignorarla', () => {
    expect(() => parseRules('esto-no-tiene-igual')).toThrow(/Regla invalida/);
    expect(() => parseRules('vacia=')).toThrow(/no declara ningun glob/);
    expect(() => parseRules('')).toThrow(/No se declaro ninguna regla/);
  });
});

describe('evaluate', () => {
  const rules = ['unit=src/**,tests/**,package.json', 'docs=docs/**,*.md', 'iac=cdk/**'].join('\n');

  it('marca solo las reglas afectadas por los archivos cambiados', () => {
    const result = evaluate({
      rules,
      files: 'src/auth/auth.service.ts\nREADME.md',
      resolved: true,
      fallback: true,
    });

    expect(result).toEqual({ unit: true, docs: true, iac: false });
  });

  it('un cambio de solo documentacion no dispara los jobs de codigo', () => {
    const result = evaluate({
      rules,
      files: 'docs/README.md\ndocs/adr/0001.md',
      resolved: true,
      fallback: true,
    });

    expect(result).toEqual({ unit: false, docs: true, iac: false });
  });

  it('sin archivos cambiados no dispara nada', () => {
    const result = evaluate({ rules, files: '', resolved: true, fallback: true });

    expect(result).toEqual({ unit: false, docs: false, iac: false });
  });

  /**
   * Fail-safe: si el diff no se pudo resolver (merge_group, historia
   * superficial, primer push), se ejecuta todo. Lo contrario dejaria pasar un
   * cambio sin probar.
   */
  it('aplica el fallback a todas las reglas cuando el diff no se resuelve', () => {
    const result = evaluate({ rules, files: '', resolved: false, fallback: true });

    expect(result).toEqual({ unit: true, docs: true, iac: true });
  });

  it('respeta un fallback en false cuando se pide explicitamente', () => {
    const result = evaluate({ rules, files: '', resolved: false, fallback: false });

    expect(result).toEqual({ unit: false, docs: false, iac: false });
  });

  it('las exclusiones ganan a las inclusiones', () => {
    const result = evaluate({
      rules: 'code=src/**,!src/**/*.md',
      files: 'src/auth/README.md',
      resolved: true,
      fallback: true,
    });

    expect(result).toEqual({ code: false });
  });

  it('ignora espacios sobrantes en la lista de archivos', () => {
    const result = evaluate({
      rules: 'iac=cdk/**',
      files: '  cdk/lib/api.stack.ts  \n\n',
      resolved: true,
      fallback: true,
    });

    expect(result).toEqual({ iac: true });
  });
});
