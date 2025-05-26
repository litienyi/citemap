import { useState, useEffect } from 'react'
import './App.css'

const API_URL = 'http://localhost:3001'

function App() {
  const [inputText, setInputText] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyzeText = async (text) => {
    if (!text.trim()) {
      setAnalysis('')
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Analysis failed')
      }

      setAnalysis(data.analysis)
    } catch (error) {
      setError(error.message)
      console.error('Analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      analyzeText(inputText)
    }, 1000)

    return () => clearTimeout(debounceTimer)
  }, [inputText])

  return (
    <div className="app-container">
      <div className="panel left-panel">
        <textarea
          className="text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your text here for analysis..."
        />
      </div>
      <div className="panel">
        <div className="analysis-output">
          {isLoading ? (
            <div className="loading">Analyzing text...</div>
          ) : error ? (
            <div className="error">
              Error: {error}
              <br />
              <br />
              Please check that:
              <br />
              1. The backend server is running
              <br />
              2. Your Gemini API key is correctly set in the .env file
            </div>
          ) : (
            analysis
          )}
        </div>
      </div>
    </div>
  )
}

export default App
