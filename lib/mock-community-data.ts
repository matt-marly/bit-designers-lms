export interface Member {
  id: string;
  name: string;
  role: string;
  track: string;
  cohort: string;
  location: string;
  bio: string;
  avatar: string | null;
  initials: string;
  portfolioUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  skills: string[];
  status: string;
  isCurrentUser: boolean;
}

export interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  track: string;
  missionSlug: string;
  figmaUrl: string;
  submittedAt: string;
  tags: string[];
}

export const mockMembers: Member[] = [
  {
    id: 'mem-01',
    name: 'Amara Okonkwo',
    role: 'Product Designer',
    track: 'Design Lab',
    cohort: 'Cohort 01',
    location: 'Lagos, Nigeria',
    bio: 'Product designer with 4 years experience. Passionate about financial inclusion and Bitcoin UX.',
    avatar: null,
    initials: 'AO',
    portfolioUrl: 'https://example.com/amara',
    githubUrl: 'https://github.com/amara',
    twitterUrl: 'https://twitter.com/amara',
    skills: ['Product Design', 'UX Research', 'Figma'],
    status: 'active',
    isCurrentUser: true,
  },
  {
    id: 'mem-02',
    name: 'Kwame Asante',
    role: 'UX Designer',
    track: 'Design Lab',
    cohort: 'Cohort 01',
    location: 'Accra, Ghana',
    bio: 'UX designer focused on mobile-first experiences for emerging markets.',
    avatar: null,
    initials: 'KA',
    portfolioUrl: 'https://example.com/kwame',
    githubUrl: 'https://github.com/kwame',
    twitterUrl: null,
    skills: ['UX Design', 'Mobile', 'User Research'],
    status: 'active',
    isCurrentUser: false,
  },
  {
    id: 'mem-03',
    name: 'Zainab Musa',
    role: 'Visual Designer',
    track: 'Open Source Lab',
    cohort: 'Cohort 01',
    location: 'Abuja, Nigeria',
    bio: 'Visual designer and illustrator. Exploring Bitcoin through the lens of African aesthetics.',
    avatar: null,
    initials: 'ZM',
    portfolioUrl: 'https://example.com/zainab',
    githubUrl: 'https://github.com/zainab',
    twitterUrl: 'https://twitter.com/zainab',
    skills: ['Visual Design', 'Illustration', 'Brand'],
    status: 'active',
    isCurrentUser: false,
  },
  {
    id: 'mem-04',
    name: 'Emeka Chukwu',
    role: 'Product Designer',
    track: 'Design Lab',
    cohort: 'Cohort 01',
    location: 'Enugu, Nigeria',
    bio: 'Building products that work for everyday Nigerians. Bitcoin is the next frontier.',
    avatar: null,
    initials: 'EC',
    portfolioUrl: null,
    githubUrl: 'https://github.com/emeka',
    twitterUrl: null,
    skills: ['Product Design', 'Prototyping', 'Design Systems'],
    status: 'active',
    isCurrentUser: false,
  },
  {
    id: 'mem-05',
    name: 'Fatima Al-Hassan',
    role: 'UX Researcher',
    track: 'Open Source Lab',
    cohort: 'Cohort 01',
    location: 'Kano, Nigeria',
    bio: 'UX researcher specializing in financial technology adoption in Northern Nigeria.',
    avatar: null,
    initials: 'FA',
    portfolioUrl: 'https://example.com/fatima',
    githubUrl: 'https://github.com/fatima',
    twitterUrl: 'https://twitter.com/fatima',
    skills: ['UX Research', 'Qualitative Research', 'Bitcoin'],
    status: 'active',
    isCurrentUser: false,
  },
  {
    id: 'mem-06',
    name: 'Chioma Eze',
    role: 'UI Designer',
    track: 'Design Lab',
    cohort: 'Cohort 01',
    location: 'Port Harcourt, Nigeria',
    bio: 'UI designer with a background in graphic design. Learning Bitcoin one block at a time.',
    avatar: null,
    initials: 'CE',
    portfolioUrl: 'https://example.com/chioma',
    githubUrl: null,
    twitterUrl: 'https://twitter.com/chioma',
    skills: ['UI Design', 'Visual Design', 'Figma'],
    status: 'active',
    isCurrentUser: false,
  },
  {
    id: 'mem-07',
    name: 'Adeyemi Matthew',
    role: 'Bitcoin Designer',
    track: 'Design Lab',
    cohort: 'Cohort 01',
    location: 'Lagos, Nigeria',
    bio: 'Founder of BitDesigners Africa. Helping African designers contribute to Bitcoin.',
    avatar: null,
    initials: 'AM',
    portfolioUrl: 'https://example.com/adeyemi',
    githubUrl: 'https://github.com/adeyemi',
    twitterUrl: 'https://twitter.com/adeyemi',
    skills: ['Product Design', 'Bitcoin', 'Education'],
    status: 'mentor',
    isCurrentUser: false,
  },
];

export const mockShowcaseItems: ShowcaseItem[] = [
  {
    id: 'show-01',
    title: 'Bitcoin Wallet UX Audit',
    description: 'Comprehensive UX audit of three leading Bitcoin wallets with actionable recommendations.',
    author: 'Amara Okonkwo',
    authorId: 'mem-01',
    track: 'Design Lab',
    missionSlug: 'bitcoin-ux-audit-wallets',
    figmaUrl: 'https://figma.com/file/example1',
    submittedAt: '2025-07-10',
    tags: ['UX Audit', 'Wallets', 'Research'],
  },
  {
    id: 'show-02',
    title: 'Bitcoin Mental Models Map',
    description: 'Visual map of how different African user types think about money and Bitcoin.',
    author: 'Kwame Asante',
    authorId: 'mem-02',
    track: 'Design Lab',
    missionSlug: 'bitcoin-mental-models',
    figmaUrl: 'https://figma.com/file/example2',
    submittedAt: '2025-07-08',
    tags: ['Research', 'Mental Models', 'Africa'],
  },
  {
    id: 'show-03',
    title: 'Bitcoin Onboarding Redesign',
    description: 'Complete onboarding flow redesign for a Bitcoin wallet targeting first-time users.',
    author: 'Zainab Musa',
    authorId: 'mem-03',
    track: 'Open Source Lab',
    missionSlug: 'bitcoin-onboarding-flow',
    figmaUrl: 'https://figma.com/file/example3',
    submittedAt: '2025-07-09',
    tags: ['Onboarding', 'Mobile', 'Prototype'],
  },
];
