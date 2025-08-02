import { parseCarouselCards } from '@/app/global_components'

describe('Response Format Detection', () => {
  const testCases = {
    carouselSteps: {
      input: `**public-doc**:
Based on the applicable law, here are the steps to file a complaint:

:::carousel
card: Step 1: Document the Issue
content: Keep detailed records of the incident including dates, times, and any witnesses.
icon: 📝
---
card: Step 2: Internal Complaint
content: File a formal complaint with your employer's HR department.
icon: 📋
---
card: Step 3: External Complaint
content: If internal resolution fails, contact the provincial labor board.
icon: ⚖️
action: Learn More | https://example.com/complaint-process
:::

[Found: Yes]`,
      expectedFormat: 'carousel',
      expectedCards: 3
    },

    carouselOptions: {
      input: `**public-doc**:
Based on the applicable law, here are your leave options:

:::carousel
card: Sick Leave
content: Up to 5 days per year for personal illness or injury
icon: 🏥
---
card: Vacation Leave
content: Minimum 2 weeks per year, increases with tenure
icon: 🏖️
---
card: Parental Leave
content: Up to 63 weeks for new parents
icon: 👶
action: Apply Now | https://example.com/parental-leave
:::

[Found: Yes]`,
      expectedFormat: 'carousel',
      expectedCards: 3
    },

    // TABLE FORMAT - Lists that become tables
    tableList: {
      input: `**public-doc**:
Based on the applicable law, overtime rates are:

- Regular overtime (1.5x): First 8 hours beyond standard work week
- Double time (2x): Work on statutory holidays
- Time and a half: Work beyond 44 hours per week
- Compensatory time: May be offered instead of overtime pay
- Manager approval: Required for all overtime work

[Found: Yes]`,
      expectedFormat: 'table',
      expectedRows: 5
    },

    // REGULAR TEXT - Simple answers
    regularText: {
      input: `**public-doc**:
Based on the applicable law, the minimum wage in Ontario is $16.55 per hour as of October 2023. This applies to most employees, with some exceptions for students and liquor servers.

[Found: Yes]`,
      expectedFormat: 'text',
      expectedParagraphs: 1
    },

    // MIXED FORMAT - Carousel followed by list
    mixedFormat: {
      input: `**public-doc**:
Based on the applicable law, here's how to report workplace safety issues:

:::carousel
card: Identify the Hazard
content: Document the safety concern with photos and detailed notes
icon: ⚠️
---
card: Report to Supervisor
content: Notify your immediate supervisor in writing within 24 hours
icon: 📢
---
card: File with Safety Board
content: If unresolved, submit formal complaint to provincial safety authority
icon: 🏛️
:::

Additional requirements:
- Keep copies of all documentation
- Follow up within 5 business days
- Seek union representation if available

[Found: Yes]`,
      expectedFormat: 'mixed',
      expectedCards: 3,
      expectedListItems: 3
    }
  }

  describe('Format Detection Logic', () => {
    it('should detect carousel format from ::: markers', () => {
      const carouselRegex = /:::carousel[\s\S]*?:::/
      
      expect(carouselRegex.test(testCases.carouselSteps.input)).toBe(true)
      expect(carouselRegex.test(testCases.carouselOptions.input)).toBe(true)
      expect(carouselRegex.test(testCases.tableList.input)).toBe(false)
      expect(carouselRegex.test(testCases.regularText.input)).toBe(false)
    })

    it('should detect list format from markdown lists', () => {
      const listRegex = /^- .+$/m
      
      expect(listRegex.test(testCases.tableList.input)).toBe(true)
      expect(listRegex.test(testCases.mixedFormat.input)).toBe(true)
      expect(listRegex.test(testCases.carouselSteps.input)).toBe(false)
      expect(listRegex.test(testCases.regularText.input)).toBe(false)
    })
  })

  describe('Carousel Parsing', () => {
    it('should correctly parse carousel cards for steps', () => {
      const { cards } = parseCarouselCards(testCases.carouselSteps.input)
      
      expect(cards).toHaveLength(3)
      expect(cards[0].title).toBe('Step 1: Document the Issue')
      expect(cards[0].icon).toBe('📝')
      expect(cards[2].action).toEqual({
        text: 'Learn More',
        url: 'https://example.com/complaint-process'
      })
    })

    it('should correctly parse carousel cards for options', () => {
      const { cards } = parseCarouselCards(testCases.carouselOptions.input)
      
      expect(cards).toHaveLength(3)
      expect(cards[0].title).toBe('Sick Leave')
      expect(cards[1].title).toBe('Vacation Leave')
      expect(cards[2].title).toBe('Parental Leave')
    })

    it('should handle mixed format content', () => {
      const { cards, remainingContent } = parseCarouselCards(testCases.mixedFormat.input)
      
      expect(cards).toHaveLength(3)
      expect(remainingContent).toContain('Additional requirements:')
      expect(remainingContent).toContain('- Keep copies')
    })
  })

  describe('Content Type Detection Rules', () => {
    const detectContentType = (content: string): 'carousel' | 'table' | 'text' | 'mixed' => {
      const hasCarousel = /:::carousel[\s\S]*?:::/m.test(content)
      const hasList = /^- .+$/m.test(content)
      
      if (hasCarousel && hasList) return 'mixed'
      if (hasCarousel) return 'carousel'
      if (hasList) return 'table'
      return 'text'
    }

    it('should correctly identify content types', () => {
      expect(detectContentType(testCases.carouselSteps.input)).toBe('carousel')
      expect(detectContentType(testCases.tableList.input)).toBe('table')
      expect(detectContentType(testCases.regularText.input)).toBe('text')
      expect(detectContentType(testCases.mixedFormat.input)).toBe('mixed')
    })
  })

  describe('AI Prompt Trigger Detection', () => {
    const shouldUseCarousel = (question: string): boolean => {
      const carouselTriggers = [
        /steps?\s+to/i,
        /how\s+to/i,
        /process\s+for/i,
        /procedure\s+to/i,
        /what\s+are\s+my\s+options/i,
        /types?\s+of/i,
        /different\s+kinds/i,
        /compare/i,
        /difference\s+between/i
      ]
      
      return carouselTriggers.some(trigger => trigger.test(question))
    }

    it('should detect carousel-appropriate questions', () => {
      // Should trigger carousel
      expect(shouldUseCarousel('What are the steps to apply for leave?')).toBe(true)
      expect(shouldUseCarousel('How to file a complaint?')).toBe(true)
      expect(shouldUseCarousel('What is the process for getting promoted?')).toBe(true)
      expect(shouldUseCarousel('What are my options for resolving disputes?')).toBe(true)
      expect(shouldUseCarousel('Compare different types of leave')).toBe(true)
      
      // Should NOT trigger carousel
      expect(shouldUseCarousel('What is the minimum wage?')).toBe(false)
      expect(shouldUseCarousel('When does overtime apply?')).toBe(false)
      expect(shouldUseCarousel('Is lunch break paid?')).toBe(false)
    })
  })
})

// Export helper functions for use in the application
export const formatDetectionHelpers = {
  detectContentType(content: string): 'carousel' | 'table' | 'text' | 'mixed' {
    const hasCarousel = /:::carousel[\s\S]*?:::/m.test(content)
    const hasList = /^- .+$/m.test(content)
    
    if (hasCarousel && hasList) return 'mixed'
    if (hasCarousel) return 'carousel'
    if (hasList) return 'table'
    return 'text'
  },

  shouldUseCarousel(question: string): boolean {
    const carouselTriggers = [
      /steps?\s+to/i,
      /how\s+to/i,
      /process\s+for/i,
      /procedure\s+to/i,
      /what\s+are\s+my\s+options/i,
      /types?\s+of/i,
      /different\s+kinds/i,
      /compare/i,
      /difference\s+between/i
    ]
    
    return carouselTriggers.some(trigger => trigger.test(question))
  },

  extractCarouselCards(content: string) {
    return parseCarouselCards(content)
  }
}