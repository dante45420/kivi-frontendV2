/**
 * Generador de PDF para Nota de Cobro
 * Genera un PDF bonito y ordenado con la información del cliente y sus items pendientes
 */
import { jsPDF } from 'jspdf'

export function generateInvoicePDF(invoiceData) {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const contentWidth = pageWidth - (2 * margin)
  
  let y = 25
  
  // ======== ENCABEZADO ========
  // Título KIVI (sin emoji)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(76, 175, 80) // Verde Kivi
  doc.text('KIVI', margin, y)
  
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text('Frutas y Verduras Frescas', margin, y)
  
  // Fecha de emisión (derecha)
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  const dateText = `Fecha: ${new Date().toLocaleDateString('es-CL')}`
  const dateWidth = doc.getTextWidth(dateText)
  doc.text(dateText, pageWidth - margin - dateWidth, 25)
  
  y += 15
  
  // Línea separadora
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  
  y += 12
  
  // ======== TÍTULO ========
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  const titleText = 'NOTA DE COBRO'
  const titleWidth = doc.getTextWidth(titleText)
  doc.text(titleText, (pageWidth - titleWidth) / 2, y)
  
  y += 15
  
  // ======== INFORMACIÓN DEL CLIENTE ========
  doc.setFillColor(248, 249, 250)
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F')
  
  y += 8
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(70, 70, 70)
  doc.text('Cliente:', margin + 5, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text(invoiceData.customer.name, margin + 25, y)
  
  y += 7
  
  if (invoiceData.customer.phone) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Tel: ${invoiceData.customer.phone}`, margin + 5, y)
  }
  
  y += 6
  
  if (invoiceData.customer.address) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Dir: ${invoiceData.customer.address}`, margin + 5, y)
  }
  
  y += 18
  
  // ======== DETALLE DE ITEMS ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('DETALLE DE PRODUCTOS', margin, y)
  
  y += 8
  
  // Encabezado de tabla
  doc.setFillColor(40, 40, 40)  // Negro
  doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'F')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  
  // Centrar verticalmente el texto (y + altura/2 + offset para centrado)
  doc.text('PRODUCTO', margin + 3, y + 6)
  doc.text('CANTIDAD', pageWidth - margin - 70, y + 6)
  doc.text('SUBTOTAL', pageWidth - margin - 30, y + 6)
  
  y += 10
  
  // Items
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  
  invoiceData.items.forEach((item, index) => {
    // Verificar si necesitamos nueva página
    if (y > pageHeight - 60) {
      doc.addPage()
      y = 20
    }
    
    // Fondo alternado para mejor legibilidad
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, y - 5, contentWidth, 16, 'F')
    }
    
    // Nombre del producto
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const productName = item.product_name || item.product?.name || 'Producto'
    doc.text(productName.substring(0, 30), margin + 3, y)
    
    y += 5
    
    // Cantidad y precio unitario
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    
    const unitPrice = Math.round(item.calculated_total / item.qty)
    const qtyText = `${item.qty} ${item.unit} × $${unitPrice.toLocaleString('es-CL')}`
    doc.text(qtyText, margin + 3, y)
    
    // Cantidad (derecha)
    doc.setTextColor(40, 40, 40)
    const quantityText = `${item.qty} ${item.unit}`
    doc.text(quantityText, pageWidth - margin - 70, y - 5)
    
    // Subtotal (derecha)
    doc.setFont('helvetica', 'bold')
    const subtotalText = `$${item.calculated_total.toLocaleString('es-CL')}`
    const subtotalWidth = doc.getTextWidth(subtotalText)
    doc.text(subtotalText, pageWidth - margin - subtotalWidth - 3, y - 5)
    
    // Información de conversión si aplica
    if (item.needs_conversion && item.has_conversion) {
      y += 4
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(120, 120, 120)
      
      let conversionText = ''
      if (item.unit === 'unit' && item.product?.unit === 'kg') {
        const kgEquivalent = (item.qty / item.product.avg_units_per_kg).toFixed(2)
        conversionText = `(aprox. ${kgEquivalent} kg)`
      } else if (item.unit === 'kg' && item.product?.unit === 'unit') {
        const unitsEquivalent = (item.qty * item.product.avg_units_per_kg).toFixed(1)
        conversionText = `(aprox. ${unitsEquivalent} unidades)`
      }
      
      if (conversionText) {
        doc.text(conversionText, margin + 3, y)
      }
    }
    
    y += 10
    doc.setTextColor(40, 40, 40)
  })
  
  y += 5
  
  // Línea separadora antes del total
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  
  y += 10
  
  // ======== SUBTOTAL Y ENVÍO/DESCUENTO ========
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F')
  
  y += 8
  
  // Subtotal
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('Subtotal:', margin + 5, y)
  
  const subtotal = invoiceData.subtotal || invoiceData.items.reduce((sum, item) => sum + (item.calculated_total || 0), 0)
  const subtotalText = `$${subtotal.toLocaleString('es-CL')}`
  const subtotalWidth = doc.getTextWidth(subtotalText)
  doc.text(subtotalText, pageWidth - margin - subtotalWidth - 5, y)
  
  y += 8
  
  // Envío o descuento
  if (invoiceData.shipping_amount && invoiceData.shipping_amount !== 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    if (invoiceData.shipping_amount > 0) {
      doc.setTextColor(76, 175, 80)
    } else {
      doc.setTextColor(255, 152, 0)
    }
    
    const shippingLabel = invoiceData.shipping_amount > 0 ? 'Envío rápido:' : 'Descuento 5%:'
    doc.text(shippingLabel, margin + 5, y)
    
    const shippingText = `${invoiceData.shipping_amount > 0 ? '+' : ''}$${Math.abs(invoiceData.shipping_amount).toLocaleString('es-CL')}`
    const shippingWidth = doc.getTextWidth(shippingText)
    doc.text(shippingText, pageWidth - margin - shippingWidth - 5, y)
    
    y += 8
  }
  
  // Línea separadora antes del total
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  
  y += 8
  
  // ======== TOTAL ========
  doc.setFillColor(240, 240, 240)
  doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F')
  
  y += 10
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40) // Negro
  doc.text('TOTAL A PAGAR:', margin + 5, y)
  
  const totalText = `$${invoiceData.total.toLocaleString('es-CL')}`
  const totalWidth = doc.getTextWidth(totalText)
  doc.text(totalText, pageWidth - margin - totalWidth - 5, y)
  
  y += 20
  
  // ======== INFORMACIÓN DE PAGO ========
  if (y > pageHeight - 50) {
    doc.addPage()
    y = 20
  }
  
  doc.setFillColor(240, 248, 255)
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F')
  
  y += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('Medios de Pago:', margin + 5, y)
  
  y += 6
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(70, 70, 70)
  doc.text('- Transferencia bancaria', margin + 5, y)
  
  y += 5
  doc.text('- Efectivo', margin + 5, y)
  
  y += 5
  doc.text('- Debito o Credito', margin + 5, y)
  
  // ======== PIE DE PÁGINA ========
  const footerY = pageHeight - 15
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  
  const footerText = 'Gracias por confiar en Kivi - Tu personal shopper de Lo Valledor'
  const footerWidth = doc.getTextWidth(footerText)
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
  
  // Contacto
  doc.setFontSize(7)
  const contactText = 'WhatsApp: +56969172764 | Instagram: @kivi.chile'
  const contactWidth = doc.getTextWidth(contactText)
  doc.text(contactText, (pageWidth - contactWidth) / 2, footerY + 4)
  
  // Descargar el PDF
  const filename = `nota-cobro-${invoiceData.customer.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

