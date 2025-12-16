/**
 * Página: Gestión de Tips de Green Market
 * Crear, editar y gestionar los tips que Green Market muestra a los usuarios
 */
import { useState, useEffect } from 'react'
import { fetchTips, createTip, updateTip, deleteTip } from '../api/kivi'
import Loader from '../components/Loader'

const CATEGORIES = [
  { value: 'platform_usage', label: '📱 Uso de la Plataforma', emoji: '📱' },
  { value: 'product_info', label: '🥬 Información de Productos', emoji: '🥬' },
  { value: 'promotion', label: '🏷️ Promociones', emoji: '🏷️' },
  { value: 'brand_info', label: '🌱 Información de Green Market', emoji: '🌱' }
]

export default function KiviTips() {
  const [loading, setLoading] = useState(true)
  const [tips, setTips] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTip, setEditingTip] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    category: 'platform_usage',
    message: '',
    emoji: '💡',
    active: true
  })

  useEffect(() => {
    loadTips()
  }, [categoryFilter])

  async function loadTips() {
    setLoading(true)
    try {
      const data = await fetchTips(categoryFilter)
      setTips(data)
    } catch (error) {
      console.error('Error cargando tips:', error)
      alert('Error cargando tips: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingTip(null)
    setFormData({
      category: 'platform_usage',
      message: '',
      emoji: '💡',
      active: true
    })
    setShowModal(true)
  }

  function openEditModal(tip) {
    setEditingTip(tip)
    setFormData({
      category: tip.category,
      message: tip.message,
      emoji: tip.emoji || '💡',
      active: tip.active
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.message.trim()) {
      alert('Por favor ingresa un mensaje')
      return
    }

    try {
      const data = {
        category: formData.category,
        message: formData.message.trim(),
        emoji: formData.emoji || null,
        active: formData.active
      }

      if (editingTip) {
        await updateTip(editingTip.id, data)
        alert('✅ Tip actualizado')
      } else {
        await createTip(data)
        alert('✅ Tip creado')
      }

      setShowModal(false)
      loadTips()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function handleToggleActive(tip) {
    try {
      await updateTip(tip.id, { active: !tip.active })
      loadTips()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function handleDelete(tip) {
    if (!confirm(`¿Eliminar este tip?\n\n"${tip.message}"`)) return

    try {
      await deleteTip(tip.id)
      alert('✅ Tip eliminado')
      loadTips()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <Loader />
      </div>
    )
  }

  const activeTips = tips.filter(t => t.active)
  const inactiveTips = tips.filter(t => !t.active)

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
            🌱 Tips de Green Market
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
            Gestiona los mensajes que Green Market muestra a los usuarios
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="button"
          style={{ minWidth: '140px' }}
        >
          <span>➕</span>
          <span>Nuevo Tip</span>
        </button>
      </div>

      {/* Filtros de categoría */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setCategoryFilter(null)}
          className="button button-sm"
          style={{
            background: categoryFilter === null ? 'var(--kivi-green)' : 'transparent',
            color: categoryFilter === null ? '#fff' : 'var(--kivi-text)',
            border: categoryFilter === null ? 'none' : '1px solid #e1e7e1'
          }}
        >
          Todas las categorías
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className="button button-sm"
            style={{
              background: categoryFilter === cat.value ? 'var(--kivi-green)' : 'transparent',
              color: categoryFilter === cat.value ? '#fff' : 'var(--kivi-text)',
              border: categoryFilter === cat.value ? 'none' : '1px solid #e1e7e1'
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Tips Activos */}
      {activeTips.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#4caf50'
          }}>
            ✅ Tips Activos ({activeTips.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {activeTips.map(tip => (
              <TipCard
                key={tip.id}
                tip={tip}
                onEdit={() => openEditModal(tip)}
                onToggle={() => handleToggleActive(tip)}
                onDelete={() => handleDelete(tip)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips Inactivos */}
      {inactiveTips.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#999'
          }}>
            🚫 Tips Inactivos ({inactiveTips.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {inactiveTips.map(tip => (
              <TipCard
                key={tip.id}
                tip={tip}
                onEdit={() => openEditModal(tip)}
                onToggle={() => handleToggleActive(tip)}
                onDelete={() => handleDelete(tip)}
              />
            ))}
          </div>
        </div>
      )}

      {tips.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐕</div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            No hay tips
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Crea el primer tip para Green Market
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700 }}>
              {editingTip ? '✏️ Editar Tip' : '➕ Nuevo Tip'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Categoría *</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Mensaje *</label>
                <textarea
                  className="input"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Escribe el consejo o mensaje que Green Market mostrará a los usuarios..."
                  rows={4}
                  required
                  style={{ resize: 'vertical' }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {formData.message.length} caracteres
                </div>
              </div>

              <div>
                <label className="label">Emoji (opcional)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="💡"
                  maxLength={10}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="active-checkbox" style={{ fontSize: '14px', cursor: 'pointer' }}>
                  Tip activo (se mostrará a los usuarios)
                </label>
              </div>

              {/* Preview */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                borderRadius: '12px',
                border: '2px solid #4caf50'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
                  Vista Previa:
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ fontSize: '32px' }}>🐕</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      background: '#fff',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: 1.6
                    }}>
                      {formData.emoji && <span style={{ marginRight: '8px' }}>{formData.emoji}</span>}
                      {formData.message || 'Tu mensaje aparecerá aquí...'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button ghost"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button"
                  style={{ flex: 1 }}
                >
                  {editingTip ? '💾 Actualizar' : '➕ Crear'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

function TipCard({ tip, onEdit, onToggle, onDelete }) {
  const category = CATEGORIES.find(c => c.value === tip.category)

  return (
    <div className="card" style={{
      padding: '16px',
      background: tip.active ? '#fff' : '#f5f5f5',
      opacity: tip.active ? 1 : 0.7
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: category ? '#e8f5e9' : '#f5f5f5',
            color: '#4caf50',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '12px'
          }}>
            {category ? `${category.emoji} ${category.label}` : tip.category}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            {tip.emoji && (
              <div style={{ fontSize: '24px', flexShrink: 0 }}>
                {tip.emoji}
              </div>
            )}
            <div style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'var(--kivi-text-dark)'
            }}>
              {tip.message}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onEdit}
            className="button button-sm ghost"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={onToggle}
            className="button button-sm ghost"
            title={tip.active ? 'Desactivar' : 'Activar'}
          >
            {tip.active ? '👁️' : '🚫'}
          </button>
          <button
            onClick={onDelete}
            className="button button-sm ghost"
            title="Eliminar"
            style={{ color: '#f44336' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

