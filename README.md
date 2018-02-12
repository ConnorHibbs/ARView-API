# ARView API

## Description
This project is for the GraphQL API for the Social AR project for Software Architecture. It is responsible for implementing the API needed for the various mobile clients.

## Resources
API Specification: https://goo.gl/R7zEio


# Quick Start Guide

This guide is for understanding how to interact with the data through the API. If you already have a database running and can modify the following calls to suit your needs, please skip the next section. If you want to get the database and API running locally, and fill the database with the test data used in this example, then the next section is just for you.

##Setting Up With Sample Data
1. Install Neo4J https://neo4j.com/
You just need the desktop version, not the server or enterprise version

2. Create a new local database in Neo4J.
	Enter anything for the database name and description.
    
3. When it is done, install the APOC plugin.
      * Select your project, your database, and click Manage
      * Click the “Plugnis” tab
      * Under APOC, click “Install”
      ( It might take a little bit to install, and might require a restart.

4. When it is finished installing, go ahead and click “Start”. It will take a couple of seconds to start. 
After that, go ahead of an click “Manage” > “Open Browser”. 

5. For the first time running a database, it will ask you to log in. The URL and username should be filled in with “https://127.0.0.1:8080” and “neo4j”. You should keep the defaults. The default password is “neo4j”. When you enter it, the program will prompt you for a new password. The API is expecting “password” and the password, so you should use this as well. After you enter the password, a panel will pop up showing resources for learning how to use Neo4J. At this point, you are in the Browser.

6. This page is like a console for the database. It allows queries to be entered and executed, directly on the database without an API in between. The language they use for querying is called “Cypher”, and was made by Neo4J for Neo4J. I recommend learning a little more about how it works (but is not needed to run the API).

7. Clone the Github repository. https://github.com/chibbs96/ARView-API
Once inside the project, run “npm install” to install the dependencies needed for the project. The project is started with “npm run start” which uses nodemon to auto recompile the project every time the project is saved.

8. The URL for the database (assuming the default one is used) is already programmed into the API. By default, the API runs on “localhost:8080”. The two end-points that are exposed are “/graphiql” and “/api/v1”. To interact with the API you can use the browser test page at “/graphiql”, but to test the API with your own queries (from your own tool such as Postman, Insomnia, or AJAX) you will need to use “/api/v1”.




## Importing Data:
Data can be entered manually through the API, but sometimes it would be easier to bulk import data in the beginning of the database. This can be done with CSV files and some Cypher commands.
#### Load in the data for the users
Make sure the server is running, and then open the browser.
Execute the command
```
LOAD CSV WITH HEADERS FROM "https://pastebin.com/raw/bqt67hPi" AS line 
CREATE (u:User)
SET u += line
RETURN u
```
It should spin for a second or two, then it should return 26 new users. Clicking on them should reveal their properties in the white bar under the graph.
If it doesn’t work, you can clear the users with `MATCH (u:User) DELETE u`
It isn’t efficient at all, but with a small dataset it is the easiest way

#### Load the data for the tags
Make sure the server is running, and then open the browser.
Execute the following command
```
LOAD CSV WITH HEADERS FROM "https://pastebin.com/raw/rvqkq1dL" AS line
CREATE (t:Tag)
SET t.lat = toFloat(line.lat)
SET t.lon = toFloat(line.lon)
SET t.ele = toFloat(line.elevation)
SET t.title = line.title
SET t.text = line.text
SET t.username = line.username
SET t.dtg = line.dtg
RETURN t
```
If it doesn’t work, you can clear all of the tags with `MATCH (t:Tag) DELETE t`

#### Create the relationships between the users and the tags
Make sure the server is running, and both the users and tags have been imported.
Execute the following command
```
MATCH (u:User), (t:Tag)
WHERE u.username = t.username
WITH u, t
CREATE (u)-[:TAGGED]->(t)
CREATE (t)-[:TAGGED_BY]->(u)
RETURN u, t
```
It should return saying that it created 2000 new relationships.
To delete these relationships, execute the command below
`
MATCH (u)-[r1:TAGGED]->(t)
MATCH (t)-[r2:TAGGED_BY]->(u)
DELETE r1, r2
`
At this point, the database should have 26 unique users, and 1000 unique tags, as well as all of the relationships between them. The API sample code should work against this data set.

## Testing API
There are a couple of different ways to test the API.
* In browser, go to "localhost:8080/graphiql" and execute test queries exactly as they are written
* In Insomnia, specify the URL "localhost:8080/api/v1" and execute test queries exactly as they are writte
* In Postman or Javascript, make a POST request to "localhost:8080/api/v1" with a JSON body. The body should have a single element "query" as the root, and the text being the query exactly as they are written

##My First Query
To verify that the database and API are running as expected, you can execute the following query.

```
query {
	allUsers {
    	username
        name
	}
}
```
This should return all of the users (and their names / usernames) as a JSON array

To query with specific variables, you can specify those in parentheses like below.
```
query {
	getUser(username: "Alex") {
    	name
        username
    }
}
```
This should return a single user, Alex, with the username and name both being "Alex"



##My First Mutation
Mutations work very similarly to queries in GraphQL.


## Examples
#### Example for in-browser Javascript using XMLHttpRequest
```javascript
let URL = "http://localhost:8080/api/v1";
let query = `
query {
    allUsers() {
        username
        name
        picture
    }
}
`;
let mutation =  `
mutation {
    createUser(
        username: "chibbs",
        name: "Connor",
        picture: "https://cdn1.iconfinder.com/data/icons/user-pictures/101/malecostume-512.png"
    ) {
        username
        name
        picture
    }
}
`;

function callAjax(url, query, callback){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            callback(xmlhttp.responseText);
        }
    }
    xmlhttp.open("POST", url, true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(JSON.stringify( {query: query} ));
}


callAjax(URL, query, (text) => console.log(text));
callAjax(URL, mutation, (text) => console.log(text));
```

#### Example using JQuery AJAX
```javascript
// Assuming there are input fields with the ID latField, lonField, and radiusField
let lat = $("#latField")[0].value;
let lon = $("#lonField")[0].value;
let radius = $("#radiusField")[0].value;

// Print out the values being used
console.log(lat, lon, radius);

let query = `
query {
	getTagsByLocation(lat: ${lat}, lon: ${lon}, radius: ${radius}) {
    	_id
        lat
        lon
        ele
        title
        text
        username
        dtg
    }
}
`;

$.ajax({
    url: "http://localhost:8080/api/v1",
    data: JSON.stringify({query: mutation}),
    async: true,
    type: "POST",
    contentType: "application/json",
    success: handleSuccess,
    error: handleError
});

function handleSuccess(response) {
	console.log("Success!");
    console.log(response);
}

function handleError(response) {
	console.log("Error", response);
}
```


### Revision History
|Change                   | Date    | By           |
|-------------------------|---------|--------------|
|Quick Start Guide added  | 2/12/18 | Connor Hibbs |
|Created                  | 1/23/18 | Connor Hibbs |
