const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs-extra')
const path = require('path')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Utility: load/save phrases from JSON file
function loadPhrases () {
  const data = fs.readFileSync(path.join(__dirname, 'phrases.json'), 'utf8')
  return JSON.parse(data)
}

function savePhrases (phrases) {
  fs.writeFileSync(
    path.join(__dirname, 'phrases.json'),
    JSON.stringify(phrases, null, 2),
    'utf8'
  )
}

// 1) Get All Phrases
app.get('/api/phrases', (req, res) => {
  try {
    const phrases = loadPhrases()
    res.json(phrases)
  } catch (error) {
    console.error('Failed to load phrases:', error)
    res.status(500).json({ error: 'Unable to load phrases' })
  }
})

// 2) Add a New Phrase
app.post('/api/phrases', (req, res) => {
  const { text } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Phrase text is required.' })
  }

  try {
    const phrases = loadPhrases()
    const newId =
      phrases.length > 0 ? Math.max(...phrases.map(p => p.id)) + 1 : 1
    const newPhrase = { id: newId, text: text.trim() }
    phrases.push(newPhrase)
    savePhrases(phrases)
    res.status(201).json(newPhrase)
  } catch (error) {
    console.error('Failed to add phrase:', error)
    res.status(500).json({ error: 'Unable to add phrase' })
  }
})

// 3) Edit an Existing Phrase
app.put('/api/phrases/:id', (req, res) => {
  const phraseId = parseInt(req.params.id, 10)
  const { text } = req.body

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Phrase text is required.' })
  }

  try {
    const phrases = loadPhrases()
    const index = phrases.findIndex(p => p.id === phraseId)
    if (index === -1) {
      return res.status(404).json({ error: 'Phrase not found.' })
    }

    phrases[index].text = text.trim()
    savePhrases(phrases)
    res.json(phrases[index])
  } catch (error) {
    console.error('Failed to edit phrase:', error)
    res.status(500).json({ error: 'Unable to edit phrase' })
  }
})

// 4) Delete a Phrase
app.delete('/api/phrases/:id', (req, res) => {
  const phraseId = parseInt(req.params.id, 10)
  try {
    const phrases = loadPhrases()
    const filtered = phrases.filter(p => p.id !== phraseId)
    if (filtered.length === phrases.length) {
      return res.status(404).json({ error: 'Phrase not found.' })
    }
    savePhrases(filtered)
    res.json({ message: 'Phrase deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete phrase:', error)
    res.status(500).json({ error: 'Unable to delete phrase' })
  }
})

// 5) Generate Bingo Card from 24 selected phrases
app.post('/api/generate', (req, res) => {
  const { selectedPhrases } = req.body // array of EXACTLY 24 strings
  if (!Array.isArray(selectedPhrases) || selectedPhrases.length !== 24) {
    return res
      .status(400)
      .json({ error: 'Exactly 24 phrases must be selected.' })
  }

  // Shuffle selected phrases
  const shuffled = shuffleArray(selectedPhrases)

  // Build 5x5 with "FREE" in center
  const bingoGrid = []
  let index = 0
  for (let row = 0; row < 5; row++) {
    const rowArray = []
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        rowArray.push('FREE')
      } else {
        rowArray.push(shuffled[index])
        index++
      }
    }
    bingoGrid.push(rowArray)
  }

  return res.json({ bingoGrid })
})

// Helper: shuffle array
function shuffleArray (array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Start server
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
