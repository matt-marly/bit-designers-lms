export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'guide' | 'research' | 'tool' | 'article';
  topics: string[];
  addedAt: string;
  source: string;
}

export const mockResources: Resource[] = [
  {
    id: 'res-01',
    title: 'Bitcoin Design Guide',
    description: 'The comprehensive open-source guide for designing Bitcoin products. Covers everything from onboarding to security.',
    url: 'https://bitcoin.design/guide',
    type: 'guide',
    topics: ['Bitcoin', 'UX', 'Design Systems'],
    addedAt: '2025-06-01',
    source: 'Bitcoin Design Community',
  },
  {
    id: 'res-02',
    title: 'Bitcoin UX Research Report 2024',
    description: 'User research findings from the Bitcoin Design Community covering wallet usability and onboarding friction.',
    url: 'https://bitcoin.design/research',
    type: 'research',
    topics: ['Research', 'UX', 'Wallets'],
    addedAt: '2025-06-05',
    source: 'Bitcoin Design Community',
  },
  {
    id: 'res-03',
    title: 'Figma Bitcoin UI Kit',
    description: 'Community-built Figma component library for Bitcoin interfaces. Includes wallet patterns, transaction flows, and icons.',
    url: 'https://figma.com/community',
    type: 'tool',
    topics: ['Figma', 'Design Systems', 'Components'],
    addedAt: '2025-06-10',
    source: 'Bitcoin Design Community',
  },
  {
    id: 'res-04',
    title: 'Bitcoin Wallet UX Teardown',
    description: 'In-depth analysis of leading Bitcoin wallet UX — what works, what fails, and why.',
    url: 'https://example.com/teardown',
    type: 'article',
    topics: ['UX', 'Wallets', 'Analysis'],
    addedAt: '2025-06-15',
    source: 'BitDesigners Africa',
  },
  {
    id: 'res-05',
    title: 'Lightning Network for Designers',
    description: 'A designer-friendly explainer of how the Lightning Network works and what it means for UX.',
    url: 'https://example.com/lightning',
    type: 'article',
    topics: ['Bitcoin', 'Lightning', 'UX'],
    addedAt: '2025-06-20',
    source: 'BitDesigners Africa',
  },
  {
    id: 'res-06',
    title: 'Bitcoin Accessibility Guidelines',
    description: 'Accessibility considerations specific to Bitcoin products — key generation, transaction signing, and more.',
    url: 'https://example.com/accessibility',
    type: 'guide',
    topics: ['Accessibility', 'Bitcoin', 'UX'],
    addedAt: '2025-06-25',
    source: 'Bitcoin Design Community',
  },
];
