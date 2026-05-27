import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import RichPopover, { YouTubeIcon, InstagramIcon, LinkedInIcon } from './RichPopover'

// vitest globals are disabled, so Testing Library's auto-cleanup is not
// registered — unmount between tests so triggers don't accumulate.
afterEach(() => cleanup())

// jsdom lacks several browser APIs that motion (useReducedMotion) and Radix
// Popover (useSize) depend on — polyfill them so the component can mount.
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

function renderPopover(props = {}) {
  return render(
    <RichPopover
      trigger={<button type="button">open me</button>}
      title="My video"
      {...props}
    />
  )
}

function openPopover() {
  fireEvent.click(screen.getByText('open me'))
}

describe('RichPopover', () => {
  it('renders trigger element', () => {
    renderPopover()
    expect(screen.getByText('open me')).toBeInTheDocument()
  })

  it('opens popover on trigger click', () => {
    renderPopover({ description: 'a description' })
    expect(screen.queryByText('a description')).not.toBeInTheDocument()
    openPopover()
    expect(screen.getByText('a description')).toBeInTheDocument()
  })

  it('renders title in popover content', () => {
    renderPopover({ title: 'My video' })
    openPopover()
    expect(screen.getByText('My video')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    renderPopover({ description: 'Watch this clip' })
    openPopover()
    expect(screen.getByText('Watch this clip')).toBeInTheDocument()
  })

  it('renders meta badge when provided', () => {
    renderPopover({ meta: '0:00-2:15' })
    openPopover()
    expect(screen.getByText('0:00-2:15')).toBeInTheDocument()
  })

  it('renders action button when actionLabel provided', () => {
    renderPopover({ actionLabel: 'Watch video' })
    openPopover()
    expect(screen.getByText('Watch video')).toBeInTheDocument()
  })

  it('renders title as link when href provided', () => {
    renderPopover({ title: 'Linked title', href: 'https://example.com' })
    openPopover()
    const link = screen.getByRole('link', { name: /Linked title/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('does not render meta badge when meta is not provided', () => {
    renderPopover({ actionLabel: 'Watch video', meta: undefined })
    openPopover()
    expect(screen.queryByText('0:00-2:15')).not.toBeInTheDocument()
  })
})

describe('YouTubeIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<YouTubeIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    const { container } = render(<YouTubeIcon className="custom-icon" />)
    expect(container.querySelector('svg')).toHaveClass('custom-icon')
  })
})

describe('InstagramIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<InstagramIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('LinkedInIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<LinkedInIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
