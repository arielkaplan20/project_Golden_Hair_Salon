"""Generate the draw.io diagrams for the Golden Hair Salon project book (chapters 5-9).

Every diagram is written as an editable .drawio file into diagrams/, then rendered to PNG
with drawio_render.py. Names come from the book: actors, the components in the SAD
(Users / Appointments / Schedule / Shop & Orders Manager) and their databases.

Usage: python build_diagrams.py            (from the diagrams/ folder)
"""
import os
from xml.sax.saxutils import quoteattr

import drawio_render

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # diagrams/

HEAD = "rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
BAR = "rounded=0;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
LIFELINE = "endArrow=none;html=1;dashed=1;strokeColor=#000000;"
MSG = "endArrow=block;endFill=1;html=1;rounded=0;verticalAlign=bottom;labelBackgroundColor=none;"
RET = "endArrow=open;endFill=0;html=1;rounded=0;dashed=1;verticalAlign=bottom;labelBackgroundColor=none;"
SELF = "endArrow=block;endFill=1;html=1;rounded=0;align=left;spacingLeft=4;labelBackgroundColor=none;"
FRAME = "shape=umlFrame;whiteSpace=wrap;html=1;width=50;height=20;fillColor=none;"
TEXT = "text;html=1;align=left;verticalAlign=middle;whiteSpace=nowrap;fillColor=none;strokeColor=none;"
ELSE_LINE = "endArrow=none;html=1;dashed=1;"


class Diagram:
    def __init__(self, name):
        self.name = name
        self.cells = []
        self.n = 0

    def _id(self, prefix):
        self.n += 1
        return f"{prefix}{self.n}"

    def vertex(self, value, style, x, y, w, h, parent="1", cid=None):
        cid = cid or self._id("v")
        self.cells.append(
            f'<mxCell id="{cid}" value={quoteattr(value)} style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" /></mxCell>')
        return cid

    def edge(self, value, style, sp=None, tp=None, points=(), source=None, target=None):
        cid = self._id("e")
        st = f' source="{source}"' if source else ""
        tg = f' target="{target}"' if target else ""
        geo = '<mxGeometry relative="1" as="geometry">'
        if sp:
            geo += f'<mxPoint x="{sp[0]}" y="{sp[1]}" as="sourcePoint" />'
        if tp:
            geo += f'<mxPoint x="{tp[0]}" y="{tp[1]}" as="targetPoint" />'
        if points:
            geo += '<Array as="points">' + "".join(f'<mxPoint x="{x}" y="{y}" />' for x, y in points) + "</Array>"
        geo += "</mxGeometry>"
        self.cells.append(f'<mxCell id="{cid}" value={quoteattr(value)} style="{style}" edge="1" parent="1"{st}{tg}>{geo}</mxCell>')
        return cid

    def save(self):
        path = os.path.join(OUT, self.name + ".drawio")
        xml = ('<mxfile host="app.diagrams.net"><diagram name=' + quoteattr(self.name) + ' id="d1">'
               '<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
               'arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="1600" math="0" shadow="0">'
               '<root><mxCell id="0" /><mxCell id="1" parent="0" />' + "".join(self.cells) +
               "</root></mxGraphModel></diagram></mxfile>")
        with open(path, "w", encoding="utf-8") as f:
            f.write(xml)
        png = os.path.join(OUT, self.name + ".png")
        drawio_render.render(path, png, 3)
        return png


# ---------------------------------------------------------------- sequence diagrams
def sequence(name, parts, steps, spacing=None, font=None, left=150, right_pad=130):
    """parts: [(key, label, 'actor'|'box')]
    steps: list of
      ('m', from, to, text)      call        ('r', from, to, text) return (dashed)
      ('s', who, text)           self call
      ('frame', kind, guard)     open a combined fragment (alt / opt / break / loop)
      ('else', guard)            separator inside the open alt
      ('end',)                   close the fragment
    Message numbering is automatic: <prefix>.<k>.
    font: text size of the messages (default 11) - the heads, the frames and the gaps between the messages
    grow with it; left: x of the first lifeline; right_pad: how far the frames reach past the last lifeline."""
    d = Diagram(name)
    spacing = spacing or (250 if len(parts) <= 3 else 215)
    xs = {k: left + i * spacing for i, (k, _, _) in enumerate(parts)}
    fs = f"fontSize={font};" if font else ""
    k_ = max(1, font / 12) if font else 1           # 1 keeps every other diagram exactly as it was
    step, self_step = round(45 * k_), round(55 * k_)
    hw, hh = round(120 * k_), round(40 * k_ ** 0.5)
    tab_w, tab_h = round(50 * k_), round(20 * k_)
    frame_style = FRAME.replace("width=50;height=20;", f"width={tab_w};height={tab_h};") + fs
    text_style = TEXT + fs
    kinds = {k: kind for k, _, kind in parts}
    top = 20
    for k, label, kind in parts:
        if kind == "actor":
            d.vertex(label, ACTOR + fs, xs[k] - 15, top, 30, 50)
        else:
            d.vertex(label, HEAD + fs, xs[k] - hw / 2, top + 5, hw, hh)
    y = 120
    frames, stack, msgs, pending = [], [], [], []
    num = 0
    prefix = name.split("_")[0].replace("SEQ-SUC-", "").replace("OBJ-", "")
    for s in steps:
        t = s[0]
        if t == "frame":
            y += 20
            stack.append({"kind": s[1], "guard": s[2], "y0": y - 10, "elses": []})
            y += round(30 * k_)
            continue
        if t == "else":
            y += 5
            stack[-1]["elses"].append((y, s[1]))
            y += step
            continue
        if t == "end":
            fr = stack.pop()
            fr["y1"] = y - 10
            frames.append((len(stack), fr))
            y += 15
            continue
        label = f"{prefix}.{num} {s[-1]}" if prefix.isdigit() else f"{num + 1}: {s[-1]}"
        num += 1
        if t == "s":
            x = xs[s[1]]
            pending.append((label, SELF + fs, (x + 5, y), (x + 5, y + 20), [(x + 40, y), (x + 40, y + 20)]))
            msgs.append((s[1], y - 6, 32))
            y += self_step
        else:
            a, b = xs[s[1]], xs[s[2]]
            off = 5 if b > a else -5
            pending.append((label, (MSG if t == "m" else RET) + fs, (a + off, y), (b - off, y), []))
            msgs.append((s[2], y - 8, 24))
            y += step
    bottom = y + 10
    # lifelines and activation bars
    for k, _, kind in parts:
        start = top + 70 if kind == "actor" else top + 5 + hh
        d.edge("", LIFELINE, sp=(xs[k], start), tp=(xs[k], bottom))
        if kind == "actor":
            d.vertex("", BAR, xs[k] - 5, 100, 10, bottom - 110)
    for k, by, bh in msgs:
        if kinds[k] != "actor":
            d.vertex("", BAR, xs[k] - 5, by, 10, bh)
    # combined fragments (outer ones first so inner ones draw on top)
    right = max(xs.values()) + right_pad
    for depth, fr in sorted(frames, key=lambda f: f[0]):
        x0 = 15 + depth * 12
        w = right - x0 - depth * 12
        d.vertex(f"<b>{fr['kind']}</b>", frame_style, x0, fr["y0"], w, fr["y1"] - fr["y0"])
        # white behind the guard only, so a lifeline or activation bar never runs through its text
        d.vertex(f"<span style='background:#ffffff'>[{fr['guard']}]</span>", text_style, x0 + tab_w + 5, fr["y0"],
                 400, tab_h)
        for ey, g in fr["elses"]:
            d.edge("", ELSE_LINE, sp=(x0, ey), tp=(x0 + w, ey))
            d.vertex(f"<span style='background:#ffffff'>[{g}]</span>", text_style, x0 + 5, ey + 2, 400, tab_h)
    for label, style, sp, tp, pts in pending:
        d.edge(label, style, sp=sp, tp=tp, points=pts)
    return d.save()


