export const parseBackendError = ({ message }: any): string => {
  if (message.includes('duplicate key error collection')) {
    const fields = message.split('{')[1];
    return `Validation Error - Record already exists with fields: { ${fields}`;
  } else {
    return message;
  }
};
