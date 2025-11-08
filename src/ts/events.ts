/**
 * Signature of the primary click handler for day interactions.
 * Matches `clickEvents.click` in CLNDR options.
 */
export type ClickHandler = NonNullable<ClndrOptions['clickEvents']>['click']

/**
 * Declarative binding for high-level calendar events.
 * This type abstracts DOM specifics so the core can remain portable.
 */
export interface EventBinding {
  type: 'click' | 'today' | 'next' | 'prev' | 'nextYear' | 'prevYear'
  handler: Function
}

/**
 * Normalize a user-supplied day click handler to a callable form.
 *
 * This wrapper allows the core to treat an absent handler as undefined while
 * retaining the original signature when provided.
 *
 * @param h Optional user-provided click handler
 * @returns A function forwarding to `h`, or `undefined` if not provided
 */
export function normalizeClickHandler(
  h?: ClickHandler
): ClickHandler | undefined {
  if (!h) return undefined
  return target => h(target)
}
