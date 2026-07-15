export interface Material {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  url: string;
  type: string;
}

export interface MaterialGroup {
  id: string;
  label: string;
  description: string;
  materials: Material[];
}

export const mockMaterialGroups: MaterialGroup[] = [
  {
    id: 'core',
    label: 'Core',
    description: 'Start here. Program essentials every cohort member needs.',
    materials: [
      {
        slug: 'onboarding',
        title: 'Onboarding',
        description: 'Pre-work checklist, channels, expectations, and how gates work.',
        readTime: '10 min',
        url: 'https://notion.so/placeholder-onboarding',
        type: 'doc',
      },
      {
        slug: 'program-guide',
        title: 'Program Guide',
        description: 'The full 9-week week-by-week guide. Start here.',
        readTime: '30 min',
        url: 'https://notion.so/placeholder-program-guide',
        type: 'doc',
      },
      {
        slug: 'bitcoin-fundamentals-reader',
        title: 'Bitcoin Fundamentals Reader',
        description: 'Principles, mechanics, ecosystem map with glossary. Three parts.',
        readTime: '60 min',
        url: 'https://notion.so/placeholder-bitcoin-fundamentals',
        type: 'doc',
      },
      {
        slug: 'wallet-lab-guide',
        title: 'Wallet Lab Guide',
        description: 'The Lesson 2 lab, step by step, with safety rules.',
        readTime: '15 min',
        url: 'https://notion.so/placeholder-wallet-lab',
        type: 'doc',
      },
    ],
  },
  {
    id: 'craft',
    label: 'Craft',
    description: 'Design tools, frameworks, and project briefs.',
    materials: [
      {
        slug: 'flow-redesign-brief',
        title: 'Flow Redesign Project Brief',
        description: 'Scope, options, rubric, and critique format.',
        readTime: '10 min',
        url: 'https://notion.so/placeholder-flow-redesign',
        type: 'doc',
      },
      {
        slug: 'ui-kit-figma-setup',
        title: 'UI Kit & Figma Setup',
        description: 'Cohort file conventions and Bitcoin UI Kit usage.',
        readTime: '15 min',
        url: 'https://notion.so/placeholder-figma-setup',
        type: 'doc',
      },
      {
        slug: 'designing-for-african-user',
        title: 'Designing for the African User',
        description: 'Our flagship original module. Also a public org asset.',
        readTime: '30 min',
        url: 'https://notion.so/placeholder-african-user',
        type: 'doc',
      },
      {
        slug: 'design-guide-companion',
        title: 'Design Guide Companion',
        description: 'How we use bitcoin.design and which chapters map to which lessons.',
        readTime: '10 min',
        url: 'https://notion.so/placeholder-design-guide',
        type: 'doc',
      },
    ],
  },
  {
    id: 'research-contribute',
    label: 'Research & Contribute',
    description: 'Tools and frameworks for research, audits, and open source contribution.',
    materials: [
      {
        slug: 'audit-rubric-templates',
        title: 'Audit Rubric & Templates',
        description: 'Rubric, report template, and publishing checklist.',
        readTime: '15 min',
        url: 'https://notion.so/placeholder-audit-rubric',
        type: 'doc',
      },
      {
        slug: 'research-ethics-consent',
        title: 'Research Ethics & Consent Kit',
        description: 'Consent script, anonymization rules, interview and test templates.',
        readTime: '10 min',
        url: 'https://notion.so/placeholder-research-ethics',
        type: 'doc',
      },
      {
        slug: 'github-for-designers',
        title: 'GitHub for Designers',
        description: 'Just enough Git and GitHub to contribute design. Nothing more.',
        readTime: '20 min',
        url: 'https://notion.so/placeholder-github',
        type: 'doc',
      },
      {
        slug: 'contribution-playbook',
        title: 'Contribution Playbook',
        description: 'Good-first-design-issues list, proposal templates, annotated example threads, case study template.',
        readTime: '20 min',
        url: 'https://notion.so/placeholder-contribution',
        type: 'doc',
      },
    ],
  },
];
