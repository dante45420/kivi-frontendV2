/**
 * Generador de PDF para Compra Actual Detallada
 * Formato compacto y elegante con detalle por cliente y maduración
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

const getMaturityLabel = (maturityNote) => {
  switch (maturityNote) {
    case 'para_hoy':
      return 'Hoy'
    case 'para_4_5_dias':
      return '4-5d'
    default:
      return '-'
  }
}

const getMaturityColor = (maturityNote) => {
  switch (maturityNote) {
    case 'para_hoy':
      return { r: 255, g: 107, b: 0 } // Naranja
    case 'para_4_5_dias':
      return { r: 76, g: 175, b: 80 } // Verde
    default:
      return { r: 200, g: 200, b: 200 } // Gris
  }
}

export async function generatePurchaseDetailPDF(consolidatedList, products, ordersData) {
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
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('LISTA DE COMPRAS DETALLADA', margin, y)
  
  y += 8
  
  // Obtener rango de pedidos
  const orderIds = new Set()
  consolidatedList.forEach(item => {
    item.customers?.forEach(customer => {
      customer.order_id && orderIds.add(customer.order_id)
    })
  })
  const sortedOrderIds = Array.from(orderIds).sort((a, b) => a - b)
  const orderRange = sortedOrderIds.length > 0 
    ? sortedOrderIds.length === 1 
      ? `Pedido #${sortedOrderIds[0]}`
      : `Pedidos #${sortedOrderIds[0]}-${sortedOrderIds[sortedOrderIds.length - 1]}`
    : 'Sin pedidos'
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(orderRange, margin, y)
  
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
    if (y > pageHeight - 50) {
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
    
    // Items de esta categoría
    const sortedItems = [...byCategory[category]].sort((a, b) => {
      if (a.product_name === b.product_name) {
        if (a.unit === 'kg' && b.unit !== 'kg') return -1
        if (a.unit !== 'kg' && b.unit === 'kg') return 1
      }
      return 0
    })
    
    sortedItems.forEach((item, itemIdx) => {
      // Verificar si necesitamos una nueva página
      if (y > pageHeight - 60) {
        doc.addPage()
        y = 20
      }
      
      // Nombre del producto y cantidad total
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(item.product_name, margin + 5, y)
      
      // Cantidad total (derecha)
      const qtyText = `${item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`
      const qtyWidth = doc.getTextWidth(qtyText)
      doc.setFont('helvetica', 'normal')
      doc.text(qtyText, pageWidth - margin - qtyWidth, y)
      
      y += 6
      
      // Desglose por maduración (compacto, en una línea)
      if (item.maturity_breakdown) {
        const breakdown = item.maturity_breakdown
        const parts = []
        if (breakdown.para_hoy > 0) {
          parts.push(`Hoy: ${breakdown.para_hoy.toFixed(item.unit === 'kg' ? 1 : 0)}`)
        }
        if (breakdown.para_4_5_dias > 0) {
          parts.push(`4-5d: ${breakdown.para_4_5_dias.toFixed(item.unit === 'kg' ? 1 : 0)}`)
        }
        if (breakdown.sin_especificar > 0) {
          parts.push(`-: ${breakdown.sin_especificar.toFixed(item.unit === 'kg' ? 1 : 0)}`)
        }
        
        if (parts.length > 0) {
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(parts.join(' | '), margin + 10, y)
          y += 5
        }
      }
      
      // Detalle por cliente (compacto)
      if (item.customers && item.customers.length > 0) {
        // Agrupar clientes por nombre
        const customersMap = {}
        item.customers.forEach(customer => {
          const customerName = customer.customer_name || 'Cliente desconocido'
          if (!customersMap[customerName]) {
            customersMap[customerName] = []
          }
          customersMap[customerName].push(customer)
        })
        
        // Mostrar clientes de forma compacta
        Object.entries(customersMap).forEach(([customerName, customerItems], cIdx) => {
          // Verificar si necesitamos nueva página
          if (y > pageHeight - 30) {
            doc.addPage()
            y = 20
          }
          
          // Nombre del cliente (compacto)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(60, 60, 60)
          doc.text(`  ${customerName}:`, margin + 10, y)
          
          // Items del cliente en línea compacta
          const itemsText = customerItems.map(customerItem => {
            // Buscar maduración
            let maturityNote = 'sin_especificar'
            if (ordersData && ordersData[customerItem.order_id]) {
              const orderItems = ordersData[customerItem.order_id]
              const orderItem = orderItems.find(oi => 
                oi.product_id === item.product_id && 
                oi.customer_name === customerName
              )
              if (orderItem && orderItem.maturity_note) {
                maturityNote = orderItem.maturity_note
              }
            }
            
            const maturityLabel = getMaturityLabel(maturityNote)
            return `#${customerItem.order_id} (${customerItem.qty}${item.unit === 'kg' ? '' : 'u'} ${maturityLabel})`
          }).join(', ')
          
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          const itemsWidth = doc.getTextWidth(itemsText)
          const maxWidth = pageWidth - margin - 80
          if (itemsWidth > maxWidth) {
            // Si es muy largo, truncar
            const truncated = doc.splitTextToSize(itemsText, maxWidth)
            doc.text(truncated[0], margin + 50, y)
            if (truncated.length > 1) {
              y += 4
              doc.text(truncated[1], margin + 50, y)
            }
          } else {
            doc.text(itemsText, margin + 50, y)
          }
          
          y += 5
        })
      }
      
      y += 3
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
  
  const footerText = 'Lista de compras detallada generada por Green Market - Tu personal shopper de Lo Valledor'
  const footerWidth = doc.getTextWidth(footerText)
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY)
  
  // Contacto
  doc.setFontSize(7)
  const contactText = 'WhatsApp: +56969172764 | Instagram: @greenmarket.chile'
  const contactWidth = doc.getTextWidth(contactText)
  doc.text(contactText, (pageWidth - contactWidth) / 2, footerY + 4)
  
  return doc
}
