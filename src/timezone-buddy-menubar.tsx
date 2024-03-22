import { Icon, LocalStorage, MenuBarExtra, Image } from "@raycast/api";
import { useEffect, useState } from "react";

interface TimezoneBuddy {
  name: string;
  twitter_handle?: string;
  tz: string;
  avatar: string;
}

function formatZoneName(zoneName: string): string {
  return zoneName.replaceAll("_", " ");
}

function getHourForTz(tz: string): number {
  const formatter = new Intl.DateTimeFormat(["en-GB"], {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  });

  return Number(formatter.format(new Date()));
}

function getTooltipForTz(tz: string) {
  const hour = getHourForTz(tz);

  if (hour >= 5 && hour <= 7) {
    return "It's early, they might be sleeping";
  }

  if (hour >= 8 && hour < 9) {
    return "It's early, they might be busy";
  }

  if (hour >= 9 && hour <= 18) {
    return "It's a good time to reach out";
  }

  if (hour >= 19 && hour < 23) {
    return "It's getting late, they might be busy";
  }

  return "It's late, they might be sleeping";
}

function getCurrentTimeForTz(tz: string): string {
  const formatter = new Intl.DateTimeFormat([], {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
  });
  return formatter.format(new Date());
}

export default function Command() {
  const [buddies, setBuddies] = useState<TimezoneBuddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getBuddies() {
      const buddies = await LocalStorage.getItem<string>("buddies");

      if (buddies) {
        setBuddies(JSON.parse(buddies));
      }

      setLoading(false);
    }

    getBuddies();
  }, []);

  return (
    <MenuBarExtra icon={Icon.TwoPeople} tooltip="Your buddies" isLoading={loading}>
      {!buddies.length && <MenuBarExtra.Item title="No buddies added" icon={Icon.RemovePerson} onAction={() => {}} />}
      {buddies &&
        buddies.map((buddy, index) => (
          <MenuBarExtra.Item
            key={index}
            title={buddy.name}
            subtitle={" – " + getCurrentTimeForTz(buddy.tz) + " (" + formatZoneName(buddy.tz) + ")"}
            icon={{ source: buddy.avatar, mask: Image.Mask.Circle }}
            tooltip={getTooltipForTz(buddy.tz)}
            onAction={() => {}}
          />
        ))}
    </MenuBarExtra>
  );
}
