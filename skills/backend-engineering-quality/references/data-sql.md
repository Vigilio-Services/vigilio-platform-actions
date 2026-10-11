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

## Evidencia

- Ejecutar migración y rollback/recovery en un entorno desechable con datos representativos.
- Probar mapping, constraints, ausencia, error de DB y límites de paginación.
- Para queries sensibles, conservar plan de ejecución y volumen representativo; no optimizar por intuición.
- Registrar comandos, exit codes, checks de integridad y riesgos residuales.
