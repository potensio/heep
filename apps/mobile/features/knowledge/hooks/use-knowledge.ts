import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { createMemory, deleteMemory, fetchMemories } from "../api/knowledge.api";
import type { KnowledgeEntry } from "../types";

const keyFor = (restaurantId?: string) => ["knowledge", restaurantId] as const;

export function useKnowledge(restaurantId?: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return useQuery({
    queryKey: keyFor(restaurantId),
    queryFn: () => fetchMemories(restaurantId!),
    enabled: ready && !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateMemory(restaurantId?: string) {
  return useMutation({
    mutationFn: (text: string) => createMemory(restaurantId!, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keyFor(restaurantId) });
    },
  });
}

export function useDeleteMemory(restaurantId?: string) {
  return useMutation({
    mutationFn: (memoryId: string) => deleteMemory(memoryId),
    onMutate: async (memoryId) => {
      await queryClient.cancelQueries({ queryKey: keyFor(restaurantId) });
      const previous = queryClient.getQueryData<KnowledgeEntry[]>(
        keyFor(restaurantId),
      );
      queryClient.setQueryData<KnowledgeEntry[]>(
        keyFor(restaurantId),
        (old = []) => old.filter((e) => e.id !== memoryId),
      );
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(keyFor(restaurantId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keyFor(restaurantId) });
    },
  });
}
