#!/usr/bin/env python3
"""Generate leaderboard_snippet.md from the local leaderboard.csv.

The canonical leaderboard lives in ajhamdi/colon-bench-eval and is what the
website fetches live at page load. The local static/assets/leaderboard.csv
is a fallback snapshot, refreshed daily by
.github/workflows/update-leaderboard.yml (which curls the canonical CSV
and then reruns this script).

Run manually after a local edit if you need to regenerate the snippet:
    python scripts/generate_leaderboard_md.py
"""

import csv
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "static" / "assets" / "leaderboard.csv"
MD_PATH = ROOT / "static" / "assets" / "leaderboard_snippet.md"

METRIC_COLS = list(range(1, 9))  # columns 1-8 are numeric
DASH = "\u2014"
# AVG = mean of VQA Prompted (1), VQA Unprompted (2), Cls. F1 (6),
# Seg. IoU (7); only defined when all four are present.
AVG_COLS = [1, 2, 6, 7]


def compute_avg(row):
    vals = [row[ci] for ci in AVG_COLS]
    if any(v == DASH or v == "" for v in vals):
        return None
    return sum(float(v) for v in vals) / len(AVG_COLS)


def main():
    with open(CSV_PATH, newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    avgs = {id(r): compute_avg(r) for r in rows}

    # Sort by AVG lowest to highest; rows without an AVG stay first, in
    # their original order.
    without_avg = [r for r in rows if avgs[id(r)] is None]
    with_avg = sorted(
        (r for r in rows if avgs[id(r)] is not None),
        key=lambda r: avgs[id(r)],
    )
    rows = without_avg + with_avg

    # find best (max) value per metric column
    best = {}
    for ci in METRIC_COLS:
        nums = [float(r[ci]) for r in rows if r[ci] != DASH]
        best[ci] = max(nums) if nums else None
    avg_nums = [avgs[id(r)] for r in rows if avgs[id(r)] is not None]
    best_avg = max(avg_nums) if avg_nums else None

    lines = [
        "## \U0001f3c6 Colon-Bench Leaderboard",
        "",
        "<table>",
        "  <thead>",
        "    <tr>",
    ]
    for h in header:
        lines.append(f"      <th>{h}</th>")
    lines.append("      <th>AVG</th>")
    lines += ["    </tr>", "  </thead>", "  <tbody>"]

    for row in rows:
        cells = []
        for ci, val in enumerate(row):
            if ci == 0:
                cells.append(f"<td>{val}</td>")
            elif val == DASH:
                cells.append(f"<td>{DASH}</td>")
            else:
                is_best = best.get(ci) is not None and float(val) == best[ci]
                if is_best:
                    cells.append(f"<td><b>{val}</b></td>")
                else:
                    cells.append(f"<td>{val}</td>")
        avg = avgs[id(row)]
        if avg is None:
            cells.append(f"<td>{DASH}</td>")
        else:
            avg_str = f"{avg:.1f}"
            if best_avg is not None and avg == best_avg:
                cells.append(f"<td><b>{avg_str}</b></td>")
            else:
                cells.append(f"<td>{avg_str}</td>")
        lines.append("    <tr>" + "".join(cells) + "</tr>")

    lines += ["  </tbody>", "</table>", ""]

    MD_PATH.write_text("\n".join(lines))
    print(f"Wrote {MD_PATH}")


if __name__ == "__main__":
    main()
