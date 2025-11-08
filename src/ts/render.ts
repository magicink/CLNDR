/**
 * Render helpers for converting template data into HTML.
 * These are intentionally minimal and framework-agnostic to allow consumers
 * to plug in their own templating systems.
 */
import { TemplateRenderer } from './templates'

/**
 * Minimal render instruction set describing the resulting HTML string.
 * Future additions may capture targeted DOM mutation plans.
 */
export interface RenderInstructions {
  html: string
}

/**
 * Render with a provided template renderer and arbitrary template data.
 *
 * @param renderer A function that produces HTML for the given data
 * @param data Arbitrary data object expected by the template
 * @returns RenderInstructions containing the HTML string
 */
export function renderWithTemplate(
  renderer: TemplateRenderer,
  data: any
): RenderInstructions {
  return { html: renderer(data) }
}
