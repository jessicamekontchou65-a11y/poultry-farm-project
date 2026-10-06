import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return {
      data: {
        status: "ok",
        service: "poultryhub-api",
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get("version")
  version() {
    return {
      data: {
        name: "PoultryHub API",
        version: "0.1.0",
        stack: "NestJS + MongoDB"
      }
    };
  }
}
