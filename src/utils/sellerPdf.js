/**
 * Generador de PDF para Resumen Semanal y Global de Vendedores
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

export async function generateSellerWeeklySummaryPDF(weekSummary) {
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
    const logoUrl = '/Logo_kivi.png'
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
  doc.text('RESUMEN SEMANAL - VENDEDOR', margin, y)
  
  y += 10
  
  // ======== INFORMACIÓN DEL VENDEDOR ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(76, 175, 80)
  doc.text('Vendedor:', margin, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(weekSummary.seller_name, margin + 40, y)
  
  y += 8
  
  // Fecha de la semana
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const weekStart = new Date(weekSummary.week_start)
  const weekEnd = new Date(weekSummary.week_end)
  doc.text(
    `Semana: ${weekStart.toLocaleDateString('es-CL')} - ${weekEnd.toLocaleDateString('es-CL')}`,
    margin,
    y
  )
  
  y += 15
  
  // ======== MÉTRICAS ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Cantidad de Pedidos:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(weekSummary.orders_count.toString(), margin + 80, y)
  
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Porcentaje de Comisión:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${weekSummary.avg_utility_percent.toFixed(2)}%`, margin + 80, y)
  
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(76, 175, 80)
  doc.text('Comisión Total de la Semana:', margin, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(weekSummary.total_utility), margin + 80, y)
  
  // ======== PIE DE PÁGINA ========
  const footerY = pageHeight - 15
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  
  const footerText = 'Resumen semanal generado por Green Market - Tu personal shopper de Lo Valledor'
  const footerWidth = doc.getTextWidth(footerText)
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
  
  // Contacto
  doc.setFontSize(7)
  const contactText = 'WhatsApp: +56969172764 | Instagram: @greenmarket.chile'
  const contactWidth = doc.getTextWidth(contactText)
  doc.text(contactText, (pageWidth - contactWidth) / 2, footerY + 4)
  
  // Descargar el PDF
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const sellerName = weekSummary.seller_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const filename = `resumen_semanal_${sellerName}_${weekStartStr}.pdf`
  doc.save(filename)
}

export async function generateSellerGlobalSummaryPDF(globalSummary) {
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
    const logoUrl = '/Logo_kivi.png'
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
  doc.text('RESUMEN GLOBAL - VENDEDOR', margin, y)
  
  y += 10
  
  // ======== INFORMACIÓN DEL VENDEDOR ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(76, 175, 80)
  doc.text('Vendedor:', margin, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(globalSummary.seller_name, margin + 40, y)
  
  y += 15
  
  // ======== MÉTRICAS GLOBALES ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Cantidad de Pedidos:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(globalSummary.orders_count.toString(), margin + 80, y)
  
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Porcentaje de Comisión:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${globalSummary.avg_utility_percent.toFixed(2)}%`, margin + 80, y)
  
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(76, 175, 80)
  doc.text('Comisión Total:', margin, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(globalSummary.total_utility), margin + 80, y)
  
  y += 20
  
  // ======== DETALLE POR CLIENTE ========
  if (globalSummary.customers && globalSummary.customers.length > 0) {
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
    
    globalSummary.customers.forEach((customerData, idx) => {
      // Verificar si necesitamos nueva página
      if (y > pageHeight - 60) {
        doc.addPage()
        y = 20
      }
      
      // Nombre del cliente
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(customerData.customer.name, margin, y)
      
      y += 8
      
      // Total del cliente
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Total facturado: ${formatCurrency(customerData.total_revenue)}`, margin, y)
      
      y += 6
      doc.text(`Pedidos: ${customerData.orders_count}`, margin, y)
      
      y += 10
      
      // Items del cliente (pedidos)
      if (customerData.orders && customerData.orders.length > 0) {
        customerData.orders.forEach((order, orderIdx) => {
          // Verificar si necesitamos nueva página
          if (y > pageHeight - 40) {
            doc.addPage()
            y = 20
          }
          
          // Fondo para el pedido
          const itemHeight = 15
          doc.setFillColor(248, 249, 250)
          doc.roundedRect(margin + 5, y - 5, contentWidth - 10, itemHeight, 3, 3, 'F')
          
          // Información del pedido
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          doc.text(`Pedido #${order.order_id}`, margin + 10, y)
          
          // Monto del pedido
          const orderTotalText = formatCurrency(order.order_total)
          const orderTotalWidth = doc.getTextWidth(orderTotalText)
          doc.setFont('helvetica', 'bold')
          doc.text(orderTotalText, pageWidth - margin - 10 - orderTotalWidth, y)
          
          // Fecha del pedido si existe
          if (order.order_date) {
            y += 5
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(150, 150, 150)
            const orderDate = new Date(order.order_date).toLocaleDateString('es-CL')
            doc.text(`Fecha: ${orderDate}`, margin + 10, y)
            y += 3
          } else {
            y += 8
          }
        })
      }
      
      // Espacio entre clientes
      if (idx < globalSummary.customers.length - 1) {
        y += 8
        // Línea sutil
        doc.setDrawColor(240, 240, 240)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageWidth - margin, y)
        y += 8
      }
    })
  }
  
  // ======== PIE DE PÁGINA ========
  const footerY = pageHeight - 15
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  
  const footerText = 'Resumen global generado por Green Market - Tu personal shopper de Lo Valledor'
  const footerWidth = doc.getTextWidth(footerText)
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
  
  // Contacto
  doc.setFontSize(7)
  const contactText = 'WhatsApp: +56969172764 | Instagram: @greenmarket.chile'
  const contactWidth = doc.getTextWidth(contactText)
  doc.text(contactText, (pageWidth - contactWidth) / 2, footerY + 4)
  
  // Descargar el PDF
  const sellerName = globalSummary.seller_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const filename = `resumen_global_${sellerName}.pdf`
  doc.save(filename)
}

