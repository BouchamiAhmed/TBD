import { Slide } from '../types';

export const presentationSlides: Slide[] = [
  {
    id: 1,
    type: 'title',
    title: 'End of Day Report',
    subtitle: 'Daily Progress & Key Achievements • Team Performance Review',
  },
  {
    id: 2,
    type: 'content',
    title: 'Today\'s Accomplishments',
    content: 'Key milestones and achievements from today\'s work session',
    points: [
      'Completed user authentication system with secure token management',
      'Implemented responsive dashboard with real-time data updates',
      'Fixed critical performance issues reducing load time by 60%',
      'Conducted code review and merged 5 pull requests',
      'Updated documentation and deployed to staging environment',
      'Collaborated with design team on new feature specifications'
    ]
  },
  {
    id: 3,
    type: 'stats',
    title: 'Performance Metrics',
    stats: [
      { label: 'Tasks Completed', value: '12', change: '+3 from yesterday' },
      { label: 'Code Coverage', value: '94%', change: '+2% improvement' },
      { label: 'Bug Reports', value: '2', change: '-5 from yesterday' },
    ]
  },
  {
    id: 4,
    type: 'image',
    title: 'Project Timeline',
    content: 'Current progress visualization showing completed milestones and upcoming deliverables.',
    image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: 5,
    type: 'content',
    title: 'Challenges & Solutions',
    content: 'Issues encountered today and how we resolved them',
    points: [
      'Database connection timeout - Implemented connection pooling',
      'Mobile responsiveness issues - Updated CSS grid and flexbox',
      'API rate limiting - Added request caching and queuing system',
      'Team coordination - Established daily standup schedule'
    ]
  },
  {
    id: 6,
    type: 'content',
    title: 'Tomorrow\'s Priorities',
    content: 'Action items and focus areas for the next work session',
    points: [
      'Begin integration testing for payment processing module',
      'Complete user onboarding flow wireframes',
      'Optimize database queries for improved performance',
      'Prepare presentation for client demo meeting',
      'Review security audit recommendations',
      'Update project timeline and resource allocation'
    ]
  },
    {
    id: 7,
    type: 'content',
    title: 'Tomorrow\'s Priorities',
    content: 'Action items and focus areas for the next work session',
    points: [
      'Begin integration testing for payment processing module',
      'Complete user onboarding flow wireframes',
      'Optimize database queries for improved performance',
      'Prepare presentation for client demo meeting',
      'Review security audit recommendations',
      'Update project timeline and resource allocation'
    ]
  },
  {
    id: 8,
    type: 'closing',
    title: 'Session Complete',
    subtitle: 'Great progress today! Ready for tomorrow\'s challenges.',
  }
  
];