import {
  NavigationBarLeft,
  NavigationBarRight,
} from "@/components/navigation-bar";
import { UserMenu } from "./user-menu";

export default function ApplicationHeader() {
  const user = {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  };

  return (
    <>
      <NavigationBarLeft>
        <h1 className="text-4xl font-bold capitalize"> Hello, {user.name} </h1>
      </NavigationBarLeft>
      <NavigationBarRight>
        <UserMenu user={user} />
      </NavigationBarRight>
    </>
  );
}
