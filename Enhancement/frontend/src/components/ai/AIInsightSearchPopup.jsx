import { useRef, useState } from 'react'
import { LoaderCircle, MessageCircleMore, Sparkles } from 'lucide-react'
import { apiPath } from '../../utils/api.js'

const PRESET_QUESTIONS = [
  "What's been trending in leather sales lately?",
  'Which material is generating the most revenue?',
  'When do we see the most orders come in?',
  'How are accessory sales doing?',
  "What's changed compared to last quarter?",
]

export default function AIInsightSearchPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resultText, setResultText] = useState('')
  const [resultState, setResultState] = useState('idle')
  const requestIdRef = useRef(0)

  const handleQuestionClick = async (question) => {
    const currentRequestId = requestIdRef.current + 1
    requestIdRef.current = currentRequestId

    setIsOpen(true)
    setIsLoading(true)
    setResultText('')
    setResultState('loading')

    try {
      const response = await fetch(apiPath('/api/insights/search/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.detail || 'Request failed')
      }

      const nextText = payload?.results?.[0]?.text?.trim() || ''

      if (requestIdRef.current !== currentRequestId) return

      if (nextText) {
        setResultText(nextText)
        setResultState('success')
      } else {
        setResultText('No matching insight found.')
        setResultState('empty')
      }
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return
      setResultText('Something went wrong. Please try again.')
      setResultState('error')
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-outline-variant/70 bg-surface p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-on-surface">Ask about your sales data</p>
              <p className="mt-1 text-xs text-on-surface-variant">Pick a question to explore seeded insights.</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {PRESET_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleQuestionClick(question)}
                disabled={isLoading}
                className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-left text-sm text-on-surface transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {question}
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-[84px]">
            {resultState === 'loading' && (
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant/70 bg-surface-variant/40 p-3 text-sm text-on-surface-variant">
                <LoaderCircle size={16} className="animate-spin" />
                <span>Searching...</span>
              </div>
            )}

            {resultState === 'success' && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed text-on-surface shadow-sm">
                <p className="font-semibold text-primary">Insight</p>
                <p className="mt-1 text-sm text-on-surface">{resultText}</p>
              </div>
            )}

            {resultState === 'empty' && <p className="text-sm text-on-surface-variant">{resultText}</p>}

            {resultState === 'error' && <p className="text-sm text-error">{resultText}</p>}

            {resultState === 'idle' && (
              <div className="rounded-lg border border-dashed border-outline-variant/70 bg-surface-variant/30 p-3 text-sm text-on-surface-variant">
                Select a question to see a matching insight.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-lg transition-transform hover:scale-105"
        aria-label="Open AI insight search"
        aria-expanded={isOpen}
      >
        <MessageCircleMore size={24} />
      </button>
    </div>
  )
}
