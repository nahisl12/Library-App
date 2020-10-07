const { ApolloServer, gql, AuthenticationError, UserInputError, PubSub } = require('apollo-server');
const mongoose = require('mongoose');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const Author = require('./models/author');
const Book = require('./models/book');
const User = require('./models/user');
const pubsub = new PubSub();

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY';

mongoose.set('useFindAndModify', false);

const MONGODB_URI = 'mongodb+srv://nahid:1234@cluster0.uleih.mongodb.net/library?retryWrites=true&w=majority';

console.log('connecting to', MONGODB_URI);

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to mongodb');
  })
  .catch((error) => {
    console.log('error connecting to mongodb', error.message);
  });

const typeDefs = gql`
  type Author {
    name: String!
    born: Int 
    bookCount: Int
    id: ID!
  }
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  type Token {
    value: String!
  }

  type Subscription {
    bookAdded: Book!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int
      author: String!
      genres: [String]
    ): Book,
    addAuthor(
      name: String!
      born: Int
      bookCount: Int
    ): Author,
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author,
    createUser(
      username: String!
      favouriteGenre: String!
    ): User,
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      let books = await Book.find({});

      if(args.author && args.genre) {
        // return books.filter(book => book.author === args.author && book.genres.includes(args.genre));
        books = books.filter(book => book.genres.includes(args.genre));
        const author = await Author.findOne({ name: args.author });
        books = books.filter(book => {
          return book.author.equals(author._id);
        });
      }
      else if(args.genre) {
        // return books.filter(book => book.genres.includes(args.genre));
        books = books.filter(book => book.genres.includes(args.genre));
      }
      else if(args.author) {
        // return books.filter(book => book.author === args.author);
        const author = await Author.findOne({ name: args.author });
        books = books.filter(book => {
          return book.author.equals(author._id);
        });
      }
      
      return books.map(async book => {
        return {
          title: book.title,
          published: book.published,
          genres: book.genres,
          author: await Author.findById(book.author)
        }
      });
    },
    allAuthors: async () => {
      const authors = await Author.find({});
      return authors.map(async author => {
        return {
          name: author.name,
          born: author.born,
          id: author.id,
          bookCount: await Book.find({ author: author.id }).countDocuments()
        }
      });
      // return authors.map(author => {
      //   return {
      //     ...author,
      //     bookCount: books.filter(book => book.author === author.name).length
      //   }
      // });
    },
    me: (root, args, context) => {
      console.log(context)
      return context.currentUser;
    }
  },
  Mutation: {
    addBook: async (root, args, { currentUser }) => {
      if(!currentUser) {
        throw new AuthenticationError("not auth'd");
      }

      let author = await Author.findOne({ name: args.author });
      if (!author) {
        author = await new Author({ name: args.author });
        await author.save();
      }

      const book = new Book({ ...args, author });

      try {
        await book.save();
      } catch (error) {
        throw new AuthenticationError(error.message);
      }

      pubsub.publish('BOOK_ADDED', { bookAdded: book });
      return book;
    },
    addAuthor: async (root, args) => {
      const author = new Author({ ...args });

      try {
        await author.save();
      } catch (error) {
        throw new AuthenticationError(error.message);
      }
      return author;
    },
    editAuthor: async (root, args, { currentUser }) => {
      if(!currentUser) {
        throw new AuthenticationError("Not auth'd");
      }

      let author = await Author.findOne({ name: args.name });
      if(!author) {
        throw new AuthenticationError("No auth found");
      }

      author.born = args.setBornTo;
      await author.save();
      return author;
    },
    createUser: (root, args) => {
      const user = new User({ username: args.username, favouriteGenre: args.favouriteGenre });
      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, { invalidArgs: args, });
        });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });
      if(!user || args.password !== 'password') {
        throw new UserInputError("wrong creds");
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET )}
    }
  },
  Subscription: {
    bookAdded: {
        subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
        const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
        const currentUser = await User.findById(decodedToken.id);
        return { currentUser };
    };
  }
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
})