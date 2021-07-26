import { api } from "@pagerduty/pdjs";

enum PagerDutyDetails {
  BODY_TYPE = "incident_body",
  FROM = "john@pokt.network",
  SERVICE_ID = "PASFNRN",
  SERVICE_TYPE = "service_reference",
  TYPE = "incident",
}

export enum IncidentLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

class Service {
  private client: any;
  constructor() {
    this.client = api({ token: process.env.PAGER_DUTY_API_KEY });
  }

  async createIncident({ title, urgency, details }) {
    try {
      const { data } = await this.client.post("/incidents", {
        data: {
          incident: {
            type: PagerDutyDetails.TYPE,
            title,
            service: {
              id: PagerDutyDetails.SERVICE_ID,
              type: PagerDutyDetails.SERVICE_TYPE,
            },
            urgency,
            body: {
              type: PagerDutyDetails.BODY_TYPE,
              details,
            },
          },
        },
        headers: {
          From: PagerDutyDetails.FROM,
        },
      });
      return data;
    } catch (error) {
      throw new Error(`could not create pd incident ${error}`);
    }
  }
}

export { Service };
