'use server';

/**
 * @fileOverview Agente de IA para recomendaciones de reposición.
 *
 * - getReorderRecommendations - Una función que sugiere la cantidad óptima de cada tipo de rodamiento a reponer.
 * - ReorderRecommendationsInput - El tipo de entrada para la función getReorderRecommendations.
 * - ReorderRecommendationsOutput - El tipo de retorno para la función getReorderRecommendations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReorderRecommendationsInputSchema = z.object({
  bearingTypes: z
    .array(z.string())
    .describe('Una lista de tipos de rodamientos para obtener recomendaciones de reposición.'),
  historicalUsageData: z
    .string()
    .describe(
      'Datos históricos de uso para cada tipo de rodamiento, incluyendo fechas y cantidades utilizadas.'
    ),
  currentStockLevels: z
    .string()
    .describe('Los niveles de stock actuales para cada tipo de rodamiento.'),
  reorderThreshold: z
    .number()
    .describe(
      'El nivel de stock en el que se debe activar una reposición para todos los tipos de rodamientos.'
    ),
  leadTimeDays: z
    .number()
    .describe('El tiempo de entrega en días para la reposición de rodamientos.'),
});
export type ReorderRecommendationsInput = z.infer<
  typeof ReorderRecommendationsInputSchema
>;

const ReorderRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      bearingType: z.string().describe('El tipo de rodamiento.'),
      quantityToReorder: z
        .number()
        .describe('La cantidad óptima a reponer.'),
      reasoning: z
        .string()
        .describe('El razonamiento detrás de la recomendación de reposición.'),
    })
  ),
  totalValue: z
    .number()
    .describe('El valor total de todos los tipos de rodamientos necesarios y repuestos.'),
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
  prompt: `Eres un gerente de stock que proporciona recomendaciones de reposición para rodamientos.

  Basado en los datos históricos de uso, los niveles de stock actuales, el umbral de reposición y el tiempo de entrega, sugiere la cantidad óptima de cada tipo de rodamiento a reponer.

  Datos Históricos de Uso: {{{historicalUsageData}}}
  Niveles de Stock Actuales: {{{currentStockLevels}}}
  Umbral de Reposición: {{{reorderThreshold}}}
  Tiempo de Entrega (Días): {{{leadTimeDays}}}
  Tipos de Rodamientos: {{#each bearingTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Proporciona un razonamiento claro para cada recomendación.
  Además, calcula el valor total para todos los tipos de rodamientos necesarios y repuestos. Asume que 1 unidad de cada tipo de rodamiento cuesta $10.

  Asegúrate de que la salida sea un objeto JSON que se ajuste al siguiente esquema:
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