# ---------------------------------------------------------------- class boxes
CLS = ("swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;"
       "horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=0;marginBottom=0;rounded=1;html=1;"
       "fillColor=#fff2cc;strokeColor=#d6b656;fontSize=14;")
ROWS = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;whiteSpace=wrap;html=1;fontSize=11;"
SEP = "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;strokeColor=#d6b656;"


def class_box(d, name, attrs, methods, x, y, w=200, big=False):
    """big: larger text and tighter rows, for a diagram that has to be read on a full book page."""
    head, line, pad = (30, 16, 6) if big else (26, 15, 8)
    cls = CLS.replace("startSize=26", "startSize=30").replace("fontSize=14", "fontSize=16") if big else CLS
    rows = ROWS.replace("fontSize=11", "fontSize=13") if big else ROWS
    # a class without fields of its own gets an empty fields box; a data class without operations has no operations box
    ah = len(attrs) * line + pad if attrs else 10
    mh = len(methods) * line + pad if methods else 0
    h = head + ah + (8 + mh if methods else 0)
    cid = d.vertex(name, cls, x, y, w, h)
    d.vertex("<br>".join(attrs), rows, 0, head, w, ah, parent=cid)
    if methods:
        d.vertex("", SEP, 0, head + ah, w, 8, parent=cid)
        d.vertex("<br>".join(methods), rows, 0, head + ah + 8, w, mh, parent=cid)
    return cid, (x, y, w, h)


LABEL_ABOVE = "verticalAlign=bottom;labelBackgroundColor=none;"      # label sits just above a horizontal line
LABEL_SIDE = "align=left;spacingLeft=6;labelBackgroundColor=none;"   # label next to a vertical line


def link(d, style, src, tgt, pts, a, b, label="", place="above"):
    """Edge between two boxes; a/b are (fx, fy) anchor fractions, pts are bend points.
    place: where the label goes relative to the middle of the line - "above" or "side"."""
    s = f"{style}exitX={a[0]};exitY={a[1]};entryX={b[0]};entryY={b[1]};"
    if label:
        s += LABEL_SIDE if place == "side" else LABEL_ABOVE
    return d.edge(label, s, points=pts, source=src, target=tgt)


INHERIT = "endArrow=block;endFill=0;endSize=10;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;"
ASSOC = "endArrow=open;endFill=0;html=1;rounded=0;labelBackgroundColor=#ffffff;"
AGGR = "endArrow=none;startArrow=diamondThin;startFill=0;startSize=14;html=1;rounded=0;labelBackgroundColor=#ffffff;"
COMP = "endArrow=none;startArrow=diamondThin;startFill=1;startSize=14;html=1;rounded=0;labelBackgroundColor=#ffffff;"
MULT = "text;html=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=11;"
CONCEPT = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=14;fontStyle=1;"


def mult(d, text, x, y, size=11):
    d.vertex(text, MULT.replace("fontSize=11", f"fontSize={size}"), x - 20, y - 10, 40, 20)


REL = "text;html=1;fillColor=none;strokeColor=none;whiteSpace=nowrap;fontSize=12;"


def rel(d, text, x, y, place):
    """Name of a relationship as its own text, so no line ever runs through it.
    place "above": (x, y) is the middle of a horizontal line; "left"/"right": (x, y) is a point on a vertical line."""
    w = 150
    if place == "above":
        d.vertex(text, REL + "align=center;verticalAlign=bottom;", x - w / 2, y - 22, w, 20)
    elif place == "left":
        d.vertex(text, REL + "align=right;verticalAlign=middle;", x - 6 - w, y - 10, w, 20)
    else:
        d.vertex(text, REL + "align=left;verticalAlign=middle;", x + 6, y - 10, w, 20)


def center_x(box, f=0.5):
    return box[0] + box[2] * f


