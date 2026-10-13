# Prompt Builder compatibility

Read this reference before authoring manifests/plans or claiming compatibility.

## Discover the actual toolchain

1. Locate the installed/local package and version.
2. Run or read `--help` and inspect the shipped schemas/templates.
3. Confirm rules root, registry path semantics, decision grammar, plan schema, scanner behavior,
   migration support, target-profile rules, and lock verification.
4. Use the discovered commands and schema fields; never assume another version.

## Required invariants

- Registry IDs equal manifest IDs and registry paths resolve from the real rules root.
- Plan references and `depends_on` edges resolve to registered packs; the dependency graph is acyclic.
- Enabled packs declare required documents, implementation paths, and real quality gates.
- Skills are installed/discoverable in the target runtime; declaring a name is not installation proof.
- Templates are isolated from product scanning and never masquerade as executable packs.
- Target profiles are used only when their schema matches the product topology.
- `answers.md` follows the real parser grammar and has no relevant material OPEN questions before
  APPLY/REVIEW/FIX.
- Generated prompts and lockfiles are outputs. Change canonical inputs and regenerate them.

## Evidence levels

Report the highest level actually proven:

- `STRUCTURAL_PASS`: inventory and parse checks pass.
- `SCHEMA_PASS`: shipped schemas pass.
- `RESOLVER_PASS`: registry, inheritance, documents, paths, and graph resolve.
- `CLI_PASS`: real package commands pass.
- `PROJECT_PASS`: target repositories, contracts, runtimes, and project gates resolve.
- `PUBLICATION_READY`: decisions, eligibility, locks, and publication gates pass.

Run the conceptual sequence using exact supported command names: migrate when required, validate
references, validate decisions, validate packs/eligibility, plan, build/build-all, then verify locks.
Capture command, exit code, and artifact. Do not replace a failing real gate with an easier custom one.
