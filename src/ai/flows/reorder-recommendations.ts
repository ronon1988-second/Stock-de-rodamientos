'use server';

/**
 * @fileOverview Reorder recommendation AI agent.
 *
 * - getReorderRecommendations - A function that suggests the optimal quantity of each bearing type to reorder.
 * - ReorderRecommendationsInput - The input type for the getReorderRecommendations function.
 * - ReorderRecommendationsOutput - The return type for the getReorderRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReorderRecommendationsInputSchema = z.object({
  bearingTypes: z
    .array(z.string())
    .describe('A list of bearing types to get reorder recommendations for.'),
  historicalUsageData: z
    .string()
    .describe(
      'Historical usage data for each bearing type, including dates and quantities used.'
    ),
  currentStockLevels: z
    .string()
    .describe('The current stock levels for each bearing type.'),
  reorderThreshold: z
    .number()
    .describe(
      'The stock level at which a reorder should be triggered for all bearing types.'
    ),
  leadTimeDays: z
    .number()
    .describe('The lead time in days for reordering bearings.'),
});
export type ReorderRecommendationsInput = z.infer<
  typeof ReorderRecommendationsInputSchema
>;

const ReorderRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      bearingType: z.string().describe('The type of bearing.'),
      quantityToReorder: z
        .number()
        .describe('The optimal quantity to reorder.'),
      reasoning: z
        .string()
        .describe('The reasoning behind the reorder recommendation.'),
    })
  ),
  totalValue: z
    .number()
    .describe('The total value of all bearing types needed and reordered.'),
});
export type ReorderRecommendationsOutput = z.infer<
  typeof ReorderRecommendationsOutputSchema
>;

export async function getReorderRecommendations(
  input: ReorderRecommendationsInput
): Promise<ReorderRecommendationsOutput> {
  return reorderRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reorderRecommendationsPrompt',
  input: {schema: ReorderRecommendationsInputSchema},
  output: {schema: ReorderRecommendationsOutputSchema},
  prompt: `You are a stock manager providing reorder recommendations for bearings.

  Based on the historical usage data, current stock levels, reorder threshold, and lead time, suggest the optimal quantity of each bearing type to reorder.

  Historical Usage Data: {{{historicalUsageData}}}
  Current Stock Levels: {{{currentStockLevels}}}
  Reorder Threshold: {{{reorderThreshold}}}
  Lead Time (Days): {{{leadTimeDays}}}
  Bearing Types: {{#each bearingTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Provide clear reasoning for each recommendation.
  Also, compute the total value for all bearing types needed and reordered. Assume 1 unit of each bearing type costs $10.

  Ensure the output is a JSON object conforming to the following schema:
  ${JSON.stringify(ReorderRecommendationsOutputSchema.shape, null, 2)}`,
});

const reorderRecommendationsFlow = ai.defineFlow(
  {
    name: 'reorderRecommendationsFlow',
    inputSchema: ReorderRecommendationsInputSchema,
    outputSchema: ReorderRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
