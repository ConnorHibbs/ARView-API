// import graphql-tools
import { makeExecutableSchema } from 'graphql-tools';

// we’ll define our resolver functions in the next section
import resolvers from './resolvers';

// Simple Movie schema
const typeDefs = `
type User {
    userId: String!
    name: String!
}

type Tag {
  userId: String!
  title: String!
  text: String
  lat: Float
  lon: Float
  ele: Float
  dtg: String
}

type Query {
    userById(userId: String) : User
    allUsers : [User]
    tagById(tagId: String) : Tag
    tagsByLocation(lat: Float, lon: Float radius: Float): [Tag]
}
`;

export default makeExecutableSchema({
  typeDefs, resolvers,
});