import React, { useState, useEffect } from 'react'

/**
 * ManagePhrases:
 * - Displays all phrases (fetched from server) in a single list
 *   with checkboxes, text, Edit, and Delete.
 * - Allows adding new phrases.
 * - Allows editing and deleting existing phrases.
 * - Tracks which phrases are selected (up to 24).
 * - Calls onGenerate(selectedPhrases) in App when user wants to generate the Bingo card.
 */
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
      // We'll enhance each phrase object with a 'selected' property (false by default)
      const phrasesWithSelected = data.map(p => ({ ...p, selected: false }))
      setPhrases(phrasesWithSelected)
    } catch (error) {
      console.error(error)
      alert('Unable to load phrases.')
    }
  }

  // ----------- Adding a new phrase -----------
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
      // phrase was successfully added, reload phrases from server
      setNewPhraseText('')
      await loadPhrases()
    } catch (error) {
      console.error(error)
      alert('Failed to add phrase.')
    }
  }

  // ----------- Editing an existing phrase -----------
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
      // success, reload phrases
      setEditId(null)
      setEditText('')
      await loadPhrases()
    } catch (error) {
      console.error(error)
      alert('Failed to update phrase.')
    }
  }

  // ----------- Deleting a phrase -----------
  const deletePhrase = async phraseId => {
    const confirmDel = window.confirm(
      'Are you sure you want to delete this phrase?'
    )
    if (!confirmDel) return

    try {
      const res = await fetch(`/api/phrases/${phraseId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const { error } = await res.json()
        alert(error)
        return
      }
      // success, reload
      await loadPhrases()
    } catch (error) {
      console.error(error)
      alert('Failed to delete phrase.')
    }
  }

  // ----------- Checkbox for selection -----------
  const toggleSelection = phraseId => {
    setPhrases(prev =>
      prev.map(p => {
        if (p.id === phraseId) {
          return { ...p, selected: !p.selected }
        }
        return p
      })
    )
  }

  // Count how many are selected
  const selectedCount = phrases.filter(p => p.selected).length

  // 24 is the required count for Bingo
  const canGenerate = selectedCount === 24

  // Prepare list of selected phrase TEXTS for the Bingo card
  const selectedPhrases = phrases.filter(p => p.selected).map(p => p.text)

  const handleGenerateBingo = () => {
    if (!canGenerate) {
      alert(
        'You must have exactly 24 selected phrases to generate a Bingo card!'
      )
      return
    }
    onGenerate(selectedPhrases)
  }

  return (
    <div className='manage-panel'>
      <h2>Manage &amp; Select Phrases</h2>

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

      {/* Display phrases with checkbox, text, Edit, Delete */}
      <ul className='manage-phrase-list'>
        {phrases.map(phrase => {
          const isEditing = phrase.id === editId
          return (
            <li key={phrase.id} className='phrase-item-row'>
              {/* Checkbox on the left */}
              <input
                type='checkbox'
                checked={phrase.selected}
                onChange={() => {
                  // If we already have 24 selected and this is an attempt to check the 25th,
                  // disallow it:
                  if (!phrase.selected && selectedCount >= 24) {
                    alert(
                      'You already have 24 phrases selected. Uncheck one before selecting a new one.'
                    )
                    return
                  }
                  toggleSelection(phrase.id)
                }}
              />

              {/* Phrase text or edit field */}
              {isEditing ? (
                <input
                  type='text'
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                />
              ) : (
                <span className='phrase-text'>{phrase.text}</span>
              )}

              {/* Edit/Save/Cancel/Delete buttons */}
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

      {/* Show how many selected, and a button to generate Bingo if exactly 24 */}
      <div className='selected-info'>
        <p>{selectedCount} selected (24 required)</p>
        <button onClick={handleGenerateBingo} disabled={!canGenerate}>
          Generate Bingo Card
        </button>
      </div>
    </div>
  )
}

export default ManagePhrases
