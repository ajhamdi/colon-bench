#!/usr/bin/env python3
"""Generate leaderboard_snippet.md from leaderboard.csv.

Run after editing leaderboard.csv to keep the Markdown table in sync:
    python scripts/generate_leaderboard_md.py
"""

import csv
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "static" / "assets" / "leaderboard.csv"
MD_PATH = ROOT / "static" / "assets" / "leaderboard_snippet.md"

METRIC_COLS = list(range(1, 9))  # columns 1-8 are numeric


def main():
    with open(CSV_PATH, newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    # find best (max) value per metric column
    best = {}
    for ci in METRIC_COLS:
        nums = [float(r[ci]) for r in rows if r[ci] != "\u2014"]
        best[ci] = max(nums) if nums else None

    lines = [
        "## \U0001f3c6 Colon-Bench Leaderboard",
        "",
        "<table>",
        "  <thead>",
        "    <tr>",
    ]
    for h in header:
        lines.append(f"      <th>{h}</th>")
    lines += ["    </tr>", "  </thead>", "  <tbody>"]

    for row in rows:
        cells = []
        for ci, val in enumerate(row):
            if ci == 0:
                cells.append(f"<td>{val}</td>")
            elif val == "\u2014":
                cells.append("<td>\u2014</td>")
            else:
                is_best = best.get(ci) is not None and float(val) == best[ci]
                if is_best:
                    cells.append(f"<td><b>{val}</b></td>")
                else:
                    cells.append(f"<td>{val}</td>")
        lines.append("    <tr>" + "".join(cells) + "</tr>")

    lines += ["  </tbody>", "</table>", ""]

    MD_PATH.write_text("\n".join(lines))
    print(f"Wrote {MD_PATH}")


if __name__ == "__main__":
    main()
