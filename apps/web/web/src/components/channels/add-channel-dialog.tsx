import { Button } from "@chat/ui/components/button.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@chat/ui/components/dialog.tsx";
import { Input } from "@chat/ui/components/input.tsx";
import {
  RadioGroup,
  RadioGroupItem,
} from "@chat/ui/components/radio-group.tsx";
import { Loader2 } from "@chat/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meKeys } from "~/common/keys/me";
import { createChannelSchema, MAX_CHANNEL_NAME_LENGTH } from "~/common/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { client } from "~/utils/api";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type AddChannelDialogProps = React.PropsWithChildren<{ workspace: string }>;

type ChannelSchema = z.output<typeof createChannelSchema>;

export function AddChannelDialog({
  children,
  workspace,
}: AddChannelDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useMutation({
    mutationKey: ["channels", "create", { workspace }],
    mutationFn: async (values: ChannelSchema) => {
      const response = await client.api.channels.$post({
        query: { workspace },
        json: {
          name: values.name,
          type: values.type,
        },
      });

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Channel created successfully");
      queryClient.invalidateQueries({
        queryKey: meKeys.channels({ workspace }),
      });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>
            Channels are where conversations happen around a topic.
          </DialogDescription>

          <AddChannelForm
            isPending={isPending}
            onSubmit={(values) =>
              mutate(values, {
                onSuccess: () => {
                  setOpen(false);
                },
              })
            }
          />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export function AddChannelForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (values: ChannelSchema) => void;
}) {
  const form = useForm({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "",
      type: "public",
    },
  });

  const nameLength = MAX_CHANNEL_NAME_LENGTH - form.watch("name").length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values))}>
        <fieldset
          disabled={isPending}
          aria-disabled={isPending}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Channel name"
                      type="text"
                      className="pr-9"
                    />
                  </FormControl>
                  <span className="absolute right-0 top-1/2 w-8 -translate-y-1/2 text-sm text-muted-foreground">
                    {nameLength}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Visibility</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="public" />
                      </FormControl>
                      <div className="flex items-center space-x-1">
                        <FormLabel className="leading-normal">Public</FormLabel>
                        <FormDescription>
                          - Anyone on the workspace
                        </FormDescription>
                      </div>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="private" />
                      </FormControl>
                      <div className="flex space-x-1">
                        <FormLabel className="leading-normal">
                          Private
                        </FormLabel>
                        <FormDescription>
                          - Can only be viewed or joined by invitation
                        </FormDescription>
                      </div>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              aria-disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Form>
  );
}
