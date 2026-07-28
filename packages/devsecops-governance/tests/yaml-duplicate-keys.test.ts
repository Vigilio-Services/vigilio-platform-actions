import { describe, expect, it } from 'vitest';
import { validateNoDuplicateKeys } from '../src/yaml-policy.js';

/**
 * Este gate nace de un fallo real: `shared-backend-node-nest-deploy-cdk.yml`
 * tenia `defaults:` y `steps:` duplicados en el mismo job por copia-pega. El
 * documento era YAML invalido y GitHub Actions lo habria rechazado entero, pero
 * pasaba todas las validaciones porque estaban basadas en buscar cadenas.
 */
describe('validateNoDuplicateKeys', () => {
  it('acepta un workflow bien formado', () => {
    const content = [
      'name: ci',
      'on:',
      '  push:',
      '    branches: [main]',
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@abc',
      '      - name: Build',
      '        run: pnpm build',
    ].join('\n');

    expect(validateNoDuplicateKeys(content, 'ci.yml')).toEqual([]);
  });

  it('detecta el patron exacto que se escapo en produccion', () => {
    const content = [
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
      '    defaults:',
      '      run:',
      '        working-directory: .',
      '    steps:',
      '      - uses: actions/checkout@abc',
      '    defaults:',
      '      run:',
      '        working-directory: .',
      '    steps:',
      '      - uses: actions/checkout@abc',
    ].join('\n');

    const errors = validateNoDuplicateKeys(content, 'deploy.yml');

    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('duplicate key "defaults"');
    expect(errors[1]).toContain('duplicate key "steps"');
    expect(errors[0]).toContain('first seen at line 4');
  });

  it('detecta dos jobs con el mismo nombre', () => {
    const content = ['jobs:', '  build:', '    runs-on: a', '  build:', '    runs-on: b'].join(
      '\n',
    );

    expect(validateNoDuplicateKeys(content, 'ci.yml')[0]).toContain('duplicate key "build"');
  });

  /**
   * El falso positivo mas probable: dentro de `run: |` el contenido es shell y
   * puede repetir cualquier cosa con dos puntos sin ser una clave YAML.
   */
  it('no marca contenido dentro de un escalar de bloque', () => {
    const content = [
      'jobs:',
      '  build:',
      '    steps:',
      '      - name: Script',
      '        run: |',
      '          echo "algo: uno"',
      '          echo "algo: dos"',
      '          if: no-es-una-clave',
      '          if: tampoco',
      '      - name: Otro',
      '        run: echo ok',
    ].join('\n');

    expect(validateNoDuplicateKeys(content, 'ci.yml')).toEqual([]);
  });

  it('no confunde claves iguales en elementos de lista distintos', () => {
    const content = [
      'jobs:',
      '  build:',
      '    steps:',
      '      - name: Uno',
      '        run: echo 1',
      '      - name: Dos',
      '        run: echo 2',
      '      - name: Tres',
      '        run: echo 3',
    ].join('\n');

    expect(validateNoDuplicateKeys(content, 'ci.yml')).toEqual([]);
  });

  it('no confunde la misma clave en niveles de anidamiento distintos', () => {
    const content = [
      'permissions:',
      '  contents: read',
      'jobs:',
      '  a:',
      '    permissions:',
      '      contents: read',
      '  b:',
      '    permissions:',
      '      contents: read',
    ].join('\n');

    expect(validateNoDuplicateKeys(content, 'ci.yml')).toEqual([]);
  });

  it('ignora comentarios y lineas en blanco', () => {
    const content = [
      'jobs:',
      '  # steps: esto es un comentario',
      '  build:',
      '',
      '    steps:',
      '      - run: echo ok',
    ].join('\n');

    expect(validateNoDuplicateKeys(content, 'ci.yml')).toEqual([]);
  });

  it('tolera CRLF', () => {
    const content = ['jobs:', '  build:', '    steps:', '    steps:'].join('\r\n');

    expect(validateNoDuplicateKeys(content, 'ci.yml')[0]).toContain('duplicate key "steps"');
  });
});
