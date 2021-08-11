import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

const url =
  "mongodb+srv://test:test123@cluster0.iubac.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDB = async (operation, res) => {
  try {
    const client = await MongoClient.connect(url, {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");

    await operation(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to the db", error });
  }
};

app.get("/api/projects/:name", async (req, res) => {
  withDB(async (db) => {
    const projectName = req.params.name;

    const projectInfo = await db
      .collection("projects")
      .findOne({ name: projectName });

    res.status(200).json(projectInfo);
  }, res);
});

app.post("/api/projects/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const projectName = req.params.name;
    const projectInfo = await db
      .collection("projects")
      .findOne({ name: projectName });
    await db.collection("projects").updateOne(
      { name: projectName },
      {
        $set: { upvotes: projectInfo.upvotes + 1 },
      }
    );
    const updatedProjectInfo = await db
      .collection("projects")
      .findOne({ name: projectName });
    res.status(200).json(updatedProjectInfo);
  }, res);
});

app.post("/api/projects/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const projectName = req.params.name;

  withDB(async (db) => {
    const projectInfo = await db
      .collection("projects")
      .findOne({ name: projectName });
    await db.collection("projects").updateOne(
      { name: projectName },
      {
        $set: { comments: projectInfo.comments.concat({ username, text }) },
      }
    );
    const updatedProjectInfo = await db
      .collection("projects")
      .findOne({ name: projectName });

    res.status(200).json(updatedProjectInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on port 8000"));
