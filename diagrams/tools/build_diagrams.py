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
def sequence(name, parts, steps, spacing=None):
    """parts: [(key, label, 'actor'|'box')]
    steps: list of
      ('m', from, to, text)      call        ('r', from, to, text) return (dashed)
      ('s', who, text)           self call
      ('frame', kind, guard)     open a combined fragment (alt / opt / break / loop)
      ('else', guard)            separator inside the open alt
      ('end',)                   close the fragment
    Message numbering is automatic: <prefix>.<k>."""
    d = Diagram(name)
    spacing = spacing or (250 if len(parts) <= 3 else 215)
    xs = {k: 150 + i * spacing for i, (k, _, _) in enumerate(parts)}
    kinds = {k: kind for k, _, kind in parts}
    top = 20
    for k, label, kind in parts:
        if kind == "actor":
            d.vertex(label, ACTOR, xs[k] - 15, top, 30, 50)
        else:
            d.vertex(label, HEAD, xs[k] - 60, top + 5, 120, 40)
    y = 120
    frames, stack, msgs, pending = [], [], [], []
    num = 0
    prefix = name.split("_")[0].replace("SEQ-SUC-", "").replace("OBJ-", "")
    for s in steps:
        t = s[0]
        if t == "frame":
            y += 20
            stack.append({"kind": s[1], "guard": s[2], "y0": y - 10, "elses": []})
            y += 30
            continue
        if t == "else":
            y += 5
            stack[-1]["elses"].append((y, s[1]))
            y += 45
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
            pending.append((label, SELF, (x + 5, y), (x + 5, y + 20), [(x + 40, y), (x + 40, y + 20)]))
            msgs.append((s[1], y - 6, 32))
            y += 55
        else:
            a, b = xs[s[1]], xs[s[2]]
            off = 5 if b > a else -5
            pending.append((label, MSG if t == "m" else RET, (a + off, y), (b - off, y), []))
            msgs.append((s[2], y - 8, 24))
            y += 45
    bottom = y + 10
    # lifelines and activation bars
    for k, _, kind in parts:
        start = top + 70 if kind == "actor" else top + 45
        d.edge("", LIFELINE, sp=(xs[k], start), tp=(xs[k], bottom))
        if kind == "actor":
            d.vertex("", BAR, xs[k] - 5, 100, 10, bottom - 110)
    for k, by, bh in msgs:
        if kinds[k] != "actor":
            d.vertex("", BAR, xs[k] - 5, by, 10, bh)
    # combined fragments (outer ones first so inner ones draw on top)
    right = max(xs.values()) + 130
    for depth, fr in sorted(frames, key=lambda f: f[0]):
        x0 = 15 + depth * 12
        w = right - x0 - depth * 12
        d.vertex(f"<b>{fr['kind']}</b>", FRAME, x0, fr["y0"], w, fr["y1"] - fr["y0"])
        d.vertex(f"[{fr['guard']}]", TEXT, x0 + 55, fr["y0"], 300, 20)
        for ey, g in fr["elses"]:
            d.edge("", ELSE_LINE, sp=(x0, ey), tp=(x0 + w, ey))
            d.vertex(f"[{g}]", TEXT, x0 + 5, ey + 2, 300, 20)
    for label, style, sp, tp, pts in pending:
        d.edge(label, style, sp=sp, tp=tp, points=pts)
    return d.save()


# ---------------------------------------------------------------- class boxes
CLS = ("swimlane;fontStyle=1;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=26;"
       "horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=0;marginBottom=0;rounded=1;html=1;"
       "fillColor=#fff2cc;strokeColor=#d6b656;fontSize=14;")
ROWS = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;whiteSpace=wrap;html=1;fontSize=11;"
SEP = "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;strokeColor=#d6b656;"


def box_height(attrs, methods):
    return 26 + max(1, len(attrs)) * 15 + 8 + 8 + max(1, len(methods)) * 15 + 8


