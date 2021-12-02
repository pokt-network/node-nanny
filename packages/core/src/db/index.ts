import mongoose from "mongoose";

const connect = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGO_URI_DEV);
};

const disconnect = async (): Promise<void> => {
  await mongoose.disconnect();
};

export { connect, disconnect };
