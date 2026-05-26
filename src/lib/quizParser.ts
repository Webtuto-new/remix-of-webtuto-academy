// Bulk paste parser for the Master Quiz Center.
// Supports MCQ, True/False, and short-answer formats with tolerant matching.

export type ParsedOption = { text: string; is_correct: boolean };
export type ParsedQuestion = {
  question_text: string;
  question_type: "mcq" | "true_false" | "short_answer";
  options: ParsedOption[];
  correct_answer_text?: string;
  explanation?: string;
  points: number;
};

// Strips a leading "Question:" / "Q:" / "1." / "1)" prefix
const QUESTION_PREFIX = /^\s*(?:question\s*:?|q\s*:?|\d+\s*[\.\)\-:])\s*/i;
// Matches an option line: "A) text", "A. text", "(A) text", "a) text"
const OPTION_LINE = /^\s*\(?([A-Da-d])\)?[\.\)\-:]\s*(.+)$/;
const ANSWER_LINE = /^\s*(?:correct\s*answer|answer|ans)\s*:\s*(.+?)\s*$/i;
const EXPLANATION_LINE = /^\s*(?:explanation|explain|reason)\s*:\s*(.+?)\s*$/i;
const TYPE_TF = /^\s*(?:true\s*\/\s*false|true_false|tf)\s*:\s*(.+)$/i;

function letterIndex(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

function splitIntoBlocks(text: string): string[] {
  // Blocks separated by blank line, "---", or a numbered "1." after a newline.
  const normalised = text.replace(/\r\n/g, "\n").trim();
  // Split on 2+ newlines, then re-split blocks that contain multiple "1.", "2." etc.
  const rough = normalised.split(/\n{2,}|^---+$/gm);
  const blocks: string[] = [];
  rough.forEach((b) => {
    const trimmed = b.trim();
    if (!trimmed) return;
    // If a block starts with multiple "N." separated by single newlines, split them.
    const numbered = trimmed.split(/(?=^\s*\d+\s*[\.\)]\s)/gm);
    numbered.forEach((n) => {
      if (n.trim()) blocks.push(n.trim());
    });
  });
  return blocks;
}

function parseBlock(block: string): ParsedQuestion | null {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let questionText = "";
  const options: ParsedOption[] = [];
  let answerRaw = "";
  let explanation = "";
  let type: ParsedQuestion["question_type"] = "mcq";

  const questionParts: string[] = [];
  for (const line of lines) {
    const ansMatch = line.match(ANSWER_LINE);
    const expMatch = line.match(EXPLANATION_LINE);
    const optMatch = line.match(OPTION_LINE);
    const tfMatch = line.match(TYPE_TF);

    if (ansMatch) {
      answerRaw = ansMatch[1].trim();
    } else if (expMatch) {
      explanation = expMatch[1].trim();
    } else if (optMatch) {
      options.push({ text: optMatch[2].trim(), is_correct: false });
    } else if (tfMatch) {
      type = "true_false";
      questionParts.push(tfMatch[1].trim());
    } else {
      questionParts.push(line.replace(QUESTION_PREFIX, ""));
    }
  }

  questionText = questionParts.join(" ").replace(/\s+/g, " ").trim();
  if (!questionText) return null;

  // Detect True/False without explicit prefix
  if (
    options.length === 0 &&
    /^(true|false|t|f|yes|no)$/i.test(answerRaw)
  ) {
    type = "true_false";
    options.push({ text: "True", is_correct: /^(true|t|yes)$/i.test(answerRaw) });
    options.push({ text: "False", is_correct: /^(false|f|no)$/i.test(answerRaw) });
    return {
      question_text: questionText,
      question_type: "true_false",
      options,
      explanation,
      points: 1,
    };
  }

  // Explicit True/False with options provided
  if (type === "true_false" && options.length === 0) {
    options.push({ text: "True", is_correct: false });
    options.push({ text: "False", is_correct: false });
  }

  // MCQ: mark correct option by letter, exact text, or fuzzy contains
  if (options.length > 0 && answerRaw) {
    const letter = answerRaw.match(/^[A-Da-d]$/);
    if (letter) {
      const idx = letterIndex(answerRaw);
      if (idx >= 0 && idx < options.length) options[idx].is_correct = true;
    } else {
      const lower = answerRaw.toLowerCase();
      const exact = options.findIndex((o) => o.text.toLowerCase() === lower);
      if (exact >= 0) options[exact].is_correct = true;
      else {
        const contains = options.findIndex((o) => o.text.toLowerCase().includes(lower) || lower.includes(o.text.toLowerCase()));
        if (contains >= 0) options[contains].is_correct = true;
      }
    }
    return {
      question_text: questionText,
      question_type: type === "true_false" ? "true_false" : "mcq",
      options,
      explanation,
      points: 1,
    };
  }

  // Short answer: no options, but answer text provided
  if (options.length === 0 && answerRaw) {
    return {
      question_text: questionText,
      question_type: "short_answer",
      options: [],
      correct_answer_text: answerRaw,
      explanation,
      points: 1,
    };
  }

  // MCQ without a marked answer — return as draft (first option = correct fallback)
  if (options.length > 0) {
    options[0].is_correct = true;
    return {
      question_text: questionText,
      question_type: "mcq",
      options,
      explanation,
      points: 1,
    };
  }

  return null;
}

export function parseQuizPaste(input: string): ParsedQuestion[] {
  if (!input.trim()) return [];
  const blocks = splitIntoBlocks(input);
  const out: ParsedQuestion[] = [];
  for (const b of blocks) {
    const parsed = parseBlock(b);
    if (parsed) out.push(parsed);
  }
  return out;
}

export const SAMPLE_PASTE = `What is the capital of France?
A) London
B) Paris
C) Rome
D) Berlin
Correct Answer: B
Explanation: Paris has been the capital of France since 987 AD.

The Earth is flat.
Answer: False
Explanation: The Earth is an oblate spheroid.

Who wrote "Hamlet"?
Answer: William Shakespeare`;