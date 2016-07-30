const fs = require('fs');
const path = require('path');
const assert = require('assert');

const helper = require('../../helper');
const pouch = require('../../../lib/pouch-graphql/pouchdb');
const graphqlPouch = require('../../../lib/pouch-graphql');

const ENVIRONMENT = 'query-relay-tests';
const USER = {};
const TEST_FIXTURES = 'test/integration/graphql/fixtures-relay';
const ENABLE_RELAY = true;
const CUSTOM_FUNCTIONS = [];
const SCHEMA_DEFINITION = `
type Post {
  id: ID
  rev: String
  personId: ID
  title: String
  body: String
}

type Comment {
  id: ID
  rev: String
  personId: ID
  title: String
}

type Person {
  id: ID
  rev: String
  name: String
}

type Tag {
  id: ID
  value: String
}
`;

describe('GraphQL query integration (relay)', () => {
  const db = pouch.createPouchDB(ENVIRONMENT);

  before(() => {
    const post1 = {
      doctype: 'Post',
      _id: 'test1',
      title: 'title 1',
      body: 'body 1',
    };
    const post2 = {
      doctype: 'Post',
      _id: 'test2',
      title: 'title 2',
      body: 'body 2',
    };
    const post3 = {
      doctype: 'Post',
      _id: 'test3',
      title: 'title 3',
      body: 'body 3',
    };

    return db.bulkDocs([
      post1,
      post2,
      post3,
    ]);
  });

  after(() => {
    /*
      Also note that in Web SQL, the database will not really be destroyed – it will just have its tables dropped.
      This is because Web SQL does not support true database deletion.
    */
    return db.destroy();
  });

  fs.readdirSync(TEST_FIXTURES).forEach(fileName => {
    if(path.extname(fileName) === '.graphql') {
      const testName = path.basename(fileName, '.graphql');

      it(`GraphQL query ${testName}`, () => {
        const sut = graphqlPouch(ENVIRONMENT, SCHEMA_DEFINITION, ENABLE_RELAY, CUSTOM_FUNCTIONS);
        const expectedData = helper.json(`${TEST_FIXTURES}/${testName}.json`);

        const operationName = null;
        const rootValue = null;
        const contextValue = {environment: ENVIRONMENT, user: USER};
        const schemaQuery = helper.read(`${TEST_FIXTURES}/${testName}.graphql`);
        const variableValues = null;

        return sut
          .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
          .then(result => assert.deepEqual(result, expectedData));
      });
    }
  });

});