"""Render a (subset of) draw.io diagram to PNG through headless Microsoft Edge.

Supports what the project book uses: rectangles (rounded), rhombus, ellipse,
endState, text, umlActor, umlFrame, swimlane class boxes with child rows/lines,
and edges (source/target or explicit points) with classic/open/block/diamond ends.

Usage: python drawio_render.py <diagram.drawio> <out.png> [scale]
"""
import html
import math
import os
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
BORDER = 10


def parse_style(s):
    d = {}
    for tok in (s or "").split(";"):
        if not tok:
            continue
        if "=" in tok:
            k, v = tok.split("=", 1)
            d[k] = v
        else:
            d[tok] = "1"
    return d


class Cell:
    def __init__(self, el):
        self.id = el.get("id")
        self.parent = el.get("parent")
        self.value = el.get("value") or ""
        self.style = parse_style(el.get("style"))
        self.vertex = el.get("vertex") == "1"
        self.edge = el.get("edge") == "1"
        self.source = el.get("source")
        self.target = el.get("target")
        g = el.find("mxGeometry")
        self.x = self.y = self.w = self.h = 0.0
        self.sp = self.tp = None
        self.points = []
        if g is not None:
            self.x = float(g.get("x", 0))
            self.y = float(g.get("y", 0))
            self.w = float(g.get("width", 0))
            self.h = float(g.get("height", 0))
            for p in g.findall("mxPoint"):
                pt = (float(p.get("x", 0)), float(p.get("y", 0)))
                if p.get("as") == "sourcePoint":
                    self.sp = pt
                elif p.get("as") == "targetPoint":
                    self.tp = pt
            arr = g.find("Array")
            if arr is not None:
                self.points = [(float(p.get("x", 0)), float(p.get("y", 0))) for p in arr.findall("mxPoint")]


def load(path):
    root = ET.parse(path).getroot()
    cells = [Cell(c) for c in root.iter("mxCell")]
    by_id = {c.id: c for c in cells}
    # absolute coordinates for nested vertices
    for c in cells:
        if c.vertex:
            p = by_id.get(c.parent)
            ax, ay = c.x, c.y
            while p is not None and p.vertex:
                ax += p.x
                ay += p.y
                p = by_id.get(p.parent)
            c.ax, c.ay = ax, ay
    return cells, by_id


def anchor(c, fx, fy):
    return (c.ax + c.w * fx, c.ay + c.h * fy)


def auto_ends(s, t):
    scx, scy = s.ax + s.w / 2, s.ay + s.h / 2
    tcx, tcy = t.ax + t.w / 2, t.ay + t.h / 2
    dx, dy = tcx - scx, tcy - scy
    if abs(dy) >= abs(dx):
        a = (0.5, 1) if dy > 0 else (0.5, 0)
        b = (0.5, 0) if dy > 0 else (0.5, 1)
    else:
        a = (1, 0.5) if dx > 0 else (0, 0.5)
        b = (0, 0.5) if dx > 0 else (1, 0.5)
    return a, b


def edge_path(e, by_id):
    st = e.style
    s = by_id.get(e.source)
    t = by_id.get(e.target)
    if s is not None and t is not None:
        a, b = auto_ends(s, t)
        if "exitX" in st:
            a = (float(st["exitX"]), float(st["exitY"]))
        if "entryX" in st:
            b = (float(st["entryX"]), float(st["entryY"]))
        p0, p1 = anchor(s, *a), anchor(t, *b)
    else:
        p0, p1 = e.sp, e.tp
    pts = [p0] + list(e.points) + [p1]
    if st.get("edgeStyle") == "orthogonalEdgeStyle" and not e.points:
        # one bend: leave along the exit direction, then turn
        ex = a if s is not None else None
        if ex and ex[1] in (0, 1):
            pts = [p0, (p0[0], p1[1]), p1]
        else:
            pts = [p0, (p1[0], p0[1]), p1]
    # straighten tiny drifts on straight edges
    return pts


def poly_len(pts):
    return sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def point_at(pts, frac):
    total = poly_len(pts) * frac
    for i in range(len(pts) - 1):
        seg = math.dist(pts[i], pts[i + 1])
        if seg >= total and seg > 0:
            r = total / seg
            return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r,
                    pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r), i
        total -= seg
    return pts[-1], len(pts) - 2


def marker(kind, fill, tip, frm, stroke):
    """SVG for an arrow head at tip, pointing from frm to tip."""
    ang = math.atan2(tip[1] - frm[1], tip[0] - frm[0])
    ca, sa = math.cos(ang), math.sin(ang)

    def P(l, w):  # l back along the line, w sideways
        return (tip[0] - ca * l - sa * w, tip[1] - sa * l + ca * w)

    if kind in ("none", None):
        return ""
    if kind == "open":
        a, b = P(8, 4), P(8, -4)
        return f'<polyline points="{a[0]},{a[1]} {tip[0]},{tip[1]} {b[0]},{b[1]}" fill="none" stroke="{stroke}" stroke-width="1"/>'
    if kind in ("diamond", "diamondThin"):
        wd = 4 if kind == "diamondThin" else 6
        pts = [tip, P(7, wd), P(14, 0), P(7, -wd)]
    elif kind == "block":
        pts = [tip, P(10, 5), P(10, -5)]
    else:  # classic
        pts = [tip, P(7, 3.5), P(5.25, 0), P(7, -3.5)]
    f = stroke if fill else "#ffffff"
    s = " ".join(f"{x},{y}" for x, y in pts)
    return f'<polygon points="{s}" fill="{f}" stroke="{stroke}" stroke-width="1"/>'