# ---------------------------------------------------------------- PDOM (conceptual map)
def pdom_concept():
    d = Diagram("PDOM-concept")
    W, H = 160, 60
    pos = {"User": (180, 20), "Client": (30, 170), "Barber": (330, 170), "Admin": (630, 170),
           "Order": (30, 340), "Appointment": (330, 340), "WorkSchedule": (630, 340),
           "OrderItem": (30, 500), "Product": (300, 500)}
    heb = {"User": "User<br><span style='font-weight:normal'>משתמש</span>",
           "Admin": "Admin<br><span style='font-weight:normal'>מנהל ראשי</span>",
           "Client": "Client<br><span style='font-weight:normal'>לקוח</span>",
           "Barber": "Barber<br><span style='font-weight:normal'>נותן שירות (ספר)</span>",
           "Order": "Order<br><span style='font-weight:normal'>הזמנה בחנות</span>",
           "Appointment": "Appointment<br><span style='font-weight:normal'>תור</span>",
           "WorkSchedule": "WorkSchedule<br><span style='font-weight:normal'>ימי ושעות עבודה</span>",
           "OrderItem": "OrderItem<br><span style='font-weight:normal'>פריט בהזמנה</span>",
           "Product": "Product<br><span style='font-weight:normal'>מוצר</span>"}
    ids, box = {}, {}
    for k, (x, y) in pos.items():
        ids[k] = d.vertex(heb[k], CONCEPT, x, y, W, H)
        box[k] = (x, y, W, H)
    # Client and Barber are users; the admin also works as a barber
    trunk = 125
    for k in ("Client", "Barber"):
        link(d, INHERIT, ids[k], ids["User"], [(center_x(box[k]), trunk), (260, trunk)], (0.5, 0), (0.5, 1))
    link(d, INHERIT, ids["Admin"], ids["Barber"], [], (0, 0.5), (1, 0.5))
    # Client places Orders: straight down
    link(d, ASSOC, ids["Client"], ids["Order"], [], (0.25, 1), (0.25, 0))
    rel(d, "לקוח מבצע הזמנות", 70, 262, "right")
    mult(d, "1", 58, 245); mult(d, "0..*", 52, 325)
    # Client books Appointments: down, right, down
    link(d, ASSOC, ids["Client"], ids["Appointment"], [(180, 290), (370, 290)], (0.9375, 1), (0.25, 0))
    rel(d, "לקוח מזמין תורים", 275, 290, "above")
    mult(d, "1", 192, 245); mult(d, "0..*", 352, 325)
    # Barber performs Appointments: straight down
    link(d, ASSOC, ids["Barber"], ids["Appointment"], [], (0.5, 1), (0.5, 0))
    rel(d, "ספר מבצע תורים", 410, 260, "left")
    mult(d, "1", 422, 245); mult(d, "0..*", 428, 325)
    # Barber owns his work schedule: down, right, down
    link(d, COMP, ids["Barber"], ids["WorkSchedule"], [(470, 290), (670, 290)], (0.875, 1), (0.25, 0))
    rel(d, "ספר מגדיר סדר עבודה", 570, 290, "above")
    mult(d, "1", 482, 245); mult(d, "1", 682, 325)
    # Order is made of OrderItems, each refers to a Product
    link(d, COMP, ids["Order"], ids["OrderItem"], [], (0.5, 1), (0.5, 0))
    rel(d, "הזמנה מכילה פריטים", 110, 450, "right")
    mult(d, "1", 125, 412); mult(d, "1..*", 128, 488)
    link(d, ASSOC, ids["OrderItem"], ids["Product"], [], (1, 0.5), (0, 0.5))
    rel(d, "פריט מתייחס למוצר", 245, 530, "above")
    mult(d, "0..*", 208, 544); mult(d, "1", 290, 544)   # below the line, the label is above it
    return d.save()


