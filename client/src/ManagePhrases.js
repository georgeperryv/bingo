import React, { useState, useEffect } from 'react'

function ManagePhrases ({ onGenerate }) {
  const [phrases, setPhrases] = useState([])
  const [newPhraseText, setNewPhraseText] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    loadPhrases()
  }, [])

  const loadPhrases = async () => {
    try {
      const res = await fetch('/api/phrases')
      if (!res.ok) throw new Error('Failed to fetch phrases')
      const data = await res.json()
      // We'll store a 'status' for each: 'in' | 'out' | 'maybe'
      // For new loaded phrases, default is 'maybe'
      const phrasesWithStatus = data.map(p => ({ ...p, status: 'maybe' }))
      setPhrases(phrasesWithStatus)
    } catch (error) {
      console.error(error)
      alert('Unable to load phrases.')
    }
  }

  // ---------- ADD -----------
  const addPhrase = async () => {
    if (!newPhraseText.trim()) {
      alert('Please enter a phrase.')
      return
    }
    try {
      const res = await fetch('/api/phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newPhraseText })
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(error)
        return
      }
      setNewPhraseText('')
      // reload from server
      await loadPhrases()
    } catch (error) {
      console.error(error)
      alert('Failed to add phrase.')
    }
  }

  // ---------- EDIT -----------
  const startEditing = phrase => {
    setEditId(phrase.id)
    setEditText(phrase.text)
  }

  const cancelEditing = () => {
    setEditId(null)
    setEditText('')
  }

  const saveEdit = async phraseId => {
    if (!editText.trim()) {
      alert('Phrase text cannot be empty.')
      return
    }
    try {
      const res = await fetch(`/api/phrases/${phraseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText })
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(error)
        return
      }
      setEditId(null)
      setEditText('')
      await loadPhrases()
    } catch (error) {
      console.error(error)
      alert('Failed to update phrase.')
    }
  }

  // ---------- DELETE -----------
  const deletePhrase = async phraseId => {
    if (!window.confirm('Are you sure you want to delete this phrase?')) return
    try {
      const res = await fetch(`/api/phrases/${phraseId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(error)
        return
      }
      await loadPhrases()
    } catch (error) {
      console.error(error)
      alert('Failed to delete phrase.')
    }
  }

  // ---------- STATUS CHECKBOXES -----------
  // If user clicks green => status='in', red => status='out'
  // Only one can be active; if green is clicked, red is unset, etc.
  const setStatus = (phraseId, newStatus) => {
    setPhrases(prev =>
      prev.map(p => {
        if (p.id === phraseId) {
          return { ...p, status: newStatus }
        }
        return p
      })
    )
  }

  // ---------- GENERATE BINGO CARD -----------
  const handleGenerateBingo = () => {
    // We'll gather phrases into 3 arrays:
    // "include" => text of phrases with status='in'
    // "exclude" => text of phrases with status='out'
    // "maybe"   => text of phrases with status='maybe'
    const include = phrases.filter(p => p.status === 'in').map(p => p.text)
    const exclude = phrases.filter(p => p.status === 'out').map(p => p.text)
    const maybe = phrases.filter(p => p.status === 'maybe').map(p => p.text)

    // Pass to parent to call the server
    onGenerate({ include, exclude, maybe })
  }

  return (
    <div className='manage-panel'>
      <h2>Manage Phrases</h2>

      {/* Add new phrase */}
      <div className='add-phrase-row'>
        <input
          type='text'
          placeholder='Enter a new phrase...'
          value={newPhraseText}
          onChange={e => setNewPhraseText(e.target.value)}
        />
        <button onClick={addPhrase}>Add</button>
      </div>

      <ul className='manage-phrase-list'>
        {phrases.map(phrase => {
          const isEditing = phrase.id === editId
          return (
            <li key={phrase.id} className='phrase-item-row'>
              {/* Checkboxes for in/out */}
              <input
                type='checkbox'
                // Green checkbox
                style={{ accentColor: 'green' }}
                checked={phrase.status === 'in'}
                onChange={() => {
                  if (phrase.status === 'in') {
                    // toggling off sets to 'maybe'
                    setStatus(phrase.id, 'maybe')
                  } else {
                    setStatus(phrase.id, 'in')
                  }
                }}
              />
              <input
                type='checkbox'
                // Red checkbox
                style={{ accentColor: 'red' }}
                checked={phrase.status === 'out'}
                onChange={() => {
                  if (phrase.status === 'out') {
                    // toggling off sets to 'maybe'
                    setStatus(phrase.id, 'maybe')
                  } else {
                    setStatus(phrase.id, 'out')
                  }
                }}
              />

              {/* Phrase text or input if editing */}
              {isEditing ? (
                <input
                  type='text'
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className='phrase-edit-input'
                />
              ) : (
                <span className='phrase-text'>{phrase.text}</span>
              )}

              {isEditing ? (
                <>
                  <button onClick={() => saveEdit(phrase.id)}>Save</button>
                  <button onClick={cancelEditing}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => startEditing(phrase)}>Edit</button>
                  <button onClick={() => deletePhrase(phrase.id)}>
                    Delete
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {/* Generate button */}
      <div style={{ textAlign: 'right', marginTop: '10px' }}>
        <button onClick={handleGenerateBingo}>Generate Bingo Card</button>
      </div>
    </div>
  )
}

export default ManagePhrases
