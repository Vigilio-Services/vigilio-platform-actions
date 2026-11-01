---
name: ux-mobile-experience
description: Especialista UX móvil Expo/React Native: patrones nativos, touch, safe area y accesibilidad.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "mobile,expo"
routing_keywords: "experiencia movil,app movil,android,ios,safe area,touch,nativo movil,expo ui,mobile ux"
routing_files: "package.json"
routing_capabilities: "feature"
requires: []
optional: []
conflicts: []
supersedes: []
---

# ux-mobile-experience — procedimiento Senior/Staff

## Condiciones de activación

Usar solo ante una solicitud UI/UX o flujo de producto pertinente. Si no hay repositorio, ofrecer opciones y decidir con el usuario únicamente lo irreversible. Si existe, inspeccionar stack, pantallas, estilos, tokens, tests y decisiones de producto; no reemplazar diseño aprobado sin justificación. **El router solo sugiere; el agente debe abrir este documento y las guías antes de afirmar su lectura.**

## Contratos de interacción nativa

Revisar Expo y navegación existente antes de cambiar. Diseñar safe areas, teclado virtual, orientación, dynamic type, VoiceOver/TalkBack, gestos, permisos y estados offline. Validar diferencias iOS y Android; reutilizar tokens sin trasplantar CSS por defecto.

## Entrega verificable

Pantalla vertical completa de tarea crítica con estados, tap targets verificados por SO, flujo de navegación/Back y reintento seguro.

## Evaluación y riesgos

Device tests en ambas plataformas, lector pantalla, teclado, poor network, start/restore y screenshots comparables.

**Evidencia mínima:** fuente canónica leída; rutas/archivos tocados si se implementó; impacto a consumidores; tests `PASS/FAIL/BLOCKED/NOT_RUN`; revisión independiente solo lectura; decisiones y preguntas que no pueden inferirse del proyecto. Prohibido afirmar puntuación perfecta por propuesta visual o test no ejecutado.

## Fuentes canónicas y referencias de aplicación

- [Blueprints UX/UI originales por producto](../.vigilio-docs/standards/experience/product-originality-and-platform-blueprints.md)

- [Guía especializada](../.vigilio-docs/stacks/mobile/expo/ui/uxui-mobile-native-patterns.md)
- [Norma UX/UI](../.vigilio-docs/standards/experience/README.md)
- [Accesibilidad](../.vigilio-docs/standards/experience/accessibility-inclusive-interactions.md)
- [Gates UX/UI](../.vigilio-docs/standards/experience/ux-quality-gates-and-ci-cd.md)
- [Review](../.vigilio-docs/standards/engineering/change-impact-and-review-gates.md)
- [Ejecución y casos adversarios](references/execution.md)

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** usar contexto del producto, abrir fuentes, validar accesibilidad/comportamiento real y registrar pruebas ejecutadas.
- ❌ **Incorrecto:** imponer un diseño genérico, afirmar carga de skill no leída o etiquetar un mock/propuesta como E2E aprobado.


## Lectura obligatoria de referencias

Consultar las referencias locales del módulo antes de ejecutar modificaciones normativas.

