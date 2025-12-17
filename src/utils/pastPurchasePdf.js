/**
 * Generador de PDF para Compra Pasada Detallada
 * Muestra qué pidió cada cliente con maduración de forma bonita y ordenada
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const getMaturityLabel = (maturityNote) => {
  switch (maturityNote) {
    case 'para_hoy':
      return 'Para hoy'
    case 'para_4_5_dias':
      return 'Para 4-5 días'
    default:
      return 'Sin especificar'
  }
}

const getMaturityColor = (maturityNote) => {
  switch (maturityNote) {
    case 'para_hoy':
      return { r: 255, g: 107, b: 0 } // Naranja
    case 'para_4_5_dias':
      return { r: 76, g: 175, b: 80 } // Verde
    default:
      return { r: 150, g: 150, b: 150 } // Gris
  }
}

export async function generatePastPurchasePDF(purchase) {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const contentWidth = pageWidth - (2 * margin)
  
  let y = 20
  
  // ======== ENCABEZADO ========
  // Fondo crema
  doc.setFillColor(255, 249, 240)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  // Intentar cargar logo
  try {
    const logoUrl = '/Logo_con_slogan.png'
    const logoData = await loadImageAsBase64(logoUrl)
    
    const maxWidth = 50
    const aspectRatio = logoData.width / logoData.height
    const logoWidth = maxWidth
    const logoHeight = maxWidth / aspectRatio
    
    doc.addImage(logoData.base64, 'PNG', margin, 10, logoWidth, logoHeight)
  } catch (e) {
    console.warn('No se pudo cargar el logo, usando texto:', e)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(76, 175, 80)
    doc.text('GREEN MARKET', margin, 22)
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
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('RESUMEN DE COMPRA', margin, y)
  
  y += 10
  
  // ======== INFORMACIÓN DE LA COMPRA ========
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(76, 175, 80)
  doc.text('Producto:', margin, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.text(purchase.product?.name || 'Producto desconocido', margin + 40, y)
  
  y += 8
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const purchaseDate = purchase.created_at 
    ? new Date(purchase.created_at).toLocaleDateString('es-CL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Sin fecha'
  doc.text(`Fecha de compra: ${purchaseDate}`, margin, y)
  
  y += 6
  
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(
    `Cantidad: ${purchase.qty} ${purchase.unit} × ${formatCurrency(purchase.price_per_unit)} = ${formatCurrency(purchase.price_total)}`,
    margin,
    y
  )
  
  if (purchase.conversion_qty) {
    y += 6
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Conversión: ${purchase.conversion_qty} ${purchase.conversion_unit}`,
      margin,
      y
    )
  }
  
  y += 15
  
  // ======== DETALLE POR CLIENTE ========
  if (purchase.customers && purchase.customers.length > 0) {
    // Línea divisoria
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(76, 175, 80)
    doc.text('DETALLE POR CLIENTE', margin, y)
    
    y += 12
    
    purchase.customers.forEach((customerInfo, cIdx) => {
      // Verificar si necesitamos nueva página
      if (y > pageHeight - 80) {
        doc.addPage()
        y = 20
      }
      
      // Nombre del cliente
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(customerInfo.customer.name, margin, y)
      
      y += 8
      
      // Total del cliente
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      const totalQty = customerInfo.total_qty.toFixed(customerInfo.items[0]?.unit === 'kg' ? 1 : 0)
      doc.text(`Total: ${totalQty} ${customerInfo.items[0]?.unit || purchase.unit}`, margin, y)
      
      y += 10
      
      // Items del cliente
      customerInfo.items.forEach((item, itemIdx) => {
        // Verificar si necesitamos nueva página
        if (y > pageHeight - 50) {
          doc.addPage()
          y = 20
        }
        
        // Fondo para el item
        const itemHeight = 20
        doc.setFillColor(248, 249, 250)
        doc.roundedRect(margin + 5, y - 6, contentWidth - 10, itemHeight, 3, 3, 'F')
        
        // Información del pedido
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(`Pedido #${item.order_id}`, margin + 10, y)
        
        // Cantidad
        const qtyText = `${item.qty} ${item.unit}`
        const qtyWidth = doc.getTextWidth(qtyText)
        doc.setFont('helvetica', 'normal')
        doc.text(qtyText, pageWidth - margin - 100 - qtyWidth, y)
        
        // Badge de maduración
        const maturityLabel = getMaturityLabel(item.maturity_note)
        const maturityColor = getMaturityColor(item.maturity_note)
        doc.setFillColor(maturityColor.r, maturityColor.g, maturityColor.b)
        doc.roundedRect(pageWidth - margin - 90, y - 5, 85, 8, 2, 2, 'F')
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        const labelWidth = doc.getTextWidth(maturityLabel)
        doc.text(maturityLabel, pageWidth - margin - 90 + (85 - labelWidth) / 2, y + 1)
        
        // Fecha del pedido si existe
        if (item.order_date) {
          y += 6
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(150, 150, 150)
          const orderDate = new Date(item.order_date).toLocaleDateString('es-CL')
          doc.text(`Fecha: ${orderDate}`, margin + 10, y)
        }
        
        y += 12
      })
      
      // Espacio entre clientes
      if (cIdx < purchase.customers.length - 1) {
        y += 8
        // Línea sutil
        doc.setDrawColor(240, 240, 240)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageWidth - margin, y)
        y += 8
      }
    })
  } else {
    // Si no hay clientes asociados
    y += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('No se encontraron clientes asociados a esta compra', margin, y)
  }
  
  // ======== PIE DE PÁGINA ========
  const footerY = pageHeight - 15
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  
  const footerText = 'Resumen de compra generado por Green Market - Tu personal shopper de Lo Valledor'
  const footerWidth = doc.getTextWidth(footerText)
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
  
  // Contacto
  doc.setFontSize(7)
  const contactText = 'WhatsApp: +56969172764 | Instagram: @greenmarket.chile'
  const contactWidth = doc.getTextWidth(contactText)
  doc.text(contactText, (pageWidth - contactWidth) / 2, footerY + 4)
  
  // Descargar el PDF
  const purchaseDateStr = purchase.created_at 
    ? new Date(purchase.created_at).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  const productName = (purchase.product?.name || 'producto').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const filename = `resumen-compra-${productName}-${purchaseDateStr}.pdf`
  doc.save(filename)
}

