import type { InfiniteData } from "@tanstack/react-query";
import type { Message } from "../types/Message";
import type { Custom, KeyMap } from "./messageNormalizer";

export type MessagePage<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw>
> = Message<Custom<Raw, Map>>[];

export type MessageInfiniteData<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw>
> = InfiniteData<MessagePage<Raw, Map>>;
