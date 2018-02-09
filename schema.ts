import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = `
type User {
    username: String!
    name: String!
}

type Tag {
  _id: Int @cypher(statement: "WITH {this} AS this RETURN ID(this)")
  username: String!
  title: String!
  text: String
  lat: Float
  lon: Float
  ele: Float
  dtg: String
}

type Query {
    getUser(username: String) : User
    allUsers : [User]
    tagById(id: Int) : Tag
    tagsByUsername(username: String) : [Tag]
    tagsByLocation(lat: Float, lon: Float radius: Float): [Tag]
}

type Mutation {
    createUser(username: String, name: String, picture: String) : User
    createTag(username: String, title: String, text: String, lat: Float, lon: Float, ele: Float, dtg: String) : Tag
    removeTag(id: Int) : Tag
    updateTag(id: Int, title: String, text: String) : Tag
}
`;

export default makeExecutableSchema({
  typeDefs, resolvers,
});
