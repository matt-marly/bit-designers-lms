export interface ReferenceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  duration: string;
  source: string;
}

export interface ReferenceGroup {
  id: string;
  label: string;
  description: string;
  items: ReferenceItem[];
}

export const mockReferenceGroups: ReferenceGroup[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    description: 'Bitcoin principles, mechanics, and context for designers.',
    items: [
      {
        id: 'ref-01',
        title: 'Bitcoin Explained \u2014 3Blue1Brown',
        description: 'The clearest visual explanation of how Bitcoin works mechanically.',
        url: 'https://youtube.com/watch?v=example1',
        type: 'video',
        duration: '26 min',
        source: 'YouTube',
      },
      {
        id: 'ref-02',
        title: 'Bitcoin in Africa \u2014 Anita Posch',
        description: 'Real usage stories from African Bitcoin users. Essential context for African designers.',
        url: 'https://youtube.com/watch?v=example2',
        type: 'video',
        duration: '42 min',
        source: 'YouTube',
      },
      {
        id: 'ref-03',
        title: 'Bitcoin Principles \u2014 Andreas Antonopoulos',
        description: 'Why Bitcoin matters and what makes it different. Principles over mechanics.',
        url: 'https://youtube.com/watch?v=example3',
        type: 'video',
        duration: '38 min',
        source: 'YouTube',
      },
    ],
  },
  {
    id: 'craft',
    label: 'Craft',
    description: 'Design tools, systems, and Bitcoin-specific design practice.',
    items: [
      {
        id: 'ref-04',
        title: 'Bitcoin Design Community \u2014 Design Review',
        description: 'Real Bitcoin product design critiques from the community.',
        url: 'https://youtube.com/watch?v=example4',
        type: 'video',
        duration: '55 min',
        source: 'YouTube',
      },
      {
        id: 'ref-05',
        title: 'Bitcoin UI Kit Walkthrough',
        description: 'How to use the Bitcoin UI Kit in Figma for real product work.',
        url: 'https://youtube.com/watch?v=example5',
        type: 'video',
        duration: '22 min',
        source: 'YouTube',
      },
      {
        id: 'ref-06',
        title: 'Designing for the Next Billion Users',
        description: 'Google talk on designing for emerging market users \u2014 directly applicable.',
        url: 'https://youtube.com/watch?v=example6',
        type: 'video',
        duration: '34 min',
        source: 'YouTube',
      },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    description: 'User research methods and evaluation techniques.',
    items: [
      {
        id: 'ref-07',
        title: 'Heuristic Evaluation Walkthrough',
        description: 'How to run a heuristic evaluation on a real product, step by step.',
        url: 'https://youtube.com/watch?v=example7',
        type: 'video',
        duration: '28 min',
        source: 'YouTube',
      },
      {
        id: 'ref-08',
        title: 'User Interview Techniques \u2014 Erika Hall',
        description: 'How to conduct user interviews that actually reveal useful insights.',
        url: 'https://youtube.com/watch?v=example8',
        type: 'video',
        duration: '45 min',
        source: 'YouTube',
      },
    ],
  },
  {
    id: 'contribution',
    label: 'Contribution',
    description: 'Open source contribution for designers.',
    items: [
      {
        id: 'ref-09',
        title: 'Bitcoin Design Community \u2014 Design Proposal Discussion',
        description: 'A real BDC call where a designer\'s proposal is reviewed by maintainers.',
        url: 'https://youtube.com/watch?v=example9',
        type: 'video',
        duration: '60 min',
        source: 'YouTube',
      },
      {
        id: 'ref-10',
        title: 'First-Time OSS Contribution Story',
        description: 'A designer walks through their first open source contribution end to end.',
        url: 'https://youtube.com/watch?v=example10',
        type: 'video',
        duration: '18 min',
        source: 'YouTube',
      },
    ],
  },
];