# ---------------------------------------------------------------- PDOM (infrastructure classes)
def pdom_classes():
    # Matches the code: the fields are those of the models in app/server/src/models (a reference to another
    # class is shown with the field name from the code, e.g. clientId: Client), and the operations are the server
    # functions, each on the class of the user who performs it. Appointment, Order, OrderItem and Product are data
    # only, so they have no operations box. The admin also works as a barber (every admin gets a work schedule),
    # so Admin inherits from Barber. The lines have no arrow heads: the reference is kept on the side that has the field.
    # It gets a book page of its own, so the text is larger and every box is only as wide as its text.
    d = Diagram("PDOM-classes")
    X1, X2, X3 = 0, 235, 455            # three columns, 60 px apart
    W1, W2, W3 = 175, 160, 255
    c = {}
    cx1, cx2 = X1 + W1 / 2, X2 + W2 / 2
    UW = 180
    c["User"] = class_box(d, "User", ["- firstName: String", "- lastName: String", "- email: String",
                                      "- passwordHash: String", "- address: String", "- birthDate: Date",
                                      "- role: String", "- resetToken: String", "- resetTokenExpires: Date"],
                          ["+ register()", "+ login()", "+ updateProfile()", "+ forgotPassword()", "+ resetPassword()"],
                          (cx1 + cx2) / 2 - UW / 2, 0, UW, big=True)
    y2 = c["User"][1][3] + 44
    c["Client"] = class_box(d, "Client", [],
                            ["+ getBarbers()", "+ getFreeSlots()", "+ bookAppointment()", "+ myAppointments()",
                             "+ changeAppointment()", "+ cancelAppointment()", "+ getProducts()", "+ getProduct()",
                             "+ createOrder()", "+ myOrders()"],
                            X1, y2, W1, big=True)
    c["Barber"] = class_box(d, "Barber", [],
                            ["+ getDiary()", "+ getMySchedule()", "+ updateMySchedule()", "+ saveException()",
                             "+ deleteException()"], X2, y2, W2, big=True)
    c["Admin"] = class_box(d, "Admin", [],
                           ["+ getUsers()", "+ updateRole()", "+ getAllAppointments()", "+ getAllOrders()",
                            "+ addProduct()", "+ updateProduct()", "+ deleteProduct()"], X3, y2, 165, big=True)
    bottom = lambda k: c[k][1][1] + c[k][1][3]
    lane = max(bottom(k) for k in ("Client", "Barber", "Admin")) + 40   # horizontal parts of the lines below row 2
    y3 = lane + 56
    c["Order"] = class_box(d, "Order", ["- orderNumber: String", "- clientId: Client", "- items: Array&lt;OrderItem&gt;",
                                        "- deliveryType: String", "- fullName: String", "- phone: String",
                                        "- email: String", "- pickupPoint: String", "- address: String",
                                        "- notes: String", "- totalPrice: Number", "- status: String",
                                        "- createdAt: Date"], [], X1, y3, W1, big=True)
    c["Appointment"] = class_box(d, "Appointment", ["- clientId: Client", "- barberId: Barber", "- date: String",
                                                    "- time: String", "- haircutType: String", "- status: String"],
                                 [], X2, y3, W2, big=True)
    c["WorkSchedule"] = class_box(d, "WorkSchedule", ["- weeklySchedule: Array&lt;DaySchedule&gt;",
                                                      "- exceptions: Array&lt;DateException&gt;",
                                                      "- slotMinutes: Number"],
                                  ["+ defaultWeek()", "+ weeklyOf()", "+ hoursForDate(date)",
                                   "+ calcFreeSlots(hours, bookedList)", "+ findConflicts(appointments)"],
                                  X3, y3, W3, big=True)
    y4 = bottom("Order") + 70
    c["OrderItem"] = class_box(d, "OrderItem", ["- productId: Product", "- name: String", "- price: Number",
                                                "- quantity: Number"], [], X1, y4, W1, big=True)
    PX = X1 + W1 + 130                  # room above the line for the name of the link
    c["Product"] = class_box(d, "Product", ["- name: String", "- description: String", "- price: Number",
                                            "- stock: Number", "- image: String"], [], PX, y4, 160, big=True)
    ids = {k: v[0] for k, v in c.items()}
    box = {k: v[1] for k, v in c.items()}
    line = "endArrow=none;html=1;rounded=0;"

    # Client and Barber are users; the admin is a barber too
    trunk = y2 - 22
    ux = box["User"][0] + UW / 2
    for k in ("Client", "Barber"):
        link(d, INHERIT, ids[k], ids["User"], [(center_x(box[k]), trunk), (ux, trunk)], (0.5, 0), (0.5, 1))
    ym = y2 + box["Barber"][3] / 2
    link(d, INHERIT, ids["Admin"], ids["Barber"], [], (0, (ym - y2) / box["Admin"][3]), (1, 0.5))
    # the client places orders: straight down
    ox = X1 + 0.4 * W1
    link(d, line, ids["Client"], ids["Order"], [], (0.4, 1), (0.4, 0))
    rel(d, "לקוח מבצע הזמנות", ox, lane + 16, "right")   # below the lane of the Client - Appointment line
    mult(d, "1", ox + 12, bottom("Client") + 12, 12); mult(d, "0..*", ox + 18, y3 - 12, 12)
    # the client books appointments: down, right along the lane, down into Appointment
    cx, ax = X1 + 0.9 * W1, X2 + 0.25 * W2
    link(d, line, ids["Client"], ids["Appointment"], [(cx, lane), (ax, lane)], (0.9, 1), (0.25, 0))
    rel(d, "לקוח מזמין תורים", (cx + ax) / 2, lane, "above")
    mult(d, "1", cx + 12, bottom("Client") + 12, 12); mult(d, "0..*", ax - 18, y3 - 12, 12)
    # the barber performs appointments: straight down
    bx = X2 + 0.6 * W2
    link(d, line, ids["Barber"], ids["Appointment"], [], (0.6, 1), (0.6, 0))
    rel(d, "ספר מבצע תורים", bx, (bottom("Barber") + lane) / 2, "left")
    mult(d, "1", bx + 12, bottom("Barber") + 12, 12); mult(d, "0..*", bx + 18, y3 - 12, 12)
    # the barber's work schedule is kept inside his record: down, right along the lane, down into WorkSchedule
    sx, wx = X2 + 0.9 * W2, X3 + 0.35 * W3
    link(d, COMP, ids["Barber"], ids["WorkSchedule"], [(sx, lane), (wx, lane)], (0.9, 1), (0.35, 0))
    rel(d, "ספר מגדיר סדר עבודה", (sx + wx) / 2, lane, "above")
    mult(d, "1", sx + 12, bottom("Barber") + 12, 12); mult(d, "1", wx + 12, y3 - 12, 12)
    # an order is made of order items
    link(d, COMP, ids["Order"], ids["OrderItem"], [], (0.5, 1), (0.5, 0))
    rel(d, "הזמנה מכילה פריטים", X1 + W1 / 2, (bottom("Order") + y4) / 2, "right")
    mult(d, "1", X1 + W1 / 2 - 12, bottom("Order") + 12, 12); mult(d, "1..*", X1 + W1 / 2 - 18, y4 - 12, 12)
    # each order item refers to one product; the numbers go below the line, the name above it
    ly = y4 + 45
    link(d, line, ids["OrderItem"], ids["Product"], [], (1, 45 / box["OrderItem"][3]), (0, 45 / box["Product"][3]))
    rel(d, "פריט מתייחס למוצר", (X1 + W1 + PX) / 2, ly, "above")
    mult(d, "0..*", X1 + W1 + 18, ly + 12, 12); mult(d, "1", PX - 12, ly + 12, 12)
    return d.save()


