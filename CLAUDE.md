# CLAUDE.md

Follow the conventions in [.github/copilot-instructions.md](.github/copilot-instructions.md).

## Comments — the rule

Default: no comment. Code must explain itself through naming and structure. A comment is justified only when it carries information unrecoverable from the code: a non-obvious external constraint (specific version format behaviour), a deliberate deviation a reader would want to "fix" back, or a reference that saves a research session. Never write restatements, section banners, or edit narration. If unsure whether a comment qualifies, it does not.

## Technical writing

Technical text: ASD-STE100 style. Max 20 words per sentence in instructions, 25 in descriptions. Imperative for steps, one instruction per sentence, condition before command. Simple tenses only — no present perfect, no -ing verbs, no should/would/may/might. Active voice. One word per meaning — no synonym rotation. No contractions, keep articles and "that". Delete filler: simply, robust, seamlessly, leverage. Code and identifiers stay exact.

## Local build scripts (Windows)

- `build.bat`: install the dependencies and build the development app.
- `run.bat`: start the development app. If no build exists, it runs `build.bat` first.
- `build_and_run.bat`: build the app, then start it.
