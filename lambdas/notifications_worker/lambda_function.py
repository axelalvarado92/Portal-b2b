# lambdas/notifications_worker/lambda_function.py

import sys
import os
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
import boto3
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

from shared.db import get_connection

ses = boto3.client("ses", region_name=os.environ["AWS_REGION"])

SENDER_EMAIL = os.environ["SENDER_EMAIL"]


def handler(event, context):
    """
    Disparado por SQS. Procesa cada mensaje de la cola.
    """

    for record in event["Records"]:

        try:

            body = json.loads(record["body"])
            event_type = body.get("event")

            if event_type == "ORDER_CREATED":

                process_order(body["order_id"])

            else:

                print(f"Evento desconocido: {event_type}")

        except Exception:

            print(traceback.format_exc())

            raise  # Re-lanzamos para que SQS reintente


def process_order(order_id):
    """
    Orquesta el flujo completo:
    - verifica idempotencia
    - busca datos
    - genera PDF
    - envía emails
    - marca como procesado
    """

    conn = get_connection()
    cur  = conn.cursor()

    try:

        # Verificamos si ya fue procesado
        cur.execute("""
            SELECT notification_sent
            FROM orders
            WHERE id = %s
        """, [order_id])

        row = cur.fetchone()

        if not row:

            print(f"Pedido no encontrado: {order_id}")

            return

        notification_sent = row[0]

        if notification_sent is True:

            print(f"Pedido {order_id} ya procesado previamente")

            return

        # Traemos toda la info
        order_data = get_order_data(cur, order_id)

        if not order_data:

            print(f"Pedido no encontrado: {order_id}")

            return

        # Generamos PDF
        pdf_bytes = generate_pdf(order_data)

        # Enviamos emails
        send_emails(order_data, pdf_bytes)

        # Marcamos como procesado SOLO después del éxito
        cur.execute("""
            UPDATE orders
            SET notification_sent = true
            WHERE id = %s
        """, [order_id])

        conn.commit()

        print(f"Pedido {order_id} procesado correctamente")

    except Exception:

        conn.rollback()

        print(traceback.format_exc())

        raise

    finally:

        cur.close()


def get_order_data(cur, order_id):
    """
    Trae todos los datos del pedido necesarios para el PDF y el email.
    """

    # Datos del pedido, usuario y empresa
    cur.execute("""
        SELECT
            o.id,
            o.total_amount,
            o.notes,
            o.created_at,
            u.full_name,
            u.email        AS user_email,
            c.name         AS company_name,
            c.notification_emails,
            c.whatsapp_phone
        FROM orders o
        INNER JOIN users     u ON o.user_id    = u.id
        INNER JOIN companies c ON o.company_id = c.id
        WHERE o.id = %s
    """, [order_id])

    order = cur.fetchone()

    if not order:

        return None

    # Items del pedido
    cur.execute("""
        SELECT
            product_name,
            unit_price,
            quantity,
            subtotal,
            observations
        FROM order_items
        WHERE order_id = %s
        ORDER BY product_name ASC
    """, [order_id])

    items = cur.fetchall()

    return {
        "id":                  str(order[0]),
        "total_amount":        float(order[1]),
        "notes":               order[2],
        "created_at":          order[3],
        "client_name":         order[4],
        "client_email":        order[5],
        "company_name":        order[6],
        "notification_emails": order[7] or [],
        "whatsapp_phone":      order[8],
        "items": [
            {
                "product_name": item[0],
                "unit_price":   float(item[1]),
                "quantity":     float(item[2]),
                "subtotal":     float(item[3]),
                "observations": item[4]
            }
            for item in items
        ]
    }


