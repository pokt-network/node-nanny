import mongoose from "mongoose";
import env from "../environment";

const connect = async (): Promise<void> => {
  await mongoose.connect(env("MONGO_URI"));
};

const disconnect = async (): Promise<void> => {
  await mongoose.disconnect();
};

export { connect, disconnect };
