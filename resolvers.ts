// import Neo4j driver
import {v1 as neo4j} from 'neo4j-driver';
// import {neo4jgraphql} from 'neo4j-graphql-js';
import { neo4jgraphql } from "./executor";


// create Neo4j driver instance, here we use a Neo4j Sandbox instance. See neo4j.com/sandbox-v2, Recommendations example dataset
// let driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));

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
    }
};

// const resolveFunctions = {
//     Query: {
//         userById(root: any, args: any, ctx, resolveInfo) {
//
//
//
//                 return neo4jgraphql(root, args, ctx, resolveInfo);
//
//
//
//             //
//             //
//             // let session = driver.session();
//             // let params = {userId: args.userId};
//             // let query = `
//             //     MATCH (u:User)
//             //     WHERE u.name = $userId
//             //     RETURN u;
//             // `;
//             //
//             // return session.run(query, params).then((result) => {
//             //     console.log(result);
//             //     return result;
//             // });
//         },
//         allUsers(root: any, args: any) {
//             return [
//                 {userId: "1", name: "Joe Bob"},
//                 {userId: "2", name: "Jane Bob"}
//             ]
//         },
//         tagById(root: any, args: any) {
//             console.log("Tag By ID:(args)", args);
//
//             let params = {
//                 tagId: args.id
//             };
//
//             let query = `
//                 MATCH (t:Tag)
//                 WHERE id(t) = $tagId
//                 RETURN t
//             `;
//
//             let session = driver.session();
//             return session.run(query, params).then(result => {
//                 // console.log("Result:", result);
//                 console.log("Record", result.records[0]);
//                 console.log("Field", result.records[0]._fields[0]);
//
//                 let node = result.records[0]._fields[0];
//
//                 let tag = result.records[0].get("t").properties;
//                 getId(node);
//
//                 tag["id"] = 508;
//                 return tag;
//             });
//         },
//         tagsByLocation(root: any, args: any) {
//             console.log("Args:", args);
//
//             let session = driver.session();
//             let params = {
//                 minLat: args.lat - args.radius,
//                 maxLat: args.lat + args.radius,
//                 minLon: args.lon - args.radius,
//                 maxLon: args.lon + args.radius
//             };
//             let query = `
//                 MATCH (t:Tag)
//                 WHERE $minLat < t.lat AND t.lat < $maxLat
//                 AND   $minLon < t.lon AND t.lon < $maxLon
//                 RETURN t
//             `;
//
//             return session.run(query, params).then(result => {
//                 return result.records.map(record => {
//                     return record.get("t").properties;
//                 })
//             });
//         }
//     },
//     // Tag: {
//     //     id(tag: any, args: any) {
//     //         // _id: Int @cypher(statement: "WITH {this} AS this RETURN ID(this)")
//     //         console.log("Tag:", tag);
//     //
//     //
//     //         let params = {
//     //             tag
//     //         };
//     //
//     //         let query = `
//     //             RETURN id($tag)
//     //         `;
//     //
//     //         driver.session().run(query, params).then(result => {
//     //             console.log("Result:", result);
//     //             console.log("Record:", result.records[0]);
//     //             return result.records[0];
//     //         });
//     //     }
//     // }
// };
//
// function getId(tag: any) {
//     console.log("Getting ID for", tag);
//
//     let session = driver.session();
//     let params = { tag };
//     let query = "RETURN id($tag)";
//     return session.run(query, params).then(result => {
//         console.log("Got back from DB:", result.records[0]);
//         return 508;
//     });
// }

export default resolvers;


/*





    Movie: {
        // the similar field in the Movie type is an array of similar Movies
        similar(movie) {
            // we define similarity to be movies with overlapping genres, we could use a more complex
            // Cypher query here to use collaborative filtering based on user ratings, see Recommendations
            // Neo4j Sandbox for more complex examples
            let session = driver.session(),
                params = {movieId: movie.movieId},
                query = `
            MATCH (m:Movie) WHERE m.movieId = $movieId
            MATCH (m)-[:IN_GENRE]->(g:Genre)<-[:IN_GENRE]-(movie:Movie)
            WITH movie, COUNT(*) AS score
            RETURN movie ORDER BY score DESC LIMIT 3
          `
            return session.run(query, params)
                .then( result => { return result.records.map(record => { return record.get("movie").properties })})
        },
        genres(movie) {
            // Movie genres are represented as relationships in Neo4j so we need to query the database
            // to resolve genres
            let session = driver.session(),
                params = {movieId: movie.movieId},
                query = `
            MATCH (m:Movie)-[:IN_GENRE]->(g:Genre)
            WHERE m.movieId = $movieId
            RETURN g.name AS genre;
          `
            return session.run(query, params)
                .then( result => { return result.records.map(record => { return record.get("genre") })})
        }
    },
 */