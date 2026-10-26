#!/usr/bin/env python3
"""
ProcureFlow — Professional Academic & Engineering Project Report Generator
Generates a publication-grade, 8-page Microsoft Word (.docx) document
for ProcureFlow: Regional B2B Procurement Platform for MSMEs.
"""

import os
import sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

# --- Color Palette Constants ---
COLOR_NAVY_HEX = "1E3A8A"      # #1E3A8A - Primary Headers / Titles
COLOR_TEAL_HEX = "0F766E"      # #0F766E - Secondary Headers / Accents
COLOR_SLATE_HEX = "334155"     # #334155 - Body Text / Charcoal
COLOR_MUTED_HEX = "64748B"     # #64748B - Captions / Subtitles
COLOR_BG_LIGHT_HEX = "F8FAFC"  # #F8FAFC - Table Alternating Rows
COLOR_BORDER_HEX = "CBD5E1"    # #CBD5E1 - Table Borders
COLOR_CALLOUT_BG = "F0FDFA"    # #F0FDFA - Callout Background

RGB_NAVY = RGBColor(30, 58, 138)
RGB_TEAL = RGBColor(15, 118, 110)
RGB_SLATE = RGBColor(51, 65, 85)
RGB_MUTED = RGBColor(100, 116, 139)
RGB_WHITE = RGBColor(255, 255, 255)

# --- Helper Functions for XML Manipulation ---

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    """Set explicit padding inside a table cell (values in dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_background(cell, hex_color):
    """Set shading/fill color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_table_borders(table, color=COLOR_BORDER_HEX, sz="4", val="single"):
    """Set clean horizontal-only borders for formal academic tables."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_cell_text(cell, text, bold=False, italic=False, font_size=9, color=RGB_SLATE, align=WD_ALIGN_PARAGRAPH.LEFT):
    """Helper to populate cell text with clean styling."""
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return run

def add_callout_box(doc, text, bold_prefix="", title=""):
    """Adds an elegant single-cell callout box with a teal left accent bar."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.77)
    
    # Left border thick teal, others none
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{COLOR_TEAL_HEX}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    set_cell_background(cell, COLOR_CALLOUT_BG)
    set_cell_margins(cell, top=100, bottom=100, left=180, right=140)
    
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    if title:
        r_title = p.add_run(title + "\n")
        r_title.font.name = "Calibri"
        r_title.font.size = Pt(9.5)
        r_title.font.bold = True
        r_title.font.color.rgb = RGB_TEAL
        
    if bold_prefix:
        r_pre = p.add_run(bold_prefix + " ")
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(9)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGB_NAVY
        
    r_body = p.add_run(text)
    r_body.font.name = "Calibri"
    r_body.font.size = Pt(9)
    r_body.font.color.rgb = RGB_SLATE

