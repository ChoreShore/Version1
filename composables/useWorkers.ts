export const useWorkers = () => {
  const listPublicWorkers = async (limit?: number, category?: string) => {
    return await $fetch<{ workers: any[] }>('/api/public/workers', {
      params: {
        ...(limit ? { limit: limit.toString() } : {}),
        ...(category ? { category } : {})
      }
    });
  };

  return {
    listPublicWorkers
  };
};
