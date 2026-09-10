import { User, UserRound, Contact, PersonStanding, CircleUserRound, Smile, Cat, Dog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const AVATAR_ICONS: Record<string, LucideIcon> = {
  user: User,
  "user-round": UserRound,
  contact: Contact,
  "person-standing": PersonStanding,
  "circle-user-round": CircleUserRound,
  smile: Smile,
  cat: Cat,
  dog: Dog,
};

export const AVATAR_ICON_KEYS = Object.keys(AVATAR_ICONS);
