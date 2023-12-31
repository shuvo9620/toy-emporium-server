const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r3b4drv.mongodb.net/?retryWrites=true&w=majority`;


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

        const toyCollection = client.db("toyEmporium").collection('toys');

        app.get('/toys', async (req, res) => {
            const cursor = toyCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/toydetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.findOne(query);
            res.send(result);
        })
        //search
        app.get('/searchToy/:name', async (req, res) => {
            const searchName = req.params.name;
            const result = await toyCollection
                .find({ name: { $regex: searchName, $options: 'i' } })
                .toArray();
            res.send(result);
            console.log(result);
        });

        //limit
        app.get('/allToy', async (req, res) => {
            const limitToy = parseInt(req.query.limit);
            const result = await toyCollection.find({}).limit(limitToy).toArray();
            res.send(result);
        });

        //add a toy
        app.post('/addToy', async (req, res) => {
            console.log(req.body)
            const addToy = req.body;
            const result = await toyCollection.insertOne(addToy);
            res.send(result);
        });

        app.get('/my_toy/:email', async (req, res) => {
            const { sortBy: sortByPrice, sortOrder: sortingOrder } = req.query;
            const sortingOptions = {};

            if (sortByPrice === "price") {
                sortingOptions["price"] = sortingOrder === 'desc' ? -1 : 1;
            }

            try {
                const result = await toyCollection
                    .find({ 'sellerEmail': req.params.email })
                    .toArray();

                result.forEach(toys => {
                    toys.price = parseInt(toys.price);
                });

                if (sortByPrice === "price") {
                    result.sort((x, y) => {
                        return sortingOrder === 'desc' ? y.price - x.price : x.price - y.price;
                    });
                }
                res.send(result);
            } catch (error) {
                console.error('Error retrieving:', error);
                res.status(500).send('Internal Server');
            }
        });
        // update method
        app.put('/updateToy/:id', async (req, res) => {
            const id = req.params.id;
            const bodyField = req.body;
            const filterById = { _id: new ObjectId(id) };
            const updateMyToy = {
                $set: {
                    "price": bodyField.price,
                    "quantity": bodyField.quantity,
                    "description": bodyField.description,
                }
            };
            const result = await toyCollection.updateOne(filterById, updateMyToy);
            res.send(result);
        });

        // Delete
        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('toys are dancing')
})

app.listen(port, () => {
    console.log(`toy emporium server is running on port ${port}`);
})