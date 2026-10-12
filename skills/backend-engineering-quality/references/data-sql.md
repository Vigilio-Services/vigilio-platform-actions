# Calidad De Datos Y SQL

## Schema Y Consultas

- Seguir naming y límites del motor/repositorio propietario; usar nombres descriptivos y consistentes sin
  imponer prefijos heredados a un proyecto que no los adopta.
- Elegir tipo, longitud, nulabilidad, default y precisión desde el dominio y datos reales.
- Parametrizar valores. Nunca concatenar input de usuario ni hardcodear hosts, IPs, credenciales o valores
  de ambiente en queries o lógica de negocio.
- Seleccionar columnas explícitas y usar aliases claros en joins; evitar `SELECT *` y datos sensibles no
  requeridos.
- Aplicar límites, orden determinista, paginación y aislamiento por tenant/ownership cuando corresponda.
- Evitar N+1 y verificar con evidencia antes de afirmar problemas de índice o rendimiento.
- Evitar casts o funciones sobre columnas filtradas cuando destruyan índices; confirmar con el plan real.
- Usar `UNION ALL` solo cuando conservar duplicados sea correcto. `UNION`, `COUNT(*)` o `COUNT(1)` se
  eligen por semántica, dialecto y evidencia, no por dogma.
- Mantener binds, nombres y mappers trazables entre query, adapter y tipos de salida.

## Cambios De Datos Y Migraciones

- Usar expand-contract cuando haya despliegues con versiones coexistentes: expandir, desplegar
  compatibilidad, backfill, verificar y contraer después.
- No renombrar o eliminar una columna todavía usada por la versión anterior en el mismo release.
- No actualizar una clave primaria como operación ordinaria. Una corrección excepcional requiere diseño
  de migración, FKs, compatibilidad, auditoría y rollback o forward-fix.
- Partir DML masivo en lotes acotados por tiempo, locks y observabilidad, no por un número universal.
- Todo pase de datos declara forward, verificación y rollback o recuperación. No prometer rollback si la
  operación destruye información; usar backup, expand-contract o forward-fix probado.
- Mantener seeders idempotentes y separados de migraciones estructurales cuando el stack lo soporte.

### Ejemplo De Documentación IC Para Procedimientos Y Funciones

Cuando el checklist corporativo IC sea autoridad del proyecto, documentar cada procedimiento o función
con su plantilla auditable. Para SQL, usar `--` en comentarios de una línea y `/* ... */` en bloques:

```sql
/*
Nombre SP        : spx_calcular_salario_base
Propósito        : Calcula el salario base aplicando las reglas vigentes del período.
Input            : @id_empleado - identificador del empleado.
                   @periodo     - período de cálculo en formato YYYYMM.
Output           : result set con salario_base y moneda.
Creado por       : equipo-rrhh
Fec Creación     : 2026-10-11
Fec Actualización: 2026-10-11
Actualizado por  : equipo-rrhh
Ticket/Proyecto  : PROY-0042
Detalle cambios  : Implementación inicial con validación de período activo.
*/
CREATE PROCEDURE rrhh.spx_calcular_salario_base
  @id_empleado bigint,
  @periodo char(6)
AS
BEGIN
  -- El período debe existir antes de calcular para evitar resultados parciales.
  -- La validación y el error concreto dependen del dialecto y estándar del repositorio.
END;
```

La cabecera debe describir claramente propósito, inputs, output y cambio. Mantenerla sincronizada con la
firma y el comportamiento. No copiarla en queries ordinarias ni código de aplicación si la autoridad no
la exige; allí Git, ADRs y el contrato ejecutable conservan la trazabilidad.

### Ejemplo De Plan De Migración Documentado

```markdown
Cambio: agregar `external_reference` única a settlements.

Forward:
1. agregar columna nullable e índice no bloqueante;
2. desplegar escritura dual compatible;
3. backfill por lotes con checkpoint;
4. verificar nulos, duplicados, locks y latencia;
5. activar unique/not-null y retirar compatibilidad en otro release.

Recovery:
- antes de contraer: desactivar escritura dual y retirar índice/columna nueva;
- después de contraer: restaurar desde backup o aplicar forward-fix; no prometer recuperar datos
  destruidos con un `down` ficticio.

Evidencia: comandos + exit codes, conteos pre/post, duración, plan de ejecución y owner operativo.
```

La migración real usa la sintaxis y tooling del stack. El documento explica orden, compatibilidad,
verificación y recuperación; no incluye credenciales, datos reales ni afirmaciones sin ensayo.

## Evidencia

- Ejecutar migración y rollback/recovery en un entorno desechable con datos representativos.
- Probar mapping, constraints, ausencia, error de DB y límites de paginación.
- Para queries sensibles, conservar plan de ejecución y volumen representativo; no optimizar por intuición.
- Registrar comandos, exit codes, checks de integridad y riesgos residuales.
