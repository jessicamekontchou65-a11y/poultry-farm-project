import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Model } from "mongoose";
import { schemaNames } from "../database/schema-names";
import { User } from "../database/schemas";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    @InjectModel(schemaNames.User) private readonly userModel: Model<User>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_ACCESS_SECRET", "change_me_access_secret")
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel
      .findById(payload.sub)
      .select("-passwordHash")
      .lean();

    if (!user || user.status === "suspended") {
      throw new UnauthorizedException("User is not authorized");
    }

    return {
      id: String(user._id),
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      status: user.status,
      isVerified: user.isVerified,
      roleVerificationStatus: user.roleVerificationStatus
    };
  }
}
