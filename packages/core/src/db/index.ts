import mongoose from "mongoose";
import Env from "../environment";

const connect = async (): Promise<void> => {
  await mongoose.connect(Env("MONGO_URI"));
};

const disconnect = async (): Promise<void> => {
  await mongoose.disconnect();
};

export { connect, disconnect };
