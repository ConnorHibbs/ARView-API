// import graphql-tools
import { makeExecutableSchema } from 'graphql-tools';

// we’ll define our resolver functions in the next section
import resolvers from './resolvers';


// Simple Movie schema
const typeDefs = `
type Movie {
  movieId: String!
  title: String
  year: Int
  plot: String
  poster: String
  imdbRating: Float
  genres: [String]
  similar: [Movie]
}`;

type Query {
  movies(subString: String!, limit: Int!): [Movie]
}


export default makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers,
});