def class_box(d, name, attrs, methods, x, y, w=200):
    ah = max(1, len(attrs)) * 15 + 8
    mh = max(1, len(methods)) * 15 + 8
    h = 26 + ah + 8 + mh
    cid = d.vertex(name, CLS, x, y, w, h)
    d.vertex("<br>".join(attrs), ROWS, 0, 26, w, ah, parent=cid)
    d.vertex("", SEP, 0, 26 + ah, w, 8, parent=cid)
    d.vertex("<br>".join(methods), ROWS, 0, 26 + ah + 8, w, mh, parent=cid)
    return cid, (x, y, w, h)


def link(d, style, src, tgt, pts, a, b, label=""):
    """Edge between two boxes; a/b are (fx, fy) anchor fractions, pts are bend points."""
    s = f"{style}exitX={a[0]};exitY={a[1]};entryX={b[0]};entryY={b[1]};"
    return d.edge(label, s, points=pts, source=src, target=tgt)


INHERIT = "endArrow=block;endFill=0;endSize=10;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;"
ASSOC = "endArrow=open;endFill=0;html=1;rounded=0;labelBackgroundColor=#ffffff;"
AGGR = "endArrow=none;startArrow=diamondThin;startFill=0;startSize=14;html=1;rounded=0;labelBackgroundColor=#ffffff;"
COMP = "endArrow=none;startArrow=diamondThin;startFill=1;startSize=14;html=1;rounded=0;labelBackgroundColor=#ffffff;"
MULT = "text;html=1;align=center;verticalAlign=middle;fillColor=none;strokeColor=none;fontSize=11;"
CONCEPT = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=14;fontStyle=1;"


def mult(d, text, x, y):
    d.vertex(text, MULT, x - 20, y - 10, 40, 20)


def center_x(box, f=0.5):
    return box[0] + box[2] * f


