import { inject, provide, type InjectionKey, type Ref } from 'vue';

export type MenuContext = {
  isOpen: Ref<boolean>;
  triggerId: string;
  contentId: string;
  triggerRef: Ref<HTMLElement | null>;
  contentRef: Ref<HTMLElement | null>;
  focusNext: (direction: 1 | -1) => void;
  registerItem: (el: HTMLElement) => void;
  unregisterItem: (el: HTMLElement) => void;
  closeOnSelect: boolean;
  open: () => void;
  close: () => void;
};

const MENU_KEY: InjectionKey<MenuContext> = Symbol('MenuContext');

export function provideMenuContext(context: MenuContext) {
  provide(MENU_KEY, context);
}

export function useMenuContext(component: string) {
  const context = inject(MENU_KEY);
  if (!context) {
    throw new Error(`${component} must be used within <MenuRoot>.`);
  }
  return context;
}
