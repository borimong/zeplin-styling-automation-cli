import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

interface SelectOption<T> {
  label: string;
  value: T;
}

export async function selectPrompt<T>(
  message: string,
  options: Array<SelectOption<T>>,
): Promise<T> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    console.log(`\n${message}`);
    options.forEach((option, index) => {
      console.log(`  ${String(index + 1)}) ${option.label}`);
    });

    let selected: SelectOption<T> | undefined;
    while (selected === undefined) {
      const answer = await rl.question("\n선택 (번호): ");
      const parsed = Number.parseInt(answer.trim(), 10);

      if (Number.isNaN(parsed) || parsed < 1 || parsed > options.length) {
        console.log(`1~${String(options.length)} 사이의 번호를 입력해주세요.`);
        continue;
      }

      selected = options[parsed - 1];
      if (!selected) {
        console.log(`1~${String(options.length)} 사이의 번호를 입력해주세요.`);
      }
    }

    return selected.value;
  } finally {
    rl.close();
  }
}
