// Type definitions for the Bihar Board Mock Test Management Portal

// Mock data for development
export const mockSubjects = [
  { id: '1', name: 'Mathematics', classLevel: '10' },
  { id: '2', name: 'Science', classLevel: '10' },
  { id: '3', name: 'English', classLevel: '10' },
  { id: '4', name: 'Physics', classLevel: '12' },
  { id: '5', name: 'Chemistry', classLevel: '12' },
  { id: '6', name: 'Biology', classLevel: '12' },
];

export const mockChapters = [
  { id: '1', name: 'Algebra', subjectId: '1' },
  { id: '2', name: 'Geometry', subjectId: '1' },
  { id: '3', name: 'Light', subjectId: '2' },
  { id: '4', name: 'Electricity', subjectId: '2' },
  { id: '5', name: 'Grammar', subjectId: '3' },
  { id: '6', name: 'Mechanics', subjectId: '4' },
  { id: '7', name: 'Organic Chemistry', subjectId: '5' },
  { id: '8', name: 'Cell Biology', subjectId: '6' },
];

export const mockQuestions = [
  {
    id: '1',
    questionText: 'What is the solution of x^2 - 4x + 4 = 0?',
    options: ['x = 2', 'x = -2', 'x = 0', 'x = 4'],
    correctOptionIndex: 0,
    explanation: 'This is a perfect square trinomial that can be factored as (x - 2)^2 = 0, so x = 2.',
    subjectId: '1',
    chapterId: '1',
  },
  {
    id: '2',
    questionText: 'What is the area of a circle with radius 7cm?',
    options: ['14π cm²', '49π cm²', '7π cm²', '21π cm²'],
    correctOptionIndex: 1,
    explanation: 'The area of a circle is πr², where r is the radius. So area = π × 7² = 49π cm².',
    subjectId: '1',
    chapterId: '2',
  },
];

export const mockMockTests = [
  {
    id: '1',
    title: 'Mathematics Mid-term Test',
    description: 'Test covering algebra and geometry chapters',
    subjectId: '1',
    chapterId: '1',
    questions: ['1', '2'],
    durationInMinutes: 60,
    totalMarks: 20,
    createdAt: new Date(),
  },
];