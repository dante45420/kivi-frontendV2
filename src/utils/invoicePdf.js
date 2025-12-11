/**
 * Generador de PDF para Nota de Cobro
 * Genera un PDF bonito y ordenado similar al catálogo
 */
import { jsPDF } from 'jspdf'

// Función para cargar imagen como base64
function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      try {
        const base64 = canvas.toDataURL('image/png')
        resolve({ base64, width: img.width, height: img.height })
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = reject
    img.src = url
  })
}

export async function generateInvoicePDF(invoiceData) {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const contentWidth = pageWidth - (2 * margin)
  
  let y = 20
  
  // ======== ENCABEZADO ========
  // Fondo crema como el catálogo
  doc.setFillColor(255, 249, 240)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  // Intentar cargar logo
  try {
    const logoUrl = '/Logo_kivi.png'
    const logoData = await loadImageAsBase64(logoUrl)
    
    // Calcular dimensiones manteniendo proporción
    const maxWidth = 50
    const aspectRatio = logoData.width / logoData.height
    const logoWidth = maxWidth
    const logoHeight = maxWidth / aspectRatio
    
    // Logo a la izquierda
    doc.addImage(logoData.base64, 'PNG', margin, 10, logoWidth, logoHeight)
  } catch (e) {
    // Si falla, usar texto como fallback
    console.warn('No se pudo cargar el logo, usando texto:', e)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(76, 175, 80)
    doc.text('KIVI', margin, 22)
  }
  
  // Fecha de emisión (derecha)
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const dateText = new Date().toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const dateWidth = doc.getTextWidth(dateText)
  doc.text(dateText, pageWidth - margin - dateWidth, 25)
  
  y = 58
  
  // ======== TÍTULO ========
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0) // Negro
  const titleText = invoiceData.order_id ? `NOTA DE COBRO - PEDIDO #${invoiceData.order_id}` : 'NOTA DE COBRO'
  doc.text(titleText, margin, y)
  
  y += 12
  
  // ======== INFORMACIÓN DEL CLIENTE ========
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0) // Negro
  doc.text('Cliente:', margin, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0) // Negro
  doc.text(invoiceData.customer.name, margin + 20, y)
  
  y += 6
  
  if (invoiceData.customer.phone) {
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0) // Negro
    doc.text(`Tel: ${invoiceData.customer.phone}`, margin, y)
    y += 5
  }
  
  if (invoiceData.customer.address) {
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0) // Negro
    doc.text(`Dir: ${invoiceData.customer.address}`, margin, y)
    y += 5
  }
  
  y += 8
  
  // ======== DETALLE DE ITEMS ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0) // Negro
  doc.text('DETALLE DE PRODUCTOS', margin, y)
  
  y += 10
  
  // Encabezado de tabla - más simple, sin fondo negro
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0) // Negro
  
  doc.text('PRODUCTO', margin, y)
  doc.text('CANTIDAD', pageWidth - margin - 70, y)
  doc.text('SUBTOTAL', pageWidth - margin - 30, y)
  
  y += 2
  // Línea sutil debajo del encabezado
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  
  y += 6
  
  // Items - diseño más limpio
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0) // Negro
  
  invoiceData.items.forEach((item, index) => {
    // Verificar si necesitamos nueva página
    if (y > pageHeight - 60) {
      doc.addPage()
      y = 20
    }
    
    // Nombre del producto
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const productName = item.product_name || item.product?.name || 'Producto'
    doc.text(productName, margin, y)
    
    // Usar total o calculated_total, y asegurar que qty y unit existan
    const itemTotal = item.total || item.calculated_total || 0
    const itemQty = item.qty || item.charged_qty || 0
    const itemUnit = item.unit || item.charged_unit || 'kg'
    
    // Calcular precio unitario de forma segura
    const unitPrice = itemQty > 0 ? Math.round(itemTotal / itemQty) : (item.unit_price || 0)
    
    // Cantidad (derecha)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const quantityText = `${itemQty} ${itemUnit}`
    doc.text(quantityText, pageWidth - margin - 70, y)
    
    // Subtotal (derecha)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const subtotalText = `$${itemTotal.toLocaleString('es-CL')}`
    const subtotalWidth = doc.getTextWidth(subtotalText)
    doc.text(subtotalText, pageWidth - margin - subtotalWidth, y)
    
    // Información de conversión si aplica (más sutil)
    if (item.charged_qty && item.charged_qty !== itemQty && item.charged_unit) {
      y += 4
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      
      const conversionText = `${itemQty} ${itemUnit} → ${item.charged_qty} ${item.charged_unit}`
      doc.text(conversionText, margin, y)
      y += 3
    }
    
    y += 8
    doc.setTextColor(0, 0, 0) // Negro
  })
  
  y += 5
  
  // ======== SUBTOTAL Y ENVÍO/DESCUENTO ========
  // Línea sutil antes de totales
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  
  // Subtotal
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0) // Negro
  doc.text('Subtotal:', margin, y)
  
  const subtotal = invoiceData.subtotal || invoiceData.items.reduce((sum, item) => sum + (item.total || item.calculated_total || 0), 0)
  const subtotalText = `$${subtotal.toLocaleString('es-CL')}`
  const subtotalWidth = doc.getTextWidth(subtotalText)
  doc.text(subtotalText, pageWidth - margin - subtotalWidth, y)
  
  y += 7
  
  // Envío o descuento
  if (invoiceData.shipping_amount !== undefined && invoiceData.shipping_amount !== null) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0) // Negro
    
    // Determinar la etiqueta según el monto
    let shippingLabel = 'Envío normal:'
    if (invoiceData.shipping_amount > 0) {
      shippingLabel = 'Envío rápido:'
    } else if (invoiceData.shipping_amount < 0) {
      shippingLabel = 'Envío económico:'
    }
    doc.text(shippingLabel, margin, y)
    
    if (invoiceData.shipping_amount !== 0) {
      const shippingText = `${invoiceData.shipping_amount > 0 ? '+' : ''}$${Math.abs(invoiceData.shipping_amount).toLocaleString('es-CL')}`
      const shippingWidth = doc.getTextWidth(shippingText)
      doc.text(shippingText, pageWidth - margin - shippingWidth, y)
    } else {
      doc.text('Sin costo', pageWidth - margin - 50, y)
    }
    
    y += 7
  }
  
  // Línea antes del total
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  
  // ======== TOTAL ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0) // Negro
  doc.text('TOTAL A PAGAR:', margin, y)
  
  const totalText = `$${invoiceData.total.toLocaleString('es-CL')}`
  const totalWidth = doc.getTextWidth(totalText)
  doc.text(totalText, pageWidth - margin - totalWidth, y)
  
  y += 15
  
  // ======== INFORMACIÓN DE PAGO ========
  if (y > pageHeight - 50) {
    doc.addPage()
    y = 20
  }
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0) // Negro
  doc.text('Medios de Pago:', margin, y)
  
  y += 6
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0) // Negro
  doc.text('• Transferencia bancaria', margin, y)
  
  y += 5
  doc.text('• Efectivo', margin, y)
  
  y += 5
  doc.text('• Débito o Crédito', margin, y)
  
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
  const orderSuffix = invoiceData.order_id ? `-pedido-${invoiceData.order_id}` : ''
  const filename = `nota-cobro-${invoiceData.customer.name.replace(/\s+/g, '-').toLowerCase()}${orderSuffix}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