def generate_pdf(order_data):
    """
    Genera el PDF del pedido en memoria y devuelve los bytes.
    """

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles   = getSampleStyleSheet()
    elements = []

    # Estilo personalizado para el título
    title_style = ParagraphStyle(
        "title",
        parent     = styles["Heading1"],
        alignment  = TA_CENTER,
        fontSize   = 18,
        spaceAfter = 0.5*cm
    )

    subtitle_style = ParagraphStyle(
        "subtitle",
        parent     = styles["Normal"],
        alignment  = TA_CENTER,
        fontSize   = 10,
        textColor  = colors.grey
    )

    right_style = ParagraphStyle(
        "right",
        parent     = styles["Normal"],
        alignment  = TA_RIGHT,
        fontSize   = 9,
        textColor  = colors.grey
    )

    # Encabezado
    elements.append(Paragraph("PEDIDO DE COMPRA", title_style))
    elements.append(Paragraph(order_data["company_name"], subtitle_style))
    elements.append(Spacer(1, 0.5*cm))

    # Datos del pedido
    fecha = order_data["created_at"].strftime("%d/%m/%Y %H:%M") \
        if isinstance(order_data["created_at"], datetime) \
        else str(order_data["created_at"])

    elements.append(Paragraph(f"N° Pedido: {order_data['id'][:8].upper()}", styles["Normal"]))
    elements.append(Paragraph(f"Cliente: {order_data['client_name']}", styles["Normal"]))
    elements.append(Paragraph(f"Fecha: {fecha}", styles["Normal"]))
    elements.append(Spacer(1, 0.5*cm))

    # Tabla de items
    table_data = [["Producto", "Precio unit.", "Cantidad", "Subtotal"]]

    for item in order_data["items"]:

        row = [
            item["product_name"] + (
                f"\n({item['observations']})"
                if item["observations"]
                else ""
            ),
            f"${item['unit_price']:,.2f}",
            str(item["quantity"]),
            f"${item['subtotal']:,.2f}"
        ]

        table_data.append(row)

    # Fila total
    table_data.append([
        "",
        "",
        "TOTAL",
        f"${order_data['total_amount']:,.2f}"
    ])

    table = Table(
        table_data,
        colWidths=[9*cm, 3*cm, 3*cm, 3*cm]
    )

    table.setStyle(TableStyle([

        # Header
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#2d2d2d")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 10),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING",    (0, 0), (-1, 0), 8),

        # Filas
        ("FONTSIZE",      (0, 1), (-1, -2), 9),
        ("ALIGN",         (1, 1), (-1, -1), "RIGHT"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -2),
            [colors.white, colors.HexColor("#f5f5f5")]
        ),
        ("TOPPADDING",    (0, 1), (-1, -2), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -2), 6),

        # Total
        ("FONTNAME",      (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, -1), (-1, -1), 10),
        ("LINEABOVE",     (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING",    (0, -1), (-1, -1), 8),

        # Bordes
        ("GRID",          (0, 0), (-1, -2), 0.5, colors.HexColor("#dddddd")),
        ("BOX",           (0, 0), (-1, -1), 1, colors.HexColor("#2d2d2d")),

    ]))

    elements.append(table)

    # Observaciones
    if order_data["notes"]:

        elements.append(Spacer(1, 0.5*cm))
        elements.append(Paragraph("Observaciones:", styles["Heading3"]))
        elements.append(Paragraph(order_data["notes"], styles["Normal"]))

    doc.build(elements)

    return buffer.getvalue()


def send_emails(order_data, pdf_bytes):
    """
    Envía el PDF por email a todos los destinatarios.
    """

    fecha = order_data["created_at"].strftime("%d/%m/%Y") \
        if isinstance(order_data["created_at"], datetime) \
        else str(order_data["created_at"])

    subject = f"Nuevo pedido - {order_data['company_name']} - {fecha}"

    body_text = f"""
Nuevo pedido recibido.

Cliente: {order_data['client_name']}
Empresa: {order_data['company_name']}
Total: ${order_data['total_amount']:,.2f}
Fecha: {fecha}

Se adjunta el detalle en PDF.
    """.strip()

    # Destinatarios
    recipients = list(order_data["notification_emails"])

    if order_data["client_email"] not in recipients:

        recipients.append(order_data["client_email"])

    # MIME
    import email.mime.multipart as multipart
    import email.mime.text as mime_text
    import email.mime.application as mime_app

    msg = multipart.MIMEMultipart()

    msg["Subject"] = subject
    msg["From"]    = SENDER_EMAIL
    msg["To"]      = ", ".join(recipients)

    # Body
    msg.attach(
        mime_text.MIMEText(body_text, "plain")
    )

    # PDF
    attachment = mime_app.MIMEApplication(
        pdf_bytes,
        _subtype="pdf"
    )

    attachment.add_header(
        "Content-Disposition",
        "attachment",
        filename=f"pedido-{order_data['id'][:8].upper()}.pdf"
    )

    msg.attach(attachment)

    # SES
    response = ses.send_raw_email(
        Source       = SENDER_EMAIL,
        Destinations = recipients,
        RawMessage   = {"Data": msg.as_string()}
    )

    print(f"SES response: {response}")

    print(f"Email enviado a: {', '.join(recipients)}")