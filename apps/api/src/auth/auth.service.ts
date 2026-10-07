import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import bcrypt from "bcryptjs";
import { Model } from "mongoose";
import { schemaNames } from "../database/schema-names";
import { User } from "../database/schemas";
import { getJwtSecret } from "../common/jwt-secrets";
import { LoginDto, RegisterDto } from "./dto";

const MAX_VERIFICATION_DOC_CHARS = 3_500_000; // ~2.5MB base64

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(schemaNames.User) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userModel.exists({
      $or: [{ email }, ...(dto.phone ? [{ phone: dto.phone }] : [])]
    });

    if (existing) {
      throw new ConflictException("Email or phone already exists");
    }

    const needsProof = dto.role === "farmer" || dto.role === "shopkeeper";
    if (needsProof) {
      if (!dto.verificationDocument?.trim() || !dto.verificationDocumentName?.trim()) {
        throw new BadRequestException(
          dto.role === "farmer"
            ? "An official document proving you are a farmer is required"
            : "An official document proving you are a shopkeeper is required"
        );
      }
      if (!dto.verificationDocument.startsWith("data:")) {
        throw new BadRequestException("Verification document must be a valid uploaded file");
      }
      if (dto.verificationDocument.length > MAX_VERIFICATION_DOC_CHARS) {
        throw new BadRequestException("Verification document is too large (max ~2MB)");
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      fullName: dto.fullName,
      email,
      phone: dto.phone,
      passwordHash,
      roles: [dto.role],
      status: "active",
      isVerified: dto.role === "customer",
      roleVerificationStatus: needsProof ? "pending" : "not_required",
      ...(needsProof
        ? {
            verificationDocument: dto.verificationDocument,
            verificationDocumentName: dto.verificationDocumentName,
            verificationDocumentMimeType: dto.verificationDocumentMimeType
          }
        : {})
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.toLowerCase().trim();
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { phone: dto.identifier }]
    });

    if (!user || user.status === "suspended") {
      throw new UnauthorizedException("Invalid credentials");
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.issueTokens(user);
  }

  private async issueTokens(user: User & { _id?: unknown }) {
    const id = String(user._id);
    const payload = {
      sub: id,
      email: user.email,
      roles: user.roles
    };

    const accessExpiresIn = this.config.get<string>("JWT_ACCESS_EXPIRES_IN", "15m");
    const refreshExpiresIn = this.config.get<string>("JWT_REFRESH_EXPIRES_IN", "7d");
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: getJwtSecret(this.config, "JWT_ACCESS_SECRET"),
        expiresIn: accessExpiresIn as never
      }),
      this.jwtService.signAsync(payload, {
        secret: getJwtSecret(this.config, "JWT_REFRESH_SECRET"),
        expiresIn: refreshExpiresIn as never
      })
    ]);

    return {
      data: {
        user: {
          id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          roles: user.roles,
          status: user.status,
          isVerified: user.isVerified,
          roleVerificationStatus: user.roleVerificationStatus
        },
        accessToken,
        refreshToken
      }
    };
  }
}
