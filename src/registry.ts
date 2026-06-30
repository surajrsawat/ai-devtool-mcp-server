import { z } from "zod";

type ToolDefinition<TIn extends z.ZodTypeAny, TOut extends z.ZodTypeAny> = {
  inputSchema: TIn;
  outputSchema: TOut;
  handler: (input: z.infer<TIn>) => Promise<z.infer<TOut>>;
};

type AnyToolDefinition = {
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  handler: (input: unknown) => Promise<unknown>;
};

export class ToolRegistry {
  private readonly tools = new Map<string, AnyToolDefinition>();

  register<TIn extends z.ZodTypeAny, TOut extends z.ZodTypeAny>(
    name: string,
    definition: ToolDefinition<TIn, TOut>,
  ): void {
    this.tools.set(name, {
      inputSchema: definition.inputSchema,
      outputSchema: definition.outputSchema,
      handler: (input: unknown) => definition.handler(input as z.infer<TIn>),
    });
  }

  list(): string[] {
    return [...this.tools.keys()];
  }

  async invoke(name: string, input: unknown): Promise<unknown> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const parsedInput = tool.inputSchema.parse(input);
    const result = await tool.handler(parsedInput);

    return tool.outputSchema.parse(result);
  }
}
