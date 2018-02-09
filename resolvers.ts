import { neo4jgraphql } from "./executor";
import driver from "./server";
import { makeError } from "graphql-errors";

const { maskErrors } = require('graphql-errors');

require("./server");

const resolvers = {
    Query: {
        userById(object, args, ctx, resolveInfo) {
            return neo4jgraphql(object, args, ctx, resolveInfo);
        },
        allUsers(object, args, ctx, resolveInfo) {
            return neo4jgraphql(object, args, ctx, resolveInfo);
        },
        tagById(object, args, ctx, resolveInfo) {
            let matcher = `id(tag) = ${args.id}`;
            return neo4jgraphql(object, args, ctx, resolveInfo, matcher);
        },
        tagsByUserId(object, args, ctx, resolveInfo) {
            return neo4jgraphql(object, args, ctx, resolveInfo);
        },
        tagsByLocation(object, args, ctx, resolveInfo) {
            let minLat = args.lat - args.radius;
            let maxLat = args.lat + args.radius;
            let minLon = args.lon - args.radius;
            let maxLon = args.lon + args.radius;
            let matcher = `${minLat} < tag.lat AND tag.lat < ${maxLat}
                       AND ${minLon} < tag.lon AND tag.lon < ${maxLon}`;
            return neo4jgraphql(object, args, ctx, resolveInfo, matcher);
        }
    },
    Mutation: {
        createUser(object, args, ctx, resolveInfo) {
            console.log("Creating a user");
            console.log(args.userId);

            return neo4jgraphql(object, args, ctx, resolveInfo).then(existingUser => {

                console.log("Existing User:", existingUser);

                if(!existingUser) {
                    console.log("The user did not exist");
                    let params = {
                        userId: args.userId
                    }

                    // CREATE (u:User {userId:"Donald Duck", name:"Donald Duck"})

                    let query = `CREATE (user:User { userId: $userId, name: $userId }) RETURN user`;

                    return driver.session().run(query, params).then(result => {
                       return result.records[0].get('user').properties;
                    });

                } else {
                    console.log("The user already exists in the system");
                    throw new Error("A user with that userId already exists");
                }
            })


        }
    }
};

export default resolvers;