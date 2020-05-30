import { ForbiddenError } from 'apollo-server';
import { combineResolvers, skip } from 'graphql-resolvers';

export const isAuthenticated = (parent, args, { me }) =>
  me ? skip : new ForbiddenError('Not authenticated as user');

export const isAdmin = combineResolvers(
  isAuthenticated,
  (parent, args, { me: { role } }) =>
    role === 'admin' ? skip : new ForbiddenError('Not authorized as Admin')
);

export const isMessageOwner = async (parent, { id }, { models, me }) => {
  const message = await models.Message.findByPk(id, { raw: true });
  console.log(`the message: ${message}`);
  if (message.userId !== me.id) {
    throw new ForbiddenError('Not authenticated as user');
  }

  return skip;
};
