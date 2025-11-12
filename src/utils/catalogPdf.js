/**
 * Generador de PDF para Catálogo de Productos
 * Genera un PDF bonito con productos y ofertas de la semana
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
        resolve(base64)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = reject
    img.src = url
  })
}

export async function generateCatalogPDF(products, weeklyOffers = []) {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const contentWidth = pageWidth - (2 * margin)
  
  let y = 20
  
  // ======== ENCABEZADO ========
  // Color crema: #FFF9F0 (RGB: 255, 249, 240) - igual al de la página
  doc.setFillColor(255, 249, 240)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  // Intentar cargar logo
  try {
    const logoUrl = '/Logo_kivi.png'
    const logoBase64 = await loadImageAsBase64(logoUrl)
    // Logo a la izquierda, altura 30mm
    doc.addImage(logoBase64, 'PNG', margin, 10, 40, 12)
  } catch (e) {
    // Si falla, usar texto como fallback
    console.warn('No se pudo cargar el logo, usando texto:', e)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(76, 175, 80) // Verde Kivi
    doc.text('KIVI', margin, 22)
  }
  
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text('Catálogo de Productos Frescos', margin, 35)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const dateText = new Date().toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const dateWidth = doc.getTextWidth(dateText)
  doc.text(dateText, pageWidth - margin - dateWidth, 25)
  
  y = 58
  
  // ======== OFERTAS DE LA SEMANA ========
  if (weeklyOffers.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = 20
    }
    
    doc.setFillColor(255, 244, 229)
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F')
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 87, 34)
    doc.text('OFERTAS DE LA SEMANA', margin + 4, y + 6.5)
    
    y += 14
    
    weeklyOffers.forEach(offer => {
      if (y > pageHeight - 50) {
        doc.addPage()
        y = 20
      }
      
      // Caja de oferta - más espaciosa
      doc.setFillColor(255, 245, 238)
      doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F')
      
      // Borde destacado
      doc.setDrawColor(255, 87, 34)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'S')
      
      y += 8
      
      // Nombre del producto - más grande
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      const productName = (offer.product?.name || 'Producto').substring(0, 35)
      doc.text(productName, margin + 4, y)
      
      // Precio tachado
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      const oldPrice = `$${offer.product?.sale_price?.toLocaleString('es-CL')}`
      const oldPriceX = pageWidth - margin - 80
      doc.text(oldPrice, oldPriceX, y)
      const oldPriceWidth = doc.getTextWidth(oldPrice)
      doc.line(oldPriceX, y - 1, oldPriceX + oldPriceWidth, y - 1)
      
      y += 8
      
      // Precio de oferta - más grande
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 87, 34)
      const newPrice = `$${offer.special_price.toLocaleString('es-CL')}`
      doc.text(newPrice, pageWidth - margin - 70, y)
      
      // Descuento
      if (offer.product?.sale_price) {
        const discount = Math.round((1 - offer.special_price / offer.product.sale_price) * 100)
        doc.setFillColor(255, 87, 34)
        doc.roundedRect(pageWidth - margin - 30, y - 10, 26, 12, 2, 2, 'F')
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        const discountText = `-${discount}%`
        const discountWidth = doc.getTextWidth(discountText)
        doc.text(discountText, pageWidth - margin - 17 - discountWidth / 2, y - 2)
      }
      
      // Unidad - más grande
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`/ ${offer.product?.unit === 'kg' ? 'kg' : 'unidad'}`, margin + 4, y)
      
      y += 10
      
      // Vigencia - más grande
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      const startDate = new Date(offer.start_date).toLocaleDateString('es-CL')
      const endDate = new Date(offer.end_date).toLocaleDateString('es-CL')
      doc.text(`Válido del ${startDate} al ${endDate}`, margin + 4, y)
      
      y += 10
    })
    
    y += 10
  }
  
  // ======== PRODUCTOS ========
  if (y > pageHeight - 40) {
    doc.addPage()
    y = 20
  }
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('PRODUCTOS DISPONIBLES', margin, y)
  
  y += 10
  
  // Agrupar productos por categoría
  const productsByCategory = {}
  products.forEach(product => {
    const categoryName = product.category?.name || 'Sin Categoria'
    if (!productsByCategory[categoryName]) {
      productsByCategory[categoryName] = []
    }
    productsByCategory[categoryName].push(product)
  })
  
  // Ancho de columna - más espacio entre columnas
  const columnWidth = (contentWidth - 12) / 2
  
  // Renderizar por categoría
  Object.keys(productsByCategory).sort().forEach(categoryName => {
    const categoryProducts = productsByCategory[categoryName]
    
    if (y > pageHeight - 40) {
      doc.addPage()
      y = 20
    }
    
    // Encabezado de categoría - más grande
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'F')
    
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(70, 70, 70)
    
    doc.text(categoryName.toUpperCase(), margin + 4, y + 6)
    
    y += 12
    
    // Productos de la categoría en DOS COLUMNAS
    let column = 0
    let columnY = y
    const lineHeight = 12 // Altura de línea más grande
    
    categoryProducts.forEach((product, idx) => {
      // Verificar si necesitamos nueva página o cambiar de columna
      if (columnY + lineHeight > pageHeight - 25) {
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
      
      const xPos = column === 0 ? margin + 2 : margin + columnWidth + 10
      
      // Nombre del producto - más grande
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      // Ajustar longitud del nombre según ancho de columna
      const maxNameLength = Math.floor(columnWidth / 2.5)
      let productName = product.name
      if (productName.length > maxNameLength) {
        productName = productName.substring(0, maxNameLength - 3) + '...'
      }
      doc.text(productName, xPos, columnY)
      
      // Precio y unidad - más grande
      if (product.sale_price) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)
        const priceText = `$${product.sale_price.toLocaleString('es-CL')} / ${product.unit === 'kg' ? 'kg' : 'unid'}`
        doc.text(priceText, xPos, columnY + 5)
      }
      
      columnY += lineHeight
      
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
    y += 8
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
    
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    
    const footerText = 'Kivi - Tu personal shopper de Lo Valledor | WhatsApp: +56969172764 | Instagram: @kivi.chile'
    const footerWidth = doc.getTextWidth(footerText)
    doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
    
    // Número de página - más grande
    doc.setFontSize(8)
    const pageText = `Página ${i} de ${totalPages}`
    const pageWidth2 = doc.getTextWidth(pageText)
    doc.text(pageText, pageWidth - margin - pageWidth2, footerY)
  }
  
  // Descargar el PDF
  const filename = `catalogo-kivi-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

