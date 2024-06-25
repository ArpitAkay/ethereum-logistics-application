export const saveValueToLocalStorage = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

export const getValueFromLocalStorage = (key: string): string => {
  return localStorage.getItem(key) || "";
};

export const clearStorage = () => {
  localStorage.clear();
};
