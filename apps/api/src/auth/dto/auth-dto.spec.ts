import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LoginDto } from "./login.dto";
import { RegisterDto } from "./register.dto";

describe("DTO d’authentification", () => {
  it("normalise l’adresse e-mail de connexion", async () => {
    const dto = plainToInstance(LoginDto, {
      email: "  ADMIN@SAHELIA.AI ",
      password: "mot-de-passe",
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.email).toBe("admin@sahelia.ai");
  });

  it("exige un mot de passe d’inscription d’au moins 12 caractères", async () => {
    const dto = plainToInstance(RegisterDto, {
      email: "client@sahelia.ai",
      password: "trop-court",
      name: "Client Test",
      businessName: "Entreprise Test",
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "password")).toBe(true);
  });
});
