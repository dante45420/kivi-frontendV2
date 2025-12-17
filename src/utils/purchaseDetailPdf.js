/**
 * Generador de PDF para Compra Actual Detallada
 * Muestra detalle por cliente y maduración de forma bonita y ordenada
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
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('LISTA DE COMPRAS DETALLADA', margin, y)
  
  y += 10
  
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
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(orderRange, margin, y)
  
  y += 15
  
  // ======== AGRUPAR POR PRODUCTO ========
  consolidatedList.forEach((item, itemIdx) => {
    // Verificar si necesitamos nueva página
    if (y > pageHeight - 100) {
      doc.addPage()
      y = 20
    }
    
    const product = products[item.product_id]
    
    // Nombre del producto
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(76, 175, 80)
    doc.text(item.product_name, margin, y)
    
    y += 8
    
    // Cantidad total
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(
      `Cantidad total: ${item.total_qty.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`,
      margin,
      y
    )
    
    y += 10
    
    // Detalle por maduración
    if (item.maturity_breakdown) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Desglose por Maduración:', margin, y)
      y += 8
      
      if (item.maturity_breakdown.para_hoy > 0) {
        const maturityColor = getMaturityColor('para_hoy')
        doc.setFillColor(maturityColor.r, maturityColor.g, maturityColor.b)
        doc.roundedRect(margin + 5, y - 5, 80, 8, 2, 2, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text('Para hoy', margin + 10, y + 1)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(
          `: ${item.maturity_breakdown.para_hoy.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`,
          margin + 95,
          y + 1
        )
        y += 10
      }
      
      if (item.maturity_breakdown.para_4_5_dias > 0) {
        const maturityColor = getMaturityColor('para_4_5_dias')
        doc.setFillColor(maturityColor.r, maturityColor.g, maturityColor.b)
        doc.roundedRect(margin + 5, y - 5, 80, 8, 2, 2, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text('Para 4-5 días', margin + 10, y + 1)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(
          `: ${item.maturity_breakdown.para_4_5_dias.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`,
          margin + 95,
          y + 1
        )
        y += 10
      }
      
      if (item.maturity_breakdown.sin_especificar > 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(
          `Sin especificar: ${item.maturity_breakdown.sin_especificar.toFixed(item.unit === 'kg' ? 1 : 0)} ${item.unit}`,
          margin + 5,
          y
        )
        y += 10
      }
      
      y += 5
    }
    
    // Detalle por cliente
    if (item.customers && item.customers.length > 0) {
      // Línea divisoria
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(76, 175, 80)
      doc.text('Detalle por Cliente:', margin, y)
      y += 10
      
      // Agrupar clientes por nombre
      const customersMap = {}
      item.customers.forEach(customer => {
        const customerName = customer.customer_name || 'Cliente desconocido'
        if (!customersMap[customerName]) {
          customersMap[customerName] = {
            name: customerName,
            items: [],
            totalQty: 0
          }
        }
        customersMap[customerName].items.push(customer)
        customersMap[customerName].totalQty += customer.qty || 0
      })
      
      Object.values(customersMap).forEach((customerData, cIdx) => {
        // Verificar si necesitamos nueva página
        if (y > pageHeight - 60) {
          doc.addPage()
          y = 20
        }
        
        // Nombre del cliente
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(customerData.name, margin + 5, y)
        
        y += 6
        
        // Items del cliente
        customerData.items.forEach((customerItem, itemIdx) => {
          // Verificar si necesitamos nueva página
          if (y > pageHeight - 40) {
            doc.addPage()
            y = 20
          }
          
          // Fondo para el item
          const itemHeight = 15
          doc.setFillColor(248, 249, 250)
          doc.roundedRect(margin + 10, y - 4, contentWidth - 15, itemHeight, 3, 3, 'F')
          
          // Información del pedido
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          doc.text(`Pedido #${customerItem.order_id}`, margin + 15, y)
          
          // Cantidad
          const qtyText = `${customerItem.qty} ${item.unit}`
          const qtyWidth = doc.getTextWidth(qtyText)
          doc.text(qtyText, pageWidth - margin - 90 - qtyWidth, y)
          
          // Buscar maduración del item en ordersData
          let maturityNote = 'sin_especificar'
          if (ordersData && ordersData[customerItem.order_id]) {
            const orderItems = ordersData[customerItem.order_id]
            const orderItem = orderItems.find(oi => 
              oi.product_id === item.product_id && 
              oi.customer_name === customerData.name
            )
            if (orderItem && orderItem.maturity_note) {
              maturityNote = orderItem.maturity_note
            }
          }
          
          // Badge de maduración
          const maturityLabel = getMaturityLabel(maturityNote)
          const maturityColor = getMaturityColor(maturityNote)
          doc.setFillColor(maturityColor.r, maturityColor.g, maturityColor.b)
          doc.roundedRect(pageWidth - margin - 85, y - 4, 80, 8, 2, 2, 'F')
          
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          const labelWidth = doc.getTextWidth(maturityLabel)
          doc.text(maturityLabel, pageWidth - margin - 85 + (80 - labelWidth) / 2, y + 1)
          
          y += 12
        })
        
        // Espacio entre clientes
        if (cIdx < Object.values(customersMap).length - 1) {
          y += 5
        }
      })
    }
    
    // Espacio entre productos
    if (itemIdx < consolidatedList.length - 1) {
      y += 10
      doc.setDrawColor(240, 240, 240)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10
    }
  })
  
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

