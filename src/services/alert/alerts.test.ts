import { Service } from "./service";
import { Webhooks } from "./types";
import { DataDogTypes } from "../../types";
const alert = new Service();

test.skip("send discord alert", async () => {
  const response = await alert.sendDiscordMessage({
    title: "test message",
    color: DataDogTypes.AlertColor.SUCCESS,
    channel: Webhooks.WEBHOOK_ERRORS_TEST,
    fields: [
      {
        name: "fieldName1",
        value: "content1"
      },
      {
        name: "fieldName2",
        value: "content2"
      }
    ]
  })
  expect(response).toBe(true);
});
