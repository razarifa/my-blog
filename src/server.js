import express from "express";
import { MongoClient } from "mongodb";
import path from "path";
const app = express();
app.use(express.static(path.join(__dirname, "/build")));
app.use(express.json());
app.use(
 express.urlencoded({
  extended: true,
 })
);
const withDb = async (operations, res) => {
 try {
  const client = await MongoClient.connect("mongodb://localhost:27017", {
   useUnifiedTopology: true,
  });
  const db = client.db("my-blog");

  await operations(db);
  client.close();
 } catch (error) {
  res
   .status(500)
   .json({ message: "Error connecting to db", error: error.message });
 }
};
// app.get("/hello", (req, res) => res.send("Hello World!"));
// app.get("/hello/:name", (req, res) => res.send(`Hello, ${req.params.name}`));
// app.post("/hello", (req, res) => res.send(`hello ${req.body.name}`));

app.get("/api/articles/:name", async (req, res) => {
 withDb(async (db) => {
  const articleName = req.params.name;

  const articleInfo = await db
   .collection("articles")
   .findOne({ name: articleName });
  res.status(200).json(articleInfo);
 }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
 const articleName = req.params.name;

 const client = await MongoClient.connect("mongodb://localhost:27017", {
  useUnifiedTopology: true,
 });
 const db = client.db("my-blog");

 withDb(async (db) => {
  const articleInfo = await db
   .collection("articles")
   .findOne({ name: articleName });

  await db.collection("articles").updateOne(
   { name: articleName },
   {
    $set: {
     upvotes: articleInfo.upvotes + 1,
    },
   }
  );
  const updatedArticleInfo = await db
   .collection("articles")
   .findOne({ name: articleName });
  res.status(200).json(updatedArticleInfo);
 }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
 withDb(async (db) => {
  const { username, text } = req.body;
  const articleName = req.params.name;
  const articleInfo = await db
   .collection("articles")
   .findOne({ name: articleName });
  await db.collection("articles").updateOne(
   { name: articleName },
   {
    $set: {
     comments: articleInfo.comments.concat({ username, text }),
    },
   }
  );
  const updatedArticleInfo = await db
   .collection("articles")
   .findOne({ name: articleName });
  res.status(200).json(updatedArticleInfo);
 }, res);
});
app.get("*", (res, req) => {
 res.sendFile(path.join(__dirname + "/build/index.html"));
});
app.listen(8000, () => console.log("Listening on port 8000!"));
