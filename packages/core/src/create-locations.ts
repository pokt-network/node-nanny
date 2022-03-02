import { Types } from "mongoose";
import { connect, disconnect } from "./db";
import { LocationsModel, HostsModel } from "./models";

(async () => {
  await connect();

  // const locations = ["NL", "LI", "DE", "USE1", "USE2", "USW2", "HK", "LDN", "SG"];

  // for await (const location of locations) {
  //   await LocationsModel.create({ name: location });
  // }

  const hosts = await HostsModel.find({});
  console.log("FOUND", hosts.length, "HOSTS");

  for await (const host of hosts) {
    const hostLocation = host.internalHostName?.split(".")[1];
    const hostLocationCode = {
      "us-east-2": "USE2",
      "ap-southeast-1": "APSE1",
      "us-west-2": "USW2",
    }[hostLocation];
    if (hostLocationCode) {
      const [{ _id }] = await LocationsModel.find({ name: hostLocationCode as any });
      // console.log({ hostLocation, hostLocationCode, location });

      await HostsModel.updateOne(
        { _id: host.id },
        { location: new Types.ObjectId(_id) as any },
      );
    }
  }

  await disconnect();
})();