# ---------------------------------------------------------------- component class diagrams
def component_users():
    # Matches the code: the screens are the React pages (each operation is the function in the page that sends the
    # request), Users Manager is authController.js + adminController.js, Users DB is the users collection that the
    # User model reads and writes, and User has the fields of models/User.js.
    d = Diagram("CLS-UsersManager")
    W, XU = 190, 340
    gui = class_box(d, "User Client (GUI)", ["- firstName: String", "- lastName: String", "- email: String",
                                             "- address: String", "- birthDate: String", "- password: String",
                                             "- confirmPassword: String", "- error: String"],
                    ["+ Register.handleSubmit(e)", "+ Login.handleSubmit(e)", "+ saveAuth(token, user)",
                     "+ Profile.save(e)", "+ ForgotPassword.submit(e)", "+ ResetPassword.submit(e)",
                     "+ ManageUsers.confirm()"], 0, 0, W, big=True)
    ym = gui[1][3] + 80
    um = class_box(d, "Users Manager", [],
                   ["+ register(req, res)", "+ login(req, res)", "+ me(req, res)", "+ updateProfile(req, res)",
                    "+ forgotPassword(req, res)", "+ resetPassword(req, res)", "+ getUsers(req, res)",
                    "+ updateRole(req, res)", "- createToken(user)"], 0, ym, W, big=True)
    yd = ym + um[1][3] + 80
    db = class_box(d, "Users DB", ["- users: Collection&lt;User&gt;"],
                   ["+ findOne(filter)", "+ findById(id)", "+ find()", "+ create(data)"], 0, yd, W, big=True)
    u = class_box(d, "User", ["- firstName: String", "- lastName: String", "- email: String", "- passwordHash: String",
                              "- address: String", "- birthDate: Date", "- role: String", "- resetToken: String",
                              "- resetTokenExpires: Date"], ["+ save()"], XU, ym, 190, big=True)
    x = W / 2
    link(d, ASSOC, gui[0], um[0], [], (0.5, 1), (0.5, 0))
    rel(d, "המסך שולח בקשה לשרת", x, (gui[1][3] + ym) / 2, "right")
    link(d, ASSOC, um[0], db[0], [], (0.5, 1), (0.5, 0))
    rel(d, "שומר ושולף משתמשים", x, (ym + um[1][3] + yd) / 2, "right")
    link(d, ASSOC, um[0], u[0], [], (1, 40 / um[1][3]), (0, 40 / u[1][3]))
    rel(d, "יוצר ומעדכן משתמשים", (W + XU) / 2, ym + 40, "above")
    ly, ux = yd + 50, XU + 95
    link(d, ASSOC, db[0], u[0], [(ux, ly)], (1, 50 / db[1][3]), (0.5, 1))
    rel(d, "מכיל את כל המשתמשים", (W + ux) / 2, ly, "above")
    mult(d, "1", W + 12, ly + 12, 12); mult(d, "0..*", ux + 18, ym + u[1][3] + 14, 12)
    return d.save()


def component_appointments():
    d = Diagram("CLS-AppointmentsManager")
    a = class_box(d, "Appointment Client (GUI)", ["- selectedBarber: String", "- selectedDate: Date", "- selectedTime: String"],
                  ["+ chooseBarber(barberId)", "+ chooseDate(date)", "+ confirmBooking()", "+ showMessage(text)"], 255, 20, 250)
    b = class_box(d, "Appointments Manager", ["- appointmentsDB: AppointmentsDB", "- providersDB: ServiceProvidersDB"],
                  ["+ getAvailableSlots(barberId, date)", "+ BookAppointment(clientId, barberId, date, time)",
                   "+ changeAppointment(apptId, date, time)", "+ cancelAppointment(apptId)",
                   "+ getClientAppointments(clientId)", "- calcFreeSlots(schedule, bookedList)"], 230, 250, 300)
    c = class_box(d, "Service Providers DB", ["- barbers: Collection&lt;Barber&gt;"],
                  ["+ getBarbers()", "+ getWorkSchedule(barberId)"], 20, 540, 230)
    e = class_box(d, "Appointments DB", ["- appointments: Collection&lt;Appointment&gt;"],
                  ["+ findByBarberAndDate(barberId, date)", "+ insertAppointment(appt)", "+ updateAppointment(appt)"],
                  520, 540, 250)   # cancelling goes through updateAppointment (status), as in the state machine
    ap = class_box(d, "Appointment", ["- clientId: String", "- barberId: String", "- date: Date", "- time: String",
                                      "- status: String"], ["+ reschedule(date, time)", "+ cancel()"], 580, 250, 190)
    link(d, ASSOC, a[0], b[0], [], (0.5, 1), (0.5, 0), "בקשת תור", "side")
    bb = b[1]
    ybot = bb[1] + bb[3]
    link(d, ASSOC, b[0], c[0], [(300, ybot + 40), (135, ybot + 40)], (70 / 300, 1), (0.5, 0), "שעות עבודה")
    link(d, ASSOC, b[0], e[0], [(460, ybot + 40), (600, ybot + 40)], (230 / 300, 1), (80 / 250, 0), "שמירה / שליפה")
    link(d, ASSOC, b[0], ap[0], [], (1, 45 / bb[3]), (0, 45 / ap[1][3]), "יוצר")
    link(d, ASSOC, e[0], ap[0], [], ((675 - 520) / 250, 0), (0.5, 1), "מכיל", "side")
    return d.save()


# ---------------------------------------------------------------- state machine
STATE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcc99;strokeColor=#d79b00;fontStyle=5;fontSize=14;verticalAlign=top;spacingTop=10;"
TRANS = "endArrow=block;endFill=1;html=1;rounded=0;labelBackgroundColor=none;"


def state_machine():
    d = Diagram("STATE-Appointment")
    d.vertex("<b>sd</b> State Machine<br>Appointment", "shape=umlFrame;whiteSpace=wrap;html=1;width=130;height=40;fillColor=none;",
             0, 0, 720, 560)
    st = d.vertex("", "ellipse;html=1;fillColor=#000000;strokeColor=#000000;", 440, 30, 30, 30)
    booked = d.vertex("תור נקבע", STATE, 360, 110, 190, 80)
    cancel = d.vertex("תור בוטל", STATE, 30, 110, 190, 80)
    done = d.vertex("תור הושלם", STATE, 360, 300, 190, 80)
    end1 = d.vertex("", "ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;", 110, 300, 30, 30)
    end2 = d.vertex("", "ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;", 440, 480, 30, 30)
    link(d, TRANS + "align=left;spacingLeft=6;", st, booked, [], (0.5, 1), (0.5, 0), "הלקוח מאשר הזמנת תור")
    link(d, TRANS + "align=left;spacingLeft=6;", booked, booked, [(600, 130), (600, 170)], (1, 0.25), (1, 0.75),
         "שינוי תור (מועד חדש)")
    link(d, TRANS + "verticalAlign=bottom;", booked, cancel, [], (0, 0.5), (1, 0.5), "ביטול תור (לקוח / מנהל)")
    link(d, TRANS + "align=left;spacingLeft=6;", cancel, end1, [], (0.5, 1), (0.5, 0), "המועד מתפנה לשאר הלקוחות")
    link(d, TRANS + "align=left;spacingLeft=6;", booked, done, [], (0.5, 1), (0.5, 0), "מועד התור הגיע - התספורת בוצעה")
    link(d, TRANS + "align=left;spacingLeft=6;", done, end2, [], (0.5, 1), (0.5, 0), "סיום")
    return d.save()


