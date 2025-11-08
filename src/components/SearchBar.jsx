import React from 'react'

export default function SearchBar({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
      <input
        type="text"
        className="input"
        placeholder="🔎 Buscar productos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1 }}
      />
    </div>
  )
}
