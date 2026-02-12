let counter = 0;

export type TestCredentials = {
  email: string;
  username: string;
  password: string;
};

export const makeCredentials = (prefix = 'user'): TestCredentials => {
  counter += 1;
  const unique = `${Date.now()}_${counter}`;

  return {
    email: `${prefix}_${unique}@example.com`,
    username: `${prefix}_${unique}`,
    password: 'password123',
  };
};
