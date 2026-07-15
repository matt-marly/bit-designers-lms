export interface ReferenceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'article' | 'guide';
  topic: string;
  duration: string;
  source: string;
  free: boolean;
}

export const mockReferenceItems: ReferenceItem[] = [
  {
    id: 'ref-01',
    title: 'GitHub for Designers — Complete Guide',
    description: 'Learn how to use GitHub as a designer: repos, issues, pull requests, and contributing to open source.',
    url: 'https://youtube.com/watch?v=example1',
    type: 'video',
    topic: 'GitHub',
    duration: '24 min',
    source: 'YouTube',
    free: true,
  },
  {
    id: 'ref-02',
    title: 'Figma Auto Layout Masterclass',
    description: 'Complete guide to Figma auto layout — components, variants, and building scalable design systems.',
    url: 'https://youtube.com/watch?v=example2',
    type: 'video',
    topic: 'Figma',
    duration: '45 min',
    source: 'YouTube',
    free: true,
  },
  {
    id: 'ref-03',
    title: 'Getting Started with Claude for Designers',
    description: 'How to use Claude as a design thinking partner — prompting strategies, critique, and workflow integration.',
    url: 'https://youtube.com/watch?v=example3',
    type: 'video',
    topic: 'Claude',
    duration: '18 min',
    source: 'YouTube',
    free: true,
  },
  {
    id: 'ref-04',
    title: 'How to Write a GitHub Issue',
    description: 'Step-by-step guide to writing clear, actionable GitHub issues that maintainers will actually respond to.',
    url: 'https://docs.github.com/issues',
    type: 'article',
    topic: 'GitHub',
    duration: '8 min read',
    source: 'GitHub Docs',
    free: true,
  },
  {
    id: 'ref-05',
    title: 'Figma Variables and Design Tokens',
    description: 'Using Figma variables to build token-based design systems that connect to code.',
    url: 'https://youtube.com/watch?v=example5',
    type: 'video',
    topic: 'Figma',
    duration: '32 min',
    source: 'YouTube',
    free: true,
  },
  {
    id: 'ref-06',
    title: 'Open Source Contribution for Designers',
    description: 'How to find, evaluate, and contribute to open source projects as a designer.',
    url: 'https://example.com/oss-designers',
    type: 'article',
    topic: 'Open Source',
    duration: '12 min read',
    source: 'BitDesigners Africa',
    free: true,
  },
  {
    id: 'ref-07',
    title: 'Claude Code for Non-Developers',
    description: 'Using Claude Code to implement your own designs — a practical guide for designers who want to ship.',
    url: 'https://youtube.com/watch?v=example7',
    type: 'video',
    topic: 'Claude',
    duration: '28 min',
    source: 'YouTube',
    free: true,
  },
  {
    id: 'ref-08',
    title: 'UX Research Methods — Quick Reference',
    description: 'Overview of core UX research methods: interviews, usability testing, surveys, and card sorting.',
    url: 'https://example.com/ux-research',
    type: 'guide',
    topic: 'UX Research',
    duration: '15 min read',
    source: 'Nielsen Norman Group',
    free: true,
  },
  {
    id: 'ref-09',
    title: 'Bitcoin Whitepaper — Annotated for Designers',
    description: 'Satoshi\'s original Bitcoin whitepaper with designer-friendly annotations explaining key concepts.',
    url: 'https://example.com/whitepaper',
    type: 'article',
    topic: 'Bitcoin',
    duration: '20 min read',
    source: 'BitDesigners Africa',
    free: true,
  },
];
