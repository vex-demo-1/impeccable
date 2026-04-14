# Pin / Unpin

Commands that create or remove standalone slash-command shortcuts for frequently-used sub-commands.

## What it does

**Pin** creates a lightweight standalone skill so `$<command>` invokes `$impeccable <command>` directly. Example: `$impeccable pin audit` creates `$audit` as a shortcut for `$impeccable audit`.

**Unpin** removes a previously pinned shortcut.

The pinned skill is a thin redirect — it doesn't duplicate the sub-command reference, it just forwards to the impeccable router.

## Usage

```bash
node {{scripts_path}}/pin.mjs pin <command>
node {{scripts_path}}/pin.mjs unpin <command>
```

The script writes to every harness directory present in the project (`.claude/`, `.cursor/`, `.codex/`, `.agents/`, `.gemini/`, etc.) so pinned shortcuts work across every AI coding tool the user has installed.

## Valid commands

Any impeccable sub-command name is a valid pin target: `craft`, `shape`, `teach`, `document`, `extract`, `critique`, `audit`, `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard`, `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive`, `clarify`, `adapt`, `optimize`, `live`.

## Reporting back

After running the script, report what happened:
- **Pin success**: confirm the new shortcut (e.g. *"Pinned. You can now use `$audit` as a shortcut for `$impeccable audit`."*).
- **Unpin success**: confirm removal.
- **Errors**: relay the script's stderr verbatim — usually the command name was invalid or the pin already/doesn't exist.
