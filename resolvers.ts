// import Neo4j driver
import {v1 as neo4j} from 'neo4j-driver';

// create Neo4j driver instance, here we use a Neo4j Sandbox instance. See neo4j.com/sandbox-v2, Recommendations example dataset
let driver = neo4j.driver("bolt://54.236.8.156:33471", neo4j.auth.basic("neo4j", "carburetor-requirement-kick"));

const resolveFunctions = {
  Query: {
    // here we define the resolver for the movies query, which searches for movies by title
    // params object contains the values for the substring and limit parameters 
    movies(_, params) {
      // query Neo4j for matching movies
      let session = driver.session();
      let query = "MATCH (movie:Movie) WHERE movie.title CONTAINS $subString RETURN movie LIMIT $limit;"
      return session.run(query, params)
        .then( result => { return result.records.map(record => { return record.get("movie").properties })})
    },
  },
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
};

export default resolveFunctions;