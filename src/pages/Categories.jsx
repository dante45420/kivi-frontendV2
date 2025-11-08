/**
 * Página: Categorías
 * Gestión de categorías de productos
 */
import { useState, useEffect } from 'react'
import { fetchCategories } from '../api/categories'
import Loader from '../components/Loader'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    emoji: '📦',
    order: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const data = await fetchCategories()
      setCategories(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('Error cargando categorías:', error)
      alert('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingCategory(null)
    setFormData({
      name: '',
      emoji: '📦',
      order: categories.length
    })
    setShowModal(true)
  }

  function openEditModal(category) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      emoji: category.emoji || '📦',
      order: category.order || 0
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('⚠️ El nombre es obligatorio')
      return
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('kivi_token')
      
      const url = editingCategory
        ? `${API_URL}/api/categories/${editingCategory.id}`
        : `${API_URL}/api/categories`
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Error al guardar categoría')

      await loadCategories()
      setShowModal(false)
      alert(editingCategory ? '✅ Categoría actualizada' : '✅ Categoría creada')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar categoría: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('kivi_token')

      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Error al eliminar categoría')

      await loadCategories()
      alert('✅ Categoría eliminada')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar categoría: ' + error.message)
    }
  }

  const emojiList = ['🥬', '🍎', '🥕', '🥩', '🧀', '🍞', '🥛', '🧊', '🧹', '📦', '🍋', '🥒', '🍌', '🍊', '🫐', '🍓', '🥔', '🧄', '🧅', '🌶️', '🥑', '🍅', '🥦', '🌽']

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <Loader />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>🏷️ Categorías</h2>
        <button className="button" onClick={openCreateModal}>
          + Nueva Categoría
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {categories.map((category) => (
          <div
            key={category.id}
            className="card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '40px' }}>
                {category.emoji || '📦'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                  {category.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                  Orden: {category.order}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="button button-sm"
                onClick={() => openEditModal(category)}
                style={{ flex: 1 }}
              >
                ✏️ Editar
              </button>
              <button
                className="button button-sm ghost"
                onClick={() => handleDelete(category.id)}
                style={{ flex: 1, color: '#d32f2f' }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
          <p style={{ fontSize: '18px', margin: 0 }}>
            No hay categorías creadas
          </p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
            Crea tu primera categoría para organizar los productos
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowModal(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              zIndex: 1001,
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              {editingCategory ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Verduras"
                    required
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Emoji
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
                    {emojiList.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, emoji })}
                        style={{
                          fontSize: '24px',
                          padding: '8px',
                          border: '2px solid',
                          borderColor: formData.emoji === emoji ? 'var(--kivi-green)' : '#e0e0e0',
                          borderRadius: '8px',
                          background: formData.emoji === emoji ? '#f0f9f0' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Orden (para mostrar en el catálogo)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                  <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                    Las categorías se ordenan de menor a mayor
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button ghost"
                  style={{ minWidth: '100px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button"
                  style={{ minWidth: '120px' }}
                >
                  {editingCategory ? '💾 Guardar' : '➕ Crear'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