def add_heading_1(doc, title, space_before=10, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(title)
    run.font.name = "Calibri"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGB_NAVY
    return p

def add_heading_2(doc, title, space_before=8, space_after=3):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(title)
    run.font.name = "Calibri"
    run.font.size = Pt(11.5)
    run.font.bold = True
    run.font.color.rgb = RGB_TEAL
    return p

def add_body_p(doc, text, bold_prefix="", space_after=4, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.12
    if bold_prefix:
        r_b = p.add_run(bold_prefix + " ")
        r_b.font.name = "Calibri"
        r_b.font.size = Pt(9.5)
        r_b.font.bold = True
        r_b.font.color.rgb = RGB_NAVY
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(9.5)
    r.font.italic = italic
    r.font.color.rgb = RGB_SLATE
    return p

def add_bullet_item(doc, text, bold_prefix="", space_after=2):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.10
    if bold_prefix:
        r_b = p.add_run(bold_prefix + " ")
        r_b.font.name = "Calibri"
        r_b.font.size = Pt(9)
        r_b.font.bold = True
        r_b.font.color.rgb = RGB_NAVY
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(9)
    r.font.color.rgb = RGB_SLATE
    return p

# --- Diagram Generation Logic ---

def generate_diagrams():
    """Generates 3 crisp, professional architectural and workflow diagrams."""
    print("[1/3] Generating System Architecture Diagram...")
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 52)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    # Title
    ax.text(50, 49.5, "ProcureFlow — Three-Tier Modular Architecture & Request Flow", 
            fontsize=11.5, fontweight='bold', color='#1E3A8A', ha='center', va='center')

    # 1. Presentation Layer (Top)
    rect1 = patches.FancyBboxPatch((4, 33), 92, 13.5, boxstyle="round,pad=0.8", facecolor='#F0FDFA', edgecolor='#0F766E', linewidth=1.5)
    ax.add_patch(rect1)
    ax.text(6, 44, "PRESENTATION LAYER (Client Browser — React 19 Single Page Application)", fontsize=8.5, fontweight='bold', color='#0F766E')
    
    components_fe = [
        ("Buyer Dashboard", "RFQ creation, quote comparison,\nvendor selection, PO issuance", 6),
        ("Vendor Dashboard", "Regional opportunity feed,\nslab quote submission, fulfillment", 29),
        ("Comparison Matrix", "Side-by-side bids, dynamic\nprice & lead time tie detection", 52),
        ("Activity Timeline", "FSM workflow stepper,\nchronological audit history", 75)
    ]
    for title, desc, x in components_fe:
        b = patches.FancyBboxPatch((x, 34.5), 20.5, 7.5, boxstyle="round,pad=0.4", facecolor='#FFFFFF', edgecolor='#99F6E4', linewidth=1)
        ax.add_patch(b)
        ax.text(x + 10.25, 39.5, title, fontsize=8, fontweight='bold', color='#334155', ha='center', va='center')
        ax.text(x + 10.25, 36.8, desc, fontsize=6.2, color='#64748B', ha='center', va='center')

    # Arrow FE -> BE
    ax.annotate("", xy=(50, 27.5), xytext=(50, 33),
                arrowprops=dict(arrowstyle="<->", color='#0F766E', lw=1.8, shrinkA=0, shrinkB=0))
    ax.text(52, 30.2, "RESTful JSON APIs (HTTPS / JWT Bearer Tokens)", fontsize=7.2, fontweight='bold', color='#0F766E')

    # 2. Application & API Layer (Middle)
    rect2 = patches.FancyBboxPatch((4, 13.5), 92, 14, boxstyle="round,pad=0.8", facecolor='#F8FAFC', edgecolor='#1E3A8A', linewidth=1.5)
    ax.add_patch(rect2)
    ax.text(6, 25, "APPLICATION & BUSINESS LOGIC LAYER (Node.js & Express 5 Modular Monolith)", fontsize=8.5, fontweight='bold', color='#1E3A8A')

    components_be = [
        ("Auth & RBAC Middleware", "JWT validation, password hashing,\nBuyer/Vendor tenant isolation", 6),
        ("RFQ State Machine (FSM)", "Draft -> Open -> Review ->\nApproved -> PO_Issued guards", 29),
        ("Tiered Pricing Engine", "Dynamic slab evaluation,\nNumber.EPSILON rounding", 52),
        ("Orders & Audit Service", "Unique PO indexing, idempotency,\nchronological milestone tracking", 75)
    ]
    for title, desc, x in components_be:
        b = patches.FancyBboxPatch((x, 15), 20.5, 8, boxstyle="round,pad=0.4", facecolor='#FFFFFF', edgecolor='#BFDBFE', linewidth=1)
        ax.add_patch(b)
        ax.text(x + 10.25, 20.5, title, fontsize=8, fontweight='bold', color='#1E3A8A', ha='center', va='center')
        ax.text(x + 10.25, 17.5, desc, fontsize=6.2, color='#475569', ha='center', va='center')

    # Arrow BE -> DB
    ax.annotate("", xy=(50, 8.5), xytext=(50, 13.5),
                arrowprops=dict(arrowstyle="<->", color='#1E3A8A', lw=1.8, shrinkA=0, shrinkB=0))
    ax.text(52, 11, "Mongoose 9 ODM (Schema Validation & Unique Indexes)", fontsize=7.2, fontweight='bold', color='#1E3A8A')

    # 3. Persistence Layer (Bottom)
    rect3 = patches.FancyBboxPatch((4, 1), 92, 7.5, boxstyle="round,pad=0.8", facecolor='#F1F5F9', edgecolor='#475569', linewidth=1.5)
    ax.add_patch(rect3)
    ax.text(6, 6.5, "DATA PERSISTENCE LAYER (MongoDB NoSQL Document Store)", fontsize=8.5, fontweight='bold', color='#334155')

    collections = [("users", 8), ("rfqs", 26), ("quotations", 44), ("orders", 62), ("audit_logs", 80)]
    for name, x in collections:
        b = patches.FancyBboxPatch((x, 2), 15, 3.2, boxstyle="round,pad=0.3", facecolor='#FFFFFF', edgecolor='#94A3B8', linewidth=1)
        ax.add_patch(b)
        ax.text(x + 7.5, 3.6, name, fontsize=7.5, fontweight='bold', color='#334155', ha='center', va='center', fontfamily='monospace')

    plt.tight_layout()
    plt.savefig('architecture_diagram.png', dpi=300, facecolor='#FFFFFF', edgecolor='none')
    plt.close()

    print("[2/3] Generating Workflow & State Machine Diagram...")
    fig, ax = plt.subplots(figsize=(10, 4.2), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 42)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 39.5, "ProcureFlow — Deterministic State Machine & Order Fulfillment Workflow", 
            fontsize=11.5, fontweight='bold', color='#1E3A8A', ha='center', va='center')

    states = [
        ("DRAFT", "Initial requirement\ncreation & revision", 5, 26, '#F8FAFC', '#334155'),
        ("OPEN", "Published for regional\nvendor discovery", 24, 26, '#EFF6FF', '#1E3A8A'),
        ("UNDER_REVIEW", "Bids submitted &\ncomparison active", 43, 26, '#F0FDFA', '#0F766E'),
        ("APPROVED", "Winning quote accepted\ncompeting bids rejected", 62, 26, '#FEF3C7', '#B45309'),
        ("PO_ISSUED", "Terminal RFQ state\nbinding legal contract", 81, 26, '#DCFCE7', '#15803D'),
    ]

    for name, desc, x, y, bg, stroke in states:
        b = patches.FancyBboxPatch((x, y), 13.5, 8.5, boxstyle="round,pad=0.5", facecolor=bg, edgecolor=stroke, linewidth=1.5)
        ax.add_patch(b)
        ax.text(x + 6.75, y + 5.5, name, fontsize=8, fontweight='bold', color=stroke, ha='center', va='center')
        ax.text(x + 6.75, y + 2.5, desc, fontsize=6.2, color='#475569', ha='center', va='center')

    transitions = [
        (18.5, 30.25, 24, 30.25, "publish", "Buyer"),
        (37.5, 30.25, 43, 30.25, "submit quote", "Vendor"),
        (56.5, 30.25, 62, 30.25, "select vendor", "Buyer"),
        (75.5, 30.25, 81, 30.25, "issue PO", "Buyer")
    ]
    for x1, y1, x2, y2, action, role in transitions:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color='#1E3A8A', lw=1.5))
        ax.text((x1 + x2)/2, y1 + 1.8, action, fontsize=6.8, fontweight='bold', color='#1E3A8A', ha='center')
        ax.text((x1 + x2)/2, y1 - 2.2, f"[{role}]", fontsize=6, color='#64748B', ha='center')

    # Cancelled state
    b_cancel = patches.FancyBboxPatch((43, 13), 13.5, 7.5, boxstyle="round,pad=0.5", facecolor='#FEE2E2', edgecolor='#B91C1C', linewidth=1.5)
    ax.add_patch(b_cancel)
    ax.text(49.75, 17.5, "CANCELLED", fontsize=8, fontweight='bold', color='#B91C1C', ha='center', va='center')
    ax.text(49.75, 15, "Terminal state\nmutation locked", fontsize=6.2, color='#B91C1C', ha='center', va='center')

    ax.annotate("", xy=(44.5, 20.5), xytext=(11.75, 26), arrowprops=dict(arrowstyle="->", color='#B91C1C', lw=1, ls="--"))
    ax.annotate("", xy=(47, 20.5), xytext=(30.75, 26), arrowprops=dict(arrowstyle="->", color='#B91C1C', lw=1, ls="--"))
    ax.annotate("", xy=(49.75, 20.5), xytext=(49.75, 26), arrowprops=dict(arrowstyle="->", color='#B91C1C', lw=1, ls="--"))
    ax.text(28, 20.5, "Buyer cancellation", fontsize=6.5, color='#B91C1C', fontweight='bold')

    # Order Fulfillment Lifecycle (Bottom Right)
    rect_order = patches.FancyBboxPatch((59, 2), 36.5, 9, boxstyle="round,pad=0.5", facecolor='#F8FAFC', edgecolor='#0F766E', linewidth=1.2)
    ax.add_patch(rect_order)
    ax.text(77.25, 8.8, "Purchase Order Fulfillment FSM", fontsize=7.5, fontweight='bold', color='#0F766E', ha='center')

    order_states = [("ISSUED", 61), ("ACKNOWLEDGED", 72.5), ("FULFILLED", 84.5)]
    for s_name, sx in order_states:
        ob = patches.FancyBboxPatch((sx, 3.2), 9.8, 4.5, boxstyle="round,pad=0.3", facecolor='#FFFFFF', edgecolor='#0F766E', linewidth=1)
        ax.add_patch(ob)
        ax.text(sx + 4.9, 5.45, s_name, fontsize=6, fontweight='bold', color='#0F766E', ha='center', va='center')

    ax.annotate("", xy=(72.5, 5.45), xytext=(70.8, 5.45), arrowprops=dict(arrowstyle="->", color='#0F766E', lw=1))
    ax.annotate("", xy=(84.5, 5.45), xytext=(82.3, 5.45), arrowprops=dict(arrowstyle="->", color='#0F766E', lw=1))

    ax.annotate("", xy=(77.25, 11), xytext=(87.75, 26),
                arrowprops=dict(arrowstyle="->", color='#0F766E', lw=1.5, ls=":"))
    ax.text(87.5, 16.5, "Generates\nBinding PO", fontsize=6.5, fontweight='bold', color='#0F766E', ha='center')

    plt.tight_layout()
    plt.savefig('workflow_fsm_diagram.png', dpi=300, facecolor='#FFFFFF', edgecolor='none')
    plt.close()

    print("[3/3] Generating Data Model / Schema Architecture Diagram...")
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 52)
    ax.axis('off')
    fig.patch.set_facecolor('#FFFFFF')

    ax.text(50, 49.5, "ProcureFlow — Data Entities & Relational Schema Architecture", 
            fontsize=11.5, fontweight='bold', color='#1E3A8A', ha='center', va='center')

    def draw_entity(x, y, w, h, title, fields, border_color):
        b = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4", facecolor='#FFFFFF', edgecolor=border_color, linewidth=1.5)
        ax.add_patch(b)
        th = patches.FancyBboxPatch((x, y + h - 4.5), w, 4.5, boxstyle="round,pad=0.4", facecolor=border_color, edgecolor=border_color, linewidth=1)
        ax.add_patch(th)
        ax.text(x + w/2, y + h - 2.25, title, fontsize=8, fontweight='bold', color='#FFFFFF', ha='center', va='center')
        
        fy = y + h - 6.5
        for field in fields:
            ax.text(x + 1.5, fy, field, fontsize=6.3, color='#334155', fontfamily='monospace', va='center')
            fy -= 2.5

    # 1. User
    draw_entity(4, 26, 25, 19, "User", [
        "PK _id: ObjectId",
        "   name: String",
        "   email: String (unique)",
        "   password: Hash (bcrypt)",
        "   role: 'BUYER'|'VENDOR'",
        "   organization: String",
        "   regional_hub: String"
    ], '#1E3A8A')

    # 2. RFQ
    draw_entity(37, 24, 26, 21, "RFQ", [
        "PK _id: ObjectId",
        "FK buyer_id -> User._id",
        "   title: String",
        "   category: String",
        "   quantity: Number",
        "   unit: String",
        "   target_region: String",
        "   status: RFQ_STATUS enum",
        "FK selected_quotation_id"
    ], '#0F766E')

    # 3. Quotation
    draw_entity(70, 24, 26, 21, "Quotation", [
        "PK _id: ObjectId",
        "FK rfq_id -> RFQ._id",
        "FK vendor_id -> User._id",
        "   slabs: [{min, max, rate}]",
        "   evaluated_unit_price: Num",
        "   evaluated_total_price: Num",
        "   lead_time_days: Number",
        "   status: 'SUBMITTED'|'ACC'"
    ], '#1E3A8A')

    # 4. Order
    draw_entity(18, 2, 29, 18, "Order", [
        "PK _id: ObjectId",
        "   po_number: String (unique)",
        "FK rfq_id -> RFQ._id (unique)",
        "FK quotation_id -> Quote._id",
        "FK buyer_id / vendor_id",
        "   total_amount: Number",
        "   status: 'ISSUED'|'ACK'|'FUL'"
    ], '#B45309')

    # 5. AuditLog
    draw_entity(55, 2, 40, 18, "AuditLog", [
        "PK _id: ObjectId",
        "   entity_type: 'RFQ'|'ORDER'",
        "   entity_id: ObjectId",
        "   action: 'PUBLISH'|'SELECT'|...",
        "   from_state / to_state: String",
        "FK performed_by -> User._id",
        "   notes: String, createdAt: Date"
    ], '#475569')

    # User -> RFQ
    ax.annotate("", xy=(37, 35.5), xytext=(29, 35.5), arrowprops=dict(arrowstyle="->", color='#1E3A8A', lw=1.2))
    ax.text(33, 37, "1:N", fontsize=6.8, fontweight='bold', color='#1E3A8A', ha='center')

    # RFQ -> Quotation
    ax.annotate("", xy=(70, 35.5), xytext=(63, 35.5), arrowprops=dict(arrowstyle="->", color='#0F766E', lw=1.2))
    ax.text(66.5, 37, "1:N", fontsize=6.8, fontweight='bold', color='#0F766E', ha='center')

    # User -> Quotation
    ax.annotate("", xy=(83, 45), xytext=(16.5, 45),
                arrowprops=dict(arrowstyle="->", color='#1E3A8A', lw=1, ls=":", connectionstyle="arc3,rad=-0.15"))
    ax.text(50, 46, "Vendor submits (1:N)", fontsize=6.8, color='#1E3A8A', ha='center')

    # RFQ -> Order
    ax.annotate("", xy=(32.5, 20), xytext=(47, 24), arrowprops=dict(arrowstyle="->", color='#B45309', lw=1.2))
    ax.text(35, 21.5, "1:1 (Unique)", fontsize=6.8, fontweight='bold', color='#B45309')

    # RFQ/Order -> AuditLog
    ax.annotate("", xy=(68, 20), xytext=(55, 24), arrowprops=dict(arrowstyle="->", color='#475569', lw=1.2))
    ax.text(63, 22.5, "1:N Audit", fontsize=6.8, fontweight='bold', color='#475569')

    plt.tight_layout()
    plt.savefig('data_model_diagram.png', dpi=300, facecolor='#FFFFFF', edgecolor='none')
    plt.close()
    print("All diagrams generated successfully!")