# ---------------------------------------------------------------- PDOM (conceptual map)
def pdom_concept():
    d = Diagram("PDOM-concept")
    W, H = 160, 60
    pos = {"User": (270, 20), "Admin": (30, 170), "Client": (270, 170), "Barber": (560, 170),
           "Order": (30, 340), "Appointment": (380, 340), "WorkSchedule": (640, 340),
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
    trunk = 125
    for k in ("Admin", "Client", "Barber"):
        cx = center_x(box[k])
        link(d, INHERIT, ids[k], ids["User"], [(cx, trunk), (350, trunk)], (0.5, 0), (0.5, 1))
    # Client books Appointment, Barber performs it
    link(d, ASSOC, ids["Client"], ids["Appointment"], [(330, 290), (420, 290)], (0.375, 1), (0.25, 0), "מזמין")
    mult(d, "1", 318, 245); mult(d, "0..*", 440, 325)
    link(d, ASSOC, ids["Barber"], ids["Appointment"], [(600, 290), (500, 290)], (0.25, 1), (0.75, 0), "מבצע")
    mult(d, "1", 612, 245); mult(d, "0..*", 520, 325)
    # Barber owns his work schedule
    link(d, COMP, ids["Barber"], ids["WorkSchedule"], [(690, 290), (720, 290)], (0.8125, 1), (0.5, 0), "מגדיר")
    mult(d, "1", 702, 245); mult(d, "1", 738, 325)
    # Client places Orders
    link(d, ASSOC, ids["Client"], ids["Order"], [(290, 290), (110, 290)], (0.125, 1), (0.5, 0), "מבצע הזמנה")
    mult(d, "1", 278, 245); mult(d, "0..*", 128, 325)
    # Order is made of OrderItems, each refers to a Product
    link(d, COMP, ids["Order"], ids["OrderItem"], [], (0.5, 1), (0.5, 0), "מכילה")
    mult(d, "1", 125, 412); mult(d, "1..*", 128, 488)
    link(d, ASSOC, ids["OrderItem"], ids["Product"], [], (1, 0.5), (0, 0.5), "מתייחס ל")
    mult(d, "0..*", 208, 518); mult(d, "1", 290, 518)
    return d.save()


# ---------------------------------------------------------------- PDOM (infrastructure classes)
def pdom_classes():
    d = Diagram("PDOM-classes")
    c = {}
    c["User"] = class_box(d, "User", ["- firstName: String", "- lastName: String", "- email: String", "- password: String",
                                      "- address: String", "- birthDate: Date", "- role: String"],
                          ["+ register()", "+ login()", "+ updateProfile()"], 290, 20)
    y2 = c["User"][1][1] + c["User"][1][3] + 60
    c["Admin"] = class_box(d, "Admin", ["- permissions: Array&lt;String&gt;"],
                           ["+ manageUsers()", "+ manageAppointments()", "+ manageShop()"], 20, y2)
    c["Client"] = class_box(d, "Client", ["- appointments: Array&lt;Appointment&gt;", "- orders: Array&lt;Order&gt;"],
                            ["+ bookAppointment()", "+ changeAppointment()", "+ cancelAppointment()", "+ placeOrder()"], 290, y2)
    c["Barber"] = class_box(d, "Barber", ["- schedule: WorkSchedule", "- appointments: Array&lt;Appointment&gt;"],
                            ["+ viewDiary()", "+ updateWorkHours()"], 560, y2)
    y3 = max(c[k][1][1] + c[k][1][3] for k in ("Admin", "Client", "Barber")) + 70
    c["Order"] = class_box(d, "Order", ["- orderNumber: String", "- items: Array&lt;OrderItem&gt;", "- deliveryType: String",
                                        "- address: String", "- totalPrice: Number", "- status: String", "- date: Date"],
                           ["+ calculateTotal()", "+ pay()"], 20, y3)
    c["Appointment"] = class_box(d, "Appointment", ["- client: Client", "- barber: Barber", "- date: Date", "- time: String",
                                                    "- haircutType: String", "- status: String"],
                                 ["+ reschedule()", "+ cancel()"], 290, y3)
    c["WorkSchedule"] = class_box(d, "WorkSchedule", ["- workDays: Array&lt;String&gt;", "- startHour: String",
                                                      "- endHour: String", "- slotMinutes: Number"],
                                  ["+ getFreeSlots(date)", "+ update()"], 560, y3)
    y4 = max(c[k][1][1] + c[k][1][3] for k in ("Order", "Appointment", "WorkSchedule")) + 70
    c["OrderItem"] = class_box(d, "OrderItem", ["- product: Product", "- quantity: Number"], ["+ getPrice()"], 20, y4)
    c["Product"] = class_box(d, "Product", ["- name: String", "- description: String", "- price: Number",
                                            "- stock: Number", "- image: String"], ["+ updateStock()"], 290, y4)
    ids = {k: v[0] for k, v in c.items()}
    box = {k: v[1] for k, v in c.items()}
    trunk = y2 - 30
    for k in ("Admin", "Client", "Barber"):
        link(d, INHERIT, ids[k], ids["User"], [(center_x(box[k]), trunk), (390, trunk)], (0.5, 0), (0.5, 1))
    gap = y3 - 30
    cb, bb = box["Client"], box["Barber"]
    link(d, ASSOC, ids["Client"], ids["Appointment"], [], (0.5, 1), (0.5, 0), "מזמין")
    mult(d, "1", 403, cb[1] + cb[3] + 12); mult(d, "0..*", 408, y3 - 12)
    link(d, ASSOC, ids["Barber"], ids["Appointment"], [(610, gap), (450, gap)], (0.25, 1), (0.8, 0), "מבצע")
    mult(d, "1", 622, bb[1] + bb[3] + 12); mult(d, "0..*", 470, y3 - 12)
    link(d, COMP, ids["Barber"], ids["WorkSchedule"], [], (0.75, 1), (0.75, 0), "מגדיר")
    mult(d, "1", 722, bb[1] + bb[3] + 12); mult(d, "1", 722, y3 - 12)
    link(d, ASSOC, ids["Client"], ids["Order"], [(330, gap), (120, gap)], (0.2, 1), (0.5, 0), "מבצע הזמנה")
    mult(d, "1", 342, cb[1] + cb[3] + 12); mult(d, "0..*", 138, y3 - 12)
    ob = box["Order"]
    link(d, COMP, ids["Order"], ids["OrderItem"], [], (0.5, 1), (0.5, 0), "מכילה")
    mult(d, "1", 135, ob[1] + ob[3] + 12); mult(d, "1..*", 138, y4 - 12)
    oib, pb = box["OrderItem"], box["Product"]
    ymid = oib[1] + 40
    link(d, ASSOC, ids["OrderItem"], ids["Product"], [], (1, 40 / oib[3]), (0, 40 / pb[3]), "מתייחס ל")
    mult(d, "0..*", 240, ymid - 12); mult(d, "1", 280, ymid - 12)
    return d.save()


# ---------------------------------------------------------------- component class diagrams
def component_users():
    d = Diagram("CLS-UsersManager")
    a = class_box(d, "User Client (GUI)", ["- firstName: String", "- lastName: String", "- email: String",
                                           "- address: String", "- birthDate: Date", "- password: String",
                                           "- confirmPassword: String"],
                  ["+ submitRegister()", "+ submitLogin()", "+ showMessage(text)"], 20, 20, 230)
    b = class_box(d, "Users Manager", ["- usersDB: UsersDB"],
                  ["+ UserRegister(details)", "+ UserEntry(email, password)", "+ validateDetails(details)",
                   "+ updateProfile(userId, details)", "+ updatePermissions(userId, role)"], 20, 330, 230)
    c = class_box(d, "Users DB", ["- users: Collection&lt;User&gt;"],
                  ["+ findByEmail(email)", "+ insertUser(user)", "+ updateUser(user)"], 20, 610, 230)
    u = class_box(d, "User", ["- firstName: String", "- lastName: String", "- email: String", "- passwordHash: String",
                              "- address: String", "- birthDate: Date", "- role: String"],
                  ["+ hashPassword(password)"], 340, 330, 210)
    link(d, ASSOC, a[0], b[0], [], (0.5, 1), (0.5, 0), "שולח פרטים")
    link(d, ASSOC, b[0], c[0], [], (0.5, 1), (0.5, 0), "שומר / שולף")
    link(d, ASSOC, b[0], u[0], [], (1, 45 / b[1][3]), (0, 45 / u[1][3]), "יוצר")
    link(d, ASSOC, c[0], u[0], [(445, c[1][1] + 50)], (1, 50 / c[1][3]), (0.5, 1), "מכיל")
    mult(d, "0..*", 470, u[1][1] + u[1][3] + 12)
    return d.save()


def component_appointments():
    d = Diagram("CLS-AppointmentsManager")
    a = class_box(d, "Appointment Client (GUI)", ["- selectedBarber: String", "- selectedDate: Date", "- selectedTime: String"],
                  ["+ chooseBarber(barberId)", "+ chooseDate(date)", "+ confirmBooking()", "+ showMessage(text)"], 255, 20, 250)
    b = class_box(d, "Appointments Manager", ["- appointmentsDB: AppointmentsDB", "- providersDB: ServiceProvidersDB"],
                  ["+ getAvailableSlots(barberId, date)", "+ BookAppointment(clientId, barberId, date, time)",
                   "+ changeAppointment(apptId, date, time)", "+ cancelAppointment(apptId)",
                   "+ getClientAppointments(clientId)"], 230, 250, 300)
    c = class_box(d, "Service Providers DB", ["- barbers: Collection&lt;Barber&gt;"],
                  ["+ getBarbers()", "+ getWorkSchedule(barberId)"], 20, 540, 230)
    e = class_box(d, "Appointments DB", ["- appointments: Collection&lt;Appointment&gt;"],
                  ["+ findByBarberAndDate(barberId, date)", "+ insertAppointment(appt)", "+ updateAppointment(appt)",
                   "+ deleteAppointment(apptId)"], 520, 540, 250)
    ap = class_box(d, "Appointment", ["- clientId: String", "- barberId: String", "- date: Date", "- time: String",
                                      "- status: String"], ["+ reschedule(date, time)", "+ cancel()"], 580, 250, 190)
    link(d, ASSOC, a[0], b[0], [], (0.5, 1), (0.5, 0), "בקשת תור")
    bb = b[1]
    ybot = bb[1] + bb[3]
    link(d, ASSOC, b[0], c[0], [(300, ybot + 40), (135, ybot + 40)], (70 / 300, 1), (0.5, 0), "שעות עבודה")
    link(d, ASSOC, b[0], e[0], [(460, ybot + 40), (600, ybot + 40)], (230 / 300, 1), (80 / 250, 0), "שמירה / שליפה")
    link(d, ASSOC, b[0], ap[0], [], (1, 45 / bb[3]), (0, 45 / ap[1][3]), "יוצר")
    link(d, ASSOC, e[0], ap[0], [], ((675 - 520) / 250, 0), (0.5, 1), "מכיל")
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
        ("m", "am", "adb", "מחיקת התור ופינוי המועד"),
        ("r", "adb", "am", "אישור מחיקה"),
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
        ("m", "barber", "sm", "בחירה בעריכת ימי ושעות עבודה"),
        ("frame", "break", "ללא עריכה"),
        ("r", "sm", "barber", "סיום התהליך ללא שינוי בשעות העבודה"),
        ("end",),
        ("m", "barber", "sm", "עדכון ימי ושעות העבודה ולחיצה על שמירה"),
        ("s", "sm", "בדיקת תקינות השעות"),
        ("frame", "alt", "שעות לא תקינות"),
        ("r", "sm", "barber", "הודעת שגיאה - חזרה לעדכון השעות"),
        ("else", "שעות תקינות"),
        ("m", "sm", "spdb", "עדכון שעות וימי העבודה"),
        ("r", "spdb", "sm", "אישור עדכון"),
        ("r", "sm", "barber", "הודעת אישור על עדכון שעות העבודה"),
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
    "OBJ-UserRegister": ([U, ("gui", ":User Client", "box"), ("um", ":Users Manager", "box"), ("usr", ":User", "box"),
                          ("udb", ":Users DB", "box")], [
        ("m", "user", "gui", "submitRegister()"),
        ("m", "gui", "um", "UserRegister(details)"),
        ("s", "um", "validateDetails(details)"),
        ("frame", "alt", "פרטים לא תקינים / סיסמאות לא תואמות"),
        ("r", "um", "gui", "error(invalidFields)"),
        ("r", "gui", "user", "showMessage(text) - חזרה להזנת פרטים"),
        ("else", "פרטים תקינים"),
        ("m", "um", "udb", "findByEmail(email)"),
        ("r", "udb", "um", "null"),
        ("m", "um", "usr", "new User(details)"),
        ("s", "usr", "hashPassword(password)"),
        ("m", "um", "udb", "insertUser(user)"),
        ("r", "udb", "um", "ok"),
        ("r", "um", "gui", "success"),
        ("r", "gui", "user", "showMessage(text) + navigateToLogin()"),
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


if __name__ == "__main__":
    import sys
    only = set(sys.argv[1:])
    jobs = [(k, (lambda k=k, v=v: sequence(k, *v))) for k, v in SEQS.items()]
    jobs += [(k, (lambda k=k, v=v: sequence(k, *v, spacing=260))) for k, v in OBJ.items()]
    jobs += [("PDOM-concept", pdom_concept), ("PDOM-classes", pdom_classes),
             ("CLS-UsersManager", component_users), ("CLS-AppointmentsManager", component_appointments),
             ("STATE-Appointment", state_machine)]
    for k, fn in jobs:
        if not only or k in only:
            print(k, fn())
