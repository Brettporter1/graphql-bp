import 'dotenv/config';
import DataLoader from 'dataloader';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import http from 'http';
import loaders from './loaders';

import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';

const app = express();

app.use(cors());

const PORT = process.env.PORT || 8000;

const getMe = async (req) => {
  const token = req.headers['x-token'];

  if (token) {
    try {
      return await jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new AuthenticationError('Your session has expired');
    }
  }
};

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: (err) => {
    const message = err.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ', '');
    return { ...err, message };
  },
  context: async ({ req, connection }) => {
    if (connection) {
      return {
        models,
        loaders: {
          user: new DataLoader((keys) => loaders.user.batchUsers(keys, models)),
        },
      };
    }

    if (req) {
      const me = await getMe(req);

      return {
        models,
        me,
        secret: process.env.JWT_SECRET,
        loaders: {
          user: new DataLoader((keys) => loaders.user.batchUsers(keys, models)),
        },
      };
    }
  },
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const isTest = !!process.env.TEST_DATABASE;

sequelize.sync({ force: isTest }).then(async () => {
  if (isTest) {
    createUsersWithMessages(new Date());
  }
  httpServer.listen(PORT, () => {
    console.log(`Apollo Server on http://localhost:${PORT}/graphql`);
  });
});

const createUsersWithMessages = async (date) => {
  await models.User.create(
    {
      username: 'brettporter',
      email: 'gkdesign06@gmail.com',
      password: 'Password23',
      role: 'admin',
      messages: [
        {
          text: 'Published the Road to lear React',
          createdAt: date.setSeconds(date.getSeconds() + 1),
        },
      ],
    },
    {
      include: [models.Message],
    }
  );

  await models.User.create(
    {
      username: 'travisP',
      email: 'trav@mail.com',
      password: 'DaPassword2',
      messages: [
        {
          text: "This is Travis's first message",
          createdAt: date.setSeconds(date.getSeconds() + 1),
        },
        {
          text: "This is Travis's second message",
          createdAt: date.setSeconds(date.getSeconds() + 1),
        },
      ],
    },
    {
      include: [models.Message],
    }
  );
};
