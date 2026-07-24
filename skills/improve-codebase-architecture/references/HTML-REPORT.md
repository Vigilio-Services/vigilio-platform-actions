# HTML Report Format — bus-impl Architecture Review

El architectural review se renderiza como un HTML self-contained en el temp directory del OS. Tailwind y Mermaid via CDN.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — project</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Header

Repo name, fecha y leyenda compacta.

## Candidate card

Cada candidato es un `<article>`:

- **Title** — nombre corto del deepening
- **Badge row** — recommendation strength (`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate) + dependency tag
- **Files** — monospace list
- **Before / After diagram** — dos columnas side by side
- **Problem** — una oración
- **Solution** — una oración
- **Wins** — bullets, ≤6 palabras cada uno. Usar vocabulario: locality, leverage, interface shrinks, seam
- **ADR callout** — si contradice un ADR, en amber box

## Diagram patterns

### Mermaid graph (para dependencias / call flow)

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### Hand-built boxes-and-arrows

Para when Mermaid no da el layout que necesitas. Módulos como `<div>` con borders, flechas como SVG inline `<line>`.

### Cross-section

Bandas horizontales (`h-12 border-l-4`) mostrando capas. Before: 6 thin layers. After: 1 thick band.

### Mass diagram

Dos rectángulos por módulo — interface surface area vs implementation. Before: casi igual (shallow). After: interface chica, implementation grande (deep).

## Style guidance

- Lean editorial, no corporate-dashboard
- Color sparingly: emerald/indigo accent, red for leakage, amber for warnings
- Diagrams ~320px tall
- `text-xs uppercase tracking-wider` para labels en diagramas
- Solo Tailwind + Mermaid CDN, nada más

## Tone

Vocabulario exacto: module, interface, implementation, depth, seam, adapter, leverage, locality.

**No usar:** component, service, unit, API, signature, boundary, layer, wrapper (cuando quieres decir module).

Ejemplos que encajan:
- "Order intake module is shallow — interface nearly matches the implementation."
- "Pricing leaks across the seam."
- "Deepen: one interface, one place to test."
- "Locality: bugs concentrate in one module."
- "Leverage: one interface, N call sites."

No hedging, no throat-clearing, no "it's worth noting that…".
