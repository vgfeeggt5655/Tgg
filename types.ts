
export interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface QuizResult {
  id: string;
  pdfName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
}
