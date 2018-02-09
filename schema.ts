import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = `
type User {
    userId: String!
    name: String!
}

type Tag {
  _id: Int @cypher(statement: "WITH {this} AS this RETURN ID(this)")
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
    tagById(id: Int) : Tag
    tagsByUserId(userId: String) : [Tag]
    tagsByLocation(lat: Float, lon: Float radius: Float): [Tag]
}

type Mutation {
    createUser(userId: String) : User
}
`;

export default makeExecutableSchema({
  typeDefs, resolvers,
});
