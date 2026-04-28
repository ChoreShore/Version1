export default defineEventHandler(async (event) => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Payment features have been removed'
  });
});
