import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

import schema from './schema';
import {v1 as neo4j} from "neo4j-driver";

// const { maskErrors } = require('graphql-errors');
// maskErrors(schema);

var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"));

function context(headers, secrets) {
    return {driver, headers};
}

const rootValue = {};
const app = express();

app.use('*', cors());

app.use('/graphql', bodyParser.json(), graphqlExpress(request => ({
    schema,
    rootValue,
    context: context(request.headers, process.env),
})));

app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    query: `{}`,
}));

app.listen(8080, () => console.log(
    `GraphQL Server running on http://localhost:8080/graphql`
));

export default driver;