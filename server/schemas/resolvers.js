const { User } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, params, context) => {
      const user = await User.findOne({ _id: context.user._id })
      if (!user) {
        throw new AuthenticationError;
      }
      return user;
    },
    searchGame: async (parent, { title, platforms, genres }) => {
      const games = await User.find({ games:{ 
        $elemMatch: {
          title: { $regex: title, $options: 'i' },
          platforms: { $in: platforms },
          genres: { $in: genres }
        } 
      } 
    });
      return games;
    }
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);
      return { token, user };
    },
    addUser: async (parent, { name, email, password }) => {
      const user = await User.create({ name, email, password }); 
      const token = signToken(user);

      return { token, user };
    },
    // Add a third argument to the resolver to access data in our `context`
    saveGame: async (parent, { game }, context) => {
      // If context has a `user` property, that means the user executing this mutation has a valid JWT and is logged in
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          {$addToSet: { games: game }},
          {newew: true, runValidators: true}
        );
      }
      // If user attempts to execute this mutation and isn't logged in, throw an error
      throw AuthenticationError;
    },
    // Make it so a logged in user can only remove a game from their own user
    removeGame: async (parent, { game }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { games: game } },
          { new: true }
        );
      }
      throw AuthenticationError;
    },
  },
};

module.exports = resolvers;