# ---------------------------------------------------------------- the 12 system sequence diagrams
U, C, B, A = ("user", "משתמש", "actor"), ("client", "לקוח", "actor"), ("barber", "נותן שירות (ספר)", "actor"), ("admin", "מנהל ראשי", "actor")
UM, AM, SM, SOM = ("um", "Users Manager", "box"), ("am", "Appointments Manager", "box"), ("sm", "Schedule Manager", "box"), ("som", "Shop &amp; Orders Manager", "box")
UDB, SPDB, ADB, SODB = ("udb", "Users DB", "box"), ("spdb", "Service Providers DB", "box"), ("adb", "Appointments DB", "box"), ("sodb", "Shop &amp; Orders DB", "box")

SEQS = {
    "SEQ-SUC-1": ([U, UM, UDB], [
        ("m", "user", "um", "לחיצה על כפתור הרשמה"),
        ("r", "um", "user", "הצגת טופס הרשמה"),
        ("m", "user", "um", "הזנת פרטים אישיים ולחיצה על סיום הרשמה"),
        ("s", "um", "בדיקת תקינות הפרטים והתאמת הסיסמאות"),
        ("frame", "alt", "פרטים לא תקינים / חסרים"),
        ("r", "um", "user", "הצגת התראה על הפרטים השגויים - חזרה להזנת פרטים"),
        ("else", "פרטים תקינים"),
        ("m", "um", "udb", "שמירת משתמש חדש"),
        ("r", "udb", "um", "אישור שמירה"),
        ("r", "um", "user", "הודעת הרשמה הצליחה ומעבר לדף הכניסה"),
        ("end",)]),
    "SEQ-SUC-2": ([U, UM, UDB], [
        ("m", "user", "um", "הזנת דוא\"ל וסיסמה ולחיצה על התחברות"),
        ("m", "um", "udb", "שליפת המשתמש לפי דוא\"ל"),
        ("r", "udb", "um", "פרטי המשתמש"),
        ("s", "um", "אימות הסיסמה"),
        ("frame", "alt", "פרטים שגויים"),
        ("r", "um", "user", "הצגת הודעת שגיאה - חזרה להזנת דוא\"ל וסיסמה"),
        ("else", "פרטים נכונים"),
        ("r", "um", "user", "מעבר לממשק לפי הרשאה (לקוח / ספר / מנהל)"),
        ("end",)]),
    "SEQ-SUC-3": ([C, AM, SPDB, ADB], [
        ("m", "client", "am", "בחירה באפשרות הזמנת תור"),
        ("m", "am", "spdb", "שליפת רשימת הספרים"),
        ("r", "spdb", "am", "רשימת הספרים"),
        ("r", "am", "client", "הצגת רשימת הספרים"),
        ("m", "client", "am", "בחירת ספר ותאריך מלוח השנה"),
        ("m", "am", "spdb", "שליפת שעות העבודה של הספר"),
        ("r", "spdb", "am", "ימי ושעות עבודה"),
        ("m", "am", "adb", "שליפת התורים התפוסים בתאריך"),
        ("r", "adb", "am", "תורים תפוסים"),
        ("s", "am", "חישוב תורים פנויים"),
        ("frame", "alt", "אין תורים פנויים"),
        ("r", "am", "client", "הודעה: אין תורים פנויים - בחירת תאריך אחר"),
        ("else", "יש תורים פנויים"),
        ("r", "am", "client", "הצגת תורים פנויים בלבד"),
        ("m", "client", "am", "בחירת שעה ולחיצה על אישור"),
        ("m", "am", "adb", "שמירת התור"),
        ("r", "adb", "am", "אישור שמירה"),
        ("r", "am", "client", "הודעת אישור הזמנת תור"),
        ("end",)]),
    "SEQ-SUC-4": ([C, AM, ADB], [
        ("m", "client", "am", "בחירה באפשרות התורים שלי"),
        ("m", "am", "adb", "שליפת התורים העתידיים של הלקוח"),
        ("r", "adb", "am", "רשימת התורים"),
        ("frame", "alt", "אין תורים"),
        ("r", "am", "client", "הודעה: אין תורים קיימים"),
        ("else", "יש תורים"),
        ("r", "am", "client", "הצגת פירוט התורים הקיימים"),
        ("end",)]),
    "SEQ-SUC-5": ([C, AM, ADB], [
        ("m", "client", "am", "בחירה באפשרות שינוי תור"),
        ("m", "am", "adb", "שליפת התורים של הלקוח"),
        ("r", "adb", "am", "רשימת התורים"),
        ("frame", "break", "אין תורים"),
        ("r", "am", "client", "הודעה: אין תורים קיימים"),
        ("end",),
        ("r", "am", "client", "הצגת התורים הקיימים"),
        ("m", "client", "am", "לחיצה על שינוי ובחירת תאריך חדש"),
        ("m", "am", "adb", "שליפת התורים התפוסים בתאריך החדש"),
        ("r", "adb", "am", "תורים תפוסים"),
        ("s", "am", "חישוב תורים פנויים"),
        ("frame", "alt", "אין תורים פנויים"),
        ("r", "am", "client", "הודעה: אין תורים פנויים - בחירת תאריך אחר"),
        ("else", "יש תורים פנויים"),
        ("r", "am", "client", "הצגת תורים פנויים"),
        ("m", "client", "am", "בחירת שעה ולחיצה על אישור"),
        ("m", "am", "adb", "פינוי המועד הישן ועדכון התור החדש"),
        ("r", "adb", "am", "אישור עדכון"),
        ("r", "am", "client", "הודעת אישור שינוי תור"),
        ("end",)]),
    "SEQ-SUC-6": ([C, AM, ADB], [
        ("m", "client", "am", "בחירה באפשרות ביטול תור"),
        ("m", "am", "adb", "שליפת התורים של הלקוח"),
        ("r", "adb", "am", "רשימת התורים"),
        ("frame", "break", "אין תורים"),
        ("r", "am", "client", "הודעה: אין תורים קיימים"),
        ("end",),
        ("r", "am", "client", "הצגת התורים הקיימים"),
        ("m", "client", "am", "לחיצה על ביטול תור ליד התור הרלוונטי"),
        ("r", "am", "client", "הצגת חלון אישור ביטול"),
        ("frame", "alt", "הלקוח מאשר"),
        ("m", "client", "am", "אישור הביטול"),
        ("m", "am", "adb", "סימון התור כמבוטל ופינוי המועד"),
        ("r", "adb", "am", "אישור ביטול"),
        ("r", "am", "client", "הודעת אישור ביטול תור"),
        ("else", "הלקוח לא מאשר"),
        ("m", "client", "am", "לחיצה על לא - התור נשאר ללא שינוי"),
        ("end",)]),
    "SEQ-SUC-7": ([C, SOM, SODB], [
        ("m", "client", "som", "כניסה לחנות"),
        ("m", "som", "sodb", "שליפת המוצרים"),
        ("r", "sodb", "som", "רשימת המוצרים"),
        ("r", "som", "client", "הצגת כרטיסיות מוצרים"),
        ("m", "client", "som", "בחירת מוצר וכמות ולחיצה על הוסף לסל"),
        ("r", "som", "client", "עדכון הסל שלי"),
        ("m", "client", "som", "כניסה לסל ולחיצה על סיום ותשלום"),
        ("frame", "break", "הסל ריק"),
        ("r", "som", "client", "הודעה: הסל שלך ריק - חזרה לחנות"),
        ("end",),
        ("m", "client", "som", "בחירת איסוף עצמי / משלוח והזנת פרטים"),
        ("r", "som", "client", "הצגת דף תשלום"),
        ("m", "client", "som", "הזנת פרטי אשראי"),
        ("s", "som", "בדיקת פרטי אשראי תקינים"),
        ("frame", "alt", "אשראי לא תקין"),
        ("r", "som", "client", "הודעה: תשלום נכשל, אנא נסה שנית - חזרה לדף תשלום"),
        ("else", "אשראי תקין"),
        ("m", "som", "sodb", "שמירת ההזמנה ועדכון המלאי"),
        ("r", "sodb", "som", "מספר הזמנה"),
        ("r", "som", "client", "הודעת אישור הזמנה עם מספר ההזמנה"),
        ("end",)]),
    "SEQ-SUC-8": ([U, UM, UDB], [
        ("m", "user", "um", "לחיצה על פרופיל אישי"),
        ("m", "um", "udb", "שליפת הפרטים האישיים"),
        ("r", "udb", "um", "הפרטים הקיימים"),
        ("r", "um", "user", "הצגת הפרטים האישיים"),
        ("m", "user", "um", "עדכון פרטים ולחיצה על שמירת עדכון"),
        ("s", "um", "בדיקת תקינות הפרטים"),
        ("frame", "alt", "פרטים לא תקינים"),
        ("r", "um", "user", "הצגת הודעת שגיאה - חזרה לעדכון הפרטים"),
        ("else", "פרטים תקינים"),
        ("m", "um", "udb", "עדכון הפרטים"),
        ("r", "udb", "um", "אישור עדכון"),
        ("r", "um", "user", "הודעת אישור על עדכון הפרטים"),
        ("end",)]),
    "SEQ-SUC-9": ([B, SM, ADB, SPDB], [
        ("m", "barber", "sm", "בחירה באפשרות יומן תורים"),
        ("m", "sm", "adb", "שליפת התורים שנקבעו לספר בלבד"),
        ("r", "adb", "sm", "רשימת התורים"),
        ("frame", "alt", "לא נקבעו תורים"),
        ("r", "sm", "barber", "הודעה: לא נקבעו תורים עדיין"),
        ("else", "יש תורים"),
        ("r", "sm", "barber", "הצגת פירוט התורים ביומן"),
        ("end",),
        ("frame", "break", "ללא עריכה"),
        ("r", "sm", "barber", "סיום התהליך ללא שינוי בשעות העבודה"),
        ("end",),
        ("m", "barber", "sm", "בחירה בעריכת ימי ושעות עבודה"),
        ("m", "sm", "spdb", "שליפת סדר העבודה השבועי והשינויים לתאריכים"),
        ("r", "spdb", "sm", "סדר עבודה ושינויים"),
        ("r", "sm", "barber", "הצגת סדר העבודה והשינויים"),
        ("m", "barber", "sm", "עדכון סדר העבודה / שינוי לתאריך ושמירה"),
        ("s", "sm", "בדיקת תקינות השעות"),
        ("m", "sm", "adb", "שליפת התורים העתידיים של הספר"),
        ("r", "adb", "sm", "רשימת התורים"),
        ("s", "sm", "בדיקת התנגשות עם תורים שנקבעו"),
        ("frame", "alt", "שעות לא תקינות / יש תורים מחוץ לשעות החדשות"),
        ("r", "sm", "barber", "הודעת שגיאה ורשימת התורים המתנגשים"),
        ("else", "תקין"),
        ("m", "sm", "spdb", "שמירת סדר העבודה / השינוי לתאריך"),
        ("r", "spdb", "sm", "אישור עדכון"),
        ("r", "sm", "barber", "הודעת אישור על השמירה"),
        ("end",)]),
    "SEQ-SUC-10": ([A, UM, UDB], [
        ("m", "admin", "um", "לחיצה על ניהול משתמשים"),
        ("m", "um", "udb", "שליפת רשימת המשתמשים"),
        ("r", "udb", "um", "רשימת המשתמשים"),
        ("r", "um", "admin", "הצגת רשימת המשתמשים"),
        ("m", "admin", "um", "בחירת משתמש ועדכון הרשאות"),
        ("r", "um", "admin", "הצגת חלון אישור שינוי הרשאות"),
        ("frame", "alt", "המנהל מאשר"),
        ("m", "admin", "um", "אישור השינוי"),
        ("m", "um", "udb", "עדכון ההרשאות"),
        ("r", "udb", "um", "אישור עדכון"),
        ("r", "um", "admin", "הודעת אישור על עדכון השינוי"),
        ("else", "המנהל לא מאשר"),
        ("m", "admin", "um", "לחיצה על לא - ללא שינוי בהרשאות"),
        ("end",)]),
    "SEQ-SUC-11": ([A, AM, ADB], [
        ("m", "admin", "am", "לחיצה על ניהול תורים"),
        ("m", "am", "adb", "שליפת כלל התורים"),
        ("r", "adb", "am", "רשימת התורים"),
        ("frame", "alt", "אין תורים"),
        ("r", "am", "admin", "הודעה: אין תורים קיימים במערכת"),
        ("else", "יש תורים"),
        ("r", "am", "admin", "הצגת פירוט כלל התורים"),
        ("end",)]),
    "SEQ-SUC-12": ([A, SOM, SODB], [
        ("m", "admin", "som", "לחיצה על ניהול חנות"),
        ("m", "som", "sodb", "שליפת המוצרים וכלל ההזמנות"),
        ("r", "sodb", "som", "מוצרים והזמנות"),
        ("r", "som", "admin", "הצגת המוצרים וההזמנות (או: אין הזמנות קיימות)"),
        ("m", "admin", "som", "בחירת פעולה: הוספה / עדכון / מחיקה"),
        ("frame", "opt", "הוספה או עדכון"),
        ("m", "admin", "som", "הזנת פרטי המוצר ולחיצה על שמירה"),
        ("s", "som", "בדיקת תקינות הפרטים"),
        ("r", "som", "admin", "אם הפרטים לא תקינים: הודעת שגיאה - חזרה להזנת פרטים"),
        ("end",),
        ("r", "som", "admin", "הצגת חלון אישור שינוי"),
        ("frame", "alt", "המנהל מאשר"),
        ("m", "admin", "som", "אישור השינוי"),
        ("m", "som", "sodb", "עדכון המוצרים"),
        ("r", "sodb", "som", "אישור עדכון"),
        ("r", "som", "admin", "הודעת אישור על ביצוע השינוי"),
        ("else", "המנהל לא מאשר"),
        ("m", "admin", "som", "לחיצה על לא - ללא שינוי במוצרים"),
        ("end",)]),
}

