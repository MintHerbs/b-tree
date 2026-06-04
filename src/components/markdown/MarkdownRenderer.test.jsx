import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import MarkdownRenderer from './MarkdownRenderer'

// vitest globals are disabled, so Testing Library's auto-cleanup is not
// registered — unmount between tests so DOM nodes don't accumulate.
afterEach(() => cleanup())

// jsdom lacks several browser APIs that motion (useReducedMotion) and Radix
// Popover (useSize) depend on — polyfill them so the SocialLink chip can mount.
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

const SOCIAL_TAG =
  '<SocialLink platform="youtube" href="https://youtu.be/x" title="My video" actionLabel="Watch video" />'

describe('MarkdownRenderer — Issue #16: SocialLink chips render inline', () => {
  it('does not wrap sentence text in block <p> elements around an inline chip', () => {
    // Regression for Issue #16: previously each text segment around the chip
    // was rendered in its own <ReactMarkdown>, producing block <p> paragraphs
    // that pushed the chip onto its own line.
    const { container } = render(
      <MarkdownRenderer content={`Check out this video ${SOCIAL_TAG} and subscribe.`} />
    )

    // The surrounding text must flow inline with the chip — no block paragraphs.
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('renders the surrounding text and the chip trigger together', () => {
    const { container, getByLabelText } = render(
      <MarkdownRenderer content={`Check out this video ${SOCIAL_TAG} and subscribe.`} />
    )

    expect(container.textContent).toContain('Check out this video')
    expect(container.textContent).toContain('and subscribe.')
    // The chip trigger button is present (aria-label is the link title).
    expect(getByLabelText('My video')).toBeInTheDocument()
  })

  it('keeps the chip and its adjacent text as inline-level siblings in one flow container', () => {
    const { container } = render(
      <MarkdownRenderer content={`before ${SOCIAL_TAG} after`} />
    )

    const flow = container.querySelector('div') // markdownContainer
    // No element is forced onto its own line by a block <p> wrapper.
    expect(flow.querySelector('p')).toBeNull()
    expect(flow.textContent).toContain('before')
    expect(flow.textContent).toContain('after')
  })

  it('still renders normal paragraphs as block <p> elements (no regression)', () => {
    const { container } = render(
      <MarkdownRenderer content={'First paragraph.\n\nSecond paragraph.'} />
    )
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0].textContent).toContain('First paragraph.')
    expect(paragraphs[1].textContent).toContain('Second paragraph.')
  })

  it('renders block content before a chip as a block, but the adjacent line inline', () => {
    const { container } = render(
      <MarkdownRenderer content={`Intro paragraph.\n\nWatch ${SOCIAL_TAG} now.`} />
    )
    const paragraphs = container.querySelectorAll('p')
    // Only the standalone intro paragraph stays a block <p>; the "Watch ... now."
    // line flows inline with the chip.
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].textContent).toContain('Intro paragraph.')
    expect(container.textContent).toContain('Watch')
    expect(container.textContent).toContain('now.')
  })
})
