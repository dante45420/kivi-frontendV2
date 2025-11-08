import React from 'react'

export default function FilterPopover({ categories, active, onSelect }) {
  return (
    <div className="card" style={{ padding: 12, width: 260 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => onSelect(null)} className={`button ${active === null ? '' : 'ghost'}`}>
          Todas
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => onSelect(cat.id)} className={`button ${active === cat.id ? '' : 'ghost'}`}>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
