import React, { useState, useEffect } from 'react'

function ManagePhrases ({ onGenerate }) {
  const [phrases, setPhrases] = useState([])
  const [newPhraseText, setNewPhraseText] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    loadPhrases()
  }, [])

  // Load from server, default each phrase's status to "maybe"
  const loadPhrases = async () => {
    try {
      const res = await fetch('/api/phrases')
      if (!res.ok) throw new Error('Failed to fetch phrases')
      const data = await res.json()
      const phrasesWithStatus = data.map(p => ({ ...p, status: 'maybe' }))
      setPhrases(phrasesWithStatus)
    } catch (error) {
      console.error(error)
      alert('Unable to load phrases.')
    }
  }

  // --- ADD NEW PHRASE ---
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
      await loadPhrases()
    } catch (error) {
      console.error(error)
      alert('Failed to add phrase.')
    }
  }

  // --- EDIT PHRASE ---
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

  // --- DELETE PHRASE ---
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

  // --- STATUS CHECKBOXES ---
  // "in" => green, "out" => red, "maybe" => neither
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

  // --- GENERATE BINGO CARD ---
  const handleGenerateBingo = () => {
    const include = phrases.filter(p => p.status === 'in').map(p => p.text)
    const exclude = phrases.filter(p => p.status === 'out').map(p => p.text)
    const maybe = phrases.filter(p => p.status === 'maybe').map(p => p.text)

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

      {/* Instructions */}
      <div className='phrase-explanation'>
        <em>
          Please check <strong>Include</strong> to ensure a phrase is included
          in the bingo card generation. Please choose <strong>Exclude</strong>{' '}
          to ensure it is not included. Any phrase with no check marks will be
          eligible for random selection.
        </em>
      </div>

      {/* Header row with an empty col-number so columns align */}
      <div className='phrase-header-row'>
        <span className='col-number'></span>
        <span className='col-include'>Include</span>
        <span className='col-exclude'>Exclude</span>
        <span className='col-phrase'>Phrase</span>
      </div>

      {/* List of phrases */}
      <div className='manage-phrase-list'>
        {phrases.map((phrase, index) => {
          const isEditing = phrase.id === editId

          return (
            <div key={phrase.id} className='phrase-item-row'>
              {/* Dynamic numbering: (index + 1). */}
              <span className='col-number'>{index + 1}.</span>

              {/* Green checkbox */}
              <span className='col-include'>
                <input
                  type='checkbox'
                  style={{ accentColor: 'green' }}
                  checked={phrase.status === 'in'}
                  onChange={() => {
                    if (phrase.status === 'in') {
                      setStatus(phrase.id, 'maybe')
                    } else {
                      setStatus(phrase.id, 'in')
                    }
                  }}
                />
              </span>

              {/* Red checkbox */}
              <span className='col-exclude'>
                <input
                  type='checkbox'
                  style={{ accentColor: 'red' }}
                  checked={phrase.status === 'out'}
                  onChange={() => {
                    if (phrase.status === 'out') {
                      setStatus(phrase.id, 'maybe')
                    } else {
                      setStatus(phrase.id, 'out')
                    }
                  }}
                />
              </span>

              {/* Phrase text left-aligned, Edit/Delete right-aligned */}
              <span className='col-phrase phrase-row-content'>
                {/* The text or input if editing */}
                <span className='phrase-left'>
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
                </span>

                {/* Buttons on the far right */}
                <span className='phrase-actions'>
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
                </span>
              </span>
            </div>
          )
        })}
      </div>

      {/* Generate button at bottom center */}
      <div className='generate-button-container'>
        <button onClick={handleGenerateBingo} className='generate-button'>
          Generate Bingo Card
        </button>
      </div>
    </div>
  )
}

export default ManagePhrases
