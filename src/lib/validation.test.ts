import { describe, expect, it } from 'vitest'
import { filterNoticings, inferTimeOfDay, normalizeTag, validateBulkImages, validateFiles } from './validation'

describe('upload validation', () => {
  it('rejects mixed image and video uploads', () => { const files = [new File(['x'], 'one.jpg', { type: 'image/jpeg' }), new File(['x'], 'one.mp4', { type: 'video/mp4' })]; expect(validateFiles(files)).toContain('Choose several images or one video, not both.') })
  it('rejects unsupported types', () => expect(validateFiles([new File(['x'], 'bad.exe', { type: 'application/octet-stream' })])[0]).toContain('not a supported'))
  it('accepts a batch of separate images', () => expect(validateBulkImages([new File(['x'], 'one.jpg', { type: 'image/jpeg' }), new File(['x'], 'two.png', { type: 'image/png' })])).toEqual([]))
  it('rejects video in the photo inbox', () => expect(validateBulkImages([new File(['x'], 'one.mp4', { type: 'video/mp4' })])[0]).toContain('not a supported image'))
})
describe('search and tags', () => {
  const items = [{ title: 'Morning web', observation_text: 'Sun touched it', tags: [{ name: 'mist' }] }, { title: 'Moon', observation_text: 'Still water', tags: [] }]
  it('normalizes tags', () => expect(normalizeTag(' Spider Web! ')).toBe('spider-web'))
  it('filters title, observation and tags', () => { expect(filterNoticings(items, 'mist')).toHaveLength(1); expect(filterNoticings(items, 'water')[0].title).toBe('Moon') })
})
describe('time of day', () => {
  it('derives a useful label from the local capture time', () => {
    expect(inferTimeOfDay('2026-05-28T06:15')).toBe('early morning')
    expect(inferTimeOfDay('2026-05-28T12:21')).toBe('midday')
    expect(inferTimeOfDay('2026-05-28T19:30')).toBe('evening')
  })
  it('leaves an unknown capture time empty', () => expect(inferTimeOfDay('')).toBe(''))
})
