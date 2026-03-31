import { quizService } from '../quiz.service';
import { quizRepository } from '../quiz.repository';

jest.mock('../quiz.repository');

const makeQuestion = (id: string, correctIndex: number) => ({
  id,
  courseId: 'c1',
  text: `Question ${id}`,
  options: JSON.stringify(['A', 'B', 'C', 'D']),
  correctIndex,
  order: 1,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('quizService.submitAttempt', () => {
  it('score=60% (3/5 correct) → passed=true', async () => {
    const questions = [
      makeQuestion('q1', 0),
      makeQuestion('q2', 1),
      makeQuestion('q3', 2),
      makeQuestion('q4', 3),
      makeQuestion('q5', 0),
    ];
    (quizRepository.getQuestions as jest.Mock).mockResolvedValue(questions);
    (quizRepository.upsertAttempt as jest.Mock).mockResolvedValue(undefined);

    // answers: q1✓ q2✓ q3✓ q4✗ q5✗ → 3/5 = 60%
    const result = await quizService.submitAttempt('u1', 'c1', [0, 1, 2, 0, 1]);

    expect(result.score).toBe(60);
    expect(result.passed).toBe(true);
    expect(result.correctCount).toBe(3);
    expect(result.total).toBe(5);
  });

  it('score<60% (2/5 correct) → passed=false', async () => {
    const questions = [
      makeQuestion('q1', 0),
      makeQuestion('q2', 1),
      makeQuestion('q3', 2),
      makeQuestion('q4', 3),
      makeQuestion('q5', 0),
    ];
    (quizRepository.getQuestions as jest.Mock).mockResolvedValue(questions);
    (quizRepository.upsertAttempt as jest.Mock).mockResolvedValue(undefined);

    // answers: q1✓ q2✓ q3✗ q4✗ q5✗ → 2/5 = 40%  (q5 correctIndex=0, answer=1 → wrong)
    const result = await quizService.submitAttempt('u1', 'c1', [0, 1, 0, 0, 1]);

    expect(result.score).toBe(40);
    expect(result.passed).toBe(false);
  });

  it('no questions → score=100, passed=true (auto pass)', async () => {
    (quizRepository.getQuestions as jest.Mock).mockResolvedValue([]);
    (quizRepository.upsertAttempt as jest.Mock).mockResolvedValue(undefined);

    const result = await quizService.submitAttempt('u1', 'c1', []);

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });
});

describe('quizService.submitAttempt — upsert behaviour', () => {
  it('calls upsertAttempt (idempotent re-submission updates score)', async () => {
    const questions = [makeQuestion('q1', 0)];
    (quizRepository.getQuestions as jest.Mock).mockResolvedValue(questions);
    (quizRepository.upsertAttempt as jest.Mock).mockResolvedValue(undefined);

    await quizService.submitAttempt('u1', 'c1', [0]);
    await quizService.submitAttempt('u1', 'c1', [1]);

    expect(quizRepository.upsertAttempt).toHaveBeenCalledTimes(2);
    const [, , score2] = (quizRepository.upsertAttempt as jest.Mock).mock.calls[1];
    expect(score2).toBe(0); // 0/1 = 0%
  });
});

describe('quizService.isQuizPassed', () => {
  it('returns true when no questions exist (no quiz)', async () => {
    (quizRepository.getQuestions as jest.Mock).mockResolvedValue([]);
    const result = await quizService.isQuizPassed('u1', 'c1');
    expect(result).toBe(true);
  });

  it('returns false when quiz exists but no attempt', async () => {
    (quizRepository.getQuestions as jest.Mock).mockResolvedValue([makeQuestion('q1', 0)]);
    (quizRepository.getAttempt as jest.Mock).mockResolvedValue(null);
    const result = await quizService.isQuizPassed('u1', 'c1');
    expect(result).toBe(false);
  });

  it('returns attempt.passed value', async () => {
    (quizRepository.getQuestions as jest.Mock).mockResolvedValue([makeQuestion('q1', 0)]);
    (quizRepository.getAttempt as jest.Mock).mockResolvedValue({
      passed: true,
      score: 100,
      attemptedAt: new Date(),
    });
    const result = await quizService.isQuizPassed('u1', 'c1');
    expect(result).toBe(true);
  });
});
