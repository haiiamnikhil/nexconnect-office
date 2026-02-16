from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_payslip_pdf(payslip):
    """
    Generate a PDF payslip for the given Payslip model instance.
    Returns a BytesIO buffer containing the PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # Title
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    elements.append(Paragraph(f"Payslip - {payslip.month_year.strftime('%B %Y')}", title_style))
    elements.append(Spacer(1, 20))

    # Employee Details
    emp = payslip.employee
    emp_data = [
        ["Employee ID:", emp.employee_code, "Designation:", emp.designation.title if emp.designation else "-"],
        ["Name:", f"{emp.first_name} {emp.last_name}", "Department:", emp.department.name if emp.department else "-"],
        ["Bank Account:", "XXXXXXXXXX", "PAN:", "XXXXX"] # Placeholders for sensitive/missing data
    ]
    
    t_emp = Table(emp_data, colWidths=[100, 150, 100, 150])
    t_emp.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_emp)
    elements.append(Spacer(1, 20))

    # Earnings & Deductions Table
    # We need to parse the JSON lines if they are stored as JSON, or use the summary fields
    # Assuming payslip.line_items is a JSON list of dicts {name, amount, type}
    
    earnings = []
    deductions = []
    
    if payslip.line_items:
        for item in payslip.line_items:
            if item.get('is_deduction'):
                deductions.append([item['name'], f"{float(item['amount']):,.2f}"])
            else:
                earnings.append([item['name'], f"{float(item['amount']):,.2f}"])

    # Pad lists to make them equal length for side-by-side display
    max_len = max(len(earnings), len(deductions))
    earnings += [['', '']] * (max_len - len(earnings))
    deductions += [['', '']] * (max_len - len(deductions))

    data = [['Earnings', 'Amount', 'Deductions', 'Amount']]
    for e, d in zip(earnings, deductions):
        data.append([e[0], e[1], d[0], d[1]])

    # Totals
    data.append(['Total Earnings', f"{float(payslip.gross_salary):,.2f}", 'Total Deductions', f"{float(payslip.total_deductions):,.2f}"])

    t_main = Table(data, colWidths=[150, 100, 150, 100])
    t_main.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'), # Amount column right align
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'), # Amount column right align
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'), # Total Row Bold
        ('BACKGROUND', (0, -1), (-1, -1), colors.whitesmoke),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_main)
    elements.append(Spacer(1, 20))

    # Net Pay
    net_style = ParagraphStyle('NetPay', parent=styles['Heading2'], alignment=2) # Right align
    elements.append(Paragraph(f"Net Pay: {float(payslip.net_salary):,.2f}", net_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
