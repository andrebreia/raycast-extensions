import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  useNavigation,
  LocalStorage,
  confirmAlert,
  Alert,
  showToast,
  Toast,
  Image,
} from "@raycast/api";
import { getAvatarIcon } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";
import { getCurrentTimeForTz } from "./helpers/getCurrentTimeForTz";
import { getOffsetForTz } from "./helpers/getOffsetForTz";
import { formatZoneName } from "./helpers/formatZoneName";
import { getTooltipForTz } from "./helpers/getTooltipForTz";
import { TimezoneBuddy } from "./interfaces/TimezoneBuddy";
import { getColorForTz } from "./helpers/getColorForTz";
import { getIconForTz } from "./helpers/getIconForTz";

const ALL_TIMEZONES = Intl.supportedValuesOf("timeZone");

function CreateBuddyForm(props: { onCreate: (buddy: TimezoneBuddy) => void }): JSX.Element {
  const { pop } = useNavigation();
  const allTimezones = useMemo(() => ALL_TIMEZONES, []);
  const [nameError, setNameError] = useState<string | undefined>();
  const nameRequiredError = "The name field is required";

  function dropNameErrorIfNeeded() {
    if (nameError && nameError.length > 0) {
      setNameError(undefined);
    }
  }

  function handleSubmit(values: { name: string; twitter_handle: string; timezone: string }): void {
    if (values.name?.length == 0) {
      setNameError(nameRequiredError);
      return;
    }

    props.onCreate({
      name: values.name,
      twitter_handle: values.twitter_handle || "",
      tz: values.timezone,
      avatar: values.twitter_handle
        ? `https://unavatar.io/twitter/${values.twitter_handle}?fallback=https://source.boringavatars.com/beam/${values.twitter_handle}`
        : getAvatarIcon(values.name),
    });
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Buddy" onSubmit={handleSubmit} icon={Icon.AddPerson} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        error={nameError}
        onChange={dropNameErrorIfNeeded}
        onBlur={(event) => {
          if (event.target.value?.length == 0) {
            setNameError(nameRequiredError);
          } else {
            dropNameErrorIfNeeded();
          }
        }}
      />
      <Form.TextField id="twitter_handle" title="Twitter/X handle (optional)" info="Used to fetch profile images" />
      <Form.Dropdown id="timezone" title="Select Timezone">
        {allTimezones &&
          allTimezones.map((tz: string) => <Form.Dropdown.Item value={tz} key={tz} title={formatZoneName(tz)} />)}
      </Form.Dropdown>
    </Form>
  );
}

function EditBuddyForm(props: {
  buddy: TimezoneBuddy;
  index: number;
  onUpdate: (buddy: TimezoneBuddy, index: number) => void;
}): JSX.Element {
  const { pop } = useNavigation();
  const allTimezones = useMemo(() => ALL_TIMEZONES, []);
  const [nameError, setNameError] = useState<string | undefined>();
  const nameRequiredError = "The name field is required";

  function dropNameErrorIfNeeded() {
    if (nameError && nameError.length > 0) {
      setNameError(undefined);
    }
  }

  function handleSubmit(values: { name: string; twitter_handle: string; timezone: string }): void {
    if (values.name?.length == 0) {
      setNameError(nameRequiredError);
      return;
    }

    props.onUpdate(
      {
        name: values.name,
        twitter_handle: values.twitter_handle || "",
        tz: values.timezone,
        avatar: values.twitter_handle
          ? `https://unavatar.io/twitter/${values.twitter_handle}?fallback=https://source.boringavatars.com/beam/${values.twitter_handle}`
          : getAvatarIcon(values.name),
      },
      props.index,
    );
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update Buddy" onSubmit={handleSubmit} icon={Icon.Pencil} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        defaultValue={props.buddy.name}
        error={nameError}
        onChange={dropNameErrorIfNeeded}
        onBlur={(event) => {
          if (event.target.value?.length == 0) {
            setNameError(nameRequiredError);
          } else {
            dropNameErrorIfNeeded();
          }
        }}
      />
      <Form.TextField
        id="twitter_handle"
        title="Twitter/X handle (optional)"
        info="Used to fetch profile images"
        defaultValue={props.buddy.twitter_handle}
      />
      <Form.Dropdown id="timezone" title="Select Timezone" defaultValue={props.buddy.tz}>
        {allTimezones &&
          allTimezones.map((tz: string) => <Form.Dropdown.Item value={tz} key={tz} title={formatZoneName(tz)} />)}
      </Form.Dropdown>
    </Form>
  );
}

