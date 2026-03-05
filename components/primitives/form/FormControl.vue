<template>
  <slot :id="fieldId" :described-by="describedBy"></slot>
</template>

<script setup lang="ts">
import { useFormFieldContext } from './context';

const { fieldId, describedBy } = useFormFieldContext('FormControl');
</script>
