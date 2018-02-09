import { neo4jgraphql } from "./executor";
import driver from "./server";

const resolvers = {
    Query: {
        getUser(object, args, ctx, resolveInfo) {
            return neo4jgraphql(object, args, ctx, resolveInfo);
        },
        allUsers(object, args, ctx, resolveInfo) {
            return neo4jgraphql(object, args, ctx, resolveInfo);
        },
        tagById(object, args, ctx, resolveInfo) {
            let matcher = `id(tag) = ${args.id}`;
            return neo4jgraphql(object, args, ctx, resolveInfo, matcher);
        },
        tagsByUsername(object, args, ctx, resolveInfo) {
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
            console.log(args.username);

            return neo4jgraphql(object, args, ctx, resolveInfo).then(existingUser => {
                if(!existingUser) {
                    console.log("The user did not exist");

                    let params = {
                        username: args.username,
                        name: (args.name ? args.name : args.username),
                        picture: (args.picture ? args.picture : "")
                    };

                    let query = `CREATE (user:User { username: $username, name: $name, picture: $picture }) RETURN user`;

                    return driver.session().run(query, params).then(result => {
                        return result.records[0].get('user').properties;
                    });

                } else {
                    console.log("The user already exists in the system");
                    throw new Error("A user with that username already exists");
                }
            })


        },
        createTag(object, args, ctx, resolveInfo) {
            console.log("Creating a tag");
            console.log(args);

            let query = `
                CREATE (tag:Tag {
                    username: $username, 
                    title: $title, 
                    text: $text, 
                    lat: $lat, 
                    lon: $lon, 
                    ele: $ele, 
                    dtg: $dtg 
                })
                WITH tag
                MATCH (user:User) WHERE user.username = "${args.username}"
                WITH tag, user
                CREATE (user)-[:TAGGED]->(tag)
                CREATE (tag)-[:TAGGED_BY]->(user)
                RETURN tag
            `;

            if (!args.title) throw new Error("Missing Title");
            if (!args.text) throw new Error("Missing Text");
            if (!args.username) throw new Error("Missing Username");


            return userExists(args.username).then(user => {
                if(!user) throw new Error("User " + args.username + " does not exist");

                return driver.session().run(query, args).then(result => {
                    return neo4jgraphql(object, args, ctx, resolveInfo, undefined);
                });
            });
        },
        removeTag(object, args, ctx, resolveInfo) {
            console.log("Removing a tag");
            console.log(args);

            let query = `
                MATCH (tag:Tag)
                WHERE id(tag) = ${args.id}
                DETACH DELETE tag
            `;

            return driver.session().run(query, args).then(result => {
                let matcher = `id(tag) = ${args.id}`;
                return neo4jgraphql(object, args, ctx, resolveInfo, matcher);
            })
        },
        updateTag(object, args, ctx, resolveInfo) {
            console.log("Updating a tag");
            console.log(args);

            let query = `
                MATCH (tag:Tag)
                WHERE id(tag) = $id
                WITH tag
                ${args.title ? "SET tag.title = $title" : ""}
                ${args.text  ? "SET tag.text  = $text"  : ""}
                RETURN tag
            `;
            console.log("Update Query:", query);

            return driver.session().run(query, args).then(result => {
                let matcher = `id(tag) = ${args.id}`;
                return neo4jgraphql(object, args, ctx, resolveInfo, matcher);
            });
        }
    }
};

function userExists(username) {
    let params = {username: username};
    let query = `MATCH (user:User) WHERE user.username = $username RETURN user`;
    return driver.session().run(query, params).then(result => {
        console.log("User Exists?", result.records[0]);
        return result.records[0];
    });
}

export default resolvers;