# object-level sequence diagrams (method calls between objects)
OBJ = {
    # as in authController.register: the checks, then the e-mail lookup, then the hashed password and the new user
    "OBJ-UserRegister": ([U, ("gui", ":User Client (GUI)", "box"), ("um", ":Users Manager", "box"),
                          ("udb", ":Users DB", "box"), ("usr", ":User", "box")], [
        ("m", "user", "gui", "Register.handleSubmit(e)"),
        ("m", "gui", "um", "register(req, res)"),
        ("s", "um", "בדיקת השדות והסיסמאות"),
        ("frame", "alt", "שדה חסר / הסיסמאות אינן תואמות"),
        ("r", "um", "gui", "400 { message }"),
        ("r", "gui", "user", "setError(message)"),
        ("else", "הפרטים מלאים והסיסמאות תואמות"),
        ("m", "um", "udb", "findOne({ email })"),
        ("r", "udb", "um", "exists"),
        ("frame", "alt", "הדוא\"ל כבר קיים במערכת"),
        ("r", "um", "gui", "400 { message }"),
        ("r", "gui", "user", "setError(message)"),
        ("else", "דוא\"ל חדש"),
        ("s", "um", "bcrypt.hash(password, 10)"),
        ("m", "um", "udb", "create({ ..., passwordHash })"),
        ("m", "udb", "usr", "new User(data) + save()"),
        ("r", "udb", "um", "user"),
        ("r", "um", "gui", "201 { message }"),
        ("r", "gui", "user", "setSuccess(message)"),
        ("s", "gui", "navigate(\"/login\")"),
        ("end",),
        ("end",)]),
    "OBJ-BookAppointment": ([C, ("gui", ":Appointment Client", "box"), ("am", ":Appointments Manager", "box"),
                             ("spdb", ":Service Providers DB", "box"), ("adb", ":Appointments DB", "box"),
                             ("ap", ":Appointment", "box")], [
        ("m", "client", "gui", "chooseBarber(barberId), chooseDate(date)"),
        ("m", "gui", "am", "getAvailableSlots(barberId, date)"),
        ("m", "am", "spdb", "getWorkSchedule(barberId)"),
        ("r", "spdb", "am", "schedule"),
        ("m", "am", "adb", "findByBarberAndDate(barberId, date)"),
        ("r", "adb", "am", "bookedList"),
        ("s", "am", "calcFreeSlots(schedule, bookedList)"),
        ("frame", "alt", "אין תורים פנויים"),
        ("r", "am", "gui", "[]"),
        ("r", "gui", "client", "showMessage(\"אין תורים פנויים\")"),
        ("else", "יש תורים פנויים"),
        ("r", "am", "gui", "freeSlots"),
        ("m", "client", "gui", "confirmBooking()"),
        ("m", "gui", "am", "BookAppointment(clientId, barberId, date, time)"),
        ("m", "am", "ap", "new Appointment(clientId, barberId, date, time)"),
        ("m", "am", "adb", "insertAppointment(appt)"),
        ("r", "adb", "am", "ok"),
        ("r", "am", "gui", "confirmation"),
        ("r", "gui", "client", "showMessage(\"התור נקבע בהצלחה\")"),
        ("end",)]),
}


# the diagrams redrawn to match the code get larger text and tighter lifelines
OBJ_OPTS = {"OBJ-UserRegister": {"spacing": 268, "font": 16, "left": 100, "right_pad": 70}}


if __name__ == "__main__":
    import sys
    only = set(sys.argv[1:])
    jobs = [(k, (lambda k=k, v=v: sequence(k, *v))) for k, v in SEQS.items()]
    jobs += [(k, (lambda k=k, v=v: sequence(k, *v, **OBJ_OPTS.get(k, {"spacing": 260})))) for k, v in OBJ.items()]
    jobs += [("PDOM-concept", pdom_concept), ("PDOM-classes", pdom_classes),
             ("CLS-UsersManager", component_users), ("CLS-AppointmentsManager", component_appointments),
             ("STATE-Appointment", state_machine)]
    for k, fn in jobs:
        if not only or k in only:
            print(k, fn())
