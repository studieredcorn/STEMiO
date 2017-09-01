var configuration = {
  expressPort: 49152,
  wikiHostname: "https://wiki.stemio.org/index.php",
  client: { mongoDB: { defaultCollectionName: "objects",
              defaultConnectString: "mongodb://localhost:27017/stemio-db" } }
};

module.exports = configuration;