function CreateBuddyAction(props: { onCreate: (buddy: TimezoneBuddy) => void }) {
  return (
    <Action.Push
      icon={Icon.AddPerson}
      title="Add Buddy"
      shortcut={{ modifiers: ["cmd"], key: "n" }}
      target={<CreateBuddyForm onCreate={props.onCreate} />}
    />
  );
}

function EditBuddyAction(props: {
  index: number;
  buddy: TimezoneBuddy;
  onUpdate: (buddy: TimezoneBuddy, index: number) => void;
}) {
  return (
    <Action.Push
      icon={Icon.Pencil}
      title={'Edit "' + props.buddy.name + '"'}
      shortcut={{ modifiers: ["cmd"], key: "e" }}
      target={<EditBuddyForm buddy={props.buddy} index={props.index} onUpdate={props.onUpdate} />}
    />
  );
}

function DeleteBuddyAction(props: { onDelete: () => void }) {
  return (
    <Action
      icon={Icon.Trash}
      title="Delete Buddy"
      style={Action.Style.Destructive}
      shortcut={{ modifiers: ["ctrl"], key: "x" }}
      onAction={props.onDelete}
    />
  );
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

  async function handleCreate(buddy: TimezoneBuddy) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Adding buddy...",
    });

    try {
      const newBuddies = [...buddies, buddy];
      setBuddies(newBuddies);
      await LocalStorage.setItem("buddies", JSON.stringify(newBuddies));

      toast.style = Toast.Style.Success;
      toast.title = "Buddy added";
    } catch (err) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to add buddy";
      if (err instanceof Error) {
        toast.message = err.message;
      }
    }
  }

  async function handleUpdate(buddy: TimezoneBuddy, index: number) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Updating buddy...",
    });
    console.log(buddy, index);
    try {
      const newBuddies = [...buddies];
      newBuddies.splice(index, 1, buddy);
      setBuddies(newBuddies);
      await LocalStorage.setItem("buddies", JSON.stringify(newBuddies));

      toast.style = Toast.Style.Success;
      toast.title = "Buddy updated";
    } catch (err) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to update buddy";
      if (err instanceof Error) {
        toast.message = err.message;
      }
    }
  }

  async function handleDelete(index: number) {
    if (
      await confirmAlert({
        title: "Delete this buddy?",
        message: "This action cannot be undone.",
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      })
    ) {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Deleting buddy...",
      });

      try {
        const newBuddies = [...buddies];
        newBuddies.splice(index, 1);
        setBuddies(newBuddies);
        await LocalStorage.setItem("buddies", JSON.stringify(newBuddies));

        toast.style = Toast.Style.Success;
        toast.title = "Buddy deleted";
      } catch (err) {
        toast.style = Toast.Style.Failure;
        toast.title = "Failed to delete buddy";
        if (err instanceof Error) {
          toast.message = err.message;
        }
      }
    }
  }

  return (
    <List
      isLoading={loading}
      navigationTitle={`Current Time: ${new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "numeric",
      })}`}
      searchBarPlaceholder="Search your buddies..."
      actions={
        <ActionPanel>
          <CreateBuddyAction onCreate={handleCreate} />
        </ActionPanel>
      }
    >
      {buddies &&
        buddies.map((buddy, index) => (
          <List.Item
            key={index}
            title={buddy.name}
            subtitle={getOffsetForTz(buddy.tz)}
            icon={{ source: buddy.avatar, mask: Image.Mask.Circle }}
            accessories={[
              {
                text: formatZoneName(buddy.tz),
              },
              {
                tag: {
                  value: getCurrentTimeForTz(buddy.tz),
                  color: getColorForTz(buddy.tz),
                },
                tooltip: getTooltipForTz(buddy.tz),
                icon: getIconForTz(buddy.tz),
              },
            ]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <CreateBuddyAction onCreate={handleCreate} />
                  <EditBuddyAction index={index} buddy={buddy} onUpdate={handleUpdate} />
                  <DeleteBuddyAction onDelete={() => handleDelete(index)} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}
