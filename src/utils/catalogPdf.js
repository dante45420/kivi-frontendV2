/**
 * Generador de PDF para Catálogo de Productos
 * Genera un PDF bonito con productos y ofertas de la semana
 */
import { jsPDF } from 'jspdf'

export function generateCatalogPDF(products, weeklyOffers = []) {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  const contentWidth = pageWidth - (2 * margin)
  
  let y = 15
  
  // ======== ENCABEZADO ========
  // Color crema: #FFF8DC o RGB(255, 248, 220)
  doc.setFillColor(255, 248, 220)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(76, 175, 80) // Verde Kivi
  doc.text('KIVI', margin, 22)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text('Catalogo de Productos Frescos', margin, 32)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  const dateText = new Date().toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const dateWidth = doc.getTextWidth(dateText)
  doc.text(dateText, pageWidth - margin - dateWidth, 22)
  
  y = 48
  
  // ======== OFERTAS DE LA SEMANA ========
  if (weeklyOffers.length > 0) {
    doc.setFillColor(255, 244, 229)
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F')
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 87, 34)
    doc.text('OFERTAS DE LA SEMANA', margin + 3, y + 5.5)
    
    y += 12
    
    weeklyOffers.forEach(offer => {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = 20
      }
      
      // Caja de oferta
      doc.setFillColor(255, 245, 238)
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F')
      
      // Borde destacado
      doc.setDrawColor(255, 87, 34)
      doc.setLineWidth(1)
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'S')
      
      y += 7
      
      // Nombre del producto
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text(offer.product?.name || 'Producto', margin + 4, y)
      
      // Precio tachado
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      const oldPrice = `$${offer.product?.sale_price?.toLocaleString('es-CL')}`
      doc.text(oldPrice, pageWidth - margin - 60, y)
      const oldPriceWidth = doc.getTextWidth(oldPrice)
      doc.line(pageWidth - margin - 60, y - 1, pageWidth - margin - 60 + oldPriceWidth, y - 1)
      
      y += 6
      
      // Precio de oferta
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 87, 34)
      const newPrice = `$${offer.special_price.toLocaleString('es-CL')}`
      doc.text(newPrice, pageWidth - margin - 50, y)
      
      // Descuento
      if (offer.product?.sale_price) {
        const discount = Math.round((1 - offer.special_price / offer.product.sale_price) * 100)
        doc.setFillColor(255, 87, 34)
        doc.roundedRect(pageWidth - margin - 25, y - 8, 22, 10, 2, 2, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        const discountText = `-${discount}%`
        const discountWidth = doc.getTextWidth(discountText)
        doc.text(discountText, pageWidth - margin - 14 - discountWidth / 2, y - 1)
      }
      
      // Unidad
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'italic')
      doc.text(`/ ${offer.product?.unit === 'kg' ? 'kg' : 'unidad'}`, margin + 4, y)
      
      y += 10
      
      // Vigencia
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      const startDate = new Date(offer.start_date).toLocaleDateString('es-CL')
      const endDate = new Date(offer.end_date).toLocaleDateString('es-CL')
      doc.text(`Válido del ${startDate} al ${endDate}`, margin + 4, y)
      
      y += 8
    })
    
    y += 8
  }
  
  // ======== PRODUCTOS ========
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('PRODUCTOS DISPONIBLES', margin, y)
  
  y += 8
  
  // Agrupar productos por categoría
  const productsByCategory = {}
  products.forEach(product => {
    const categoryName = product.category?.name || 'Sin Categoria'
    if (!productsByCategory[categoryName]) {
      productsByCategory[categoryName] = []
    }
    productsByCategory[categoryName].push(product)
  })
  
  // Ancho de columna
  const columnWidth = (contentWidth - 8) / 2
  
  // Renderizar por categoría
  Object.keys(productsByCategory).sort().forEach(categoryName => {
    const categoryProducts = productsByCategory[categoryName]
    
    if (y > pageHeight - 30) {
      doc.addPage()
      y = 20
    }
    
    // Encabezado de categoría
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(70, 70, 70)
    
    // Sin emoji
    doc.text(categoryName.toUpperCase(), margin + 3, y + 5)
    
    y += 10
    
    // Productos de la categoría en DOS COLUMNAS
    let column = 0
    let columnY = y
    
    categoryProducts.forEach((product, idx) => {
      if (columnY > pageHeight - 20) {
        if (column === 0) {
          // Cambiar a columna 2
          column = 1
          columnY = y
        } else {
          // Nueva página
          doc.addPage()
          y = 20
          columnY = y
          column = 0
        }
      }
      
      const xPos = column === 0 ? margin + 2 : margin + columnWidth + 8
      
      // Nombre del producto
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      const productName = product.name.substring(0, 22)
      doc.text(productName, xPos, columnY)
      
      // Precio y unidad EN EL MISMO COLOR GRIS
      if (product.sale_price) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)  // Mismo gris para todo
        const priceText = `$${product.sale_price.toLocaleString('es-CL')} / ${product.unit === 'kg' ? 'kg' : 'unid'}`
        doc.text(priceText, xPos, columnY + 4)
      }
      
      columnY += 10
      
      // Alternar columnas
      if (column === 0 && idx < categoryProducts.length - 1) {
        column = 1
        columnY = y
      } else if (column === 1) {
        column = 0
        y = columnY
      }
    })
    
    // Ajustar y para la siguiente categoría
    if (column === 1) {
      y = columnY
    }
    y += 6
  })
  
  // ======== PIE DE PÁGINA EN TODAS LAS PÁGINAS ========
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    const footerY = pageHeight - 10
    
    // Línea separadora
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
    
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    
    const footerText = 'Kivi - Tu personal shopper de Lo Valledor | WhatsApp: +56969172764 | Instagram: @kivi.chile'
    const footerWidth = doc.getTextWidth(footerText)
    doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
    
    // Número de página
    doc.setFontSize(7)
    const pageText = `Página ${i} de ${totalPages}`
    const pageWidth2 = doc.getTextWidth(pageText)
    doc.text(pageText, pageWidth - margin - pageWidth2, footerY)
  }
  
  // Descargar el PDF
  const filename = `catalogo-kivi-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

