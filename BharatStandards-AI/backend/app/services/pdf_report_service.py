"""
BharatStandards AI - PDF Report Generation Service
Generates professional, multi-page vector compliance readiness dossier PDFs
using ReportLab with custom running headers, footers, page numbering, and visual tables.
"""
import io
from datetime import datetime
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

DISCLAIMER_TEXT = (
    "Important: This report is an AI-assisted compliance readiness assessment based on "
    "available product information, standards data and uploaded evidence. It does not constitute "
    "official BIS certification, legal advice, or an official conformity assessment."
)


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count
    along with running header, running footer, and security disclaimer on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Top Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 28, "BharatStandards AI — Compliance Readiness Assessment Dossier")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(36, 11 * inch - 32, 8.5 * inch - 36, 11 * inch - 32)

        # Running Bottom Footer (all pages)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(36, 36, 8.5 * inch - 36, 36)

        # Footer Disclaimer left
        self.drawString(36, 26, "AI-Assisted Readiness Assessment • Not an Official BIS Certificate")
        # Page count right
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(8.5 * inch - 36, 26, page_str)

        self.restoreState()


class PDFReportService:
    """
    Engine for generating presentation-ready compliance readiness PDFs.
    """

    @classmethod
    def generate_pdf(cls, report_data: Dict[str, Any]) -> bytes:
        """
        Builds a multi-page PDF in memory from structured report data.
        Returns raw PDF bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=44,
            bottomMargin=48,
        )

        styles = getSampleStyleSheet()
        # Custom Typography
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0f172a"),
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#ea580c"),
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#0f2b48"),
            spaceBefore=12,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "BodyDark",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#334155"),
        )
        body_bold = ParagraphStyle(
            "BodyDarkBold",
            parent=body_style,
            fontName="Helvetica-Bold",
        )
        table_cell = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1e293b"),
        )
        table_cell_bold = ParagraphStyle(
            "TableCellBold",
            parent=table_cell,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#0f172a"),
        )

        story = []

        # =========================================================================
        # 1. HEADER / COVER BLOCK
        # =========================================================================
        header_data = [
            [
                Paragraph("<b>BharatStandards AI</b>", ParagraphStyle("Brand", fontName="Helvetica-Bold", fontSize=12, textColor=colors.HexColor("#0f2b48"))),
                Paragraph(f"<b>Report No:</b> {report_data.get('report_number', 'BSA-2026-000001')}", ParagraphStyle("RepNo", fontName="Helvetica", fontSize=9, alignment=2, textColor=colors.HexColor("#64748b"))),
            ]
        ]
        t_top = Table(header_data, colWidths=[4.0 * inch, 3.5 * inch])
        t_top.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(t_top)
        story.append(Spacer(1, 8))

        story.append(Paragraph("Compliance Readiness Assessment", title_style))
        story.append(Paragraph("AI-assisted compliance readiness assessment", subtitle_style))
        story.append(Spacer(1, 6))

        # Demo data notice banner
        if report_data.get("is_demo", True):
            demo_banner_data = [[
                Paragraph("<b>DEMO / SYNTHETIC DATA:</b> This assessment dossier is based on demonstration parameters and does not represent official government filings.", ParagraphStyle("DemoText", fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#92400e")))
            ]]
            t_demo = Table(demo_banner_data, colWidths=[7.5 * inch])
            t_demo.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fef3c7")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#f59e0b")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(t_demo)
            story.append(Spacer(1, 10))

        # =========================================================================
        # 2. EXECUTIVE SUMMARY & SCORE
        # =========================================================================
        score = report_data.get("readiness_score", 0.0)
        risk_score = report_data.get("overall_risk_score", 0.0)
        risk_level = report_data.get("risk_level", "LOW")
        risk_color = "#e11d48" if risk_level == "CRITICAL" else "#ea580c" if risk_level == "HIGH" else "#d97706" if risk_level == "MEDIUM" else "#059669"

        passed = report_data.get("passed_count", 0)
        partial = report_data.get("partial_count", 0)
        missing = report_data.get("missing_count", 0)
        total = report_data.get("total_requirements", passed + partial + missing)

        score_box_data = [
            [
                Paragraph("<b>READINESS SCORE</b>", ParagraphStyle("ScoreTitle", fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.HexColor("#64748b"))),
                Paragraph("<b>OVERALL RISK</b>", ParagraphStyle("RiskTitle", fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.HexColor("#64748b"))),
                Paragraph("<b>REQUIREMENT BREAKDOWN</b>", ParagraphStyle("BreakTitle", fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.HexColor("#64748b"))),
                Paragraph("<b>AUDIT SUMMARY</b>", ParagraphStyle("SumTitle", fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.HexColor("#64748b"))),
            ],
            [
                Paragraph(f"<font size=20 color='#059669'><b>{score}%</b></font><br/><font size=7.5 color='#64748b'>Readiness Level</font>", ParagraphStyle("ScoreNum", leading=14)),
                Paragraph(f"<font size=20 color='{risk_color}'><b>{risk_score}</b></font><br/><font size=7.5 color='{risk_color}'><b>{risk_level} RISK</b></font>", ParagraphStyle("RiskNum", leading=14)),
                Paragraph(
                    f"<font color='#059669'><b>{passed} PASS</b></font><br/>"
                    f"<font color='#d97706'><b>{partial} PARTIAL</b></font><br/>"
                    f"<font color='#e11d48'><b>{missing} MISSING</b></font><br/>"
                    f"<font color='#64748b'>Total: {total} Clauses</font>",
                    ParagraphStyle("BreakTxt", fontName="Helvetica", fontSize=8, leading=10.5)
                ),
                Paragraph(
                    f"{passed} of {total} assessed requirements have verified empirical evidence.<br/>"
                    f"<b>{missing} critical gap(s)</b> require accredited laboratory test proof before formal BIS licensing filing.",
                    ParagraphStyle("SumTxt", fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=colors.HexColor("#334155"))
                )
            ]
        ]
        t_score = Table(score_box_data, colWidths=[1.7 * inch, 1.7 * inch, 1.8 * inch, 2.3 * inch])
        t_score.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t_score)
        story.append(Spacer(1, 12))

        # =========================================================================
        # 3. PRODUCT & STANDARD SPECIFICATIONS
        # =========================================================================
        prod = report_data.get("product", {})
        std = report_data.get("standard", {})

        meta_data = [
            [
                Paragraph("<b>Product Information</b>", table_cell_bold),
                Paragraph(f"<b>Name:</b> {prod.get('name', 'N/A')}<br/><b>Category:</b> {prod.get('category', 'N/A')}<br/><b>Manufacturer:</b> {prod.get('manufacturer') or 'N/A'}<br/><b>Model:</b> {prod.get('model_number') or 'N/A'}", table_cell),
                Paragraph("<b>Standard Specifications</b>", table_cell_bold),
                Paragraph(f"<b>Standard:</b> {std.get('standard_number', 'DEMO-IS-001')}<br/><b>Title:</b> {std.get('title', 'N/A')}<br/><b>Version:</b> {std.get('version', '2026')}<br/><b>Scope:</b> {std.get('category', 'Electrical')}", table_cell),
            ]
        ]
        t_meta = Table(meta_data, colWidths=[1.5 * inch, 2.25 * inch, 1.5 * inch, 2.25 * inch])
        t_meta.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 14))

        # =========================================================================
        # 3.5. COMPLIANCE RISK OVERVIEW
        # =========================================================================
        top_risks = report_data.get("top_risks", [])
        story.append(Paragraph("Compliance Risk Overview & Decision Support", h2_style))

        risk_callout_data = [[
            Paragraph(
                "<b>BharatStandards AI Risk Classification - Not an official BIS risk rating.</b> "
                "This explainable assessment prioritizes gaps by combining requirement priority, compliance status, "
                "evidence completeness, and confidence. This is a decision-support system and does not constitute official certification or legal advice.",
                ParagraphStyle("RiskNotice", fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=colors.HexColor("#475569"))
            )
        ]]
        t_rcallout = Table(risk_callout_data, colWidths=[7.5 * inch])
        t_rcallout.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t_rcallout)
        story.append(Spacer(1, 6))

        if top_risks:
            risk_table_rows = [
                [
                    Paragraph("<b>Clause</b>", table_cell_bold),
                    Paragraph("<b>Title & Requirement</b>", table_cell_bold),
                    Paragraph("<b>Risk Score</b>", table_cell_bold),
                    Paragraph("<b>Level</b>", table_cell_bold),
                    Paragraph("<b>Primary Risk Driver</b>", table_cell_bold),
                    Paragraph("<b>Recommended Action</b>", table_cell_bold),
                ]
            ]
            for tr in top_risks[:5]:
                r_score = tr.get("risk_score", 0.0)
                r_level = tr.get("risk_level", "LOW")
                r_color = "#e11d48" if r_level == "CRITICAL" else "#ea580c" if r_level == "HIGH" else "#d97706" if r_level == "MEDIUM" else "#059669"
                reason_text = tr.get("reason", "") or (tr.get("reasons", ["Deficiency identified"])[0] if tr.get("reasons") else "Deficiency identified")
                action_text = tr.get("recommended_action", "Provide evidence")

                risk_table_rows.append([
                    Paragraph(f"<b>{tr.get('clause', '')}</b>", table_cell),
                    Paragraph(f"<b>{tr.get('title', '')}</b>", table_cell),
                    Paragraph(f"<font color='{r_color}'><b>{r_score}</b></font>", table_cell),
                    Paragraph(f"<font color='{r_color}'><b>{r_level}</b></font>", table_cell),
                    Paragraph(reason_text, table_cell),
                    Paragraph(action_text, table_cell),
                ])
            t_top_risks = Table(risk_table_rows, colWidths=[0.7 * inch, 1.8 * inch, 0.8 * inch, 0.8 * inch, 1.7 * inch, 1.7 * inch])
            t_top_risks.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fff1f2")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fda4af")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ffe4e6")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(t_top_risks)
            story.append(Spacer(1, 10))

        # =========================================================================
        # 4. REQUIREMENT ASSESSMENT TABLE
        # =========================================================================
        story.append(Paragraph("1. Clause-by-Clause Requirement Assessment", h2_style))
        assessments = report_data.get("assessments", [])

        table_rows = [
            [
                Paragraph("<b>Clause</b>", table_cell_bold),
                Paragraph("<b>Requirement Specification</b>", table_cell_bold),
                Paragraph("<b>Status</b>", table_cell_bold),
                Paragraph("<b>Confidence</b>", table_cell_bold),
                Paragraph("<b>Evidence & Citation Note</b>", table_cell_bold),
            ]
        ]

        for item in assessments:
            status_text = item.get("status", "PASS")
            status_color = "#059669" if status_text == "PASS" else "#d97706" if status_text == "PARTIAL" else "#e11d48"

            doc_ref = f"[{item.get('document_name')}, P.{item.get('page')}] " if item.get("document_name") else ""
            evidence_note = item.get("reason", "Verified conformity")
            if item.get("snippet"):
                evidence_note = f"{doc_ref}\"{item.get('snippet')[:100]}\""
            elif status_text == "MISSING":
                evidence_note = "No supporting evidence found in uploaded dossiers."

            table_rows.append([
                Paragraph(f"<b>{item.get('clause', '')}</b>", table_cell),
                Paragraph(f"<b>{item.get('title', '')}</b><br/><font color='#64748b'>{item.get('category', '')}</font>", table_cell),
                Paragraph(f"<font color='{status_color}'><b>{status_text}</b></font>", table_cell),
                Paragraph(item.get("confidence", "HIGH"), table_cell),
                Paragraph(evidence_note, table_cell),
            ])

        t_reqs = Table(table_rows, colWidths=[0.8 * inch, 2.3 * inch, 0.9 * inch, 0.9 * inch, 2.6 * inch])
        t_reqs.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_reqs)
        story.append(Spacer(1, 14))

        # =========================================================================
        # 5. COMPLIANCE GAPS REGISTER
        # =========================================================================
        gaps = report_data.get("gaps", [])
        if gaps:
            story.append(Paragraph("2. Compliance Gaps & Non-Conformances", h2_style))
            gap_rows = [
                [
                    Paragraph("<b>Priority</b>", table_cell_bold),
                    Paragraph("<b>Clause & Title</b>", table_cell_bold),
                    Paragraph("<b>Deficiency Description</b>", table_cell_bold),
                    Paragraph("<b>Recommended Remediation</b>", table_cell_bold),
                ]
            ]
            for g in gaps:
                p_color = "#e11d48" if g.get("priority") == "CRITICAL" else "#d97706"
                gap_rows.append([
                    Paragraph(f"<font color='{p_color}'><b>{g.get('priority')}</b></font>", table_cell),
                    Paragraph(f"<b>Clause {g.get('clause')}</b><br/>{g.get('requirement_title')}", table_cell),
                    Paragraph(g.get("problem", "Evidence missing"), table_cell),
                    Paragraph(g.get("recommended_action", "Conduct testing"), table_cell),
                ])
            t_gaps = Table(gap_rows, colWidths=[1.1 * inch, 1.8 * inch, 2.3 * inch, 2.3 * inch])
            t_gaps.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef2f2")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fee2e2")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(t_gaps)
            story.append(Spacer(1, 14))

        # =========================================================================
        # 6. ACTION PLAN & NEXT STEPS
        # =========================================================================
        actions = report_data.get("action_plan", [])
        if actions:
            story.append(Paragraph("3. Recommended Next Steps (Action Plan)", h2_style))
            action_rows = [
                [
                    Paragraph("<b>Step</b>", table_cell_bold),
                    Paragraph("<b>Action Required</b>", table_cell_bold),
                    Paragraph("<b>Target Requirement</b>", table_cell_bold),
                    Paragraph("<b>Engineering Rationale</b>", table_cell_bold),
                ]
            ]
            for idx, a in enumerate(actions, start=1):
                action_rows.append([
                    Paragraph(f"<b>{idx}</b>", table_cell_bold),
                    Paragraph(f"<b>{a.get('action')}</b>", table_cell),
                    Paragraph(a.get("related_requirement", "General"), table_cell),
                    Paragraph(a.get("reason", ""), table_cell),
                ])
            t_act = Table(action_rows, colWidths=[0.6 * inch, 2.6 * inch, 1.8 * inch, 2.5 * inch])
            t_act.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0fdf4")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#86efac")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbf7d0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(t_act)
            story.append(Spacer(1, 14))

        # =========================================================================
        # 7. SOURCES & REFERENCES
        # =========================================================================
        sources = report_data.get("sources", [])
        if sources:
            story.append(Paragraph("4. Sources & Verification References", h2_style))
            source_rows = [
                [
                    Paragraph("<b>Classification</b>", table_cell_bold),
                    Paragraph("<b>Source Name</b>", table_cell_bold),
                    Paragraph("<b>Reference Details</b>", table_cell_bold),
                ]
            ]
            for s in sources:
                source_rows.append([
                    Paragraph(s.get("source_type", "").replace("_", " "), table_cell),
                    Paragraph(f"<b>{s.get('name')}</b>", table_cell),
                    Paragraph(s.get("details", s.get("reference", "")), table_cell),
                ])
            t_src = Table(source_rows, colWidths=[1.8 * inch, 2.5 * inch, 3.2 * inch])
            t_src.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(t_src)
            story.append(Spacer(1, 14))

        # =========================================================================
        # 8. STATUTORY DISCLAIMER BOX
        # =========================================================================
        disclaimer_box = [
            [
                Paragraph(
                    f"<b>LEGAL NOTICE & DISCLAIMER:</b> {DISCLAIMER_TEXT}",
                    ParagraphStyle("DiscText", fontName="Helvetica-Oblique", fontSize=8, leading=10, textColor=colors.HexColor("#475569"))
                )
            ]
        ]
        t_disc = Table(disclaimer_box, colWidths=[7.5 * inch])
        t_disc.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(t_disc)

        # Build document with custom running canvas
        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()
