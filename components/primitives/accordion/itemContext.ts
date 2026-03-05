import { inject, provide, type ComputedRef, type InjectionKey } from 'vue';

export type AccordionItemContext = {
  value: string;
  isOpen: ComputedRef<boolean>;
  triggerId: string;
  contentId: string;
  toggle: () => void;
};

const ACCORDION_ITEM_KEY: InjectionKey<AccordionItemContext> = Symbol('AccordionItemContext');

export function provideAccordionItemContext(context: AccordionItemContext) {
  provide(ACCORDION_ITEM_KEY, context);
}

export function useAccordionItemContext(component: string) {
  const ctx = inject(ACCORDION_ITEM_KEY);
  if (!ctx) {
    throw new Error(`${component} must be used within <AccordionItem>.`);
  }
  return ctx;
}
