export const isTaskNotFoundError = (error: unknown): boolean => {
  const value = error as {
    code?: string;
    data?: { code?: string };
    shape?: { data?: { code?: string } };
  };

  return (
    value?.data?.code === 'NOT_FOUND' ||
    value?.shape?.data?.code === 'NOT_FOUND' ||
    value?.code === 'NOT_FOUND'
  );
};
