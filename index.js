const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjbjloq.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


//---------------------------- generate Chef ID--------------------------------------
function generateChefCode() {
  return "CHEF" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("local_chef_bazar_db");
    const userCollection = db.collection("users");
    const mealCollection = db.collection("meals");
    const reviewCollection = db.collection("reviews");
    const favoriteCollection = db.collection("favorite");
    const orderCollection = db.collection("orders");
    const roleRequestCollection = db.collection("role-request");

    // ------------------------user related api--------------------------------
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      console.log(userInfo);
      const email = userInfo.email;
      userInfo.role = "user";
      userInfo.status = "active";
      userInfo.createdAt = new Date();

      const userExist = await userCollection.findOne({ email: email });
      if (userExist) {
        res.send("user already exist");
      }
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const {email} = req.query
      const query = {}
      if(email){
        query.email = email
      }
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get user role 
    app.get('/user/:email/role',async(req,res)=>{
      const email = req.params.email;
      const query = {email:email};
      const user = await userCollection.findOne(query);
      res.send(user);
    })

    // ------------------------------meals related api-----------------------------------------
    app.post('/meals',async(req,res)=>{
      const mealInfo = req.body;
      const result = await mealCollection.insertOne(mealInfo);
      res.send(result);
    })

    app.patch('/meal/:id',async(req,res)=>{
      const id= req.params.id;
      const query = {_id:new ObjectId(id)};
      const UpdatedMealInfo = req.body;
      const update = {
        $set:UpdatedMealInfo
      }
      const result = await mealCollection.updateOne(query,update);
      res.send(result);
    })


      app.delete('/meal/:id',async(req,res)=>{
      const id= req.params.id;
      const query = {_id:new ObjectId(id)};
      const result = await mealCollection.deleteOne(query);
      res.send(result);
    })

    
    app.get("/meals", async (req, res) => {
      const { sortOrder,chefEmail } = req.query;
      console.log("Sort order:", sortOrder);
      
      const query = {};
      let sortOption = {};
      if(chefEmail){
        query.chefEmail = chefEmail;
      }
      if (sortOrder === "Sort By Ascending") {
        sortOption = { price: 1 }; // ascending
      } else if (sortOrder === "Sort By Descending") {
        sortOption = { price: -1 }; // descending
      }

      const cursor = mealCollection.find(query).sort(sortOption);
      const result = await cursor.toArray();
      res.send(result);
    });

    // meals by id
    app.get("/meal/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealCollection.findOne(query);
      res.send(result);
    });

    // ---------------------------------reviews related Api----------------------------
    app.post("/reviews", async (req, res) => {
      const reviewInfo = req.body;
      reviewInfo.date = new Date();
      const result = await reviewCollection.insertOne(reviewInfo);
      res.send(result);
    });


    app.patch('/reviews/:id',async(req,res)=>{
      const id = req.params.id;
      const updatedReview = req.body;
      const query = {_id:new ObjectId(id)};
      const update = {
        $set:updatedReview
      }
      const result = await reviewCollection.updateOne(query,update);
      res.send(result);
    })

    app.delete('/reviews/:id',async(req,res)=>{
      const id= req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    })

    app.get("/reviews", async (req, res) => {
      const { foodId,reviewerEmail } = req.query;
      const query = {};
      if (foodId) {
        query.foodId = foodId;
      }
      if(reviewerEmail){
        query.reviewerEmail = reviewerEmail;
      }
      const result = await reviewCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    //--------------------- favorite food related apis--------------------

    app.post("/favorite-food", async (req, res) => {
      const favoriteInfo = req.body;
      const { userEmail, foodId } = favoriteInfo;
      const exits = await favoriteCollection.findOne({ userEmail, foodId });
      if (exits) {
        return res.send("user already exits");
      }
      favoriteInfo.addedTime = new Date();
      const result = await favoriteCollection.insertOne(favoriteInfo);
      res.send(result);
    });

    app.get('/favorite-food',async(req,res)=>{
      const {userEmail} = req.query;
      const query = {}
      if(userEmail){
        query.userEmail = userEmail
      }
      const cursor = favoriteCollection.find(query).sort({addedTime:-1});
      const result = await cursor.toArray();
      res.send(result);
    })

    app.delete('/favorite-food/:id',async(req,res)=>{
      const id= req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await favoriteCollection.deleteOne(query);
      res.send(result);
    })



    // ------------------------------------order related apis-----------------------------------

    // meal order request by chef id
  
    app.post("/orders", async (req, res) => {
      const orderInfo = req.body;
      const result = await orderCollection.insertOne(orderInfo);
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
     const {userEmail,chefId} = req.query;
     const query = {}
     if(userEmail){
      query.userEmail = userEmail;
     }
     if(chefId){
      query.chefId = chefId
     }
     const cursor = orderCollection.find(query).sort({orderTime:-1})
     const result = await cursor.toArray();
     res.send(result);
      
    });


    // accept order
    app.patch('/order/accept/:id',async(req,res)=>{
      const id = req.params.id;
      
      const query = {_id : new ObjectId(id)}
      const update = {
        $set:{
          orderStatus:"accepted"
        }
      }
      const result = await orderCollection.updateOne(query,update);
      res.send(result);
    })
    // cancel order
    app.patch('/order/cancel/:id',async(req,res)=>{
      const id = req.params.id;
      
      const query = {_id : new ObjectId(id)}
      const update = {
        $set:{
          orderStatus:"cancelled"
        }
      }
      const result = await orderCollection.updateOne(query,update);
      res.send(result);
    })
    // deliver order
    app.patch('/order/deliver/:id',async(req,res)=>{
      const id = req.params.id;
      
      const query = {_id : new ObjectId(id)}
      const update = {
        $set:{
          orderStatus:"delivered"
        }
      }
      const result = await orderCollection.updateOne(query,update);
      res.send(result);
    })



    //------------------------------Role Request Api------------------------------------
    app.post('/role-request',async(req,res)=>{
      const roleRequestInfo = req.body;
      const  {userEmail,requestType} = roleRequestInfo;
      const exist = await roleRequestCollection.findOne({userEmail,requestType})
      if(exist){
        return res.send('Already Requested For the role wait for response');
      }
      const result = await roleRequestCollection.insertOne(roleRequestInfo);
      res.send(result)
    })


app.patch('/role-request/:id/approved', async (req, res) => {
  const id = req.params.id;
  const { requestType, userEmail } = req.body;


  const requestData = await roleRequestCollection.findOne({ _id: new ObjectId(id) });

  if (!requestData) {
    return res.status(404).send({ message: 'Request not found' });
  }

  if (requestData.requestStatus === 'approved') {
    return res.send({ alreadyApproved: true });
  }

  let updateUserResult;


  if (requestType === 'chef') {
    const chefId = generateChefCode();
    updateUserResult = await userCollection.updateOne(
      { email: userEmail },
      { $set: { role: 'chef', chefId } }
    );
  }

  if (requestType === 'admin') {
    updateUserResult = await userCollection.updateOne(
      { email: userEmail },
      { $set: { role: 'admin' } }
    );
  }

 
  const updateRequest = await roleRequestCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { requestStatus: 'approved' } }
  );

  res.send({
    updateUserResult,
    updateRequest
  });
});



app.patch('/role-request/:id/rejected',async(req,res)=>{
  const id = req.params.id;
  const request = req.body;
  const {requestStatus} = request;
  const exist = await roleRequestCollection.findOne({requestStatus:'rejected'})
  if(exist){
    return res.send('Already rejected');
  }
  const query = {_id: new ObjectId(id)};
  const update = {
    $set:{
      requestStatus:'rejected'
    }
  }
  const result = await roleRequestCollection.updateOne(query,update);
  res.send(result);
})



    
    app.get('/role-request',async(req,res)=>{
      const cursor = roleRequestCollection.find().sort({requestTime:-1});
      const result = await cursor.toArray();
      res.send(result);
    })



//-------------------------------------- chef related api-----------------------------------
 




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello hi bye");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
