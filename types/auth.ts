import { User } from "firebase/auth";
import { UserData } from "./user";

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
}
