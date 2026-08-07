import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChokoVisionPanel } from './ChokoVisionPanel'
vi.mock('../lib/choko-ai', () => ({ analyzeNoticing: vi.fn(async () => { throw new Error('Provider unavailable') }), latestGeneration: () => undefined, latestRevision: () => undefined, saveEditorialRevision: vi.fn() }))
describe('Choko Vision states', () => { it('shows a visible AI error and preserves manual control', async () => { render(<ChokoVisionPanel noticingId="n-1" userId="u-1"/>); fireEvent.click(screen.getByRole('button', { name: /let choko notice/i })); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Provider unavailable')); expect(screen.getByText(/your noticing was not changed/i)).toBeInTheDocument() }) })
