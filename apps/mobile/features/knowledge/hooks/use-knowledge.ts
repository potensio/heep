import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { createMemory, deleteMemory, fetchMemories } from "../api/knowledge.api";
import type { KnowledgeEntry } from "../types";

const KNOWLEDGE_KEY = ["knowledge"] as const;

export function useKnowledge() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return useQuery({
    queryKey: KNOWLEDGE_KEY,
    queryFn: () => fetchMemories(),
    enabled: ready,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateMemory() {
  return useMutation({
    mutationFn: ({ restaurantId, text }: { restaurantId: string; text: string }) =>
      createMemory(restaurantId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
    },
  });
}

export function useDeleteMemory() {
  return useMutation({
    mutationFn: (memoryId: string) => deleteMemory(memoryId),
    onMutate: async (memoryId) => {
      await queryClient.cancelQueries({ queryKey: KNOWLEDGE_KEY });
      const previous = queryClient.getQueryData<KnowledgeEntry[]>(KNOWLEDGE_KEY);
      queryClient.setQueryData<KnowledgeEntry[]>(KNOWLEDGE_KEY, (old = []) =>
        old.filter((e) => e.id !== memoryId),
      );
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KNOWLEDGE_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
    },
  });
}
