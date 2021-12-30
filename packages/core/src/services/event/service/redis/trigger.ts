import { Service as BaseService } from "./base-service";

export class Service extends BaseService {
  constructor() {
    super();
  }

  async processEvent(event) {
    console.log(event);
  }
}
