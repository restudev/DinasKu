#!/usr/bin/env python3
"""
detect_spd_cells.py
-------------------
Jalankan sekali untuk mendeteksi koordinat sel tabel di template PDF SPD asli.
Output-nya dipakai untuk mengisi konstanta ROWS_Y di SPDCheckpointPdfService.php

Cara pakai:
    python3 detect_spd_cells.py /path/to/spd_template.pdf

Atau letakkan file PDF di direktori yang sama dan jalankan langsung.
"""

import sys
import pdfplumber

def mm(pt):
    return round(pt / 2.8346, 2)

def analyze(path: str):
    with pdfplumber.open(path) as pdf:
        # Analisis halaman TERAKHIR (halaman tanda tangan)
        page = pdf.pages[-1]
        pw = page.width
        ph = page.height

        print(f"\n{'='*60}")
        print(f"File  : {path}")
        print(f"Halaman terakhir: {len(pdf.pages)}")
        print(f"Ukuran: {mm(pw)} x {mm(ph)} mm  ({pw:.1f} x {ph:.1f} pt)")
        print(f"{'='*60}\n")

        # ── Deteksi rectangles (sel tabel) ──────────────────────────────
        rects = page.rects
        if rects:
            print(f"Ditemukan {len(rects)} rect:\n")
            # Sort by Y (atas ke bawah)
            rects_sorted = sorted(rects, key=lambda r: r['top'])
            for i, r in enumerate(rects_sorted):
                x0  = mm(r['x0'])
                y0  = mm(r['top'])          # jarak dari ATAS halaman
                w   = mm(r['x1'] - r['x0'])
                h   = mm(r['bottom'] - r['top'])
                print(f"  [{i}] x={x0}mm  y={y0}mm  w={w}mm  h={h}mm")
        else:
            print("Tidak ada rect terdeteksi — template mungkin pakai lines.\n")

        # ── Deteksi horizontal lines ────────────────────────────────────
        lines = page.lines
        h_lines = [l for l in lines if abs(l['y0'] - l['y1']) < 1]
        v_lines = [l for l in lines if abs(l['x0'] - l['x1']) < 1]

        if h_lines:
            ys = sorted(set(round(mm(l['top']), 1) for l in h_lines))
            print(f"\nGaris horizontal (Y dari atas, mm): {ys}")

        if v_lines:
            xs = sorted(set(round(mm(l['x0']), 1) for l in v_lines))
            print(f"Garis vertikal   (X dari kiri, mm): {xs}")

        # ── Ringkasan untuk PHP ─────────────────────────────────────────
        print(f"\n{'─'*60}")
        print("Salin ke SPDCheckpointPdfService.php → konstanta ROWS_Y:\n")

        if rects:
            rows = sorted(set(round(mm(r['top']), 1) for r in rects))
            print("private const ROWS_Y = [")
            for i, y in enumerate(rows):
                print(f"    {i} => {y},   // baris {['header','II','III','IV'][i] if i < 4 else i}")
            print("];\n")

            ws = sorted(set(round(mm(r['x1'] - r['x0']), 1) for r in rects))
            hs = sorted(set(round(mm(r['bottom'] - r['top']), 1) for r in rects))
            xs = sorted(set(round(mm(r['x0']), 1) for r in rects))
            print(f"X kolom kiri  (X_LEFT)  : {xs}")
            print(f"Lebar kolom   (COL_W)   : {ws}")
            print(f"Tinggi baris  (ROW_H)   : {hs}")
            x_rights = [x for x in xs if x > 50]
            if x_rights:
                print(f"X kolom kanan (X_RIGHT) : {x_rights[0]}")
        elif h_lines:
            ys = sorted(set(round(mm(l['top']), 1) for l in h_lines))
            print(f"// Y garis horizontal (tepi sel): {ys}")

        print(f"{'─'*60}\n")


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'SPD.pdf'
    try:
        analyze(path)
    except FileNotFoundError:
        print(f"File tidak ditemukan: {path}")
        print("Cara pakai: python3 detect_spd_cells.py /path/to/template.pdf")