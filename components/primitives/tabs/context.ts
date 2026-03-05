import { inject, provide, type InjectionKey, type Ref } from 'vue';

export type TabsContext = {
  value: Ref<string>;
  orientation: Ref<'horizontal' | 'vertical'>;
  registerTab: (value: string) => void;
};

const TABS_KEY: InjectionKey<TabsContext> = Symbol('TabsContext');

export function provideTabsContext(context: TabsContext) {
  provide(TABS_KEY, context);
}

export function useTabsContext(component: string) {
  const context = inject(TABS_KEY);
  if (!context) {
    throw new Error(`${component} must be used within <TabsRoot>.`);
  }
  return context;
}
