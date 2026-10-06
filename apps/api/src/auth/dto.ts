import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf
} from "class-validator";
import { Transform } from "class-transformer";

const ACCOUNT_ROLES = ["customer", "farmer", "shopkeeper"] as const;

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  @IsIn(ACCOUNT_ROLES, {
    message: "role must be one of the following values: customer, farmer, shopkeeper"
  })
  role: (typeof ACCOUNT_ROLES)[number];

  /** Required for farmer and shopkeeper — official proof document as data URL */
  @ValidateIf((o: RegisterDto) => o.role === "farmer" || o.role === "shopkeeper")
  @IsString()
  verificationDocument?: string;

  @ValidateIf((o: RegisterDto) => o.role === "farmer" || o.role === "shopkeeper")
  @IsString()
  verificationDocumentName?: string;

  @IsOptional()
  @IsString()
  verificationDocumentMimeType?: string;
}

export class LoginDto {
  @IsString()
  identifier: string;

  @IsString()
  password: string;
}
