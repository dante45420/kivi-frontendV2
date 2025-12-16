/**
 * Generador de PDF para Lista de Compras
 * Genera un PDF bonito y ordenado similar a la nota de cobro
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

export async function generatePurchasesListPDF(consolidatedList) {
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
    const logoUrl = '/Logo_con_slogan.png'
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
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0) // Negro
  doc.text('LISTA DE COMPRAS', margin, y)
  
  y += 12
  
  // ======== AGRUPAR POR CATEGORÍA ========
  const byCategory = {}
  consolidatedList.forEach(item => {
    const category = item.category_name || 'Sin categoría'
    if (!byCategory[category]) {
      byCategory[category] = []
    }
    byCategory[category].push(item)
  })
  
  // Ordenar categorías alfabéticamente
  const sortedCategories = Object.keys(byCategory).sort()
  
  // ======== ITEMS POR CATEGORÍA ========
  sortedCategories.forEach((category, catIdx) => {
    // Verificar si necesitamos una nueva página
    if (y > pageHeight - 40) {
      doc.addPage()
      y = 20
    }
    
    // Encabezado de categoría
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(76, 175, 80) // Verde Kivi
    doc.text(category.toUpperCase(), margin, y)
    y += 8
    
    // Línea divisoria
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
    
    // Items de esta categoría - ordenar kg antes que unidades
    const sortedItems = [...byCategory[category]].sort((a, b) => {
      // Si el nombre es igual, kg antes que unidades
      if (a.product_name === b.product_name) {
        if (a.unit === 'kg' && b.unit !== 'kg') return -1
        if (a.unit !== 'kg' && b.unit === 'kg') return 1
      }
      return 0
    })
    
    sortedItems.forEach((item, itemIdx) => {
      // Verificar si necesitamos una nueva página
      if (y > pageHeight - 40) {
        doc.addPage()
        y = 20
      }
      
      // Nombre del producto
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0) // Negro
      doc.text(item.product_name, margin + 5, y)
      
      // Cantidad total (derecha)
      const qtyText = `${item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`
      const qtyWidth = doc.getTextWidth(qtyText)
      doc.setFont('helvetica', 'normal')
      doc.text(qtyText, pageWidth - margin - qtyWidth, y)
      
      y += 6
      
      // Mostrar desglose por maduración si existe
      if (item.maturity_breakdown) {
        const breakdown = item.maturity_breakdown
        const hasBreakdown = breakdown.para_hoy > 0 || breakdown.para_4_5_dias > 0 || breakdown.sin_especificar > 0
        
        if (hasBreakdown) {
          y += 4 // Espacio adicional antes del desglose
          doc.setFontSize(11)
          doc.setTextColor(60, 60, 60)
          doc.setFont('helvetica', 'bold')
          
          if (breakdown.para_hoy > 0) {
            const text = `Para hoy: ${breakdown.para_hoy.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`
            doc.text(text, margin + 10, y)
            y += 8 // Espacio más grande entre opciones
          }
          if (breakdown.para_4_5_dias > 0) {
            const text = `Para 4-5 días: ${breakdown.para_4_5_dias.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`
            doc.text(text, margin + 10, y)
            y += 8 // Espacio más grande entre opciones
          }
          
          doc.setFont('helvetica', 'normal')
          y += 2 // Espacio adicional después del desglose
        }
      }
      
      y += 2
    })
    
    // Espacio entre categorías
    if (catIdx < sortedCategories.length - 1) {
      y += 4
    }
  })
  
  // ======== RESUMEN ========
  if (y > pageHeight - 50) {
    doc.addPage()
    y = 20
  }
  
  y += 10
  
  // Línea divisoria
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  
  // Total de productos
  const totalProducts = consolidatedList.length
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(`Total de productos: ${totalProducts}`, margin, y)
  
  y += 6
  
  // Total de categorías
  doc.text(`Total de categorías: ${sortedCategories.length}`, margin, y)
  
  // ======== PIE DE PÁGINA ========
  const footerY = pageHeight - 15
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  
  const footerText = 'Lista de compras generada por Green Market - Tu personal shopper de Lo Valledor'
  const footerWidth = doc.getTextWidth(footerText)
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
  
  // Contacto
  doc.setFontSize(7)
  const contactText = 'WhatsApp: +56969172764 | Instagram: @greenmarket.chile'
  const contactWidth = doc.getTextWidth(contactText)
  doc.text(contactText, (pageWidth - contactWidth) / 2, footerY + 4)
  
  // Descargar el PDF
  const filename = `lista-compras-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
