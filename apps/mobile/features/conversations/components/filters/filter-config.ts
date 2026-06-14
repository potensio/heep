import {
  StarIcon,
  TagIcon,
  WhatsappLogoIcon,
  InstagramLogoIcon,
  MessengerLogoIcon,
  EnvelopeSimpleIcon,
  type Icon as PhosphorIcon,
} from "phosphor-react-native";

/** A selectable option inside a sub-sheet. */
export interface FilterOption {
  /** Canonical token sent to the API (this is what selection stores). */
  value: string;
  /** i18n key for the displayed label (app enums like priority/status). */
  labelKey?: string;
  /** Literal display label for dynamic data (e.g. user-defined tag names),
   *  which isn't translated. Falls back to `value` when absent. */
  label?: string;
}

/** Describes the light sub-sheet a filter pill opens when tapped. */
export interface FilterSheetConfig {
  /** i18n key for the sheet title. */
  titleKey: string;
  searchable?: boolean;
  options: FilterOption[];
}

export interface FilterDef {
  key: string;
  /** i18n key for the pill label. */
  labelKey: string;
  /** Combo pills render an icon circle; channel pills render an inline icon. */
  Icon?: PhosphorIcon;
  /** Brand/accent color for the icon. */
  color?: string;
  /** Combo pills get a tinted icon circle to the left of the label pill. */
  combo?: boolean;
  /**
   * When present, tapping the pill opens a light sub-sheet (search + list)
   * instead of toggling the pill. Add this to wire up more sub-sheets.
   */
  sheet?: FilterSheetConfig;
}

/** Channel pill key -> Bubble `social_media` value sent to the API. */
export const PLATFORM_VALUES: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
  email: "Email",
};

/** The filter selection committed by the overlay (Apply). */
export interface ActiveFilters {
  platform: string[]; // Bubble social_media values
  priority: string[]; // High / Medium / Low
  tags: string[]; // tag ids
  isSpam: boolean;
  isArchived: boolean;
}

export const EMPTY_FILTERS: ActiveFilters = {
  platform: [],
  priority: [],
  tags: [],
  isSpam: false,
  isArchived: false,
};

/** Count of active selections — drives the "Filters · N" badge. */
export function countActiveFilters(f: ActiveFilters): number {
  return (
    f.platform.length +
    f.priority.length +
    f.tags.length +
    (f.isSpam ? 1 : 0) +
    (f.isArchived ? 1 : 0)
  );
}

export const FILTERS: FilterDef[] = [
  {
    key: "priority",
    labelKey: "filters.pill.priority",
    Icon: StarIcon,
    color: "#FB2C36",
    combo: true,
    sheet: {
      titleKey: "filters.priority.title",
      options: [
        { value: "High", labelKey: "filters.priority.high" },
        { value: "Medium", labelKey: "filters.priority.medium" },
        { value: "Low", labelKey: "filters.priority.low" },
      ],
    },
  },
  {
    key: "tag",
    labelKey: "filters.pill.tag",
    Icon: TagIcon,
    color: "#FB2C36",
    combo: true,
    sheet: {
      titleKey: "filters.tag.title",
      searchable: true,
      // Loaded dynamically from `hono-filters-tags` (see useFilterTags); the
      // overlay passes them in as the `options` override.
      options: [],
    },
  },
  // Hidden for now — re-enable when conversation-status filtering is ready.
  // {
  //   key: "conversations",
  //   labelKey: "filters.pill.conversations",
  //   Icon: MagnifyingGlassIcon,
  //   color: "#6366F1",
  //   combo: true,
  //   sheet: {
  //     titleKey: "filters.conversations.title",
  //     searchable: true,
  //     options: [
  //       { value: "Open", labelKey: "filters.conversations.open" },
  //       { value: "Pending", labelKey: "filters.conversations.pending" },
  //       { value: "Resolved", labelKey: "filters.conversations.resolved" },
  //       { value: "Snoozed", labelKey: "filters.conversations.snoozed" },
  //       { value: "Unassigned", labelKey: "filters.conversations.unassigned" },
  //       {
  //         value: "Assigned to me",
  //         labelKey: "filters.conversations.assignedToMe",
  //       },
  //       { value: "Mentioned", labelKey: "filters.conversations.mentioned" },
  //     ],
  //   },
  // },
  {
    key: "whatsapp",
    labelKey: "filters.pill.whatsapp",
    Icon: WhatsappLogoIcon,
    color: "#25D366",
  },
  {
    key: "instagram",
    labelKey: "filters.pill.instagram",
    Icon: InstagramLogoIcon,
    color: "#E1306C",
  },
  {
    key: "messenger",
    labelKey: "filters.pill.messenger",
    Icon: MessengerLogoIcon,
    color: "#0084FF",
  },
  {
    key: "email",
    labelKey: "filters.pill.email",
    Icon: EnvelopeSimpleIcon,
    color: "#1F2937",
  },
  { key: "archived", labelKey: "filters.pill.archived" },
  { key: "spam", labelKey: "filters.pill.spam" },
];

export const COMBO_FILTERS = FILTERS.filter((f) => f.combo);
export const CHANNEL_FILTERS = FILTERS.filter((f) => !f.combo);