def trim(pts, kind, at_end):
    """Shorten the line so it ends at the back of the arrow head."""
    back = {"classic": 5.25, "block": 10, "diamond": 14, "diamondThin": 14}.get(kind, 0)
    if not back:
        return pts
    pts = list(pts)
    i, j = (-1, -2) if at_end else (0, 1)
    (x1, y1), (x0, y0) = pts[i], pts[j]
    d = math.dist((x0, y0), (x1, y1)) or 1
    pts[i] = (x1 - (x1 - x0) / d * back, y1 - (y1 - y0) / d * back)
    return pts


def text_div(x, y, w, h, value, st, default_size=12, wrap=True):
    size = st.get("fontSize", default_size)
    fs = int(st.get("fontStyle", "0"))
    align = st.get("align", "center")
    valign = st.get("verticalAlign", "middle")
    color = st.get("fontColor", "#000000")
    sl = float(st.get("spacingLeft", 0)) + float(st.get("spacing", 2))
    sr = float(st.get("spacingRight", 0)) + float(st.get("spacing", 2))
    stp = float(st.get("spacingTop", 0)) + float(st.get("spacing", 2))
    jc = {"left": "flex-start", "right": "flex-end"}.get(align, "center")
    ai = {"top": "flex-start", "bottom": "flex-end"}.get(valign, "center")
    css = (f"position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;display:flex;"
           f"justify-content:{jc};align-items:{ai};box-sizing:border-box;padding:{stp}px {sr}px 0 {sl}px;")
    inner = (f"font-size:{size}px;font-family:Helvetica,Arial,sans-serif;line-height:1.2;color:{color};"
             f"text-align:{align};white-space:{'normal' if wrap else 'nowrap'};"
             f"{'font-weight:bold;' if fs & 1 else ''}{'font-style:italic;' if fs & 2 else ''}"
             f"{'text-decoration:underline;' if fs & 4 else ''}")
    return f'<div style="{css}"><div style="{inner}" dir="auto">{value}</div></div>'


