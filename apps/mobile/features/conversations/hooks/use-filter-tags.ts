import { useQuery } from "@tanstack/react-query";
import { fetchFilterTags } from "../api/filters.api";

export function useFilterTags(enabled = true) {
  return useQuery({
    queryKey: ["filter-tags"],
    queryFn: fetchFilterTags,
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}
