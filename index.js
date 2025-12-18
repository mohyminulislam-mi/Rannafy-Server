// Import dependencies
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(`${process.env.STRIPE_KEY}`);

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
    const requestsCollection = database.collection("requests");
    const ordersCollection = database.collection("orders");
    const paymentCollection = database.collection("payments");

    // users data into Database
    // get user from database
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      try {
        const cursor = usersCollection.find(query).sort({ createdAt: -1 });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });
    app.get("/users/email", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    app.get("/users/:email/role", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ role: user?.role || "user" });
    });
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
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // requests
    app.post("/requests", async (req, res) => {
      try {
        const request = req.body;

        if (!request.userEmail || !request.requestType) {
          return res.status(400).send({ message: "Invalid request data" });
        }

        const reqExists = await requestsCollection.findOne({
          userEmail: request.userEmail,
          requestType: request.requestType,
        });

        if (reqExists) {
          return res.status(409).send({
            message: "Already requested!",
          });
        }

        const result = await requestsCollection.insertOne(request);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Request failed" });
      }
    });
    // get request
    app.get("/requests", async (req, res) => {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      const result = await requestsCollection
        .find(query)
        .sort({ requestTime: -1 })
        .toArray();
      res.send(result);
    });
    app.patch("/requests/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      const result = await requestsCollection.findOneAndUpdate(
        query,
        updateDoc,
        { returnDocument: "after" }
      );
      const userQuery = { email: result.userEmail };

      const updateRoleType = {
        $set: {
          role: result.requestType,
        },
      };
      const updateRole = await usersCollection.updateOne(
        userQuery,
        updateRoleType
      );
      res.send(updateRole);
    });
    // Meals data from MongoDB
    app.get("/meals", async (req, res) => {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.chefEmail = email;
      }
      const result = await mealsCollection.find(query).toArray();
      res.send(result);
    });
    // latest meals for home page
    app.get("/latest-meals", async (req, res) => {
      const cursor = mealsCollection.find().limit(8).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.findOne(query);
      res.send(result);
    });
    app.post("/meals", async (req, res) => {
      const meal = req.body;
      const result = await mealsCollection.insertOne(meal);
      console.log("result", result);
      res.send(result);
    });
    app.delete("/meals/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      const result = await mealsCollection.updateOne(query, updateDoc);
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
    app.get("/meals-reviews", async (req, res) => {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      const result = await mealsReviewsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });
    app.post("/meals-reviews", async (req, res) => {
      const { mealId, mealName, userName, userEmail, UserPhoto, text, rating } =
        req.body;
      if (!mealId || !text || !rating) {
        return res.status(400).send({ message: "Invalid review data" });
      }
      // const formattedDate = dayjs().format("MMM D, YYYY h:mm A");
      const UserReviews = {
        mealId: new ObjectId(mealId),
        mealName,
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
    app.delete("/meals-reviews/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await mealsReviewsCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/meals-reviews/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      const result = await mealsReviewsCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.get("/favorites", async (req, res) => {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
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
    app.delete("/favorites/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await favoritesCollection.deleteOne(query);
      res.send(result);
    });
    // order data from UI
    app.get("/orders", async (req, res) => {
      const { email, mealId, chefId } = req.query;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      if (mealId) {
        query.mealId = new ObjectId(mealId);
      }

      if (chefId) {
        query.chefId = chefId;
      }

      const result = await ordersCollection
        .find(query)
        .sort({ orderTime: -1 })
        .toArray();
      res.send(result);
    });
    app.get("/orders/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });
    // order data post data
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      orders.mealId = new ObjectId(orders.mealId);
      orders.orderTime = new Date();
      orders.orderStatus = "pending";
      orders.paymentStatus = "pending";
      const result = await ordersCollection.insertOne(orders);
      res.send(result);
    });
    app.patch("/orders/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      const order = await ordersCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!order) {
        return res.send({ message: "Order not found" });
      }

      let updateDoc = {};

      // accepted
      if (status === "accepted") {
        updateDoc = {
          orderStatus: "accepted",
          paymentStatus: "payment",
        };
      }

      // cancelled
      if (status === "cancelled") {
        updateDoc = {
          orderStatus: "cancelled",
          paymentStatus: "cancelled",
        };
      }

      //  delivered
      if (status === "delivered") {
        updateDoc = {
          orderStatus: "delivered",
        };
      }

      await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateDoc }
      );

      res.send({ success: true });
    });

    //Stripe payment option setup
    app.post("/create-checkout-session", async (req, res) => {
      try {
        const paymentInfo = req.body;
        const amount = parseInt(paymentInfo.price) * 100;

        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "USD",
                unit_amount: amount,
                product_data: {
                  name: paymentInfo.mealName,
                },
              },
              quantity: 1,
            },
          ],
          customer_email: paymentInfo.userEmail,
          mode: "payment",
          metadata: {
            orderId: paymentInfo.orderId, // 🔥 IMPORTANT
            mealName: paymentInfo.mealName,
          },
          success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.SITE_DOMAIN}/dashboard/orders`,
        });

        res.send({ url: session.url });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Checkout session failed" });
      }
    });

    // payment related apis
    app.get("/payments", async (req, res) => {
      const email = req.query.email;
      const query = {};
      // if (email) {
      //   query.customerEmail = email;
      // check email address
      // if (email !== req.decoded_email) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }
      // }
      const cursor = paymentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch("/payment-success", async (req, res) => {
      try {
        const sessionId = req.query.session_id;
        if (!sessionId) {
          return res.status(400).send({ error: "session_id missing" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
          return res.send({ success: false });
        }

        const transactionId = session.payment_intent;

        //  double payment check
        const exist = await paymentCollection.findOne({ transactionId });
        if (exist) {
          return res.send({
            success: true,
            payment: exist,
            message: "already processed",
          });
        }

        //  order status
        const orderId = session.metadata.orderId;
        await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { paymentStatus: "paid" } }
        );

        //  payment
        const payment = {
          amount: session.amount_total / 100,
          currency: session.currency,
          customerEmail: session.customer_email,
          orderId,
          mealName: session.metadata.mealName,
          transactionId,
          paymentStatus: session.payment_status,
          paidAt: new Date(),
        };

        const result = await paymentCollection.insertOne(payment);

        return res.send({
          success: true,
          payment: {
            _id: result.insertedId,
            ...payment,
          },
        });
      } catch (err) {
        console.error("payment-success error:", err);
        res.status(500).send({ error: "payment failed" });
      }
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
