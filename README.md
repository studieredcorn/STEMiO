stemio v0.1
--
This repository contains the source code for two distinct projects (maybe
separate these two in the future): the stemio node.js server, and a client
created with React.js called "stemio-react-client", located inside the
react-client folder.

--

To quickly set up a locally-running server, you will want to install node.js
on your development environment, and complete the following three steps:

1. Change "stemio.org" to "localhost:49152" in line 42 of the file:

react-client/src/app-component/app-component.js

This is the base URL that the client uses to make HTTP requests to the server;
by default, it wants to talk to a stemio server located on stemio.org (which
will likely not work in most cases due to CORS shenanigans), as opposed to
the locally-running server.

2. Within the folder react-client, run the commands:

npm install
npm run build

The first one runs an npm script that installs all the prerequisite modules
(defined in packages.json) for our React client. The second runs an npm
script that transpiles the client code from JSX-, Webpack-, and Babel-
dependent javascript code into production-ready resources ready to be served
to a user's browser by the stemio server, with everything turned into
minified js scripts, css, and static files.

3. Within the base repository folder, run the commands:

mkdir public
cp -r react-client/build/* public

This copies our resources to the folder that the stemio server will look in
when searching for files to serve.

4. Within the base repository folder, run the commands:

npm install
npm start

The first one again runs an npm script that installs all the prerequisite
modules, except this time for our node.js server. The second one starts
the node.js server (entry point is defined in package.json to be bin/www).


Now, navigating your browser to localhost:49152 will hopefully connect to
your locally-running stemio server, and the server will hopefully serve up
the React client, and the React client will hopefully communicate
successfully with the server. In order to have a toy database to save/load
stemio systems from, you should type in

mongodb://<dbuser>:<dbpassword>@ds123331.mlab.com:23331/stemio-db

under where it says "Connect to system database". (You will want to replace
"<dbuser>" and "<dbpassword>" in this string with the correct username and
password for the database server.)

--

For development of the React client, you will want to go into the
react-client folder and type:

npm run start

(See README.md in the react-client folder for more details.) This starts a
development server that serves up the transpiled client javascript; this
server keeps track of changes being made to javascript files and
automatically re-transpiles the code as necessary (and re-serves the
resulting code to a browser). To access this local server, navigate to
localhost:3001 in the browser.
