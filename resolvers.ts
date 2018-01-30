// import Neo4j driver
import {v1 as neo4j} from 'neo4j-driver';

// create Neo4j driver instance, here we use a Neo4j Sandbox instance. See neo4j.com/sandbox-v2, Recommendations example dataset
let driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));



const resolveFunctions = {
    Query: {
        userById(root: any, args: any) {
            let session = driver.session();
            let params = {userId: args.userId};
            let query = `
                MATCH (u:User)
                WHERE u.name = $userId
                RETURN u;
            `;

            return session.run(query, params).then((result) => {
                console.log(result);
                return result;
            });
        },
        allUsers(root: any, args: any) {
            return [
                {userId: "1", name: "Joe Bob"},
                {userId: "2", name: "Jane Bob"}
            ]
        },
        tagById(root: any, args: any) {
            return {
                tagId: "1",
                title: "This is a title",
                text: "This is the text"
            }
        },
        tagsByLocation(root: any, args: any) {
            let session = driver.session();
            let params = {
                minLat: args.lat - args.radius,
                maxLat: args.lat + args.radius,
                minLon: args.lon - args.radius,
                maxLon: args.lon + args.radius
            };
            let query = `
                MATCH (t:Tag)
                WHERE $minLat < t.lat AND t.lat < $maxLat
                AND   $minLon < t.lon AND t.lon < $maxLon
                RETURN t
            `;

            return session.run(query, params).then(result => {
                return result.records.map(record => {
                    return record.get("t").properties;
                })
            });
        }
    }
};

export default resolveFunctions;


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