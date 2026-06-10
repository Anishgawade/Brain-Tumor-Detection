import base64
import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle

router = APIRouter(tags=["Report"])

from typing import List

class ReportRequest(BaseModel):
    filename: str
    prediction: str
    confidence: float
    tumor_type: str
    gradcam_base64: str
    original_base64: str
    symptoms: List[str] = []
    treatments: List[str] = []
    patient_name: str = "Not Specified"
    patient_id: str = ""
    patient_age: str = ""
    patient_gender: str = ""
    patient_blood_group: str = ""
    contact_number: str = ""
    scan_date: str = ""
    clinical_notes: str = ""
    tumor_volume_mm3: float = 0.0

class TimelineScan(BaseModel):
    date: str
    filename: str
    prediction: str
    confidence: float
    tumor_type: str

class TimelineRequest(BaseModel):
    patient_name: str
    patient_id: str = ""
    patient_age: str = ""
    patient_gender: str = ""
    patient_blood_group: str = ""
    scans: List[TimelineScan]

@router.post("/export")
async def export_report(req: ReportRequest):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=40, leftMargin=40,
                                topMargin=40, bottomMargin=40)
        
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1 # Center
        title_style.textColor = colors.HexColor("#1e3a8a")
        
        normal_style = styles['Normal']
        normal_style.fontSize = 12
        normal_style.spaceAfter = 12

        elements = []
        
        # Header
        elements.append(Paragraph("NeuroScan AI - Detection Report", title_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Details
        demo_str = f"<b>Patient:</b> {req.patient_name}"
        if req.patient_id:
            demo_str += f" ({req.patient_id})"
            
        demo_str2 = ""
        if req.patient_age:
            demo_str2 += f"<b>Age:</b> {req.patient_age} yrs"
        if req.patient_gender:
            demo_str2 += f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>Gender:</b> {req.patient_gender}"
        if req.patient_blood_group:
            demo_str2 += f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>Blood:</b> {req.patient_blood_group}"
        
        elements.append(Paragraph(demo_str, normal_style))
        if demo_str2:
            elements.append(Paragraph(demo_str2, normal_style))
            
        contact_str = f"<b>Scan Date:</b> {req.scan_date if req.scan_date else 'N/A'}"
        if req.contact_number:
            contact_str += f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>Contact:</b> {req.contact_number}"
        elements.append(Paragraph(contact_str, normal_style))
        
        elements.append(Paragraph(f"<b>MRI Filename:</b> {req.filename}", normal_style))
        elements.append(Paragraph(f"<b>Prediction:</b> <font color='{'red' if req.prediction == 'Tumor' else 'green'}'>{req.tumor_type}</font>", normal_style))
        
        if req.tumor_volume_mm3 > 0:
            elements.append(Paragraph(f"<b>Est. Tumor Volume:</b> {req.tumor_volume_mm3:,.0f} mm³", normal_style))
            
        elements.append(Paragraph(f"<b>Confidence:</b> {round(req.confidence * 100, 2)}%", normal_style))
        
        if req.clinical_notes:
            elements.append(Spacer(1, 0.1 * inch))
            elements.append(Paragraph("<b>Clinical Notes / Observed Symptoms:</b>", normal_style))
            elements.append(Paragraph(req.clinical_notes, normal_style))

        elements.append(Spacer(1, 0.3 * inch))
        
        # Images side by side (Original and maybe Grad-CAM)
        try:
            orig_data = base64.b64decode(req.original_base64.split(",")[1] if "," in req.original_base64 else req.original_base64)
            orig_stream = io.BytesIO(orig_data)
            orig_img = RLImage(orig_stream, width=3*inch, height=3*inch)
            
            if req.gradcam_base64:
                gc_data = base64.b64decode(req.gradcam_base64.split(",")[1] if "," in req.gradcam_base64 else req.gradcam_base64)
                gc_stream = io.BytesIO(gc_data)
                gc_img = RLImage(gc_stream, width=3*inch, height=3*inch)
                
                img_table = Table([[orig_img, gc_img]])
                labels_table = Table([[Paragraph("Original MRI", normal_style), Paragraph("Grad-CAM Overlay", normal_style)]])
            else:
                img_table = Table([[orig_img]])
                labels_table = Table([[Paragraph("Original MRI", normal_style)]])
                
            img_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            labels_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER')]))
            
            elements.append(Paragraph("<b>MRI Scan Analysis</b>", styles['Heading2']))
            elements.append(img_table)
            elements.append(labels_table)
            
        except Exception as e:
            print(f"Failed to parse images for PDF: {e}")
            elements.append(Paragraph("<i>Image visualization failed to load in report.</i>", normal_style))
            
        if req.prediction == 'Tumor' and (req.symptoms or req.treatments):
            elements.append(Spacer(1, 0.2 * inch))
            elements.append(Paragraph(f"<b><u>{req.tumor_type} Clinical Insights</u></b>", styles['Heading3']))
            
            if req.symptoms:
                elements.append(Paragraph("<b>Typical Disease Presentation:</b>", normal_style))
                for sym in req.symptoms:
                    elements.append(Paragraph(f"• {sym}", normal_style))
                    
            if req.treatments:
                elements.append(Paragraph("<b>Preventative / Treatment Measures:</b>", normal_style))
                for trt in req.treatments:
                    elements.append(Paragraph(f"• {trt}", normal_style))

        elements.append(Spacer(1, 0.4 * inch))
        elements.append(Paragraph("<b>Disclaimer:</b> This AI-generated report is for research and informational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for proper evaluation.", styles['Italic']))

        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename=NeuroScan_Report_{req.filename}.pdf"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export-timeline")
async def export_timeline(req: TimelineRequest):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1
        title_style.textColor = colors.HexColor("#1e3a8a")
        
        normal_style = styles['Normal']
        normal_style.fontSize = 12
        normal_style.spaceAfter = 8
        
        elements = []
        elements.append(Paragraph("NeuroScan AI - Comprehensive Timeline Report", title_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        demo_str = f"<b>Patient:</b> {req.patient_name}"
        if req.patient_id:
            demo_str += f" ({req.patient_id})"
            
        demo_str2 = ""
        if req.patient_age:
            demo_str2 += f"<b>Age:</b> {req.patient_age} yrs"
        if req.patient_gender:
            demo_str2 += f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>Gender:</b> {req.patient_gender}"
        if req.patient_blood_group:
            demo_str2 += f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>Blood:</b> {req.patient_blood_group}"
            
        elements.append(Paragraph(demo_str, normal_style))
        if demo_str2:
            elements.append(Paragraph(demo_str2, normal_style))
        elements.append(Paragraph(f"<b>Total Scans Indexed:</b> {len(req.scans)}", normal_style))
        
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("<b><u>Scan Chronology</u></b>", styles['Heading3']))
        elements.append(Spacer(1, 0.1 * inch))
        
        data = [["Date", "File", "Verdict", "Subtype", "AI Confidence"]]
        for s in req.scans:
            conf_str = f"{round(s.confidence, 1)}%" if s.confidence > 1.0 else f"{round(s.confidence * 100, 2)}%"
            data.append([s.date, s.filename, s.prediction, s.tumor_type, conf_str])
            
        table = Table(data, colWidths=[1.2*inch, 2.0*inch, 1.2*inch, 1.5*inch, 1.2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1"))
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("<b>Disclaimer:</b> This longitudinal tracking report is AI-generated for research purposes only.", styles['Italic']))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename=Timeline_Report_{req.patient_name.replace(' ', '_')}.pdf"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