# --- Document Building Function ---

def build_docx_report(output_filename="ProcureFlow_Project_Report.docx"):
    print(f"Building Word document: {output_filename}...")
    doc = docx.Document()

    # 1. Page Setup: Standard A4 with 0.75 in (54 pt) margins
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)

    # 2. Header and Footer Configuration
    section.different_first_page_header_footer = True

    # Running Header (Pages 2-8)
    header = section.header
    p_head = header.paragraphs[0]
    p_head.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_head.paragraph_format.space_after = Pt(4)
    r_head = p_head.add_run("ProcureFlow — Regional B2B Procurement Platform for MSMEs")
    r_head.font.name = "Calibri"
    r_head.font.size = Pt(8.5)
    r_head.font.color.rgb = RGB_MUTED

    # Running Footer (Pages 2-8) with dynamic page numbering
    footer = section.footer
    p_foot = footer.paragraphs[0]
    p_foot.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_foot.paragraph_format.space_before = Pt(4)
    r_foot1 = p_foot.add_run("Department of Computer Science and Engineering  |  Software Engineering Capstone Report\tPage ")
    r_foot1.font.name = "Calibri"
    r_foot1.font.size = Pt(8.5)
    r_foot1.font.color.rgb = RGB_MUTED

    # Insert XML Field for Page
    fld1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instr1 = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
    fld2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fld3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    r_foot1._r.append(fld1)
    r_foot1._r.append(instr1)
    r_foot1._r.append(fld2)
    r_foot1._r.append(fld3)

    r_foot2 = p_foot.add_run(" of ")
    r_foot2.font.name = "Calibri"
    r_foot2.font.size = Pt(8.5)
    r_foot2.font.color.rgb = RGB_MUTED

    fld4 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instr2 = parse_xml(r'<w:instrText %s xml:space="preserve"> NUMPAGES </w:instrText>' % nsdecls('w'))
    fld5 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fld6 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    r_foot2._r.append(fld4)
    r_foot2._r.append(instr2)
    r_foot2._r.append(fld5)
    r_foot2._r.append(fld6)

    # =========================================================================
    # PAGE 1 — COVER PAGE AND PROJECT INFORMATION
    # =========================================================================
    print("Formatting Page 1: Cover Page...")
    
    # Top Category Banner
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_top.paragraph_format.space_before = Pt(16)
    p_top.paragraph_format.space_after = Pt(4)
    r_cat = p_top.add_run("CAPSTONE SOFTWARE ENGINEERING PROJECT REPORT")
    r_cat.font.name = "Calibri"
    r_cat.font.size = Pt(10)
    r_cat.font.bold = True
    r_cat.font.color.rgb = RGB_TEAL

    # Main Project Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("PROCUREFLOW")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(28)
    r_title.font.bold = True
    r_title.font.color.rgb = RGB_NAVY

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("Regional B2B Procurement and Quotation Management Platform for MSMEs")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(12.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGB_TEAL

    # Horizontal Rule (Accent Bar)
    p_hr = doc.add_paragraph()
    p_hr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hr.paragraph_format.space_before = Pt(0)
    p_hr.paragraph_format.space_after = Pt(14)
    r_hr = p_hr.add_run("―" * 56)
    r_hr.font.color.rgb = RGB_MUTED

    # Project Description Callout
    add_callout_box(
        doc,
        "ProcureFlow is a full-stack, state-driven B2B procurement workflow platform engineered for Micro, Small, and Medium Enterprises (MSMEs). Rather than operating as an open-ended lead-generation directory, ProcureFlow digitizes and strictly governs the end-to-end purchasing lifecycle: requirement drafting, regional vendor discovery, dynamic tiered pricing evaluation with floating-point epsilon precision, side-by-side bid comparison, direct vendor selection, and database-enforced immutable purchase order generation.",
        bold_prefix="EXECUTIVE PROJECT SUMMARY:",
        title="Project Overview & Domain Scope"
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Student & Institutional Details Table
    add_heading_2(doc, "Project Metadata & Institutional Submission Details", space_before=6, space_after=4)
    
    table_meta = doc.add_table(rows=8, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_meta.autofit = False
    set_table_borders(table_meta, color=COLOR_BORDER_HEX, sz="4", val="single")

    meta_rows = [
        ("Candidate Name", "[Student Name]"),
        ("Registration / Roll Number", "[Registration / Roll Number]"),
        ("Degree & Branch", "Bachelor of Engineering in Computer Science & Engineering"),
        ("Department", "Department of Computer Science and Engineering"),
        ("Academic Institution", "[Institution / University Name]"),
        ("Project Supervisor / Guide", "[Project Guide Name, Designation & Department]"),
        ("Academic Year & Session", "2025 – 2026"),
        ("Project Source Repository", "https://github.com/SanjayDurai16/ProcureFlow")
    ]

    for idx, (label, val) in enumerate(meta_rows):
        row = table_meta.rows[idx]
        cell_lbl = row.cells[0]
        cell_val = row.cells[1]
        cell_lbl.width = Inches(2.5)
        cell_val.width = Inches(4.27)
        
        bg_col = COLOR_BG_LIGHT_HEX if idx % 2 == 1 else "FFFFFF"
        set_cell_background(cell_lbl, bg_col)
        set_cell_background(cell_val, bg_col)
        set_cell_margins(cell_lbl, top=70, bottom=70, left=100, right=100)
        set_cell_margins(cell_val, top=70, bottom=70, left=100, right=100)

        format_cell_text(cell_lbl, label, bold=True, font_size=9, color=RGB_NAVY)
        format_cell_text(cell_val, val, bold=False, font_size=9, color=RGB_SLATE)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Bottom Submission Tag
    p_subm = doc.add_paragraph()
    p_subm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subm.paragraph_format.space_before = Pt(8)
    p_subm.paragraph_format.space_after = Pt(0)
    r_subm = p_subm.add_run("Submitted in partial fulfillment of the requirements for the Degree of Bachelor of Engineering\nOctober 2026")
    r_subm.font.name = "Calibri"
    r_subm.font.size = Pt(8.5)
    r_subm.font.italic = True
    r_subm.font.color.rgb = RGB_MUTED

    doc.add_page_break()

    # =========================================================================
    # PAGE 2 — ABSTRACT AND PROBLEM STATEMENT
    # =========================================================================
    print("Formatting Page 2: Abstract and Problem Statement...")

    add_heading_1(doc, "1. Executive Abstract", space_before=0, space_after=4)
    add_body_p(
        doc,
        "Micro, Small, and Medium Enterprises (MSMEs) constitute the industrial backbone of manufacturing and regional commerce. Despite their economic significance, internal procurement operations across small industrial units frequently rely on disconnected communication channels, including unstructured email exchanges, informal messaging, phone calls, and manual spreadsheets. This fragmented approach leads to quotation loss, inconsistent commercial baselines, complete lack of volume pricing visibility, delayed supplier selections, and unstandardized purchase commitments.",
        bold_prefix="Context & Problem Space:"
    )
    add_body_p(
        doc,
        "ProcureFlow is an end-to-end, state-driven B2B procurement and quotation management web application designed to replace ad-hoc purchasing workflows with rigorous digital governance. The system models the complete procurement lifecycle across two distinct user roles: Buyers (industrial purchasers) and Vendors (regional suppliers). The core engine enforces a deterministic Finite State Machine (FSM), algorithmic dynamic tiered pricing evaluation, objective tabular quotation comparison, direct vendor selection, and database-enforced immutable Purchase Order (PO) issuance.",
        bold_prefix="Proposed Solution:"
    )
    add_body_p(
        doc,
        "The application is architected as a modular monolith utilizing React 19, TypeScript, and Vite on the presentation tier, and Node.js, Express 5, and MongoDB with Mongoose on the server tier. Security and validation are guaranteed through salted bcrypt password hashing, stateless JSON Web Tokens (JWT), Zod runtime schema validation, and multi-tenant authorization guards. Automated testing with Vitest and Supertest verifies 20 unit and integration tests (100% pass rate) covering pricing edge cases, state machine transitions, and cross-tenant data isolation.",
        bold_prefix="Technical Architecture & Verification:"
    )

    add_heading_1(doc, "2. Background and Industry Motivation", space_before=10, space_after=4)
    add_body_p(
        doc,
        "In industrial manufacturing clusters—such as the automotive corridors of Chennai, machine tooling hubs of Coimbatore, and precision engineering clusters of Bangalore—small enterprises must procure raw materials and specialized components under stringent operating margins and compressed delivery windows. Unlike multinational corporations equipped with enterprise resource planning (ERP) suites like SAP or Oracle, MSMEs operate with lean administrative teams and cannot justify the licensing costs, lengthy deployment cycles, and operational complexity of enterprise procurement software. Consequently, MSMEs remain tethered to manual purchasing methods that impair operational efficiency and supply chain resilience."
    )

    add_heading_1(doc, "3. The Operational Pitfalls of Fragmented Procurement", space_before=10, space_after=4)
    add_bullet_item(doc, "Unstructured email threads and messaging chats lead to misplaced specifications, missed bid deadlines, and communication silos.", bold_prefix="Communication Breakdowns:")
    add_bullet_item(doc, "Vendors submit quotations across heterogeneous spreadsheets with differing units, delivery terms, and tax components, making fair comparison labor-intensive and error-prone.", bold_prefix="Opaque Quotation Comparison:")
    add_bullet_item(doc, "Suppliers offer quantity-based discounts, but buyers lack automated computational engines to dynamically evaluate volume tiers against their exact batch quantities.", bold_prefix="Absence of Volume Tier Mechanics:")
    add_bullet_item(doc, "Informal agreements result in verbal purchasing commitments without auditable purchase documentation containing fixed line items, agreed terms, and delivery milestones.", bold_prefix="Unstandardized Purchase Commitments:")

    add_heading_1(doc, "4. Specific Problem Addressed by ProcureFlow", space_before=10, space_after=4)
    add_body_p(
        doc,
        "ProcureFlow directly resolves this operational deficit by establishing a lightweight, structured digital workflow that bridges the gap between unstructured consumer messaging and over-engineered enterprise ERPs. It enforces algorithmic pricing transparency, regional vendor discovery, role-based tenant isolation, deterministic state transitions, and verifiable commercial auditability for industrial MSMEs."
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 3 — OBJECTIVES, SCOPE, AND REQUIREMENTS
    # =========================================================================
    print("Formatting Page 3: Objectives, Scope, and Requirements...")

    add_heading_1(doc, "1. Project Objectives", space_before=0, space_after=4)
    add_body_p(
        doc,
        "To architect, implement, and empirically verify a full-stack, state-driven B2B procurement platform specifically designed to govern the purchasing lifecycle for MSMEs with commercial transparency and technical rigor.",
        bold_prefix="Primary Objective:"
    )
    add_bullet_item(doc, "Enforce a deterministic backend Finite State Machine (FSM) governing RFQ transitions (DRAFT -> OPEN -> UNDER_REVIEW -> APPROVED -> PO_ISSUED), blocking unauthorized or illegal status leaps with HTTP 422.", bold_prefix="1. Lifecycle Governance:")
    add_bullet_item(doc, "Develop an algorithmic tiered pricing engine that dynamically evaluates vendor volume slabs against requested batch quantities, incorporating Number.EPSILON floating-point rounding precision.", bold_prefix="2. Dynamic Pricing Engine:")
    add_bullet_item(doc, "Provide a normalized side-by-side quotation comparison matrix that objectively identifies lowest price and fastest lead times while gracefully handling multi-quote ties.", bold_prefix="3. Quotation Comparison:")
    add_bullet_item(doc, "Enforce strict Role-Based Access Control (RBAC) and multi-tenant data isolation, ensuring Buyers cannot tamper with competing organizations' RFQs and Vendors cannot view unreleased drafts.", bold_prefix="4. Tenant Security & RBAC:")
    add_bullet_item(doc, "Generate immutable Purchase Orders with database-enforced uniqueness (unique: true index on rfq_id) to eliminate duplicate commitments under concurrent requests.", bold_prefix="5. Purchase Order Integrity:")
    add_bullet_item(doc, "Implement a lightweight, append-only chronological audit timeline recording all significant lifecycle events for operational accountability.", bold_prefix="6. Milestone Audit Trail:")

    add_heading_1(doc, "2. Project Scope and Boundaries", space_before=10, space_after=4)
    
    table_scope = doc.add_table(rows=5, cols=2)
    table_scope.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_scope.autofit = False
    set_table_borders(table_scope, color=COLOR_BORDER_HEX, sz="4", val="single")

    scope_data = [
        ("In-Scope Modules (Implemented & Verified)", "Out-of-Scope System Boundaries (Deliberate Limits)"),
        ("RFQ lifecycle management (Draft, Publish, Review, Select, Issue PO)", "Multi-line Bill of Materials (BOM) per single RFQ"),
        ("Regional industrial hub tagging (Chennai, Coimbatore, Bangalore)", "Real-time payment gateway / bank escrow fund disbursement"),
        ("Volume-based slab pricing validation & mathematical resolution", "Automated third-party freight / GPS logistics integration"),
        ("Immutable PO issuance with fulfillment FSM & chronological audit timeline", "External SMTP mail servers & SMS notification gateways")
    ]
    for r_idx, (col1, col2) in enumerate(scope_data):
        row = table_scope.rows[r_idx]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width, c2.width = Inches(3.38), Inches(3.39)
        set_cell_margins(c1, top=60, bottom=60, left=90, right=90)
        set_cell_margins(c2, top=60, bottom=60, left=90, right=90)
        if r_idx == 0:
            set_cell_background(c1, COLOR_NAVY_HEX)
            set_cell_background(c2, COLOR_NAVY_HEX)
            format_cell_text(c1, col1, bold=True, font_size=8.5, color=RGB_WHITE)
            format_cell_text(c2, col2, bold=True, font_size=8.5, color=RGB_WHITE)
        else:
            bg = COLOR_BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
            set_cell_background(c1, bg)
            set_cell_background(c2, bg)
            format_cell_text(c1, col1, bold=False, font_size=8.5, color=RGB_SLATE)
            format_cell_text(c2, col2, bold=False, font_size=8.5, color=RGB_SLATE)

    add_heading_1(doc, "3. System Requirements Specification", space_before=10, space_after=4)
    add_bullet_item(doc, "FR-1: Secure authentication with encrypted passwords (bcryptjs) and stateless JWT role claims.", bold_prefix="Functional:")
    add_bullet_item(doc, "FR-2: RFQ creation, specification drafting, regional hub tagging, and publication.", bold_prefix="Functional:")
    add_bullet_item(doc, "FR-3: Vendor quotation submission with multi-tiered volume pricing slabs and lead times.", bold_prefix="Functional:")
    add_bullet_item(doc, "FR-4: Automated unit price and total spend evaluation based on buyer requested quantity.", bold_prefix="Functional:")
    add_bullet_item(doc, "FR-5: Standardized comparison matrix highlighting lowest spend and fastest delivery with tie handling.", bold_prefix="Functional:")
    add_bullet_item(doc, "FR-6: Direct quotation selection, competitive bid rejection, and approval state transition.", bold_prefix="Functional:")
    add_bullet_item(doc, "FR-7: Idempotent Purchase Order generation with unique PO serial numbers (PO-YYYY-XXXX).", bold_prefix="Functional:")
    add_bullet_item(doc, "FR-8: Chronological audit event persistence and retrieval via REST API timeline endpoint.", bold_prefix="Functional:")
    add_bullet_item(doc, "NFR-1 (Performance): API response latencies <100ms for pricing evaluation and quote comparisons.", bold_prefix="Non-Functional:")
    add_bullet_item(doc, "NFR-2 (Security): Multi-tenant ownership verification rejecting unauthorized cross-organization access with 403.", bold_prefix="Non-Functional:")
    add_bullet_item(doc, "NFR-3 (Integrity): Database uniqueness constraint preventing duplicate PO generation under race conditions.", bold_prefix="Non-Functional:")

    doc.add_page_break()

    # =========================================================================
    # PAGE 4 — SYSTEM ARCHITECTURE AND WORKFLOW
    # =========================================================================
    print("Formatting Page 4: System Architecture and Workflow...")

    add_heading_1(doc, "1. Three-Tier Modular Monolith Architecture", space_before=0, space_after=4)
    add_body_p(
        doc,
        "ProcureFlow is engineered as a three-tier modular monolith, prioritizing domain separation, high cohesion, and low coupling without the operational overhead of microservices. The architecture cleanly decouples client presentation, HTTP transport/middleware, domain business logic, and data persistence."
    )

    if os.path.exists("architecture_diagram.png"):
        doc.add_picture("architecture_diagram.png", width=Inches(6.77))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(6)
        r_cap = p_cap.add_run("Figure 4.1: ProcureFlow Three-Tier Modular Architecture and Inter-Layer Communication")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(8)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGB_MUTED

    add_heading_1(doc, "2. Deterministic Workflow & Finite State Machine (FSM)", space_before=6, space_after=4)
    add_body_p(
        doc,
        "A central architectural contribution of ProcureFlow is the elimination of arbitrary database mutations through a centralized Finite State Machine. The procurement lifecycle advances through strictly validated state transitions:",
        bold_prefix="State Machine Invariants:"
    )

    if os.path.exists("workflow_fsm_diagram.png"):
        doc.add_picture("workflow_fsm_diagram.png", width=Inches(6.77))
        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_before = Pt(2)
        p_cap2.paragraph_format.space_after = Pt(6)
        r_cap2 = p_cap2.add_run("Figure 4.2: Deterministic RFQ Finite State Machine and Order Fulfillment Transitions")
        r_cap2.font.name = "Calibri"
        r_cap2.font.size = Pt(8)
        r_cap2.font.italic = True
        r_cap2.font.color.rgb = RGB_MUTED

    add_body_p(
        doc,
        "1. DRAFT -> OPEN: Triggered by Buyer publication; validates required fields and broadcasts RFQ to regional suppliers. 2. OPEN -> UNDER_REVIEW: Initiated upon receipt of eligible vendor quotations. 3. UNDER_REVIEW -> APPROVED: Buyer confirms winning quotation; competing bids are marked REJECTED. 4. APPROVED -> PO_ISSUED: Buyer generates formal PO; RFQ reaches terminal state. 5. CANCELLED: Can be invoked from DRAFT, OPEN, or UNDER_REVIEW, immediately freezing all bidding.",
        bold_prefix="Lifecycle Progression Rules:"
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 5 — MAJOR MODULES AND BUSINESS LOGIC
    # =========================================================================
    print("Formatting Page 5: Major Modules and Business Logic...")

    add_heading_1(doc, "1. Authentication and RBAC Module (modules/auth)", space_before=0, space_after=3)
    add_body_p(
        doc,
        "The authentication module manages user identity, organization mapping, and regional hub assignments. Passwords are encrypted using bcryptjs with 10 salt rounds. Upon verification, the server issues a signed JSON Web Token (JWT) containing the user ID, email, role (BUYER or VENDOR), organization, and regional hub. Middleware functions (authenticateToken and requireRole) guard protected API endpoints."
    )

    add_heading_1(doc, "2. RFQ Management and FSM Module (modules/rfqs)", space_before=6, space_after=3)
    add_body_p(
        doc,
        "Governs procurement requirements. Validates payloads against Zod schemas and enforces multi-tenant ownership: buyers can only update or cancel their own RFQs. To protect buyer confidentiality, vendors attempting to query DRAFT RFQs or draft quotations receive an immediate HTTP 403 Forbidden error."
    )

    add_heading_1(doc, "3. Dynamic Tiered Pricing Engine (modules/quotations)", space_before=6, space_after=3)
    add_body_p(
        doc,
        "Vendors submit volume-based pricing slabs defining minimum quantities, maximum quantities (or null for open-ended top tiers), and unit prices. The pricing engine enforces strict economic and mathematical invariants:",
        bold_prefix="Algorithmic Formulation:"
    )
    add_bullet_item(doc, "Boundary and Gap Validation: Validates that slab n+1 starts exactly at min_{n+1} = max_n + 1. Slabs with gaps or overlaps are rejected with 400 Bad Request.", bold_prefix="Validation Invariant 1:")
    add_bullet_item(doc, "Non-Inverted Economics: Enforces price monotonicity (unit_price_{n+1} <= unit_price_n) to ensure higher volumes do not incur higher per-unit rates.", bold_prefix="Validation Invariant 2:")
    add_bullet_item(doc, "Decimal Precision & Epsilon Rounding: Evaluated totals use Math.round((val + Number.EPSILON) * 100) / 100, preventing IEEE 754 precision drift (e.g. 17 * 12.35 = 209.94999999999999 rounds to 209.95).", bold_prefix="Validation Invariant 3:")

    add_heading_1(doc, "4. Quotation Comparison Matrix & Fair Tie Handling", space_before=6, space_after=3)
    add_body_p(
        doc,
        "When evaluating competing bids, the backend evaluates all quotes against requested quantity Q and compiles a normalized comparison matrix. To avoid unfair algorithmic bias, the system tracks multiple lowest price IDs (lowestPriceQuoteIds) and fastest lead time IDs (fastestDeliveryQuoteIds). All tied quotations are highlighted equally in the UI."
    )

    add_heading_1(doc, "5. Purchase Order Issuance & Fulfillment (modules/orders)", space_before=6, space_after=3)
    add_body_p(
        doc,
        "Upon quotation approval, the buyer generates an official Purchase Order. Idempotency is enforced: if a PO already exists for the given rfq_id, the existing document is returned safely without duplicate writes. A database-level unique index on rfq_id prevents concurrent generation race conditions. Post-issuance fulfillment follows an explicit state machine: ISSUED -> ACKNOWLEDGED -> FULFILLED, rejecting backward mutations."
    )

    add_heading_1(doc, "6. Append-Only Audit Trail & Activity Timeline (modules/audit)", space_before=6, space_after=3)
    add_body_p(
        doc,
        "Provides commercial auditability by recording milestone events: CREATE_DRAFT, PUBLISH, CANCEL, SUBMIT_QUOTE, SELECT_VENDOR, GENERATE_PO, ACKNOWLEDGE_PO, and FULFILL_PO. Records capture entity type, entity ID, from_state, to_state, actor user ID, timestamp, and notes. The GET /api/rfqs/:id/timeline endpoint populates a visual activity log in the frontend."
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 6 — TECHNOLOGY STACK, DATA MODEL, AND SECURITY
    # =========================================================================
    print("Formatting Page 6: Technology Stack, Data Model, and Security...")

    add_heading_1(doc, "1. Evaluated Technology Stack", space_before=0, space_after=4)
    
    table_tech = doc.add_table(rows=8, cols=4)
    table_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_tech.autofit = False
    set_table_borders(table_tech, color=COLOR_BORDER_HEX, sz="4", val="single")

    tech_headers = ["Layer", "Technology", "Version", "Technical Role & Justification"]
    tech_data = [
        ("Frontend UI", "React 19", "v19.0.0", "Component-based SPA, predictable state rendering and fast updates"),
        ("Type Safety", "TypeScript", "v5.6.3", "Compile-time type verification, interfaces for API contracts and domain models"),
        ("Build Tooling", "Vite", "v8.3.0", "Ultra-fast ES module bundling and optimized production client distribution"),
        ("Server Runtime", "Node.js (ESM)", "v22.x", "Asynchronous, event-driven backend runtime utilizing native ES modules"),
        ("API Framework", "Express", "v5.2.1", "Robust middleware routing pipeline and clean modular monolith controllers"),
        ("Database & ODM", "MongoDB / Mongoose", "v9.10.2", "Document store for flexible pricing slabs with schema validation & unique indexes"),
        ("Validation & Auth", "Zod & JWT / bcryptjs", "v4 / v9 / v3", "Runtime schema validation, salted password hashing, and stateless bearer auth")
    ]

    for c_idx, h_text in enumerate(tech_headers):
        cell = table_tech.rows[0].cells[c_idx]
        set_cell_background(cell, COLOR_NAVY_HEX)
        set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
        format_cell_text(cell, h_text, bold=True, font_size=8, color=RGB_WHITE)

    table_tech.rows[0].cells[0].width = Inches(1.1)
    table_tech.rows[0].cells[1].width = Inches(1.4)
    table_tech.rows[0].cells[2].width = Inches(0.8)
    table_tech.rows[0].cells[3].width = Inches(3.47)

    for r_idx, (col1, col2, col3, col4) in enumerate(tech_data, start=1):
        row = table_tech.rows[r_idx]
        row.cells[0].width = Inches(1.1)
        row.cells[1].width = Inches(1.4)
        row.cells[2].width = Inches(0.8)
        row.cells[3].width = Inches(3.47)
        bg = COLOR_BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([col1, col2, col3, col4]):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=45, bottom=45, left=60, right=60)
            format_cell_text(cell, val, bold=(c_idx == 1), font_size=8, color=RGB_SLATE)

    add_heading_1(doc, "2. Data Model & Relational Schema Architecture", space_before=6, space_after=3)
    
    if os.path.exists("data_model_diagram.png"):
        doc.add_picture("data_model_diagram.png", width=Inches(6.77))
        p_cap3 = doc.add_paragraph()
        p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap3.paragraph_format.space_before = Pt(2)
        p_cap3.paragraph_format.space_after = Pt(4)
        r_cap3 = p_cap3.add_run("Figure 6.1: ProcureFlow Entity-Relationship Schema Architecture & Indexed References")
        r_cap3.font.name = "Calibri"
        r_cap3.font.size = Pt(8)
        r_cap3.font.italic = True
        r_cap3.font.color.rgb = RGB_MUTED

    add_heading_1(doc, "3. Application Security Implementation & Boundaries", space_before=6, space_after=3)
    add_bullet_item(doc, "User passwords salted and hashed with bcryptjs (10 rounds); raw passwords never stored.", bold_prefix="Cryptographic Protection:")
    add_bullet_item(doc, "JWT bearer tokens cryptographically signed with HS256 secret; bearer token verified on all private routes.", bold_prefix="Stateless Token Security:")
    add_bullet_item(doc, "All write endpoints validate incoming JSON against strict Zod schemas before service execution.", bold_prefix="Runtime Input Sanitization:")
    add_bullet_item(doc, "Buyers can only inspect and manage RFQs belonging to their account; cross-tenant tampering triggers 403.", bold_prefix="Multi-Tenant Isolation:")
    add_bullet_item(doc, "Known Boundaries: Current system operates in single-cluster deployment without distributed refresh token rotators, CSRF tokens (session cookies not used), or external WAF/rate-limiting proxies (identified for future production scaling).", bold_prefix="Security Limitations:")

    doc.add_page_break()

    # =========================================================================
    # PAGE 7 — TESTING, RESULTS, AND EVALUATION
    # =========================================================================
    print("Formatting Page 7: Testing, Results, and Evaluation...")

    add_heading_1(doc, "1. Testing Strategy and Test Architecture", space_before=0, space_after=4)
    add_body_p(
        doc,
        "Software reliability and mathematical accuracy are verified via automated testing using Vitest 5 and Supertest 7. The test suite isolates business logic units (pricing engine and finite state machine) and executes full-flow HTTP integration tests against an active MongoDB test instance."
    )

    add_heading_1(doc, "2. Verified Test Execution Summary (20/20 Tests Passing)", space_before=6, space_after=4)

    table_test = doc.add_table(rows=4, cols=5)
    table_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_test.autofit = False
    set_table_borders(table_test, color=COLOR_BORDER_HEX, sz="4", val="single")

    test_headers = ["Test Suite File", "Scope / Target Module", "Tests", "Result", "Duration"]
    test_rows = [
        ("pricing-engine.test.js", "Tiered pricing, boundary checks, gaps, epsilon rounding", "11", "11 Passed (100%)", "27 ms"),
        ("state-machine.test.js", "RFQ lifecycle FSM, illegal transitions, terminal locks", "5", "5 Passed (100%)", "16 ms"),
        ("rfq-workflow.test.js", "HTTP API integration, RBAC, tenant isolation, PO idempotency", "4", "4 Passed (100%)", "937 ms")
    ]

    for c_idx, h_text in enumerate(test_headers):
        cell = table_test.rows[0].cells[c_idx]
        set_cell_background(cell, COLOR_NAVY_HEX)
        set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
        format_cell_text(cell, h_text, bold=True, font_size=8, color=RGB_WHITE)

    table_test.rows[0].cells[0].width = Inches(1.8)
    table_test.rows[0].cells[1].width = Inches(2.67)
    table_test.rows[0].cells[2].width = Inches(0.6)
    table_test.rows[0].cells[3].width = Inches(1.1)
    table_test.rows[0].cells[4].width = Inches(0.6)

    for r_idx, (col1, col2, col3, col4, col5) in enumerate(test_rows, start=1):
        row = table_test.rows[r_idx]
        row.cells[0].width = Inches(1.8)
        row.cells[1].width = Inches(2.67)
        row.cells[2].width = Inches(0.6)
        row.cells[3].width = Inches(1.1)
        row.cells[4].width = Inches(0.6)
        bg = COLOR_BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([col1, col2, col3, col4, col5]):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=45, bottom=45, left=60, right=60)
            is_pass = "Passed" in val
            color = RGB_TEAL if is_pass else RGB_SLATE
            format_cell_text(cell, val, bold=(c_idx in [0, 3]), font_size=8, color=color)

    add_heading_1(doc, "3. Deep-Dive Analysis of Verified Critical Scenarios", space_before=8, space_after=3)
    add_bullet_item(doc, "Verifies calculations at exact slab boundaries (e.g., quantities 100, 499, 500) and open-ended max_qty: null.", bold_prefix="Exact Boundary Resolution:")
    add_bullet_item(doc, "Rejects quantities below minimum tier or above bounded maximum with 400 Bad Request.", bold_prefix="Out-of-Bounds Rejection:")
    add_bullet_item(doc, "Identifies and rejects non-continuous slabs (e.g. 1–100 followed by 150–500) and overlapping brackets.", bold_prefix="Slab Gap & Overlap Detection:")
    add_bullet_item(doc, "Rejects inverted economics where larger purchase quantities cost more per unit than lower tiers.", bold_prefix="Monotonicity & Inverted Pricing:")
    add_bullet_item(doc, "Verifies Math.round((val + Number.EPSILON) * 100) / 100 correctly rounds boundary floating-point values without IEEE 754 drift.", bold_prefix="Epsilon Floating-Point Precision:")
    add_bullet_item(doc, "Asserts attempts to jump from DRAFT directly to PO_ISSUED throw HTTP 422 Unprocessable Entity.", bold_prefix="FSM Illegal Transition Blocking:")
    add_bullet_item(doc, "Asserts mutations on terminal PO_ISSUED or CANCELLED records are blocked.", bold_prefix="Terminal State Lock:")
    add_bullet_item(doc, "Asserts Buyer B attempting to fetch or modify Buyer A's RFQs receives HTTP 403 Forbidden.", bold_prefix="Cross-Tenant Security Isolation:")
    add_bullet_item(doc, "Asserts duplicate PO generation requests return existing PO without duplicate database writes.", bold_prefix="PO Generation Idempotency:")

    add_heading_1(doc, "4. Current Technical Limitations & Known Gaps", space_before=8, space_after=3)
    add_body_p(
        doc,
        "While the 20 automated tests demonstrate high architectural dependability, current testing is focused on backend services and API routes. End-to-end browser automation (e.g., Playwright or Cypress) is not yet integrated into CI. Performance benchmarks under high concurrent write loads (>10,000 req/sec) have not been conducted."
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 8 — CONCLUSION, FUTURE SCOPE, AND REFERENCES
    # =========================================================================
    print("Formatting Page 8: Conclusion, Future Scope, and References...")

    add_heading_1(doc, "1. Project Conclusion", space_before=0, space_after=3)
    add_body_p(
        doc,
        "ProcureFlow successfully demonstrates the design, full-stack implementation, and automated verification of a state-driven B2B procurement platform engineered specifically for the operational needs of MSMEs. By enforcing a deterministic Finite State Machine, automated tiered pricing evaluation with epsilon precision, objective quotation comparison with tie-handling, database-enforced PO uniqueness, and append-only audit tracking, the application replaces fragmented manual procurement with a transparent, reliable, and auditable commercial workflow."
    )

    add_heading_1(doc, "2. Key Technical Learning Outcomes", space_before=6, space_after=3)
    add_bullet_item(doc, "Designing centralized state machines to protect transactional integrity across complex business lifecycles.", bold_prefix="State Machine Architecture:")
    add_bullet_item(doc, "Understanding IEEE 754 binary floating-point representation and implementing epsilon rounding in commercial software.", bold_prefix="Financial Numerical Precision:")
    add_bullet_item(doc, "Implementing defense-in-depth authorization with JWT claims and multi-tenant resource ownership guards.", bold_prefix="Multi-Tenant Security:")
    add_bullet_item(doc, "Developing comprehensive unit and integration test suites using Vitest and Supertest to eliminate regressions.", bold_prefix="Test-Driven Dependability:")

    add_heading_1(doc, "3. Proposed Future Scope & Production Roadmap", space_before=6, space_after=3)
    add_bullet_item(doc, "Expanding RFQ schemas to support multi-item Bill of Materials (BOM) with item-specific delivery milestones.", bold_prefix="1. Multi-Item RFQ / BOM Support:")
    add_bullet_item(doc, "Introducing configurable managerial threshold approval workflows for orders exceeding configured capital limits.", bold_prefix="2. Multi-Tier Financial Approvals:")
    add_bullet_item(doc, "Integrating WebSocket connections to provide instant notification of new quotations and order acknowledgments.", bold_prefix="3. Real-Time WebSocket Alerts:")
    add_bullet_item(doc, "Connecting escrow-based milestone payment gateways to automate fund disbursement upon PO fulfillment.", bold_prefix="4. B2B Escrow Payment Gateways:")
    add_bullet_item(doc, "Providing native server-side PDF generation for formal offline RFQ summaries and printable tax invoices.", bold_prefix="5. Document Export Services:")
    add_bullet_item(doc, "Packaging services into multi-stage Docker containers with automated GitHub Actions CI/CD pipelines.", bold_prefix="6. Containerized Orchestration:")

    add_heading_1(doc, "4. Technical References and Official Documentation", space_before=6, space_after=3)
    add_bullet_item(doc, "React Documentation (React 19) — https://react.dev (Official documentation on concurrent features & hooks).")
    add_bullet_item(doc, "Node.js Documentation (Node.js v22 LTS) — https://nodejs.org/docs (ES module architecture and runtime APIs).")
    add_bullet_item(doc, "Express Application Framework — https://expressjs.com (Routing pipelines and RESTful middleware design).")
    add_bullet_item(doc, "MongoDB & Mongoose ODM — https://mongoosejs.com/docs (Schema modeling, indexing, and validation hooks).")
    add_bullet_item(doc, "Zod Validation Library — https://zod.dev (TypeScript-first schema declaration and runtime payload validation).")
    add_bullet_item(doc, "Vitest Testing Framework — https://vitest.dev (Blazing-fast unit and integration testing runner).")
    add_bullet_item(doc, "RFC 7519 JSON Web Token (JWT) — https://datatracker.ietf.org/doc/html/rfc7519 (Stateless security specification).")

    # Certification / Sign-off Block
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    table_sign = doc.add_table(rows=2, cols=3)
    table_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_sign.autofit = False
    set_table_borders(table_sign, color=COLOR_BORDER_HEX, sz="4", val="single")

    sign_labels = [
        ("Candidate Signature\n\n_____________________\n[Student Name]", Inches(2.25)),
        ("Project Supervisor\n\n_____________________\n[Guide Name, Designation]", Inches(2.26)),
        ("Department HOD / Examiner\n\n_____________________\nHead of Department", Inches(2.26))
    ]
    for c_idx, (text, width) in enumerate(sign_labels):
        cell_top = table_sign.rows[0].cells[c_idx]
        cell_top.width = width
        set_cell_background(cell_top, COLOR_BG_LIGHT_HEX)
        set_cell_margins(cell_top, top=40, bottom=40, left=60, right=60)
        format_cell_text(cell_top, text.split("\n\n")[0], bold=True, font_size=8, color=RGB_NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)

        cell_bot = table_sign.rows[1].cells[c_idx]
        cell_bot.width = width
        set_cell_background(cell_bot, "FFFFFF")
        set_cell_margins(cell_bot, top=60, bottom=60, left=60, right=60)
        format_cell_text(cell_bot, "\n" + text.split("\n\n")[1], bold=False, font_size=7.5, color=RGB_SLATE, align=WD_ALIGN_PARAGRAPH.CENTER)

    # Save Document
    doc.save(output_filename)
    print(f"Document successfully created and saved as: {output_filename}")

if __name__ == "__main__":
    generate_diagrams()
    build_docx_report("ProcureFlow_Project_Report.docx")
