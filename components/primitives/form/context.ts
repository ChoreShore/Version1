import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue';

export type FormFieldContext = {
  fieldId: string;
  hintId: string;
  errorId: string;
  hasHint: Ref<boolean>;
  hasError: Ref<boolean>;
  externalError: Ref<string | null>;
  registerHint: (present: boolean) => void;
  registerError: (present: boolean) => void;
  describedBy: ComputedRef<string | undefined>;
};

const FORM_FIELD_KEY: InjectionKey<FormFieldContext> = Symbol('FormField');

export function provideFormFieldContext(context: FormFieldContext) {
  provide(FORM_FIELD_KEY, context);
}

export function useFormFieldContext(component: string) {
  const context = inject(FORM_FIELD_KEY);
  if (!context) {
    throw new Error(`${component} must be used within <FormField> root.`);
  }
  return context;
}
