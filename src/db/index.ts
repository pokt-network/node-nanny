import mongoose from "mongoose";

const connect = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGO_URI);
};

const disconnect = async (): Promise<void> => {
  await mongoose.disconnect();
};

export { connect, disconnect };
