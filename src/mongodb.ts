const mongoose = require("mongoose");

export const connectToMongoDb: (mongoDbConnectionURL: string) => void =  (
  mongoDbConnectionURL: string
) => {
mongoose.connect(mongoDbConnectionURL, (err: Error) => {
    if (err) {
      console.log("COULD NOT CONNECT TO MONGODB!");
    }
  });
};
