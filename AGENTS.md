# Project Instructions & Behavioral Constraints

## Execution & Serving Policy

1. **No Automatic Builds**:
   - Do NOT run build commands (e.g. `npm run build`, `ng build`, `npm run build:all`, or equivalent build scripts) unless the user explicitly requests or confirms it.

2. **No Automatic Serving / Dev Server Starts**:
   - Do NOT start dev servers, background server processes, or application runners (e.g. `npm start`, `npm run dev`, `ng serve`, `nodemon`, dev daemons) unless the user explicitly requests or confirms it.

3. **No Automatic Testing**:
   - Do NOT run automated testing, browser subagents, end-to-end test suites, or testing scripts unless the user explicitly requests or confirms it.

4. **Validation & Verification**:
   - Review code modifications using static inspection and targeted code analysis only.
   - Always ask the user for confirmation before triggering builds, launching servers, or running tests.
