import type { NetworkUser } from "./networkUser";
import type { User } from "./user";

export interface UserProxy {
  id: string,
  username?: string,
  firstName?: string,
  lastName?: string,
  email?: string,
  imageUrl?: string,
  createdOn: Date,
  isDefault: boolean,
  user: User
  networkUsers: NetworkUser[];
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserSignup {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
