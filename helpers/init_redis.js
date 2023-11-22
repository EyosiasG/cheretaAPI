const redis = require("redis");

const client = redis
  .createClient({
    url: process.env.REDIS_URI,
    legacyMode: true,
  })
  .on("error", (err) => console.log("Redis Client Error", err))
  .on("connect", () => {
    console.log("Client connected to redis...");
  })
  .on("ready", () => {
    console.log("Client connected to redis and ready to use...");
  })
  .on("error", (err) => {
    console.log(err.message);
  })
  .on("end", () => {
    console.log("Client disconnected from redis");
  });

client.connect();

process.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
