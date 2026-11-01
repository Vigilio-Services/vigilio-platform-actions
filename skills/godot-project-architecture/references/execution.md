# Evidencia ejecutable — godot-project-architecture

## Checklist Senior/Staff

- Confirmar `project.godot` y versión Godot fijada; registrar commit y alcance.
- Leer fuentes canónicas referenciadas desde `SKILL.md` y documentación oficial de versión compatible.
- Evaluar escenas/resources/imports/código consumidor antes de editar.
- Formular el menor número de preguntas necesarias, recomendando alternativa.
- Verificar `--editor --import`, pruebas y escenas reales; E2E gráfico/audio cuando aplique.
- Ejecutar `review-code-change` de solo lectura, informar `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN` con evidencia.

✅ Correcto: el juego funciona sin audio si el dispositivo está silenciado. ❌ Incorrecto: acoplar salto a la ejecución del archivo SFX.
