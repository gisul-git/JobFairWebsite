export const FULLSTACK_QUESTIONS = Array.from({ length: 20 }, (_, idx) => ({
  id: idx + 1,
  question: `Sample Fullstack question ${idx + 1}?`,
  options: ["Option A", "Option B", "Option C", "Option D"],
  correctAnswer: 0,
}));

