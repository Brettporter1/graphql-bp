import { expect } from 'chai';
import * as userApi from './api';

describe('users', () => {
  describe('user(id: String!): User', () => {
    it('returns a user when user can be found', async () => {
      const expectedResult = {
        data: {
          user: {
            id: '1',
            username: 'brettporter',
            email: 'gkdesign06@gmail.com',
            role: 'admin',
          },
        },
      };
      const result = await userApi.user({ id: '1' });
      expect(result.data).to.eql(expectedResult);
    });
    it('returns null when user cannot be found', async () => {
      const expectedResult = {
        data: {
          user: null,
        },
      };
      const result = await userApi.user({ id: '33' });

      expect(result.data).to.eql(expectedResult);
    });
  });

  describe('deleteuser(id: String!): Boolean!', () => {
    it('returns an error because only admin can delete a user', async () => {
      const {
        data: {
          data: {
            signIn: { token },
          },
        },
      } = await userApi.signIn({
        login: 'travisP',
        password: 'DaPassword2',
      });
      const {
        data: { errors },
      } = await userApi.deleteUser({ id: '1' }, token);
      expect(errors[0].message).to.eql('Not authorized as Admin');
    });
  });
});
