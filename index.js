// Import dependencies
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const dayjs = require("dayjs");
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
    const mealsReviewsCollection = database.collection("mealsReviews");
    const favoritesCollection = database.collection("favorites");
    const ordersCollection = database.collection("orders");

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
    // latest meals for home page
    app.get("/latest-meals", async (req, res) => {
      try {
        const cursor = mealsCollection.find().limit(8);
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

    // user reviews for single meals
    // get reviews apis
    app.get("/meals-reviews/:mealId", async (req, res) => {
      const mealId = req.params.mealId;
      const query = { mealId: new ObjectId(mealId) };
      const cursor = mealsReviewsCollection.find(query).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/meals-reviews", async (req, res) => {
      const { mealId, userName, userEmail, UserPhoto, text, rating } = req.body;

      if (!mealId || !text || !rating) {
        return res.status(400).send({ message: "Invalid review data" });
      }
      // const formattedDate = dayjs().format("MMM D, YYYY h:mm A");
      const UserReviews = {
        mealId: new ObjectId(mealId),
        userName,
        userEmail,
        UserPhoto,
        text,
        rating,
        createdAt: new Date(),
      };
      const result = await mealsReviewsCollection.insertOne(UserReviews);
      res.send(result);
    });

    app.get("/favorites", async (req, res) => {
      const favorite = req.query;
      const query = {};
      const cursor = favoritesCollection.find(query).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/favorites", async (req, res) => {
      const favorite = req.body;
      favorite.createdAt = new Date();
      favorite.mealId = new ObjectId(favorite.mealId);
      if (!favorite.mealId) {
        return res.status(400).send({ message: "Invalid favorite data" });
      }

      //  check already in favorites
      const favoriteExists = await favoritesCollection.findOne({
        mealId: favorite.mealId,
        userEmail: favorite.userEmail,
      });

      if (favoriteExists) {
        return res.send({ message: "Already in favorites" });
      }

      const result = await favoritesCollection.insertOne(favorite);
      res.send({ message: "Added successfully", result });
    });

    // order data from UI
    app.get("/dashboard/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = {};
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // order data post data
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      orders.orderTime = new Date();
      orders.orderStatus = "pending";
      const result = await ordersCollection.insertOne(orders);
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
