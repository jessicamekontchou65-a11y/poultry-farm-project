import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Authenticates when a valid bearer token is present; lets guests through as `null`. */
@Injectable()
export class OptionalJwtGuard extends AuthGuard("jwt") {
  handleRequest<TUser>(_err: unknown, user: TUser) {
    return (user || null) as TUser;
  }
}
