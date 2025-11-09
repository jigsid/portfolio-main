import {
  HomeIcon,
  Newspaper,
  NotebookIcon,
} from "lucide-react";
import { Icons } from "@/components/icons";
import { DATA } from "./site.config";

export const navItems = [
  {
    link: "/",
    icon: <HomeIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
    name: "home",
    external: false,
  },
  {
    link: "/blog",
    icon: <NotebookIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
    name: "blogs",
    external: false,
  },
  {
    link: "/guestbook",
    icon: <Newspaper className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
    name: "guestbook",
    external: false,
  },
  {
    link: DATA.contact.social.GitHub.url,
    icon: <Icons.github className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
    name: "github",
    external: true,
  },
  {
    link: DATA.contact.social.LinkedIn.url,
    icon: <Icons.linkedin className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
    name: "linkedin",
    external: true,
  },
  {
    link: DATA.contact.social.X.url,
    icon: <Icons.x className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
    name: "x",
    external: true,
  },
  {
    link: `mailto:${DATA.contact.email}`,
    icon: <Icons.email className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
    name: "email",
    external: true,
  },
];
