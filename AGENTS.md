# Athena repository guidance

- Treat `athena_package/` and captured experiment evidence as source material. Do not silently rewrite source reports.
- Preserve the labels `Sourced`, `Institution-reported`, `Inference`, and `Unverified`.
- Do not present demand, willingness to pay, integration access, retention impact, or time savings as verified without direct evidence.
- Keep the public portal dependency-free unless a change clearly requires a build system.
- Run `npm test` after changes to the portal, package paths, or deployment workflow.
- Keep experiments decision-oriented: each test must name the decision it can change and its stop criteria.
