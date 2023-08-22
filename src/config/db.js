const mongoose = require("mongoose");

const connectMongo = () => {
  mongoose.set("strictQuery", true);
  mongoose
    .connect(`${process.env.MONGO_URI}`, {
      useNewURLParser: true,
      useUnifiedTopology: true,
    })
    .then((conn) => {
      console.log(`Connected to: ${conn.connection.host}!`);
    });
};

module.exports = { connectMongo };
