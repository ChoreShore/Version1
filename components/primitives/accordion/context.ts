import { inject, provide, type InjectionKey, type Ref } from 'vue';

export type AccordionItem = {
  id: string;
  value: string;
};

export type AccordionContext = {
  openValues: Ref<string[]>;
  toggle: (value: string) => void;
  isItemOpen: (value: string) => boolean;
  allowMultiple: boolean;
};

const ACCORDION_KEY: InjectionKey<AccordionContext> = Symbol('AccordionContext');

export function provideAccordionContext(context: AccordionContext) {
  provide(ACCORDION_KEY, context);
}

export function useAccordionContext(component: string) {
  const ctx = inject(ACCORDION_KEY);
  if (!ctx) {
    throw new Error(`${component} must be used within <AccordionRoot>.`);
  }
  return ctx;
}
