# AGENTS.md

## Project

BoiskoPlus Mobile is a React Native mobile application built with Expo.

This repository contains the mobile application only. The backend/server is maintained in a separate repository.

## Technology

- JavaScript only
- JSX for React components
- React Native
- Expo
- Expo Router
- Zustand
- Axios
- Socket.IO client
- Firebase
- Mapbox

Do NOT introduce TypeScript.
Do NOT create `.ts` or `.tsx` files.

## Project structure

Main areas of the repository include:

- `app/` — Expo Router screens and routes
- `components/` — reusable React Native components
- `assets/` — shared application resources and code, including `hook/`, `utils/`, `data/`, `song/`, `fonts/`, and other assets
- `constants/` — application constants
- `context/` — shared application state; currently contains a mix of React Context and Zustand-based state
- `Navigation/` — navigation-related code
- `Theme/` — current theme and UI styling system
- `docs/` — project documentation

The existing state architecture is intentional. Authentication currently uses React Context so the relevant data is available throughout the application. Notification state uses Zustand. Do not migrate state between Context and Zustand unless explicitly requested.

Before creating a new component, hook, utility, context, or service, inspect the existing repository for an appropriate place or existing implementation.

## Code style

Write code for a human developer to read, understand, debug, and maintain.

Prefer:

- simple and explicit code
- descriptive names
- straightforward control flow
- small functions with clear responsibilities
- existing project patterns
- reuse of existing utilities and hooks

Avoid:

- unnecessary abstractions
- clever or compressed code
- excessive generic helpers
- deep nesting
- unnecessary one-line expressions
- abstractions created only to reduce a few lines of code
- code that is difficult for a human developer to understand or debug

Do not optimize for the fewest lines of code.
Optimize for clarity, maintainability, and consistency with the existing codebase.

Do not rewrite working code simply because another style is possible.

## Existing patterns and utilities

Before implementing functionality, search the repository for existing patterns and solutions.

Reuse existing implementations whenever appropriate instead of introducing another pattern for the same problem.

In particular:

- inspect `assets/hook/` before creating a new hook
- inspect `assets/utils/` before creating a new utility
- inspect existing contexts before creating another context
- inspect existing components before creating a duplicate component
- use `assets/utils/customFetch.js` for backend communication when applicable

Do not introduce another HTTP/request abstraction when `customFetch.js` is suitable for the task.

`assets/utils/scaleUI.UX` is deprecated.

- Do not use it in new code.
- Do not expand its usage.
- Do not migrate existing code away from it unless explicitly requested.
- Use the current `Theme/` system for new UI code.

## Architecture

Do not change architecture silently.

For a significant architectural change:

1. inspect the existing architecture
2. identify the problem with the current approach
3. explain the proposed change and affected areas
4. wait for developer approval
5. only then implement the architectural change

Do not introduce new infrastructure, libraries, patterns, or abstractions merely because they are commonly used elsewhere.

If an unrelated architectural problem is discovered while implementing a task, do not silently fix it. Mention it separately as a possible future improvement.

## Dependencies

Do not install, remove, or update dependencies without explicit developer approval.

You may suggest a dependency when it would materially help solve the problem, but do not install it automatically.

Before suggesting a new dependency, check whether the existing project can solve the problem with its current dependencies or code.

## Commands, builds, and runtime

The developer controls package commands, application startup, builds, cleaning, and releases.

Do NOT run project commands or scripts. The developer controls them manually.

This includes commands such as:

- `npm run ...`
- `npm start`
- `npm install`
- `npm update`
- `npx ...`
- `expo ...`
- `eas ...`

Never run scripts defined in `package.json`, even when they appear useful for the task.

The project uses a custom Expo development build. Do not start, rebuild, clean, or launch the application.

The developer is responsible for running the application and performing builds.

Read-only and helper commands are allowed when they are useful for understanding or editing the repository, provided they do not violate the rules above.

## Testing

This project does not use automated tests as part of its development workflow.

Do NOT:

- create tests
- create test files or test suites
- create test helpers, mocks, or fixtures
- add testing infrastructure
- add testing dependencies

Do not introduce tests unless explicitly requested by the developer.

## Python

Python is not used in this project.

Never use Python, even for temporary or one-off tasks.

Do not:

- create `.py` files
- create temporary Python scripts
- use Python for data processing
- use Python for file manipulation
- use Python for debugging
- use Python for automation
- use Python for code generation

When scripting or automation is necessary, use Node.js or shell tools instead.

## Configuration and sensitive files

Do not modify configuration, credentials, secrets, or environment files without explicit developer permission.

This includes, but is not limited to:

- `.env`
- `.env.example`
- Expo/app configuration
- build configuration
- authentication configuration
- platform-specific credentials
- service configuration

These files may legitimately need to change for some tasks, but the developer must explicitly authorize such changes.

Never expose secrets or credentials in responses, logs, or generated files.

## Git

The agent must not modify Git state.

Read-only Git commands are allowed when useful, such as:

- `git status`
- `git diff`
- `git log`

Do NOT:

- commit
- push
- pull
- reset
- checkout
- rebase
- merge
- stash
- create or delete branches
- rewrite Git history

The developer controls Git manually.

## Scope control

Make the smallest change that correctly solves the requested task.

Do not modify unrelated files.
Do not perform opportunistic refactors.
Do not rename or move files unless required by the task and approved when the change is significant.

Preserve existing behavior outside the requested scope.

If the task exposes a larger possible improvement, separate it from the requested work instead of silently expanding the scope.

## Comments

Comments are useful when they explain why something is done, especially for non-obvious business logic or technical constraints.

Do not add comments that merely restate what the code already says.
Do not add large explanatory comment blocks to simple code.

## Language

Code, identifiers, filenames, and code comments should be written in English.

When explaining work to the developer, use Polish unless the developer requests another language.

## Working before implementation

For small, well-defined changes:

- inspect the relevant code
- identify the existing pattern
- implement the change

For significant changes:

- inspect the relevant architecture and code
- identify affected files and dependencies
- explain the proposed approach
- wait for developer approval
- then implement

Do not begin a large architectural implementation based only on assumptions.

## After implementation

After making changes:

- inspect the resulting changes
- check for accidental or unrelated modifications
- verify that the implementation matches the requested scope
- report what was changed
- report anything that could not be verified

Do not run project commands, builds, or tests.
