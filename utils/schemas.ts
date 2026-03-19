export const userSchema = {
  type: 'object',
  required: ['id', 'firstName', 'lastName', 'email'],
  properties: {
    id: { type: 'number' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string' },
  },
  additionalProperties: true,
};

export const productSchema = {
  type: 'object',
  required: ['id', 'title'],
  properties: {
    id: { type: 'number' },
    title: { type: 'string' },
    price: { type: ['number', 'null'] },
    rating: { type: ['number', 'null'] },
  },
  additionalProperties: true,
};
