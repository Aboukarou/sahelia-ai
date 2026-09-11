import { Controller, Get } from "@nestjs/common";

interface HealthResponse {
  service: "sahelia-api";
  status: "ok";
  timestamp: string;
}

@Controller("health")
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      service: "sahelia-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
