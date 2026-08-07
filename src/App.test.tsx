import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
vi.mock('./AuthContext', () => ({ useAuth: () => ({ session: null, loading: false }) }))
describe('route protection', () => { it('redirects anonymous visitors to login', () => { render(<MemoryRouter initialEntries={['/library']}><App/></MemoryRouter>); expect(screen.getByRole('heading', { name: /quiet place/i })).toBeInTheDocument() }) })
