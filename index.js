const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
app.use(express.json())
app.use(cors());
const port = process.env.PORT || 3000;






const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjbjloq.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db('local_chef_bazar_db');
    const userCollection = db.collection('users'); 
    const mealCollection = db.collection('meals'); 
    const reviewCollection = db.collection('reviews'); 


    // ------------------------user related api--------------------------------
    app.post('/users',async(req,res)=>{
        const userInfo = req.body;
        console.log(userInfo);
        const email = userInfo.email;
        userInfo.role = 'user';
        userInfo.status = 'active';
        userInfo.createdAt = new Date();  
      
        const userExist = await userCollection.findOne({email:email})
        if(userExist){
          res.send('user already exist');
        }
        const result = await userCollection.insertOne(userInfo)
        res.send(result);
    })

    app.get('/users',async(req,res)=>{
        const cursor = userCollection.find()
        const result = await cursor.toArray();
        res.send(result);
    })



    // ------------------------------meals related api-----------------------------------------
  app.get('/meals', async (req, res) => {
  const { sortOrder } = req.query; 
  console.log('Sort order:', sortOrder);

  const query = {};
  let sortOption = {}; 

  if (sortOrder === 'Sort By Ascending') {
    sortOption = { price: 1 }; // ascending
  } else if (sortOrder === 'Sort By Descending') {
    sortOption = { price: -1 }; // descending
  }

  const cursor = mealCollection.find(query).sort(sortOption);
  const result = await cursor.toArray();
  res.send(result);
});


    // meals by id
      app.get('/meal/:id',async(req,res)=>{
          const id = req.params.id;
          const query = {_id:new ObjectId(id)}
        const result = await mealCollection.findOne(query);
        res.send(result);
    })



    // ---------------------------------comments related Api----------------------------
    app.post('/reviews',async(req,res)=>{
      const reviewInfo = req.body;
      reviewInfo.date = new Date();
      const result = await reviewCollection.insertOne(reviewInfo);
      res.send(result);
    })

     app.get('/reviews',async(req,res)=>{
      const {foodId} = req.query
      const query = {}
      if(foodId){
        query.foodId= foodId
      }
      const result = (await reviewCollection.find(query).sort({date:-1}).toArray())
      res.send(result);
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);














app.get('/',(req,res)=>{
    res.send('hello hi bye')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})