def render(path, out_png, scale=3):
    cells, by_id = load(path)
    verts = [c for c in cells if c.vertex]
    edges = [c for c in cells if c.edge]
    xs, ys = [], []
    for v in verts:
        extra = 18 if v.style.get("shape") == "umlActor" else 0
        xs += [v.ax, v.ax + v.w]
        ys += [v.ay, v.ay + v.h + extra]
    paths = {e.id: edge_path(e, by_id) for e in edges}
    for p in paths.values():
        xs += [q[0] for q in p]
        ys += [q[1] for q in p]
    minx, miny = min(xs) - BORDER, min(ys) - BORDER
    W, H = math.ceil(max(xs) - minx + BORDER), math.ceil(max(ys) - miny + BORDER)

    svg, divs = [], []
    T = lambda p: (p[0] - minx, p[1] - miny)

    def draw_vertex(v):
        st = v.style
        x, y = v.ax - minx, v.ay - miny
        w, h = v.w, v.h
        fill = st.get("fillColor", "#ffffff")
        fill = "none" if fill == "none" else fill
        stroke = st.get("strokeColor", "#000000")
        stroke = "none" if stroke == "none" else stroke
        sw = st.get("strokeWidth", "1")
        dash = ' stroke-dasharray="3 3"' if st.get("dashed") == "1" else ""
        shape = st.get("shape")
        label_box = (x, y, w, h)
        if "text" in st and "swimlane" not in st:
            pass
        elif st.get("line") == "1" or shape == "line":
            yy = y + h / 2
            svg.append(f'<line x1="{x}" y1="{yy}" x2="{x + w}" y2="{yy}" stroke="{stroke}" stroke-width="{sw}"/>')
            return
        elif "swimlane" in st:
            ss = float(st.get("startSize", 26))
            r = 9 if st.get("rounded") == "1" else 0
            svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>')
            svg.append(f'<line x1="{x}" y1="{y + ss}" x2="{x + w}" y2="{y + ss}" stroke="{stroke}"/>')
            label_box = (x, y, w, ss)
        elif "rhombus" in st:
            pts = f"{x + w / 2},{y} {x + w},{y + h / 2} {x + w / 2},{y + h} {x},{y + h / 2}"
            svg.append(f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{dash}/>')
        elif shape == "endState":
            cx, cy, r = x + w / 2, y + h / 2, w / 2
            svg.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{stroke}"/>')
            svg.append(f'<circle cx="{cx}" cy="{cy}" r="{r - 4}" fill="{stroke}" stroke="{stroke}"/>')
        elif "ellipse" in st:
            svg.append(f'<ellipse cx="{x + w / 2}" cy="{y + h / 2}" rx="{w / 2}" ry="{h / 2}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
        elif shape == "umlActor":
            cx = x + w / 2
            hr = w / 4
            svg.append(f'<ellipse cx="{cx}" cy="{y + hr}" rx="{hr}" ry="{hr}" fill="{fill}" stroke="{stroke}"/>')
            svg.append(f'<path d="M {cx} {y + 2 * hr} L {cx} {y + h * 2 / 3} M {x} {y + h / 3} L {x + w} {y + h / 3} '
                       f'M {cx} {y + h * 2 / 3} L {x} {y + h} M {cx} {y + h * 2 / 3} L {x + w} {y + h}" fill="none" stroke="{stroke}"/>')
            label_box = (x - 30, y + h, w + 60, 18)
        elif shape == "umlFrame":
            fw, fh = float(st.get("width", 60)), float(st.get("height", 30))
            svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{stroke}"/>')
            svg.append(f'<path d="M {x} {y} L {x + fw} {y} L {x + fw} {y + fh * 0.7} L {x + fw * 0.9} {y + fh} L {x} {y + fh} Z" fill="#ffffff" stroke="{stroke}"/>')
            label_box = (x, y, fw, fh)
        else:  # rectangle
            r = min(w, h) * float(st.get("arcSize", 15)) / 100 if st.get("rounded") == "1" else 0
            svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{dash}/>')
        if v.value:
            wrap = st.get("whiteSpace") == "wrap"
            divs.append(text_div(*label_box, v.value, st, wrap=wrap))

    def draw_edge(e):
        st = e.style
        pts = paths[e.id]
        stroke = st.get("strokeColor", "#000000")
        end_k = st.get("endArrow", "classic")
        start_k = st.get("startArrow", "none")
        end_fill = st.get("endFill", "1") != "0"
        start_fill = st.get("startFill", "1") != "0"
        line = trim(trim(pts, end_k, True), start_k, False)
        dash = ' stroke-dasharray="3 3"' if st.get("dashed") == "1" else ""
        sw = st.get("strokeWidth", "1")
        svg.append('<polyline points="' + " ".join(f"{T(p)[0]},{T(p)[1]}" for p in line) +
                   f'" fill="none" stroke="{stroke}" stroke-width="{sw}"{dash}/>')
        svg.append(marker(end_k, end_fill, T(pts[-1]), T(pts[-2]), stroke))
        if start_k != "none":
            svg.append(marker(start_k, start_fill, T(pts[0]), T(pts[1]), stroke))
        if e.value:
            (mx, my), _ = point_at(pts, 0.5)
            mx, my = mx - minx, my - miny
            lw, lh = 300, 60
            st2 = dict(st)
            st2.setdefault("fontSize", "11")
            if st.get("verticalAlign") == "bottom":
                box = (mx - lw / 2, my - lh - 1, lw, lh)
                st2["align"] = "center"
            elif st.get("align") == "left":
                box = (mx, my - lh / 2, lw, lh)
                st2["verticalAlign"] = "middle"
            elif st.get("align") == "right":
                box = (mx - lw, my - lh / 2, lw, lh)
                st2["verticalAlign"] = "middle"
            else:
                box = (mx - lw / 2, my - lh / 2, lw, lh)
            bg = st.get("labelBackgroundColor", "#ffffff")
            val = e.value if bg == "none" else f'<span style="background:{bg}">{e.value}</span>'
            divs.append(text_div(*box, val, st2, default_size=11, wrap=False))

    for c in cells:
        if c.vertex:
            draw_vertex(c)
        elif c.edge:
            draw_edge(c)

    page = ("<!DOCTYPE html><html><head><meta charset='utf-8'><style>html,body{margin:0;padding:0;background:#fff;}"
            f"#c{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:#fff}}</style></head><body><div id='c'>"
            f"<svg xmlns='http://www.w3.org/2000/svg' width='{W}' height='{H}' style='position:absolute;left:0;top:0'>"
            + "".join(svg) + "</svg>" + "".join(divs) + "</div></body></html>")
    edge_exe = next(p for p in EDGE_PATHS if os.path.exists(p))
    with tempfile.TemporaryDirectory() as td:
        hp = os.path.join(td, "d.html")
        with open(hp, "w", encoding="utf-8") as f:
            f.write(page)
        out_abs = os.path.abspath(out_png)
        subprocess.run([edge_exe, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        f"--force-device-scale-factor={scale}", f"--window-size={W},{H}",
                        "--default-background-color=ffffffff", f"--user-data-dir={td}\\prof",
                        f"--screenshot={out_abs}", "file:///" + hp.replace("\\", "/")],
                       check=True, capture_output=True, timeout=120)
    return W, H


if __name__ == "__main__":
    sc = float(sys.argv[3]) if len(sys.argv) > 3 else 3
    print(render(sys.argv[1], sys.argv[2], sc))
