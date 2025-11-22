/**
 * Generador de PDF para Catálogo de Productos
 * Genera un PDF bonito con productos y ofertas de la semana
 */
import { jsPDF } from 'jspdf'
import { getImageUrl } from './imageUrl'

// Función para cargar imagen como base64 con dimensiones
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
    const logoData = await loadImageAsBase64(logoUrl)
    
    // Calcular dimensiones manteniendo proporción
    // Ancho máximo: 50mm, mantener aspect ratio
    const maxWidth = 50
    const aspectRatio = logoData.width / logoData.height
    const logoWidth = maxWidth
    const logoHeight = maxWidth / aspectRatio
    
    // Logo a la izquierda, manteniendo proporción (no se achata)
    doc.addImage(logoData.base64, 'PNG', margin, 10, logoWidth, logoHeight)
  } catch (e) {
    // Si falla, usar texto como fallback
    console.warn('No se pudo cargar el logo, usando texto:', e)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(76, 175, 80) // Verde Kivi
    doc.text('KIVI', margin, 22)
  }
  
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
  
  // ======== OFERTAS DE LA SEMANA - PRIMERA PÁGINA COMPLETA ========
  if (weeklyOffers.length > 0) {
    // Usar toda la primera página para ofertas
    // Calcular espacio disponible (desde y hasta el pie de página)
    const availableHeight = pageHeight - 30 - y // 30 para pie de página
    const offersPerPage = Math.floor(availableHeight / 65) // ~65mm por oferta con imagen
    const offersOnFirstPage = Math.min(weeklyOffers.length, offersPerPage)
    
    // Título de ofertas - más grande
    doc.setFillColor(255, 249, 240) // Crema Kivi
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F')
    
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(136, 196, 168) // Verde oscuro Kivi
    doc.text('OFERTAS DE LA SEMANA', margin + 4, y + 8)
    
    y += 16
    
    // Renderizar ofertas en grid de 2 columnas con imágenes
    const offerWidth = (contentWidth - 8) / 2 // 2 columnas con espacio entre ellas
    const offerHeight = 60 // Altura fija por oferta
    let currentRow = 0
    let currentCol = 0
    
    // Primera pasada: calcular alturas de contenido para cada oferta (imagen + nombre)
    const offerContentHeights = []
    for (let i = 0; i < offersOnFirstPage; i++) {
      const offer = weeklyOffers[i]
      let contentHeight = 4 // Badge
      
      // Altura de imagen
      if (offer.product?.photo_url) {
        try {
          const imageUrl = getImageUrl(offer.product.photo_url)
          if (imageUrl) {
            const imageData = await loadImageAsBase64(imageUrl)
            const imageWidth = 35
            const imageAspectRatio = imageData.width / imageData.height
            const imageHeight = imageWidth / imageAspectRatio
            contentHeight += imageHeight + 6 // Imagen + espacio
          }
        } catch (e) {
          // Si no se puede cargar, usar altura estimada
          contentHeight += 25 + 6
        }
      } else {
        contentHeight += 25 + 6 // Altura estimada si no hay imagen
      }
      
      // Altura del nombre (aproximadamente 5mm)
      contentHeight += 5
      
      offerContentHeights.push(contentHeight)
    }
    
    // Segunda pasada: renderizar ofertas
    for (let i = 0; i < offersOnFirstPage; i++) {
      const offer = weeklyOffers[i]
      
      // Calcular posición
      const xPos = margin + (currentCol * (offerWidth + 8))
      const yPos = y + (currentRow * (offerHeight + 8))
      
      // Verificar si cabe en la página
      if (yPos + offerHeight > pageHeight - 30) {
        break // No cabe más en esta página
      }
      
      // Caja de oferta con color de marca
      doc.setFillColor(255, 249, 240) // Crema Kivi
      doc.roundedRect(xPos, yPos, offerWidth, offerHeight, 3, 3, 'F')
      
      // Borde con color de marca
      doc.setDrawColor(168, 213, 186) // Verde Kivi
      doc.setLineWidth(1)
      doc.roundedRect(xPos, yPos, offerWidth, offerHeight, 3, 3, 'S')
      
      let offerY = yPos + 4
      let actualImageHeight = 0
      
      // Badge de descuento - más pequeño pero con letra más grande
      if (offer.product?.sale_price) {
        const discount = Math.round((1 - offer.special_price / offer.product.sale_price) * 100)
        doc.setFillColor(255, 212, 163) // Naranja Kivi
        const badgeWidth = 22
        const badgeHeight = 9
        const badgeX = xPos + offerWidth - badgeWidth - 4
        const badgeY = yPos + 4
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F')
        doc.setFontSize(10) // Letra más grande en badge más pequeño
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(52, 73, 94) // Texto oscuro
        const discountText = `-${discount}%`
        const discountTextWidth = doc.getTextWidth(discountText)
        doc.text(discountText, badgeX + (badgeWidth - discountTextWidth) / 2, badgeY + 6.5)
      }
      
      // Imagen del producto
      if (offer.product?.photo_url) {
        try {
          const imageUrl = getImageUrl(offer.product.photo_url)
          if (imageUrl) {
            const imageData = await loadImageAsBase64(imageUrl)
            
            // Tamaño de imagen: 35mm de ancho, mantener proporción
            const imageWidth = 35
            const imageAspectRatio = imageData.width / imageData.height
            actualImageHeight = imageWidth / imageAspectRatio
            
            // Centrar imagen horizontalmente
            const imageX = xPos + (offerWidth - imageWidth) / 2
            doc.addImage(imageData.base64, 'PNG', imageX, offerY, imageWidth, actualImageHeight)
            
            offerY += actualImageHeight + 6
          }
        } catch (e) {
          console.warn('No se pudo cargar imagen del producto:', e)
          actualImageHeight = 25 // Altura estimada
          offerY += actualImageHeight + 6
        }
      } else {
        actualImageHeight = 25 // Altura estimada si no hay imagen
        offerY += actualImageHeight + 6
      }
      
      // Nombre del producto - centrado
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(52, 73, 94) // Texto oscuro
      const productName = (offer.product?.name || 'Producto')
      const maxNameWidth = offerWidth - 8
      let displayName = productName
      if (doc.getTextWidth(displayName) > maxNameWidth) {
        // Truncar nombre si es muy largo
        while (doc.getTextWidth(displayName + '...') > maxNameWidth && displayName.length > 0) {
          displayName = displayName.substring(0, displayName.length - 1)
        }
        displayName += '...'
      }
      // Centrar nombre
      const nameWidth = doc.getTextWidth(displayName)
      const nameX = xPos + (offerWidth - nameWidth) / 2
      doc.text(displayName, nameX, offerY)
      
      // Calcular posición del precio: usar el espacio disponible después del contenido
      // Encontrar la oferta de la misma fila con MÁS espacio (imagen más pequeña = más margen)
      const rowStart = Math.floor(i / 2) * 2
      const rowEnd = Math.min(rowStart + 2, offersOnFirstPage)
      
      // Encontrar la altura de contenido MÍNIMA de la fila (la que tiene más espacio/margen)
      // Esto asegura que el precio se posicione basándose en la oferta con más espacio disponible
      let minContentHeightInRow = offerHeight
      for (let j = rowStart; j < rowEnd; j++) {
        if (offerContentHeights[j] < minContentHeightInRow) {
          minContentHeightInRow = offerContentHeights[j]
        }
      }
      
      // Calcular posición del precio: después del contenido más bajo + margen generoso
      // Esto asegura que todas las ofertas de la fila tengan el precio a la misma altura
      // basándose en la que tiene más espacio (más margen con la foto)
      const priceY = yPos + minContentHeightInRow + 10 // 10mm después del contenido más bajo (más espacio)
      
      // Asegurar que el precio no esté muy abajo (máximo 12mm del borde inferior)
      const maxPriceY = yPos + offerHeight - 12
      const finalPriceY = Math.min(priceY, maxPriceY)
      
      // Precio tachado (si existe)
      if (offer.product?.sale_price) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(150, 150, 150)
        const oldPrice = `$${offer.product.sale_price.toLocaleString('es-CL')}`
        const oldPriceWidth = doc.getTextWidth(oldPrice)
        const oldPriceX = xPos + (offerWidth - oldPriceWidth) / 2
        doc.text(oldPrice, oldPriceX, finalPriceY - 6)
        doc.line(oldPriceX, finalPriceY - 7, oldPriceX + oldPriceWidth, finalPriceY - 7)
      }
      
      // Precio de oferta - centrado, a la misma altura, color negro/gris
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80, 80, 80) // Negro/gris, no verde
      const newPrice = `$${offer.special_price.toLocaleString('es-CL')}`
      const newPriceWidth = doc.getTextWidth(newPrice)
      const newPriceX = xPos + (offerWidth - newPriceWidth) / 2
      doc.text(newPrice, newPriceX, finalPriceY)
      
      // Unidad - centrada también
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      const unitText = `/${offer.product?.unit === 'kg' ? 'kg' : 'unid'}`
      const unitWidth = doc.getTextWidth(unitText)
      const unitX = xPos + (offerWidth - unitWidth) / 2
      doc.text(unitText, unitX, finalPriceY + 5)
      
      // Avanzar a la siguiente posición
      currentCol++
      if (currentCol >= 2) {
        currentCol = 0
        currentRow++
      }
    }
    
    // Si hay más ofertas, continuar en siguiente página
    if (weeklyOffers.length > offersOnFirstPage) {
      doc.addPage()
      y = 20
      
      // Continuar con las ofertas restantes
      for (let i = offersOnFirstPage; i < weeklyOffers.length; i++) {
        const offer = weeklyOffers[i]
        
        if (y > pageHeight - 50) {
          doc.addPage()
          y = 20
        }
        
        // Mismo estilo pero en una columna
        doc.setFillColor(255, 249, 240)
        doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F')
        doc.setDrawColor(168, 213, 186)
        doc.setLineWidth(1)
        doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'S')
        
        let offerY = y + 4
        
        // Imagen
        if (offer.product?.photo_url) {
          try {
            const imageUrl = getImageUrl(offer.product.photo_url)
            if (imageUrl) {
              const imageData = await loadImageAsBase64(imageUrl)
              const imageWidth = 30
              const imageAspectRatio = imageData.width / imageData.height
              const imageHeight = imageWidth / imageAspectRatio
              doc.addImage(imageData.base64, 'PNG', margin + 4, offerY, imageWidth, imageHeight)
              offerY += imageHeight + 4
            }
          } catch (e) {
            console.warn('No se pudo cargar imagen:', e)
          }
        }
        
        // Nombre - centrado
        doc.setFontSize(15)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(52, 73, 94)
        const productName = offer.product?.name || 'Producto'
        const nameWidth = doc.getTextWidth(productName)
        const nameX = margin + (contentWidth - nameWidth) / 2
        doc.text(productName, nameX, offerY)
        offerY += 7
        
        // Calcular posición del precio (lo más abajo posible con margen)
        const priceY = y + 50 - 12 // 12mm de margen desde abajo
        
        // Precio tachado (si existe)
        if (offer.product?.sale_price) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
      doc.setTextColor(150, 150, 150)
          const oldPrice = `$${offer.product.sale_price.toLocaleString('es-CL')}`
          const oldPriceWidth = doc.getTextWidth(oldPrice)
          const oldPriceX = margin + (contentWidth - oldPriceWidth) / 2
          doc.text(oldPrice, oldPriceX, priceY - 6)
          doc.line(oldPriceX, priceY - 7, oldPriceX + oldPriceWidth, priceY - 7)
        }
        
        // Precio nuevo - centrado, a la misma altura, color negro/gris
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 80, 80) // Negro/gris, no verde
        const newPrice = `$${offer.special_price.toLocaleString('es-CL')}`
        const newPriceWidth = doc.getTextWidth(newPrice)
        const newPriceX = margin + (contentWidth - newPriceWidth) / 2
        doc.text(newPrice, newPriceX, priceY)
        
        // Unidad - centrada
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        const unitText = `/${offer.product?.unit === 'kg' ? 'kg' : 'unid'}`
        const unitWidth = doc.getTextWidth(unitText)
        const unitX = margin + (contentWidth - unitWidth) / 2
        doc.text(unitText, unitX, priceY + 5)
        
        // Badge de descuento - más pequeño pero con letra más grande
        if (offer.product?.sale_price) {
          const discount = Math.round((1 - offer.special_price / offer.product.sale_price) * 100)
          doc.setFillColor(255, 212, 163) // Naranja Kivi
          const badgeWidth = 22
          const badgeHeight = 9
          const badgeX = pageWidth - margin - badgeWidth - 4
          const badgeY = y + 4
          doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F')
          doc.setFontSize(10) // Letra más grande en badge más pequeño
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(52, 73, 94)
          const discountText = `-${discount}%`
          const discountTextWidth = doc.getTextWidth(discountText)
          doc.text(discountText, badgeX + (badgeWidth - discountTextWidth) / 2, badgeY + 6.5)
        }
        
        y += 55
      }
    }
    
    // Nueva página para productos
    doc.addPage()
    y = 20
  }
  
  // ======== PRODUCTOS ========
  if (y > pageHeight - 40) {
    doc.addPage()
    y = 20
  }
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(50, 50, 50)
  doc.text('PRODUCTOS DISPONIBLES', margin, y)
  
  y += 12
  
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
  const columnWidth = (contentWidth - 16) / 2 // Más espacio entre columnas
  const lineHeight = 18 // Altura de línea más grande para letras más grandes y más espacio
  const minSpaceAtBottom = 30 // Espacio mínimo al final de página
  
  // Renderizar por categoría
  Object.keys(productsByCategory).sort().forEach(categoryName => {
    const categoryProducts = productsByCategory[categoryName]
    let categoryStarted = false
    let productIndex = 0
    
    // Continuar renderizando la categoría hasta que todos los productos estén en el PDF
    while (productIndex < categoryProducts.length) {
      // Verificar si necesitamos nueva página
      if (y > pageHeight - minSpaceAtBottom) {
        doc.addPage()
        y = 20
        categoryStarted = false
      }
      
      // Si la categoría no ha empezado en esta página, agregar encabezado
      if (!categoryStarted) {
        // Encabezado de categoría - más grande
        doc.setFillColor(240, 240, 240)
        doc.roundedRect(margin, y, contentWidth, 11, 1, 1, 'F')
        
        doc.setFontSize(15)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(70, 70, 70)
        
        doc.text(categoryName.toUpperCase(), margin + 4, y + 7.5)
        
        y += 14
        categoryStarted = true
      }
      
      // Verificar espacio antes de empezar productos
      if (y > pageHeight - minSpaceAtBottom) {
        doc.addPage()
        y = 20
        categoryStarted = false
        continue // Volver a agregar encabezado
      }
      
      // Renderizar productos en dos columnas
      let column0Y = y // Posición Y de la columna 0
      let column1Y = y // Posición Y de la columna 1
      const startY = y
      
      // Renderizar productos hasta llenar ambas columnas o terminar la categoría
      while (productIndex < categoryProducts.length) {
        const product = categoryProducts[productIndex]
        
        // Decidir en qué columna colocar el producto (la que esté más arriba)
        const useColumn0 = column0Y <= column1Y
        const currentColumnY = useColumn0 ? column0Y : column1Y
        
        // Verificar si necesitamos nueva página
        if (currentColumnY + lineHeight > pageHeight - minSpaceAtBottom) {
          // Verificar si la otra columna tiene espacio
          const otherColumnY = useColumn0 ? column1Y : column0Y
          if (otherColumnY + lineHeight <= pageHeight - minSpaceAtBottom) {
            // Usar la otra columna
            if (useColumn0) {
              column0Y = column1Y
            } else {
              column1Y = column0Y
            }
          } else {
            // Ambas columnas están llenas, nueva página
            doc.addPage()
            y = 20
            categoryStarted = false
            break // Salir del while interno para volver a empezar con encabezado
          }
        }
        
        // Usar la columna correspondiente
        const finalColumnY = useColumn0 ? column0Y : column1Y
        const xPos = useColumn0 ? margin + 2 : margin + columnWidth + 10
        
        // Nombre del producto - más grande
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(52, 73, 94) // Texto oscuro Kivi
        // Ajustar longitud del nombre según ancho de columna
        const maxNameLength = Math.floor(columnWidth / 2.0)
        let productName = product.name
        if (productName.length > maxNameLength) {
          productName = productName.substring(0, maxNameLength - 3) + '...'
        }
        doc.text(productName, xPos, finalColumnY)
        
        // Precio y unidad - más grande con color gris (más claro que el título)
        if (product.sale_price) {
          doc.setFontSize(14)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100) // Gris, más claro que el título (52, 73, 94) pero no verde
          const priceText = `$${product.sale_price.toLocaleString('es-CL')} / ${product.unit === 'kg' ? 'kg' : 'unid'}`
          doc.text(priceText, xPos, finalColumnY + 7)
        }
        
        // Actualizar posición Y de la columna usada
        if (useColumn0) {
          column0Y += lineHeight
        } else {
          column1Y += lineHeight
        }
        
        productIndex++
      }
      
      // Si terminamos todos los productos de la categoría, salir
      if (productIndex >= categoryProducts.length) {
        // Ajustar y para la siguiente categoría (usar la columna más baja)
        y = Math.max(column0Y, column1Y)
        y += 10
        break
      }
    }
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

