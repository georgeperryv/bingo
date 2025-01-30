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
    res.json(phrases) // e.g. [{ id: 1, text: "..." }, ...]
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

/**
 * 5) Generate Bingo Card
 *    Receives:
 *    {
 *      "include": ["Forced phrase A", ...],
 *      "exclude": ["Forced out phrase B", ...],
 *      "maybe":   ["Maybe phrase C", ...]
 *    }
 *
 *    Must generate a 5x5 grid with:
 *      - All "include" phrases
 *      - Enough "maybe" phrases to reach total of 24 (center is FREE)
 *      - No "exclude" phrases
 */
app.post('/api/generate', (req, res) => {
  const { include, exclude, maybe } = req.body

  // Basic validation
  if (
    !Array.isArray(include) ||
    !Array.isArray(exclude) ||
    !Array.isArray(maybe)
  ) {
    return res.status(400).json({ error: 'Invalid request data.' })
  }

  // If too many forced includes
  if (include.length > 24) {
    return res
      .status(400)
      .json({ error: 'You have more than 24 forced-in phrases!' })
  }

  // We'll fill the card with all `include` + some from `maybe`.
  const forcedIn = [...include] // definitely in
  const forcedOut = [...exclude] // definitely not in
  const pool = [...maybe] // maybe pool

  // We want exactly 24 total (not counting the FREE center).
  // So we already have forcedIn.length. We need the difference from the maybe pool.
  const needed = 24 - forcedIn.length

  if (needed < 0) {
    return res
      .status(400)
      .json({ error: 'Too many forced-in phrases. Max is 24.' })
  }

  if (needed > pool.length) {
    return res.status(400).json({
      error: 'Not enough "maybe" phrases to fill the required 24.'
    })
  }

  // Shuffle the maybe pool
  shuffleArray(pool)

  // Select the needed portion from the maybe pool
  const selectedFromMaybe = pool.slice(0, needed)

  // Combine forcedIn + selectedFromMaybe
  const finalPhrases = [...forcedIn, ...selectedFromMaybe]

  // Now we have exactly 24 phrases in finalPhrases. Let's shuffle them for random placement
  shuffleArray(finalPhrases)

  // Construct the 5x5 grid with FREE in the center
  const bingoGrid = []
  let index = 0
  for (let row = 0; row < 5; row++) {
    const rowArray = []
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        // Center
        rowArray.push('FREE')
      } else {
        rowArray.push(finalPhrases[index])
        index++
      }
    }
    bingoGrid.push(rowArray)
  }

  return res.json({ bingoGrid })
})

// Helper: shuffle in-place
function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// 1) Serve static files from client/build
app.use(express.static(path.join(__dirname, 'client', 'build')))

// 2) Catch-all route: send index.html for any other request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
