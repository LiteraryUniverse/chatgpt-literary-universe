"""Build the plugin ZIP from an explicit allowlist, with deterministic timestamps."""

import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent
manifest = json.loads((root / "plugin.json").read_text())
files = (
    "plugin.json",
    "mcp.json",
    "assets/icon.png",
    "skills/literary-assistant/SKILL.md",
    "skills/bring-text-to-lu/SKILL.md",
)
output = root / "dist"
output.mkdir(exist_ok=True)
target = output / f"literary-universe-{manifest['version']}.zip"

with ZipFile(target, "w", compression=ZIP_DEFLATED) as archive:
    for name in sorted(files):
        entry = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, (root / name).read_bytes())

print(target)
