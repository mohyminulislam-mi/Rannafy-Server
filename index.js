// Import dependencies
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Create app
const app = express();
const port = process.env.PORT || 3000;

//Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@mohyminulislam.uwhwdlk.mongodb.net/?appName=Mohyminulislam`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("RannaFy");
    const usersCollection = database.collection("users");
    const mealsCollection = database.collection("meals");

    // users data into Database
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.userStatus = "active";
      user.createdAt = new Date();

      // exists user checking
      const userExists = await usersCollection.findOne({ email: user.email });
      if (userExists) {
        return res.send({ message: "User Exists" });
      }
      const result = await usersCollection.insertOne(user);
      console.log("result", result);

      res.send(result);
    });
    // get user from database
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      console.log("email", email);
      const query = {};
      if (email) {
        query.email = email;
      }
      try {
        const cursor = usersCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });

    // Meals data from MongoDB
    app.get("/meals", async (req, res) => {
      const mealsProduct = req.query;
      const query = {};
      try {
        const cursor = mealsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });
    app.get("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.findOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("Hello spicy RannaFy! 🚀");
});

// Start server
app.listen(port, () => {
  console.log(`Server running : ${port}`);
});
