import * as express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

import schema from './schema';

const app = express();

app.use('*', cors());

app.use('/graphql', bodyParser.json(), graphqlExpress({
  schema,
  context: {},
}));

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql'
}));

app.listen(8080, () => console.log(
  `GraphQL Server running on http://localhost:8080/graphql`
));