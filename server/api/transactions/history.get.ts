export default defineEventHandler(async (event) => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Transaction history has been removed'
  });
});
