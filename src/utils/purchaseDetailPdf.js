/**
 * Generador de PDF para Compra Actual Detallada
 * Formato: Por categoría, separado por unidad, dos filas por maduración con clientes
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
    doc.setTextColor(30, 30, 30) // Negro oscuro
    doc.text(category.toUpperCase(), margin, y)
    y += 8
    
    // Línea divisoria
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
    
    // Agrupar productos por nombre y ordenar alfabéticamente
    const byProductName = {}
    byCategory[category].forEach(item => {
      const productName = item.product_name
      if (!byProductName[productName]) {
        byProductName[productName] = []
      }
      byProductName[productName].push(item)
    })
    
    // Ordenar productos alfabéticamente
    const sortedProductNames = Object.keys(byProductName).sort()
    
    sortedProductNames.forEach(productName => {
      const productItems = byProductName[productName]
      
      // Separar por unidad: kg primero, luego unit
      const kgItems = productItems.filter(item => item.unit === 'kg')
      const unitItems = productItems.filter(item => item.unit !== 'kg')
      
      // Procesar items en kg primero
      if (kgItems.length > 0) {
        kgItems.forEach(item => {
          // Verificar si necesitamos una nueva página
          if (y > pageHeight - 50) {
            doc.addPage()
            y = 20
          }
          
          // Nombre del producto y unidad
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text(`${item.product_name} (kg)`, margin + 5, y)
          
          // Cantidad total (derecha)
          const qtyText = `${item.total_qty.toFixed(1)} kg`
          const qtyWidth = doc.getTextWidth(qtyText)
          doc.setFont('helvetica', 'normal')
          doc.text(qtyText, pageWidth - margin - qtyWidth, y)
          
          y += 6
          
          // Fila "Para hoy"
          if (item.maturity_breakdown && item.maturity_breakdown.para_hoy > 0) {
            // Obtener clientes que pidieron "para hoy"
            const hoyCustomers = item.customers.filter(customer => 
              customer.maturity_note === 'para_hoy' && customer.qty > 0
            )
            
            if (hoyCustomers.length > 0) {
              doc.setFontSize(10)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(60, 60, 60)
              doc.text('Para hoy:', margin + 10, y)
              
              // Agrupar clientes por nombre y sumar cantidades
              const customerMap = {}
              hoyCustomers.forEach(customer => {
                const name = customer.customer_name || 'Cliente desconocido'
                if (!customerMap[name]) {
                  customerMap[name] = 0
                }
                customerMap[name] += customer.qty || 0
              })
              
              // Mostrar clientes a la derecha
              const customerText = Object.entries(customerMap)
                .map(([name, qty]) => `${name} ${qty.toFixed(1)}`)
                .join(', ')
              
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(9)
              doc.setTextColor(100, 100, 100)
              const customerWidth = doc.getTextWidth(customerText)
              const maxWidth = pageWidth - margin - 70
              if (customerWidth > maxWidth) {
                const truncated = doc.splitTextToSize(customerText, maxWidth)
                doc.text(truncated[0], margin + 70, y)
                if (truncated.length > 1) {
                  y += 4
                  doc.text(truncated[1], margin + 70, y)
                }
              } else {
                doc.text(customerText, margin + 70, y)
              }
              
              y += 6
            }
          }
          
          // Fila "Para 4-5 días"
          if (item.maturity_breakdown && item.maturity_breakdown.para_4_5_dias > 0) {
            // Obtener clientes que pidieron "para 4-5 días"
            const diasCustomers = item.customers.filter(customer => 
              customer.maturity_note === 'para_4_5_dias' && customer.qty > 0
            )
            
            if (diasCustomers.length > 0) {
              doc.setFontSize(10)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(60, 60, 60)
              doc.text('Para 4-5 días:', margin + 10, y)
              
              // Agrupar clientes por nombre y sumar cantidades
              const customerMap = {}
              diasCustomers.forEach(customer => {
                const name = customer.customer_name || 'Cliente desconocido'
                if (!customerMap[name]) {
                  customerMap[name] = 0
                }
                customerMap[name] += customer.qty || 0
              })
              
              // Mostrar clientes a la derecha
              const customerText = Object.entries(customerMap)
                .map(([name, qty]) => `${name} ${qty.toFixed(1)}`)
                .join(', ')
              
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(9)
              doc.setTextColor(100, 100, 100)
              const customerWidth = doc.getTextWidth(customerText)
              const maxWidth = pageWidth - margin - 70
              if (customerWidth > maxWidth) {
                const truncated = doc.splitTextToSize(customerText, maxWidth)
                doc.text(truncated[0], margin + 70, y)
                if (truncated.length > 1) {
                  y += 4
                  doc.text(truncated[1], margin + 70, y)
                }
              } else {
                doc.text(customerText, margin + 70, y)
              }
              
              y += 6
            }
          }
          
          y += 3
        })
      }
      
      // Procesar items en unidades
      if (unitItems.length > 0) {
        unitItems.forEach(item => {
          // Verificar si necesitamos una nueva página
          if (y > pageHeight - 50) {
            doc.addPage()
            y = 20
          }
          
          // Nombre del producto y unidad
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text(`${item.product_name} (${item.unit})`, margin + 5, y)
          
          // Cantidad total (derecha)
          const qtyText = `${item.total_qty.toFixed(0)} ${item.unit}`
          const qtyWidth = doc.getTextWidth(qtyText)
          doc.setFont('helvetica', 'normal')
          doc.text(qtyText, pageWidth - margin - qtyWidth, y)
          
          y += 6
          
          // Fila "Para hoy"
          if (item.maturity_breakdown && item.maturity_breakdown.para_hoy > 0) {
            // Obtener clientes que pidieron "para hoy"
            const hoyCustomers = item.customers.filter(customer => 
              customer.maturity_note === 'para_hoy' && customer.qty > 0
            )
            
            if (hoyCustomers.length > 0) {
              doc.setFontSize(10)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(60, 60, 60)
              doc.text('Para hoy:', margin + 10, y)
              
              // Agrupar clientes por nombre y sumar cantidades
              const customerMap = {}
              hoyCustomers.forEach(customer => {
                const name = customer.customer_name || 'Cliente desconocido'
                if (!customerMap[name]) {
                  customerMap[name] = 0
                }
                customerMap[name] += customer.qty || 0
              })
              
              // Mostrar clientes a la derecha
              const customerText = Object.entries(customerMap)
                .map(([name, qty]) => `${name} ${qty.toFixed(0)}`)
                .join(', ')
              
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(9)
              doc.setTextColor(100, 100, 100)
              const customerWidth = doc.getTextWidth(customerText)
              const maxWidth = pageWidth - margin - 70
              if (customerWidth > maxWidth) {
                const truncated = doc.splitTextToSize(customerText, maxWidth)
                doc.text(truncated[0], margin + 70, y)
                if (truncated.length > 1) {
                  y += 4
                  doc.text(truncated[1], margin + 70, y)
                }
              } else {
                doc.text(customerText, margin + 70, y)
              }
              
              y += 6
            }
          }
          
          // Fila "Para 4-5 días"
          if (item.maturity_breakdown && item.maturity_breakdown.para_4_5_dias > 0) {
            // Obtener clientes que pidieron "para 4-5 días"
            const diasCustomers = item.customers.filter(customer => 
              customer.maturity_note === 'para_4_5_dias' && customer.qty > 0
            )
            
            if (diasCustomers.length > 0) {
              doc.setFontSize(10)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(60, 60, 60)
              doc.text('Para 4-5 días:', margin + 10, y)
              
              // Agrupar clientes por nombre y sumar cantidades
              const customerMap = {}
              diasCustomers.forEach(customer => {
                const name = customer.customer_name || 'Cliente desconocido'
                if (!customerMap[name]) {
                  customerMap[name] = 0
                }
                customerMap[name] += customer.qty || 0
              })
              
              // Mostrar clientes a la derecha
              const customerText = Object.entries(customerMap)
                .map(([name, qty]) => `${name} ${qty.toFixed(0)}`)
                .join(', ')
              
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(9)
              doc.setTextColor(100, 100, 100)
              const customerWidth = doc.getTextWidth(customerText)
              const maxWidth = pageWidth - margin - 70
              if (customerWidth > maxWidth) {
                const truncated = doc.splitTextToSize(customerText, maxWidth)
                doc.text(truncated[0], margin + 70, y)
                if (truncated.length > 1) {
                  y += 4
                  doc.text(truncated[1], margin + 70, y)
                }
              } else {
                doc.text(customerText, margin + 70, y)
              }
              
              y += 6
            }
          }
          
          y += 3
        })
      }
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
